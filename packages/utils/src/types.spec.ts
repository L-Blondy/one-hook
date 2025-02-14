import { expectTypeOf, test } from "vitest";
import type { KeyOf, EntryOf } from "./types";

test("KeyOf", () => {
  const k1: KeyOf<{ a: 1; b: "" }> = {} as any;
  expectTypeOf(k1).toEqualTypeOf<"a" | "b">();

  const k2: KeyOf<{ a: 1; b: 1 } | { c?: undefined }> = {} as any;
  expectTypeOf(k2).toEqualTypeOf<"a" | "b" | "c">();
});

test("EntryOf", () => {
  const e1: EntryOf<{ a: number; b: string }> = {} as any;
  expectTypeOf(e1).toEqualTypeOf<["a", number] | ["b", string]>();

  const e2: EntryOf<Partial<{ a: number; b: string }>> = {} as any;
  expectTypeOf(e2).toEqualTypeOf<
    ["a", number | undefined] | ["b", string | undefined]
  >();

  const e3: EntryOf<{ a: number; b: string } | { c?: boolean; d?: null }> =
    {} as any;
  expectTypeOf(e3).toEqualTypeOf<
    | ["a", number]
    | ["b", string]
    | ["c", boolean | undefined]
    | ["d", null | undefined]
  >();
});
