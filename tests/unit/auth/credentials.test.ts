import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  compare: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  compare: mocks.compare,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
  },
}));

import { authorizeWithPassword } from "@/auth/credentials";

describe("authorizeWithPassword", () => {
  beforeEach(() => {
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ where: mocks.where });
    mocks.where.mockReturnValue({ limit: mocks.limit });
  });

  it("returns the user when the password matches", async () => {
    mocks.limit.mockResolvedValue([
      {
        id: "user-1",
        email: "demo@example.com",
        name: "Demo User",
        passwordHash: "hashed-password",
        role: "admin",
      },
    ]);
    mocks.compare.mockResolvedValue(true);

    const user = await authorizeWithPassword("demo@example.com", "secret");

    expect(user).toEqual({
      id: "user-1",
      email: "demo@example.com",
      name: "Demo User",
      role: "admin",
    });
  });

  it("returns null when no password hash exists", async () => {
    mocks.limit.mockResolvedValue([
      {
        id: "user-1",
        email: "demo@example.com",
        name: "Demo User",
        passwordHash: null,
        role: "admin",
      },
    ]);

    const user = await authorizeWithPassword("demo@example.com", "secret");

    expect(user).toBeNull();
    expect(mocks.compare).not.toHaveBeenCalled();
  });
});
