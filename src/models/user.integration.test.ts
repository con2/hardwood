import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { keysMatchUser, verifiedPublicKey, type Keys } from "@/crypto/keys";
import {
  CannotDecrypt,
  readEventSettings,
  readRecord,
  readSurvey,
  writeEventSettings,
  writeRecord,
} from "@/crypto/records";
import { unlockWithRecoveryKey, WrongRecoveryKey } from "@/crypto/recovery";
import {
  defaultKdfParams,
  deriveKek,
  generateSalt,
  initialPasswordPattern,
  toBase64Url,
  wrap,
  type KdfParams,
} from "@/crypto/primitives";
import { db } from "@/prisma/db";
import { RecordKind, SurveySlug, UserStatus } from "@/prisma/enums";
import { toJson } from "@/prisma/json";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";

import {
  AlreadyInitialized,
  initializeEvent,
  type Initialized,
} from "./bootstrap";
import {
  acceptInvitation,
  changePassword,
  createInvite,
  getUser,
  invitationUrl,
  listUsers,
  promoteToGm,
  readInvitationToken,
  resetPassword,
  signIn,
  signOutEverywhere,
} from "./user";

async function truncate() {
  await execute(
    sql`truncate table encrypted_record, "user", survey, event cascade`,
  );
}

async function signInOk(token: string, password: string): Promise<Keys> {
  const result = await signIn(token, password);
  if (!result.ok) throw new Error(`sign-in failed: ${result.reason}`);
  return result.keys;
}

