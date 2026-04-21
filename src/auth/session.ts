import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth/config";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getOptionalSession() {
  return getServerSession(authOptions);
}

export async function requirePageSession() {
  const session = await getOptionalSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireApiSession() {
  const session = await getOptionalSession();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session;
}
