import { it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsomorphicLayoutEffect } from "src";

it("Should not crash", () => {
  renderHook(() => useIsomorphicLayoutEffect(() => {}));
});