/** One invitee's life, step by step; each test builds on the previous ones. */
describe("users", () => {
  let init: Initialized;
  let gmKeys: Keys;
  let invitee: { userId: string; token: string; initialPassword: string };
  let inviteeKeys: Keys;

  beforeAll(async () => {
    await truncate();
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("initialises the event once", async () => {
    init = await initializeEvent({
      discordHandle: "gm#1",
      titles: { name: "Name", discordHandle: "Discord handle" },
      flags: testFlags,
    });
    expect(init.initialPassword).toMatch(initialPasswordPattern);
    expect(invitationUrl(init.token)).toMatch(/\/i\/[A-Za-z0-9_-]{43}$/);
    await expect(
      initializeEvent({
        discordHandle: "again",
        titles: { name: "Name", discordHandle: "Discord handle" },
        flags: testFlags,
      }),
    ).rejects.toThrow(AlreadyInitialized);

    gmKeys = await signInOk(init.token, init.initialPassword);
    expect(gmKeys.gmKey).not.toBeNull();
    const settings = await readEventSettings(gmKeys);
    expect(settings.signupStartsAt).toBeNull();
    expect(settings.characterGroups).toEqual([]);
    const vetting = await readSurvey(SurveySlug.vetting, gmKeys);
    expect(vetting.map((field) => field.slug)).toEqual([
      "name",
      "discord_handle",
    ]);
    expect(await readSurvey(SurveySlug.practical, gmKeys)).toEqual([]);
  });

  it("unlocks the audience keys with the recovery key", async () => {
    const keys = await unlockWithRecoveryKey(init.recoveryKey);
    expect(
      Buffer.from(keys.inviteeKey).equals(Buffer.from(gmKeys.inviteeKey)),
    ).toBe(true);
    expect(Buffer.from(keys.gmKey!).equals(Buffer.from(gmKeys.gmKey!))).toBe(
      true,
    );
    await expect(
      unlockWithRecoveryKey(Buffer.alloc(32).toString("base64url")),
    ).rejects.toThrow(WrongRecoveryKey);
  });

  it("creates an invite", async () => {
    invitee = await createInvite(
      { discordHandle: "invitee#2", isGm: false },
      gmKeys,
    );
    const user = (await getUser(invitee.userId))!;
    expect(user.status).toBe(UserStatus.INVITED);
    expect(user.passwordPending).toBe(true);
    expect(user.gmKeyWrap).toBeNull();
    expect(readInvitationToken(user, gmKeys)).toBe(invitee.token);
    expect((await listUsers()).map((u) => u.id)).toEqual([
      init.userId,
      invitee.userId,
    ]);
  });

  it("locks the invitation after five wrong passwords", async () => {
    for (let i = 0; i < 4; i++) {
      expect(await signIn(invitee.token, "wrong")).toEqual({
        ok: false,
        reason: "invalid",
      });
    }
    const fifth = await signIn(invitee.token, "wrong");
    expect(fifth.ok).toBe(false);
    expect(!fifth.ok && fifth.reason).toBe("locked");

    // Locked even with the right password.
    const locked = await signIn(invitee.token, invitee.initialPassword);
    expect(!locked.ok && locked.reason).toBe("locked");

    const user = (await getUser(invitee.userId))!;
    expect(user.failedSignIns).toBe(5);
    const minutes = (user.lockedUntil!.getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(0.9);
    expect(minutes).toBeLessThanOrEqual(1);

    expect(await signIn("no-such-token", "x")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("signs in with the right password once the lock expires", async () => {
    await db.orm.public.User.where({ id: invitee.userId }).update({
      lockedUntil: new Date(Date.now() - 1000).toISOString(),
    });
    const result = await signIn(invitee.token, invitee.initialPassword);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.passwordPending).toBe(true);
    expect(result.keys.gmKey).toBeNull();
    inviteeKeys = result.keys;
    const user = (await getUser(invitee.userId))!;
    expect(user.failedSignIns).toBe(0);
    expect(user.lockedUntil).toBeNull();
  });

  it("accepts the invitation", async () => {
    await acceptInvitation(
      { keys: inviteeKeys },
      { name: "  Iida Invitee ", newPassword: "first password" },
    );
    const user = (await getUser(invitee.userId))!;
    expect(user.status).toBe(UserStatus.ENTERED);
    expect(user.passwordPending).toBe(false);

    // Readable by another invitee (here: the GM) through the INVITEE wrap.
    const response = await readRecord(
      RecordKind.VETTING_RESPONSE,
      invitee.userId,
      gmKeys,
    );
    expect(response).toEqual({
      values: { name: "Iida Invitee", discord_handle: "invitee#2" },
      completed: false,
    });

    await expect(
      acceptInvitation(
        { keys: inviteeKeys },
        { name: "x", newPassword: "again" },
      ),
    ).rejects.toThrow();
  });

  it("changes the password", async () => {
    expect(
      await changePassword({ keys: inviteeKeys }, "wrong", "second password"),
    ).toEqual({ ok: false, reason: "wrongPassword" });
    expect(
      await changePassword(
        { keys: inviteeKeys },
        "first password",
        "second password",
      ),
    ).toEqual({ ok: true, sessionEpoch: 1 });
    expect((await getUser(invitee.userId))!.sessionEpoch).toBe(1);

    expect((await signIn(invitee.token, "first password")).ok).toBe(false);
    inviteeKeys = await signInOk(invitee.token, "second password");
  });

  it("signs out everywhere by moving the session epoch", async () => {
    await signOutEverywhere(invitee.userId);
    expect((await getUser(invitee.userId))!.sessionEpoch).toBe(2);
  });

  it("keeps SELF+GM records private to the owner and the GMs", async () => {
    // Written by the invitee, who does not hold the GM key: the GM wrap is sealed to the GM public key.
    await writeRecord(
      RecordKind.PRACTICAL_RESPONSE,
      invitee.userId,
      { values: { diet: "vegan" }, completed: true },
      ["SELF", "GM"],
      inviteeKeys,
    );
    expect(
      await readRecord(
        RecordKind.PRACTICAL_RESPONSE,
        invitee.userId,
        inviteeKeys,
      ),
    ).toEqual({ values: { diet: "vegan" }, completed: true });
    expect(
      await readRecord(RecordKind.PRACTICAL_RESPONSE, invitee.userId, gmKeys),
    ).toEqual({ values: { diet: "vegan" }, completed: true });

    const other = await createInvite(
      { discordHandle: "other", isGm: false },
      gmKeys,
    );
    const otherKeys = await signInOk(other.token, other.initialPassword);
    await expect(
      readRecord(RecordKind.PRACTICAL_RESPONSE, invitee.userId, otherKeys),
    ).rejects.toThrow(CannotDecrypt);
  });

  it("resets the password and keeps the data", async () => {
    await expect(resetPassword(invitee.userId, inviteeKeys)).rejects.toThrow();

    const { initialPassword } = await resetPassword(invitee.userId, gmKeys);
    expect(initialPassword).toMatch(initialPasswordPattern);
    expect((await signIn(invitee.token, "second password")).ok).toBe(false);

    const result = await signIn(invitee.token, initialPassword);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.passwordPending).toBe(true);
    expect(result.user.status).toBe(UserStatus.ENTERED);
    expect(result.user.sessionEpoch).toBe(3);
    const keys = result.keys;

    // The old private key no longer opens SELF wraps; the new one does. A session that still
    // holds the old key is recognised as stale (getViewer treats it as signed out).
    expect(
      Buffer.from(keys.privateKey).equals(Buffer.from(inviteeKeys.privateKey)),
    ).toBe(false);
    expect(keysMatchUser(inviteeKeys, result.user)).toBe(false);
    expect(keysMatchUser(keys, result.user)).toBe(true);
    expect(
      await readRecord(RecordKind.VETTING_RESPONSE, invitee.userId, keys),
    ).toMatchObject({ values: { name: "Iida Invitee" } });
    // Only the SELF wrap opens this one: it has no INVITEE wrap and the invitee holds no GM key.
    expect(keys.gmKey).toBeNull();
    expect(
      await readRecord(RecordKind.PRACTICAL_RESPONSE, invitee.userId, keys),
    ).toEqual({ values: { diet: "vegan" }, completed: true });

    // Setting the password again leaves the status and the name alone when no name is given.
    await acceptInvitation({ keys }, { name: "", newPassword: "third" });
    const user = (await getUser(invitee.userId))!;
    expect(user.status).toBe(UserStatus.ENTERED);
    expect(user.passwordPending).toBe(false);
    expect(
      await readRecord(RecordKind.VETTING_RESPONSE, invitee.userId, keys),
    ).toMatchObject({ values: { name: "Iida Invitee" } });
  });

  it("promotes an invitee to GM, who can then read and write event settings", async () => {
    const recovered = await unlockWithRecoveryKey(init.recoveryKey);
    await promoteToGm(invitee.userId, recovered);

    const keys = await signInOk(invitee.token, "third");
    expect(keys.gmKey).not.toBeNull();
    expect((await getUser(invitee.userId))!.isGm).toBe(true);

    const settings = await readEventSettings(keys);
    await writeEventSettings(
      { ...settings, characterGroups: [{ slug: "staff", title: "Staff" }] },
      keys,
    );
    expect((await readEventSettings(gmKeys)).characterGroups).toEqual([
      { slug: "staff", title: "Staff" },
    ]);
    expect(
      await readRecord(RecordKind.PRACTICAL_RESPONSE, invitee.userId, {
        ...keys,
        privateKey: Buffer.alloc(32, 1),
      }),
    ).toEqual({ values: { diet: "vegan" }, completed: true });
  });

  it("creates a GM invite with the GM key", async () => {
    const newGm = await createInvite(
      { discordHandle: "gm#3", isGm: true },
      gmKeys,
    );
    const keys = await signInOk(newGm.token, newGm.initialPassword);
    expect(Buffer.from(keys.gmKey!).equals(Buffer.from(gmKeys.gmKey!))).toBe(
      true,
    );
  });

  it("sign-in writes a missing key binding", async () => {
    const invite = await createInvite(
      { discordHandle: "unbound", isGm: false },
      gmKeys,
    );
    const bound = (await getUser(invite.userId))!.publicKeyBinding;
    expect(bound).not.toBeNull();
    // A row from before key bindings existed.
    await db.orm.public.User.where({ id: invite.userId }).update({
      publicKeyBinding: null,
    });
    await signInOk(invite.token, invite.initialPassword);
    const user = (await getUser(invite.userId))!;
    expect(user.publicKeyBinding).not.toBeNull();
    expect(
      Buffer.from(verifiedPublicKey(user, gmKeys.inviteeKey)).equals(
        Buffer.from(user.publicKey, "base64url"),
      ),
    ).toBe(true);
  });

  it("moves a key from before the pepper to the peppered parameters on sign-in", async () => {
    const invite = await createInvite(
      { discordHandle: "unpeppered", isGm: false },
      gmKeys,
    );
    const { privateKey } = await signInOk(invite.token, invite.initialPassword);
    const legacyParams: KdfParams = {
      algorithm: "argon2id",
      memory: 1024,
      passes: 1,
      parallelism: 1,
    };
    const salt = generateSalt();
    await db.orm.public.User.where({ id: invite.userId }).update({
      encryptedPrivateKey: wrap(
        privateKey,
        await deriveKek(invite.initialPassword, salt, legacyParams),
      ),
      kdfSalt: toBase64Url(salt),
      kdfParams: toJson(legacyParams),
    });

    await signInOk(invite.token, invite.initialPassword);
    expect((await getUser(invite.userId))!.kdfParams).toEqual(defaultKdfParams);
    const keys = await signInOk(invite.token, invite.initialPassword);
    expect(Buffer.from(keys.privateKey).equals(Buffer.from(privateKey))).toBe(
      true,
    );
  });

  it("refuses REVOKED invitees after a correct password only", async () => {
    const revoked = await createInvite(
      { discordHandle: "gone", isGm: false },
      gmKeys,
    );
    await db.orm.public.User.where({ id: revoked.userId }).update({
      status: UserStatus.REVOKED,
    });
    expect(await signIn(revoked.token, "wrong")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(await signIn(revoked.token, revoked.initialPassword)).toEqual({
      ok: false,
      reason: "revoked",
    });
  });
});
