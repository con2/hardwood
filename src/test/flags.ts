import { defaultFlagDefinitions } from "@/models/flagDefinitions";
import en from "@/translations/en";

/** The English default flags, for tests that initialise an event or build settings by hand. */
export const testFlags = defaultFlagDefinitions(en.Flagging.defaultFlags);
