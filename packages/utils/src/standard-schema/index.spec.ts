import { expect, expectTypeOf, it } from "vitest";
import * as v from "valibot";
import { isValidationError, parseStandardSchema } from ".";
import { invariant } from "src/invariant";
import type { StandardSchemaV1 } from "@standard-schema/spec";

it("Should infer the proper type and output the correct value", async () => {
  const schema = v.pipe(
    v.object({
      key: v.string(),
    }),
    v.transform((input) => ({
      ...input,
      other: "other",
    }))
  );

  const input = { key: "value" } as const;
  const output = await parseStandardSchema(schema, input);
  const expected = { key: "value", other: "other" };
  expectTypeOf(output).toEqualTypeOf<typeof expected>();
  expect(output).toEqual(expected);
});

it("Should raise a ValidationError", async () => {
  const schema = v.object({
    key: v.string(),
  });
  let errorCatched: any;
  try {
    await parseStandardSchema(schema, { key: 1 as any });
  } catch (error) {
    errorCatched = error;
    invariant(isValidationError(error), "Should be a validation error");
    expect(error.name).toBe("ValidationError");
    expect(Array.isArray(error.issues)).toBe(true);
    expectTypeOf(error.issues).toEqualTypeOf<
      Readonly<StandardSchemaV1.Issue[]>
    >();
  }
  expect(!!errorCatched).toBe(true);
});
