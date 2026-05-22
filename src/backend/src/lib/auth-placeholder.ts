import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthContext, StudentAuthContext } from "./types.js";

const TENANT_HEADER = "x-acta-tenant-id";
const INSTRUCTOR_HEADER = "x-acta-instructor-id";
const STUDENT_HEADER = "x-acta-student-id";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
    studentAuth?: StudentAuthContext;
  }
}

export function readAuthFromHeaders(req: FastifyRequest): AuthContext | null {
  const tenantId = String(req.headers[TENANT_HEADER] ?? "").trim();
  const instructorId = String(req.headers[INSTRUCTOR_HEADER] ?? "").trim();
  if (!tenantId || !instructorId) return null;
  return { tenantId, instructorId };
}

export function readStudentAuthFromHeaders(req: FastifyRequest): StudentAuthContext | null {
  const tenantId = String(req.headers[TENANT_HEADER] ?? "").trim();
  const instructorId = String(req.headers[INSTRUCTOR_HEADER] ?? "").trim();
  const studentId = String(req.headers[STUDENT_HEADER] ?? "").trim();
  if (!tenantId) return null;
  if (!studentId && !instructorId) return null;
  return {
    tenantId,
    studentId: studentId || undefined,
    instructorId: instructorId || undefined,
  };
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (req.url === "/healthz") return;

  // Student-facing routes accept either student or instructor identity (D-024).
  // We probe both auth contexts; both may be set on a single request.
  const auth = readAuthFromHeaders(req);
  const studentAuth = readStudentAuthFromHeaders(req);

  if (!auth && !studentAuth) {
    reply.code(401).send({
      error: "unauthorized",
      message:
        "Missing X-Acta-Tenant-Id and X-Acta-Student-Id (or X-Acta-Instructor-Id). Placeholder auth, D-020/D-024.",
    });
    return;
  }
  if (auth) req.auth = auth;
  if (studentAuth) req.studentAuth = studentAuth;
}
