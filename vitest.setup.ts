import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react registers cleanup through a global afterEach, but globals are off
// here, so it is wired up explicitly to keep the DOM from leaking between tests.
afterEach(() => {
  cleanup();
});
