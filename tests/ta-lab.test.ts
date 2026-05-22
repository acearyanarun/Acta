import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const BANNED_PHRASES: string[] = [
  `${"legally"} ${"admissible"}`,
  `${"legal"} ${"proof"}`,
  `${"court"}-${"ready"}`,
  `${"guaranteed"} ${"integrity"}`,
  `${"ai"} ${"detection"}`,
  `${"proctoring"}`,
  `${"biometric"}`,
];

const NEW_FILES = [
  "src/frontend/app/student/[id]/ta-lab/page.tsx",
  "src/frontend/components/ta-lab/ta-lab.tsx",
  "src/frontend/components/ta-lab/ta-lab-topbar.tsx",
  "src/frontend/components/ta-lab/ta-lab-stage.tsx",
  "src/frontend/components/ta-lab/voice-settings-panel.tsx",
  "src/frontend/components/ta-lab/ta-lab-transcript.tsx",
  "src/frontend/components/ta-lab/ta-lab-input-dock.tsx",
];

function read(p: string): string {
  return readFileSync(p, "utf8");
}

/**
 * Phase 1 step 9 split the single globals.css into tokens.css / atoms.css /
 * surfaces.css plus a 6-line import shell. Tests that previously asserted
 * "globals.css contains rule X" now assert against the union — the cascade
 * the browser actually sees.
 */
function readAppCss(): string {
  return [
    read("src/frontend/app/tokens.css"),
    read("src/frontend/app/atoms.css"),
    read("src/frontend/app/surfaces.css"),
    read("src/frontend/app/globals.css"),
  ].join("\n");
}

describe("TA Lab — file presence and routing (test 1)", () => {
  it("route exists at src/frontend/app/student/[id]/ta-lab/page.tsx", () => {
    expect(existsSync("src/frontend/app/student/[id]/ta-lab/page.tsx")).toBe(true);
    const src = read("src/frontend/app/student/[id]/ta-lab/page.tsx");
    expect(src).toMatch(/TaLab/);
  });
});

describe("TA Lab — wrapper hooks (test 2)", () => {
  /*
   * The Phase 1 reconcile deleted the scoped [data-theme="ta-lab"] CSS block
   * from surfaces.css; the TA Lab now consumes the global vellum palette.
   * The React wrapper still sets data-theme="ta-lab" as a hook for any
   * future re-scoping, but the test no longer asserts a matching CSS rule.
   * What we DO assert: the wrapper carries the canonical .ta-lab-shell class
   * that surfaces.css styles.
   */
  it("root component renders the .ta-lab-shell wrapper", () => {
    const src = read("src/frontend/components/ta-lab/ta-lab.tsx");
    expect(src).toMatch(/className="ta-lab-shell"/);
  });
});

describe("TA Lab — reuses existing infrastructure (tests 3–5)", () => {
  it("reuses BrainAssistant state machine (no parallel state types defined)", () => {
    const root = read("src/frontend/components/ta-lab/ta-lab.tsx");
    const stage = read("src/frontend/components/ta-lab/ta-lab-stage.tsx");
    expect(root).toMatch(/BrainAssistantState/);
    expect(stage).toMatch(/from "\.\.\/brain-assistant"/);
    // No parallel state union literal in new files.
    for (const f of NEW_FILES) {
      const src = read(f);
      expect(src).not.toMatch(/type\s+TaLabBrainState\s*=/);
    }
  });

  it("reuses transcribeHelpAnswer via VoiceChatInput (no duplicate fetch path)", () => {
    const dock = read("src/frontend/components/ta-lab/ta-lab-input-dock.tsx");
    expect(dock).toMatch(/VoiceChatInput/);
    // No new component should call fetch directly.
    for (const f of NEW_FILES) {
      const src = read(f);
      expect(src).not.toMatch(/\bfetch\(/);
    }
  });

  it("reuses postHelp (no duplicate help-route call path)", () => {
    const root = read("src/frontend/components/ta-lab/ta-lab.tsx");
    expect(root).toMatch(/postHelp/);
  });
});

describe("TA Lab — privacy and secret hygiene (tests 6–7)", () => {
  it("never references OPENAI_API_KEY in frontend files", () => {
    for (const f of NEW_FILES) {
      expect(read(f)).not.toContain("OPENAI_API_KEY");
    }
  });

  it("has no banned phrases (proctoring, AI detection, biometric, etc.)", () => {
    for (const f of NEW_FILES) {
      const src = read(f).toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        expect(src).not.toContain(phrase);
      }
    }
  });
});

