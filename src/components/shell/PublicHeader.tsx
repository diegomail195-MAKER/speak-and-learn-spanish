import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
      <Link href="/" aria-label="Speak & Learn Spanish — Home">
        <Logo />
      </Link>
      <nav className="flex items-center gap-1.5 sm:gap-2">
        <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-bold text-ink-2 hover:bg-paper-2 sm:inline-flex">
          Teacher sign in
        </Link>
        <ButtonLink href="/student" variant="voice" size="sm">
          I&apos;m a student
        </ButtonLink>
      </nav>
    </header>
  );
}
