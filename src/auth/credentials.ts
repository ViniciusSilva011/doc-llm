import { compare } from "bcryptjs";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function authorizeWithPassword(
  email: string,
  password: string,
): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
} | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user?.passwordHash) {
    return null;
  }

  const isValid = await compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
