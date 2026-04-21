import Link from "next/link";

import { getOptionalSession } from "@/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export async function AppHeader() {
  const session = await getOptionalSession();

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link className="brand" href="/">
          Doc LLM Starter
        </Link>

        <nav className="nav">
          <Link href="/">Home</Link>
          {session?.user ? <Link href="/dashboard">Dashboard</Link> : null}
          {session?.user ? <Link href="/documents">Documents</Link> : null}
        </nav>

        <div className="header-actions">
          {session?.user ? (
            <>
              <span className="muted-text">{session.user.email}</span>
              <SignOutButton />
            </>
          ) : (
            <Link className="button button-secondary" href="/sign-in">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
