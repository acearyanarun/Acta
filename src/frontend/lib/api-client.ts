import type {
  Assignment,
  AssignmentPolicyVersion,
  ChatMessage,
  ConceptCheckSet,
  ConceptCheckVerification,
  CreateAssignmentInput,
  CreateConceptCheckVerificationInput,
  CreateReferenceSolutionInput,
  CreateSubmissionInput,
  EvidenceReport,
  GenerateConceptChecksInput,
  HelpRequestType,
  HelpResponse,
  InstructorDashboard,
  ReferenceSolution,
  Submission,
  TranscribeHelpResponse,
  TranscribeResponse,
} from "./types/assignment";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

// Placeholder auth (D-020 / D-024). Real auth provider is a DEFERRED L3 decision.
// These values are non-secret demo identifiers and are sent on every request.
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_ACTA_TENANT_ID ?? "demo-tenant";
const DEFAULT_INSTRUCTOR = process.env.NEXT_PUBLIC_ACTA_INSTRUCTOR_ID ?? "demo-instructor";
const DEFAULT_STUDENT = process.env.NEXT_PUBLIC_ACTA_STUDENT_ID ?? "demo-student";

type Role = "instructor" | "student";

function headers(role: Role = "instructor"): HeadersInit {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Acta-Tenant-Id": DEFAULT_TENANT,
  };
  if (role === "instructor") {
    base["X-Acta-Instructor-Id"] = DEFAULT_INSTRUCTOR;
  } else {
    base["X-Acta-Student-Id"] = DEFAULT_STUDENT;
  }
  return base;
}

export type HealthzResponse = {
  status: "ok";
  service: string;
  foundation: boolean;
  gitSha?: string;
  uptimeSeconds?: number;
};

export async function getBackendHealth(): Promise<HealthzResponse> {
  const res = await fetch(`${BACKEND_URL}/healthz`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Backend healthz failed: ${res.status}`);
  return (await res.json()) as HealthzResponse;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} :: ${text}`);
  }
  return (await res.json()) as T;
}

// ---- Instructor ----

export async function listAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments`, {
    headers: headers("instructor"),
    cache: "no-store",
  });
  const body = await unwrap<{ items: Assignment[] }>(res);
  return body.items;
}

export async function getAssignment(id: string, version?: number): Promise<Assignment> {
  const url = version
    ? `${BACKEND_URL}/v1/assignments/${id}?version=${version}`
    : `${BACKEND_URL}/v1/assignments/${id}`;
  const res = await fetch(url, { headers: headers("instructor"), cache: "no-store" });
  return unwrap<Assignment>(res);
}

export async function listAssignmentVersions(id: string): Promise<AssignmentPolicyVersion[]> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments/${id}/versions`, {
    headers: headers("instructor"),
    cache: "no-store",
  });
  const body = await unwrap<{ items: AssignmentPolicyVersion[] }>(res);
  return body.items;
}

export async function createAssignment(input: CreateAssignmentInput): Promise<Assignment> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments`, {
    method: "POST",
    headers: headers("instructor"),
    body: JSON.stringify(input),
  });
  return unwrap<Assignment>(res);
}

export async function updateAssignment(
  id: string,
  input: CreateAssignmentInput,
): Promise<Assignment> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments/${id}`, {
    method: "PUT",
    headers: headers("instructor"),
    body: JSON.stringify(input),
  });
  return unwrap<Assignment>(res);
}

// ---- Student ----

export async function listStudentAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${BACKEND_URL}/v1/student/assignments`, {
    headers: headers("student"),
    cache: "no-store",
  });
  const body = await unwrap<{ items: Assignment[] }>(res);
  return body.items;
}

export async function getStudentAssignment(id: string): Promise<Assignment> {
  const res = await fetch(`${BACKEND_URL}/v1/student/assignments/${id}`, {
    headers: headers("student"),
    cache: "no-store",
  });
  return unwrap<Assignment>(res);
}

export type PostHelpError = {
  status: number;
  error: string;
  message: string;
};

// ---- Submissions ----

export async function createSubmission(
  assignmentId: string,
  input: CreateSubmissionInput,
): Promise<Submission> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments/${assignmentId}/submissions`, {
    method: "POST",
    headers: headers("student"),
    body: JSON.stringify(input),
  });
  return unwrap<Submission>(res);
}

export async function listAssignmentSubmissions(
  assignmentId: string,
  role: Role,
): Promise<Submission[]> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments/${assignmentId}/submissions`, {
    headers: headers(role),
    cache: "no-store",
  });
  const body = await unwrap<{ items: Submission[] }>(res);
  return body.items;
}

export async function getSubmission(id: string, role: Role): Promise<Submission> {
  const res = await fetch(`${BACKEND_URL}/v1/submissions/${id}`, {
    headers: headers(role),
    cache: "no-store",
  });
  return unwrap<Submission>(res);
}

// ---- Concept checks ----

export async function generateConceptCheckSet(
  submissionId: string,
  input: GenerateConceptChecksInput = {},
): Promise<ConceptCheckSet> {
  const res = await fetch(`${BACKEND_URL}/v1/submissions/${submissionId}/concept-checks`, {
    method: "POST",
    headers: headers("student"),
    body: JSON.stringify(input),
  });
  return unwrap<ConceptCheckSet>(res);
}

export async function listConceptCheckSets(
  submissionId: string,
  role: Role,
): Promise<ConceptCheckSet[]> {
  const res = await fetch(`${BACKEND_URL}/v1/submissions/${submissionId}/concept-checks`, {
    headers: headers(role),
    cache: "no-store",
  });
  const body = await unwrap<{ items: ConceptCheckSet[] }>(res);
  return body.items;
}

export async function getConceptCheckSet(id: string, role: Role): Promise<ConceptCheckSet> {
  const res = await fetch(`${BACKEND_URL}/v1/concept-check-sets/${id}`, {
    headers: headers(role),
    cache: "no-store",
  });
  return unwrap<ConceptCheckSet>(res);
}

// ---- Reference solutions (instructor-only) ----

export async function getReferenceSolution(
  assignmentId: string,
): Promise<ReferenceSolution | null> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments/${assignmentId}/reference-solution`, {
    headers: headers("instructor"),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  return unwrap<ReferenceSolution>(res);
}

