import { expect, expectTypeOf, it } from "vitest";
import * as v from "valibot";
import { validateSync } from ".";
import { invariant } from "src/invariant";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { isValidationError } from "./schema-validation-error";

const schema = v.pipe(
  v.object({
    key: v.string(),
  }),
  v.transform((input) => ({
    ...input,
    other: "other",
  }))
);

it("type inference", () => {
  function _nocall() {
    const d1 = validateSync(schema, { key: "value" });
    expectTypeOf(d1).toEqualTypeOf<{ key: string; other: string }>();
    // @ts-expect-error
    const d2 = validateSync(schema, { key: 1 });
    expectTypeOf(d2).toEqualTypeOf<{ key: string; other: string }>();

    const d3 = validateSync((_data: number) => "", 1);
    expectTypeOf(d3).toEqualTypeOf<string>();
    // @ts-expect-error
    const d4 = validateSync((_data: number) => "", "");
    expectTypeOf(d4).toEqualTypeOf<string>();
  }
  // @ts-ignore
  const _ = _nocall;
});

it("validateSync schema should return the parsed value", () => {
  const input = { key: "value" } as const;
  const output = validateSync(schema, input);
  const expected = { key: "value", other: "other" };
  expect(output).toEqual(expected);
});

it("validateSync function should return the parsed value", () => {
  const validationFn = (input: number) => String(input);
  const input = 1;
  const output = validateSync(validationFn, input);
  expect(output).toEqual("1");
});

it("Should raise a ValidationError", () => {
  const schema = v.object({
    key: v.string(),
  });
  let errorCatched: any;
  try {
    validateSync(schema, { key: 1 as any });
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
