import { expect, expectTypeOf, test } from "vitest";
import { createEmitter } from ".";
import { noop } from "src/noop";

test("type inferrence", () => {
  const emitter = createEmitter<{ ch1: "x"; ch2: "y" }>();
  emitter.on((channel, message) => {
    if (channel === "ch1") {
      expectTypeOf(message).toEqualTypeOf<"x">();
    }
    if (channel === "ch2") {
      expectTypeOf(message).toEqualTypeOf<"y">();
    }
  });
  emitter.emit("ch1", "x");
  emitter.emit("ch2", "y");
  // @ts-expect-error
  emitter.emit("ch1", "xy");
  // @ts-expect-error
  emitter.emit("ch2", "yx");
  // @ts-expect-error
  emitter.emit("a", "x");
  // @ts-expect-error
  emitter.emit("b", "y");
});

test("Emit / receive", () => {
  const emitter = createEmitter<{ ch1: "x"; ch2: "y" }>();
  let ch1Messages = "";
  let ch2Messages = "";
  emitter.on((channel, message) => {
    if (channel !== "ch1") return;
    ch1Messages += message;
  });
  emitter.on((channel, message) => {
    if (channel !== "ch2") return;
    ch2Messages += message;
  });
  emitter.on((channel, message) => {
    if (channel !== "ch2") return;
    ch2Messages += message;
  });
  emitter.emit("ch1", "x");
  emitter.emit("ch2", "y");
  expect(ch1Messages).toBe("x");
  expect(ch2Messages).toBe("yy");
});

test("Should remove listeners properly", () => {
  const emitter = createEmitter<{ ch1: "x"; ch2: "y" }>();
  // all listeners have the same ref
  const remove_1 = emitter.on(noop);
  const remove_2 = emitter.on(noop);
  const remove_3 = emitter.on(noop);
  // listeners should be removed 1 by one, even if they have the same ref
  expect(emitter.__l.size).toBe(3);
  remove_1();
  expect(emitter.__l.size).toBe(2);
  remove_2();
  expect(emitter.__l.size).toBe(1);
  remove_3();
  expect(emitter.__l.size).toBe(0);
  // Extra remove should produce no error
  remove_3();
  expect(emitter.__l.size).toBe(0);
});
