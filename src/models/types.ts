/**
 * Decrypted record contents (docs/plan.md, "Record contents and audiences").
 */
import type { RecordKind } from "@/prisma/enums";

/** A choice of an attribute such as character group or fee category. */
export interface Choice {
  slug: string;
  title: string;
}

/** INVITEE. `values.name` and `values.discord_handle` are magical (see `magicSlugs`). */
export interface VettingResponse {
  values: Record<string, unknown>;
  completed: boolean;
}

export type Flag = "RED" | "YELLOW" | "GREEN";

/** SELF, GM. One blob per flagger; NEUTRAL is the absence of a key. */
export interface Flags {
  flags: Record<string, Flag>;
  completed: boolean;
}

/** SELF, GM. */
export interface PracticalResponse {
  values: Record<string, unknown>;
  completed: boolean;
}

export type CastingDecision = "SELECTED" | "NOT_SELECTED";

/** GM. */
export interface PlayerAttributes {
  castingDecision: CastingDecision | null;
  characterName: string;
  characterGroup: string | null;
  feeCategory: string | null;
  feePaid: boolean;
}

/** SELF, GM. Derived when the casting is completed. */
export interface CastingResult {
  result: CastingDecision;
  mutualGreens: string[];
}

export interface RecordContents {
  VETTING_RESPONSE: VettingResponse;
  FLAGS: Flags;
  PRACTICAL_RESPONSE: PracticalResponse;
  PLAYER_ATTRIBUTES: PlayerAttributes;
  CASTING_RESULT: CastingResult;
}

true satisfies [RecordKind] extends [keyof RecordContents] ? true : never;

/** INVITEE. Timestamps are ISO strings or null. */
export interface EventSettings {
  signupStartsAt: string | null;
  previewStartsAt: string | null;
  signupEndsAt: string | null;
  flaggingStartsAt: string | null;
  flaggingEndsAt: string | null;
  practicalStartsAt: string | null;
  practicalEndsAt: string | null;
  castingCompletedAt: string | null;
  characterGroups: Choice[];
  feeCategories: Choice[];
}

export const defaultEventSettings: EventSettings = {
  signupStartsAt: null,
  previewStartsAt: null,
  signupEndsAt: null,
  flaggingStartsAt: null,
  flaggingEndsAt: null,
  practicalStartsAt: null,
  practicalEndsAt: null,
  castingCompletedAt: null,
  characterGroups: [],
  feeCategories: [],
};
