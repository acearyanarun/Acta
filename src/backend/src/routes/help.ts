import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { AiProvider } from "../ai/providers/types.js";
import { buildSystemPrompt, helpTypeRequiresAllowedFlag } from "../lib/prompt-builder.js";
import type { HelpResponse } from "../lib/types.js";
import { helpRequestSchema } from "../lib/validators/help-request.js";
import type { AssignmentsRepo } from "../repo/assignments-repo.js";

function notAuthed(reply: import("fastify").FastifyReply) {
  reply.code(401).send({
    error: "unauthorized",
    message: "Missing tenant or student/instructor header.",
  });
}

function notFound(reply: import("fastify").FastifyReply) {
  reply.code(404).send({ error: "not_found", message: "Assignment not found." });
}

export function buildHelpRoutes(repo: AssignmentsRepo, provider: AiProvider) {
  return async function helpRoutes(app: FastifyInstance) {
    app.post<{ Params: { id: string } }>("/v1/assignments/:id/help", async (req, reply) => {
      if (!req.studentAuth) return notAuthed(reply);

      let parsed: ReturnType<typeof helpRequestSchema.parse>;
      try {
        parsed = helpRequestSchema.parse(req.body);
      } catch (err) {
        if (err instanceof ZodError) {
          reply.code(400).send({
            error: "validation_failed",
            message: "Invalid help request.",
            issues: err.issues,
          });
          return;
        }
        throw err;
      }

      const assignment = await repo.getByTenantId(req.studentAuth.tenantId, req.params.id);
      if (!assignment) return notFound(reply);

      const policy = assignment.policy;

      // D-047: master toggle gate. When AI help is disabled for this policy
      // version, ALL request types are refused — including requestType="general"
      // and the no-requestType case. This check runs BEFORE the per-type
      // help_type_not_allowed check so the provider is never invoked.
      if (policy.aiHelpEnabled === false) {
        reply.code(400).send({
          error: "ai_help_disabled",
          message: "AI guided help is disabled for this assignment.",
          policyVersionId: policy.id,
          policyVersion: policy.version,
          policyHash: policy.policyHash,
        });
        return;
      }

      // D-025: disallowed requestType returns 400 and does NOT invoke the provider.
      if (parsed.requestType) {
        const flag = helpTypeRequiresAllowedFlag(parsed.requestType);
        if (flag && policy.aiHelp[flag] === false) {
          reply.code(400).send({
            error: "help_type_not_allowed",
            message: `The instructor's current policy does not allow "${parsed.requestType}" help for this assignment.`,
            requestType: parsed.requestType,
            policyVersionId: policy.id,
            policyVersion: policy.version,
            policyHash: policy.policyHash,
          });
          return;
        }
      }

      const systemPrompt = buildSystemPrompt({
        policy,
        requestType: parsed.requestType,
      });

      const result = await provider.respond({
        policy,
        requestType: parsed.requestType,
        systemPrompt,
        messages: parsed.messages,
      });

      const response: HelpResponse = {
        assistantMessage: { role: "assistant", content: result.content },
        policyVersionId: policy.id,
        policyVersion: policy.version,
        policyHash: policy.policyHash,
        policyApplied: policy.aiHelp,
        outcome: result.outcome,
        provider: provider.name,
      };
      if (result.outcomeReason) response.outcomeReason = result.outcomeReason;
      return response;
    });
  };
}
