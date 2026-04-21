import { authorizeWithPassword } from "@/auth/credentials";
import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from "../../helpers/test-env";

describe("credentials auth integration", () => {
  it("authenticates the seeded user against the database", async () => {
    const user = await authorizeWithPassword(TEST_USER_EMAIL, TEST_USER_PASSWORD);

    expect(user?.email).toBe(TEST_USER_EMAIL);
    expect(user?.role).toBe("admin");
  });

  it("rejects an invalid password", async () => {
    const user = await authorizeWithPassword(TEST_USER_EMAIL, "not-the-password");

    expect(user).toBeNull();
  });
});
