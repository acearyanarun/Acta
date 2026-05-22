"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AssignmentForm } from "../../../components/assignment-form";
import { createAssignment } from "../../../lib/api-client";

export default function NewAssignmentPage() {
  const router = useRouter();
  return (
    <section>
      <Link href="/instructor" className="back-link">
        ← Back to assignments
      </Link>
      <span className="workspace-badge workspace-badge--instructor">Instructor Workspace</span>
      <h1>New assignment policy</h1>
      <p className="page-sub">Define instructions, AI-help rules, and verification mode.</p>
      <AssignmentForm
        submitLabel="Create assignment policy"
        onCancel={() => router.push("/instructor")}
        onSubmit={async (input) => {
          const created = await createAssignment(input);
          router.push(`/instructor/${created.id}`);
        }}
      />
    </section>
  );
}
