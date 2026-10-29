import Link from "next/link";
import { redirect } from "next/navigation";

import { requiredScore } from "@/auth/passwordStrength";
import { getViewer } from "@/auth/viewer";
import { magicSlugs } from "@/components/forms/models";
import { eventLocale, eventName } from "@/config";
import { readRecord } from "@/crypto/records";
import { findUserByToken } from "@/models/user";
import { RecordKind, UserStatus } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { AcceptInvitationForm } from "./AcceptInvitationForm";
import { SignInForm } from "./SignInForm";

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * The invitation link. Signed out (or signed in as someone else): Sign In. Signed in as the
 * invitee: Accept Invitation if a password is pending, else on to Sign Up.
 */
export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const t = getTranslations();
  const viewer = await getViewer();
  const tokenUser = viewer ? await findUserByToken(token) : null;

  if (viewer && tokenUser && tokenUser.id === viewer.user.id) {
    if (!viewer.user.passwordPending) redirect("/signup");

    const vetting = await readRecord(
      RecordKind.VETTING_RESPONSE,
      viewer.user.id,
      viewer.keys,
    );
    const discordHandle = vetting?.values[magicSlugs.discordHandle];
    const m = t.AcceptInvitation;

    return (
      <div className="container mt-4 mb-4" style={{ maxWidth: "40rem" }}>
        <h1 className="mb-3">{m.title}</h1>
        {typeof discordHandle === "string" && discordHandle ? (
          <p>
            {m.invitedAs} <strong>{discordHandle}</strong>
          </p>
        ) : null}
        {viewer.user.status !== UserStatus.INVITED ? (
          <div className="alert alert-warning">{m.resetNotice}</div>
        ) : null}
        <div className="alert alert-info">{m.notSignUpNotice}</div>
        <div className="alert alert-primary">{m.bookmarkNotice}</div>
        <p className="text-body-secondary">{m.noEmail}</p>
        <p>
          {m.privacyPrefix} <Link href="/privacy">{m.privacyLink}</Link>.
        </p>
        <AcceptInvitationForm
          defaultName={viewer.name ?? ""}
          locale={eventLocale}
          requiredScore={requiredScore(viewer.user.isGm)}
          messages={m}
          strengthMessages={t.PasswordStrength}
        />
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-4" style={{ maxWidth: "30rem" }}>
      <h1 className="mb-3">{eventName}</h1>
      <p>{t.SignIn.intro}</p>
      <p className="text-body-secondary">{t.SignIn.linkHint}</p>
      <section className="card">
        <div className="card-body">
          <h2 className="h5 card-title mb-3">{t.SignIn.title}</h2>
          <SignInForm token={token} messages={t.SignIn} />
        </div>
      </section>
    </div>
  );
}
