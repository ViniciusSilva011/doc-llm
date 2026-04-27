import Link from "next/link";
import Image from "next/image";

import { getOptionalSession } from "@/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";

export async function AppHeader() {
  const session = await getOptionalSession();

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
          href="/"
        >
          <Image
            src="/newimage.png"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-lg"
            priority
          />
          DocWise
        </Link>

        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link className="transition-colors hover:text-foreground" href="/">
            Home
          </Link>
          {session?.user ? (
            <Link className="transition-colors hover:text-foreground" href="/dashboard">
              Dashboard
            </Link>
          ) : null}
          {session?.user ? (
            <Link className="transition-colors hover:text-foreground" href="/upload">
              Upload
            </Link>
          ) : null}
          {session?.user ? (
            <Link className="transition-colors hover:text-foreground" href="/query">
              Query
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="text-sm text-muted-foreground">{session.user.email}</span>
              <SignOutButton />
            </>
          ) : (
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
