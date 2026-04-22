import { redirect } from "next/navigation";

import { getOptionalSession } from "@/auth/session";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Badge } from "@/components/ui/badge";

export default async function SignInPage() {
  const session = await getOptionalSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <section className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] md:items-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <Badge>Authentication</Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Sign in to the starter workspace.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">
              The current flow uses the seeded credentials user, but the auth folder
              is organized so OAuth providers can be added without untangling the app.
            </p>
          </div>
        </div>

        <SignInForm />
      </section>
    </div>
  );
}
