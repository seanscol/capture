/**
 * A small JSON Schema check, enough to tell whether an item fits the schema
 * the caller sent.
 *
 * Deliberately partial, and deliberately honest about it: it reports what it
 * can prove wrong and stays quiet about what it cannot check. It is not a
 * validator, and the difference matters — a clean result here means "nothing
 * detected", never "verified" (§2.1). What it does catch is the shape of
 * mistake a model actually makes: a required field missing, a field the
 * caller did not ask for, a string where a number was declared.
 *
 * No dependency. This service has one, the Anthropic SDK, and adding a
 * validator library to check a schema this small is not worth the supply
 * chain.
 */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function typeName(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}

function typeMatches(v: unknown, declared: unknown): boolean {
  const allowed = Array.isArray(declared) ? declared : [declared];
  const actual = typeName(v);
  return allowed.some((t) =>
    t === actual ||
    (t === "number" && actual === "integer") ||
    (t === "object" && isObject(v))
  );
}

/** Problems found, in plain words. Empty means nothing was detected. */
export function validate(value: unknown, schema: unknown, path = ""): string[] {
  if (!isObject(schema)) return [];
  const at = path ? ` at ${path}` : "";
  const problems: string[] = [];

  if (schema.type !== undefined && !typeMatches(value, schema.type)) {
    return [`${path || "the item"} should be ${JSON.stringify(schema.type)}, not ${typeName(value)}`];
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(value as never)) {
    problems.push(`the value${at} is not one the schema allows`);
  }

  if (isObject(value)) {
    const properties = isObject(schema.properties) ? schema.properties : {};

    for (const key of Array.isArray(schema.required) ? schema.required : []) {
      if (typeof key === "string" && !(key in value)) {
        problems.push(`the schema requires "${key}"${at} and it is missing`);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          problems.push(`"${key}"${at} is not a field the schema has`);
        }
      }
    }

    for (const [key, sub] of Object.entries(properties)) {
      if (key in value) problems.push(...validate(value[key], sub, path ? `${path}.${key}` : key));
    }
  }

  if (Array.isArray(value) && schema.items !== undefined) {
    value.forEach((v, i) => problems.push(...validate(v, schema.items, `${path}[${i}]`)));
  }

  return problems;
}
