import type { Field, Values } from "./models";

const falsyValues = new Set(["false", "0", "off", "no"]);

/**
 * Reads the values of `fields` from the `FormData` of a form rendered by `SchemaForm`.
 *
 * Ported from Kompassi (itself a subset of the backend's `process_form_data`). Differences: an
 * empty or unparseable NumberField is `null` rather than `NaN`, numbers are integers, and text
 * fields that were not posted at all are `""`.
 */
export default function processFormData(
  fields: Field[],
  formData: FormData,
): Values {
  const byFieldName: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") byFieldName[key] = value;
  }
  const values: Values = {};

  for (const field of fields) {
    const { slug, type } = field;

    switch (type) {
      case "StaticText":
        break;

      case "SingleLineText":
      case "MultiLineText":
      case "MarkdownText":
      case "SingleSelect":
        values[slug] = byFieldName[slug] ?? "";
        break;

      case "MultiSelect": {
        const choicesPrefix = `${slug}.`;
        const chosen: string[] = [];
        for (const [key, value] of Object.entries(byFieldName)) {
          if (key.startsWith(choicesPrefix) && !falsyValues.has(value)) {
            chosen.push(key.slice(choicesPrefix.length));
          }
        }
        values[slug] = chosen;
        break;
      }

      case "RadioMatrix": {
        const matrixValues: Record<string, string> = {};
        for (const question of field.questions) {
          const value = byFieldName[`${slug}.${question.slug}`];
          if (value !== undefined) {
            matrixValues[question.slug] = value;
          }
        }
        values[slug] = matrixValues;
        break;
      }

      case "NumberField": {
        const raw = (byFieldName[slug] ?? "").trim();
        const number = raw ? Number(raw) : NaN;
        values[slug] = Number.isFinite(number) ? Math.trunc(number) : null;
        break;
      }

      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Unsupported field type ${exhaustiveCheck}`);
      }
    }
  }

  return values;
}
