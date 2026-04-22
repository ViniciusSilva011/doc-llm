import "dotenv/config";

import { hash } from "bcryptjs";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { env } from "@/lib/env";

async function main(): Promise<void> {
  const passwordHash = await hash(env.DEMO_USER_PASSWORD, 12);

  await db
    .insert(users)
    .values({
      name: "Demo User",
      email: env.DEMO_USER_EMAIL,
      passwordHash,
      role: "admin",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: "Demo User",
        passwordHash,
        role: "admin",
        updatedAt: new Date(),
      },
    });

}

main().catch((error: unknown) => {
  console.error("Database seed failed.", error);
  process.exit(1);
});
