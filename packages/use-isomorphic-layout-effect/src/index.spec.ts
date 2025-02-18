import { it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsomorphicLayoutEffect } from "src";
import { noop } from "@rebase.io/utils/noop";

it("Should not crash", () => {
  renderHook(() => useIsomorphicLayoutEffect(noop));
});
