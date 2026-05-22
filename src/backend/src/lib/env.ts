type Env = {
  APP_ENV: string;
  BACKEND_PORT: number;
  ALLOW_REAL_STUDENT_DATA: boolean;
  FERPA_DPA_REFERENCE: string;
  DATABASE_URL: string | undefined;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  // Master kill-switch for real LLM calls. Stays false by default so a key
  // present in .env alone never triggers a network call.
  USE_REAL_LLM: boolean;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  /** When true and memory repos are in use, seed a single demo assignment +
   * reference + submission + concept-check set + verification at boot so the
   * "See sample evidence report" link on the home page works without setup. */
  SEED_DEMO_DATA: boolean;
  /** D-048: master kill-switch for real transcription calls. Real OpenAI
   * transcription only happens when this is true AND USE_REAL_LLM is true
   * AND OPENAI_API_KEY is set. Stub transcription otherwise. */
  USE_REAL_VOICE: boolean;
  OPENAI_TRANSCRIBE_MODEL: string;
  /** Maximum recording duration in seconds (client + server validate). */
  MAX_VOICE_SECONDS: number;
};

function readBool(value: string | undefined): boolean {
  return (value ?? "").toLowerCase() === "true";
}

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadEnv(): Env {
  return {
    APP_ENV: process.env.APP_ENV ?? "development",
    BACKEND_PORT: readPort(process.env.BACKEND_PORT, 4000),
    ALLOW_REAL_STUDENT_DATA: readBool(process.env.ALLOW_REAL_STUDENT_DATA),
    FERPA_DPA_REFERENCE: (process.env.FERPA_DPA_REFERENCE ?? "").trim(),
    DATABASE_URL: process.env.DATABASE_URL || undefined,
    ANTHROPIC_API_KEY: (process.env.ANTHROPIC_API_KEY ?? "").trim(),
    ANTHROPIC_MODEL: (process.env.ANTHROPIC_MODEL ?? "").trim(),
    USE_REAL_LLM: readBool(process.env.USE_REAL_LLM),
    OPENAI_API_KEY: (process.env.OPENAI_API_KEY ?? "").trim(),
    OPENAI_MODEL: (process.env.OPENAI_MODEL ?? "").trim(),
    SEED_DEMO_DATA: readBool(process.env.SEED_DEMO_DATA),
    USE_REAL_VOICE: readBool(process.env.USE_REAL_VOICE),
    OPENAI_TRANSCRIBE_MODEL:
      (process.env.OPENAI_TRANSCRIBE_MODEL ?? "").trim() || "gpt-4o-mini-transcribe",
    MAX_VOICE_SECONDS: readPort(process.env.MAX_VOICE_SECONDS, 180),
  };
}
