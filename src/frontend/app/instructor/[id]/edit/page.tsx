"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AssignmentForm } from "../../../../components/assignment-form";
import { getAssignment, updateAssignment } from "../../../../lib/api-client";
import type { Assignment } from "../../../../lib/types/assignment";

export default function EditAssignmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAssignment(params.id)
      .then(setAssignment)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [params.id]);

  if (error) return <p className="form-error">{error}</p>;
  if (!assignment) return <p style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <section>
      <Link href={`/instructor/${assignment.id}`} className="back-link">
        ← Back to assignment
      </Link>
      <span className="workspace-badge workspace-badge--instructor">Instructor Workspace</span>
      <h1>Edit policy — {assignment.policy.title}</h1>
      <p className="page-sub">Saves a new version. Older submissions keep their original policy.</p>
      <AssignmentForm
        submitLabel="Save new version"
        initial={{
          title: assignment.policy.title,
          instructions: assignment.policy.instructions,
          rubric: assignment.policy.rubric,
          aiHelp: assignment.policy.aiHelp,
          verificationMode: assignment.policy.verificationMode,
        }}
        onCancel={() => router.push(`/instructor/${assignment.id}`)}
        onSubmit={async (input) => {
          await updateAssignment(assignment.id, input);
          router.push(`/instructor/${assignment.id}`);
        }}
      />
    </section>
  );
}
