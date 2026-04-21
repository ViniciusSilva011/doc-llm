import { redirect } from "next/navigation";

import { getOptionalSession } from "@/auth/session";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage() {
  const session = await getOptionalSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="container">
      <section className="split-grid">
        <div className="stack-lg">
          <div className="stack-sm">
            <p className="pill">Authentication</p>
            <h1>Sign in to the starter workspace.</h1>
            <p className="muted-text">
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
