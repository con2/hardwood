/**
 * GM reads of survey responses: the choice-field summaries and one player's responses. Every
 * function takes the GM's keys explicitly; the callers check that the viewer is a GM.
 */
import type { Field, Values } from "@/components/forms/models";
import type { AudienceKeys } from "@/crypto/keys";
import { readAllRecords, readRecord, readSurvey } from "@/crypto/records";
import { RecordKind, SurveySlug, UserStatus } from "@/prisma/enums";

import type { FlagMatrixUser } from "./flags";
import { matchesFlagFilter, type FlagFilter } from "./flagSummary";
import { listPlayers, playerLabel, type ResponseState } from "./players";
import { hasAcceptedStatus } from "./playerStatus";
import { summariseResponses, type FieldSummary } from "./responseSummary";
import type { PracticalResponse, VettingResponse } from "./types";

/**
 * Whether the GM views count and show a vetting response: only once the invitee has marked it
 * completed, as an incomplete one is private to the invitee.
 */
export function includesVettingResponse(
  response: VettingResponse | null | undefined,
): response is VettingResponse {
  return !!response?.completed;
}

export interface SurveySummary {
  fields: Field[];
  /** Accepted (ENTERED or WITHDRAWN) players matching the filter. */
  countPeople: number;
  /** Of `countPeople`, those whose response is included. */
  countResponses: number;
  summaries: FieldSummary[];
}

export async function surveySummary(
  keys: AudienceKeys,
  slug: SurveySlug,
  filter: FlagFilter,
): Promise<SurveySummary> {
  const [fields, players, responses] = await Promise.all([
    readSurvey(slug, keys),
    listPlayers(keys),
    slug === SurveySlug.vetting
      ? readAllRecords(RecordKind.VETTING_RESPONSE, keys)
      : readAllRecords(RecordKind.PRACTICAL_RESPONSE, keys),
  ]);
  const people = players.filter(
    (row) =>
      hasAcceptedStatus(row.status) && matchesFlagFilter(row.uiStatus, filter),
  );
  const included = people.flatMap((row) => {
    const response = responses.get(row.id);
    if (slug === SurveySlug.vetting && !includesVettingResponse(response)) {
      return [];
    }
    return response ? [response.values as Values] : [];
  });
  return {
    fields,
    countPeople: people.length,
    countResponses: included.length,
    summaries: summariseResponses(fields, included),
  };
}

export type PlayerPerson = Omit<FlagMatrixUser, "completed">;

export interface PlayerDetail {
  person: PlayerPerson;
  vetting: { state: ResponseState; response: VettingResponse | null };
  practical: { state: ResponseState; response: PracticalResponse | null };
}

/** One accepted player's responses, or null for an unknown id or someone not accepted. */
export async function readPlayerDetail(
  keys: AudienceKeys,
  userId: string,
): Promise<PlayerDetail | null> {
  const row = (await listPlayers(keys)).find((player) => player.id === userId);
  if (!row || !hasAcceptedStatus(row.status)) return null;
  const [vetting, practical] = await Promise.all([
    readRecord(RecordKind.VETTING_RESPONSE, userId, keys),
    readRecord(RecordKind.PRACTICAL_RESPONSE, userId, keys),
  ]);
  return {
    person: {
      userId: row.id,
      name: playerLabel(row),
      discordHandle: row.discordHandle,
      uiStatus: row.uiStatus,
      withdrawn: row.status === UserStatus.WITHDRAWN,
    },
    vetting: {
      state: row.vetting,
      response: includesVettingResponse(vetting) ? vetting : null,
    },
    practical: { state: row.practical, response: practical },
  };
}
