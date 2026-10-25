import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/shell/PublicHeader";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Student sign in" };

async function goToClass(form: FormData) {
  "use server";
  const code = String(form.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code) redirect(`/student/${code}`);
}

export default function StudentStart() {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-lg px-5 pb-16 pt-8 text-center">
        <h1 className="font-display text-4xl font-semibold">¡Hola!</h1>
        <p className="mt-2 text-lg text-ink-2">Type your class code.</p>
        <form action={goToClass} className="mt-8 space-y-4">
          <label htmlFor="code" className="sr-only">Class code</label>
          <input
            id="code"
            name="code"
            required
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            placeholder="ABC123"
            className="w-full rounded-2xl border-2 border-line bg-card px-5 py-4 text-center font-display text-4xl font-semibold uppercase tracking-[0.3em] text-ink placeholder:text-line focus:border-teal focus:outline-none"
          />
          <Button type="submit" variant="voice" size="lg" className="w-full">
            Next
          </Button>
        </form>
      </main>
    </div>
  );
}