export async function saveReferenceSolution(
  assignmentId: string,
  input: CreateReferenceSolutionInput,
): Promise<ReferenceSolution> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments/${assignmentId}/reference-solution`, {
    method: "POST",
    headers: headers("instructor"),
    body: JSON.stringify(input),
  });
  return unwrap<ReferenceSolution>(res);
}

export async function listReferenceSolutionVersions(
  assignmentId: string,
): Promise<ReferenceSolution[]> {
  const res = await fetch(
    `${BACKEND_URL}/v1/assignments/${assignmentId}/reference-solution/versions`,
    { headers: headers("instructor"), cache: "no-store" },
  );
  const body = await unwrap<{ items: ReferenceSolution[] }>(res);
  return body.items;
}

export async function getReferenceSolutionVersion(
  assignmentId: string,
  version: number,
): Promise<ReferenceSolution> {
  const res = await fetch(
    `${BACKEND_URL}/v1/assignments/${assignmentId}/reference-solution/versions?version=${version}`,
    { headers: headers("instructor"), cache: "no-store" },
  );
  return unwrap<ReferenceSolution>(res);
}

// ---- Verifications ----

export async function submitVerification(
  conceptCheckSetId: string,
  input: CreateConceptCheckVerificationInput,
): Promise<ConceptCheckVerification> {
  const res = await fetch(
    `${BACKEND_URL}/v1/concept-check-sets/${conceptCheckSetId}/verifications`,
    {
      method: "POST",
      headers: headers("student"),
      body: JSON.stringify(input),
    },
  );
  return unwrap<ConceptCheckVerification>(res);
}

export async function listVerifications(
  conceptCheckSetId: string,
  role: Role,
): Promise<ConceptCheckVerification[]> {
  const res = await fetch(
    `${BACKEND_URL}/v1/concept-check-sets/${conceptCheckSetId}/verifications`,
    { headers: headers(role), cache: "no-store" },
  );
  const body = await unwrap<{ items: ConceptCheckVerification[] }>(res);
  return body.items;
}

export async function getVerification(id: string, role: Role): Promise<ConceptCheckVerification> {
  const res = await fetch(`${BACKEND_URL}/v1/verifications/${id}`, {
    headers: headers(role),
    cache: "no-store",
  });
  return unwrap<ConceptCheckVerification>(res);
}

// ---- Help ----

export async function postHelp(
  assignmentId: string,
  messages: ChatMessage[],
  requestType?: HelpRequestType,
): Promise<HelpResponse> {
  const res = await fetch(`${BACKEND_URL}/v1/assignments/${assignmentId}/help`, {
    method: "POST",
    headers: headers("student"),
    body: JSON.stringify({ messages, ...(requestType ? { requestType } : {}) }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;
    const err: PostHelpError = {
      status: res.status,
      error: body?.error ?? "request_failed",
      message: body?.message ?? res.statusText,
    };
    throw err;
  }
  return (await res.json()) as HelpResponse;
}

// ---- Instructor dashboard ----

export async function getInstructorDashboard(): Promise<InstructorDashboard> {
  const res = await fetch(`${BACKEND_URL}/v1/instructor/dashboard`, {
    headers: headers("instructor"),
    cache: "no-store",
  });
  return unwrap<InstructorDashboard>(res);
}

// ---- Voice transcription (student-only, owner-only) ----

export async function transcribeAnswer(
  conceptCheckSetId: string,
  questionId: string,
  audio: Blob,
): Promise<TranscribeResponse> {
  const contentType = audio.type && audio.type.length > 0 ? audio.type : "audio/webm";
  const res = await fetch(
    `${BACKEND_URL}/v1/concept-check-sets/${encodeURIComponent(conceptCheckSetId)}/transcribe?questionId=${encodeURIComponent(questionId)}`,
    {
      method: "POST",
      headers: {
        ...headers("student"),
        "Content-Type": contentType,
      },
      body: audio,
    },
  );
  return unwrap<TranscribeResponse>(res);
}

// ---- Conversational TA voice input (student-only, assignment-scoped) ----

export async function transcribeHelpAnswer(
  assignmentId: string,
  audio: Blob,
): Promise<TranscribeHelpResponse> {
  const contentType = audio.type && audio.type.length > 0 ? audio.type : "audio/webm";
  const res = await fetch(
    `${BACKEND_URL}/v1/assignments/${encodeURIComponent(assignmentId)}/help/transcribe`,
    {
      method: "POST",
      headers: {
        ...headers("student"),
        "Content-Type": contentType,
      },
      body: audio,
    },
  );
  return unwrap<TranscribeHelpResponse>(res);
}

// ---- Evidence export (instructor-only) ----

export async function getEvidenceReport(submissionId: string): Promise<EvidenceReport> {
  const res = await fetch(`${BACKEND_URL}/v1/submissions/${submissionId}/evidence-report`, {
    headers: headers("instructor"),
    cache: "no-store",
  });
  return unwrap<EvidenceReport>(res);
}