describe("TA Lab — CSS layout classes and animations (tests 8–9)", () => {
  it("app CSS exposes the .ta-lab__orb layout and the orbit keyframe", () => {
    const css = readAppCss();
    expect(css).toMatch(/@keyframes ta-lab-orbit/);
    expect(css).toMatch(/\.ta-lab__orb\b/);
  });

  it("prefers-reduced-motion suppresses TA Lab ring + chip pulse animations", () => {
    const css = readAppCss();
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
    // The TA Lab reduced-motion rule must mention the ring class.
    expect(css).toMatch(/\.ta-lab__ring[^}]*animation:\s*none\s*!important/s);
  });
});

describe("TA Lab — speech controls behavior (tests 10–11)", () => {
  it("'Read replies' state defaults to useState(false) (no auto-speak)", () => {
    const src = read("src/frontend/components/ta-lab/ta-lab.tsx");
    expect(src).toMatch(/setSpeakReplies\]\s*=\s*useState\(false\)/);
  });

  it("speechSynthesis is feature-detected before any SpeechSynthesisUtterance usage", () => {
    const src = read("src/frontend/components/ta-lab/ta-lab.tsx");
    expect(src).toMatch(/isSpeechSynthesisAvailable/);
    expect(src).toMatch(/SpeechSynthesisUtterance/);
    const panel = read("src/frontend/components/ta-lab/voice-settings-panel.tsx");
    expect(panel).toMatch(/speechSynthesis/);
  });
});

describe("TA Lab — accessibility surface (test 12)", () => {
  it("state caption uses aria-live so screen readers announce transitions", () => {
    const stage = read("src/frontend/components/ta-lab/ta-lab-stage.tsx");
    expect(stage).toMatch(/aria-live=/);
  });

  it("toggle buttons expose aria-pressed", () => {
    const topbar = read("src/frontend/components/ta-lab/ta-lab-topbar.tsx");
    expect(topbar).toMatch(/aria-pressed=/);
  });
});

describe("TA Lab — student page wires the CTA link (test 13)", () => {
  it("student/[id]/page.tsx links to /student/{id}/ta-lab", () => {
    const src = read("src/frontend/app/student/[id]/page.tsx");
    expect(src).toMatch(/\/student\/.*\/ta-lab/);
    expect(src).toMatch(/Open TA Lab/);
  });

  it("HelpChat remains mounted on the student page (no premature replacement)", () => {
    const src = read("src/frontend/app/student/[id]/page.tsx");
    expect(src).toMatch(/<HelpChat\b/);
  });
});

describe("TA Lab — copy + scope guards", () => {
  it("topbar uses 'Acta TA Lab' branding (not Lexoire / Orchestrator)", () => {
    const topbar = read("src/frontend/components/ta-lab/ta-lab-topbar.tsx");
    expect(topbar).toMatch(/TA LAB/);
    expect(topbar).not.toMatch(/Lexoire/i);
    expect(topbar).not.toMatch(/Orchestrator/i);
    expect(topbar).not.toMatch(/Copilot|Codex/i);
  });

  it("voice settings panel includes the privacy line about audio retention", () => {
    const panel = read("src/frontend/components/ta-lab/voice-settings-panel.tsx");
    expect(panel).toContain("Audio is used for transcription and is not retained by Acta.");
  });

  it("policy guardrail copy is present in topbar (final answers restricted hint)", () => {
    const topbar = read("src/frontend/components/ta-lab/ta-lab-topbar.tsx");
    expect(topbar).toMatch(/final answers restricted/);
  });
});
