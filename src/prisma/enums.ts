import type { Row } from "./models";

type ValuesOf<T> = T[keyof T];
/** Resolves to `true` only when the object lists every member of the contract's enum. */
type Exhaustive<Obj, Union> = [Exclude<Union, ValuesOf<Obj>>] extends [never]
  ? true
  : never;

export const UserStatus = {
  INVITED: "INVITED",
  REVOKED: "REVOKED",
  ENTERED: "ENTERED",
  WITHDRAWN: "WITHDRAWN",
} as const satisfies Record<string, Row<"User">["status"]>;
export type UserStatus = ValuesOf<typeof UserStatus>;
true satisfies Exhaustive<typeof UserStatus, Row<"User">["status"]>;

export const RecordKind = {
  VETTING_RESPONSE: "VETTING_RESPONSE",
  FLAGS: "FLAGS",
  PRACTICAL_RESPONSE: "PRACTICAL_RESPONSE",
  PLAYER_ATTRIBUTES: "PLAYER_ATTRIBUTES",
  CASTING_RESULT: "CASTING_RESULT",
} as const satisfies Record<string, Row<"EncryptedRecord">["kind"]>;
export type RecordKind = ValuesOf<typeof RecordKind>;
true satisfies Exhaustive<typeof RecordKind, Row<"EncryptedRecord">["kind"]>;

export const SurveySlug = {
  vetting: "vetting",
  practical: "practical",
} as const satisfies Record<string, Row<"Survey">["slug"]>;
export type SurveySlug = ValuesOf<typeof SurveySlug>;
true satisfies Exhaustive<typeof SurveySlug, Row<"Survey">["slug"]>;
