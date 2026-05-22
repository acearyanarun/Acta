"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getInstructorDashboard } from "../lib/api-client";

export default function HomePage() {
  const [sampleSubmissionId, setSampleSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // If SEED_DEMO_DATA=true on the backend, the default demo tenant has at
    // least one verification attempt. Surface a "See sample evidence report"
    // link in that case. If the fetch fails or the tenant is empty, the link
    // simply doesn't render — no error shown.
    getInstructorDashboard()
      .then((d) => {
        if (cancelled) return;
        const latest = d.recentVerifications[0];
        if (latest) setSampleSubmissionId(latest.submissionId);
      })
      .catch(() => {
        /* no demo seed available — skip the link */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="home">
      <h1 className="home__headline">Allow AI help. Verify understanding.</h1>
      <p className="home__sub">
        Acta turns student work into evidence of learning.{" "}
        <strong>It is not an AI detector.</strong> It verifies whether students understand the work
        they submit.
      </p>

      <div className="home__cta-row">
        <Link href="/instructor" className="btn btn--primary btn--lg">
          Open Instructor Workspace →
        </Link>
        {sampleSubmissionId ? (
          <Link
            href={`/submissions/${sampleSubmissionId}/evidence-report`}
            className="home__cta-secondary"
          >
            See a sample evidence report →
          </Link>
        ) : (
          <Link href="/student" className="home__cta-secondary">
            Or open as a student
          </Link>
        )}
      </div>

      <ol className="demo-strip" aria-label="How Acta works">
        <li>
          <span>1</span> Instructor sets the rules
        </li>
        <li>
          <span>2</span> Student submits work
        </li>
        <li>
          <span>3</span> Acta checks understanding
        </li>
        <li>
          <span>4</span> Instructor reviews evidence
        </li>
      </ol>
    </section>
  );
}
