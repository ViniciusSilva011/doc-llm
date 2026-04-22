import { afterEach, vi } from "vitest";

import { applyTestEnv } from "../helpers/test-env";

applyTestEnv();

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.clearAllMocks();
});
