import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

configure({ reactStrictMode: true });

window.HTMLElement.prototype.scrollIntoView = function () {};
