import { generateUniqueIdentifier } from "@con2/components/helpers";

import type { Field, FieldType } from "./models";

/**
 * A blank field of `type` with a slug unique among `usedIdentifiers`. The library helper makes
 * dashed slugs (`singlelinetext-2`); ours are underscored.
 */
export default function newField(
  type: FieldType,
  usedIdentifiers: string[],
): Field {
  const slug = generateUniqueIdentifier(
    type,
    usedIdentifiers.map((identifier) => identifier.replace(/_/g, "-")),
  ).replace(/-/g, "_");
  switch (type) {
    case "StaticText":
    case "SingleLineText":
    case "MultiLineText":
    case "MarkdownText":
    case "NumberField":
      return { type, slug, title: "" };
    case "SingleSelect":
    case "MultiSelect":
      return { type, slug, title: "", choices: [] };
    case "RadioMatrix":
      return { type, slug, title: "", choices: [], questions: [] };
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown field type ${exhaustiveCheck}`);
    }
  }
}
