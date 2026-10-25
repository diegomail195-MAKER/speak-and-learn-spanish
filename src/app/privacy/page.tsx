import { PublicHeader } from "@/components/shell/PublicHeader";

export const metadata = { title: "Privacy & student data" };

export default function Privacy() {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-5 pb-16 pt-6 leading-relaxed text-ink-2">
        <h1 className="font-display text-3xl font-semibold text-ink">Privacy &amp; student data</h1>
        <p>Speak &amp; Learn Spanish is designed for elementary schools. This page summarizes how the platform handles student information. It is not legal advice; schools should review it with their counsel (COPPA, FERPA and state student-privacy laws).</p>
        <h2 className="font-display text-xl font-semibold text-ink">What we store about students</h2>
        <ul className="list-disc pl-5">
          <li>First name, last initial, an optional full name used only for the “Spell Your Name” activity, a hashed 4-digit PIN, class and group membership.</li>
          <li>Activity results: the text transcript of each spoken answer, whether it was correct, the help used (hint or model), confidence and timestamps.</li>
        </ul>
        <h2 className="font-display text-xl font-semibold text-ink">Voice</h2>
        <ul className="list-disc pl-5">
          <li>Audio recordings are <strong>not stored</strong>. The microphone is on only while an oral activity is running, with a visible indicator and a stop button.</li>
          <li>To recognize speech, audio is sent to the speech provider configured by the school (Microsoft Azure Speech or Google Cloud Speech-to-Text). If none is configured, Chrome&apos;s built-in recognizer is used, which sends audio to Google.</li>
        </ul>
        <h2 className="font-display text-xl font-semibold text-ink">No advertising</h2>
        <p>There is no advertising and no tracking for marketing. Data is never sold. Each school&apos;s data is separated from other schools.</p>
      </main>
    </div>
  );
}
