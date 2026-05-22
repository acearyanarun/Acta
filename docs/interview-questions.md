# Interview Questions

**Purpose:** Interview question bank organized by persona. Questions are derived from the
capability gaps in the feature matrix — each question probes whether the gap represents
real pain that faculty/institutions would pay to solve.
**Owner:** customer-discovery-agent
**Last updated:** 2026-05-05
**Status:** Phase 1 complete — gap-derived questions ready for use in discovery calls

---

## Design principles

- Questions probe behavior, not opinions. ("What did you do?" not "Would you want X?")
- Questions surface the gap pain without naming Acta as the solution.
- Questions uncover who owns the appeals process, what evidence exists today, and what AI
  policy the institution has — the three key discovery signals.
- Do not lead with "verification" framing — let the interviewee arrive at the problem.

---

## Persona: Individual faculty

### Section 1 — Integrity and appeals (probing the signed ledger and verification gap)

1. Walk me through the last time a student challenged a grade decision. What happened,
   step by step?
2. What evidence did you have access to when defending that grade? What did you wish
   you had?
3. Who else was involved — department chair, dean, ombudsperson? What did they ask for?
4. Have you ever had a case where you couldn't prove what you needed to prove?
   What was the outcome?
5. How long do you typically spend on a single academic integrity case, from suspicion
   to resolution?
6. Have you used any AI detection tool (Turnitin, GPTZero, etc.)? What has your experience
   been with its accuracy?
7. Has a student ever successfully disputed a detection-based finding against you?
   What was that like?

### Section 2 — AI use in your course (probing policy and control gap)

8. What is your current AI policy for assignments in your course?
9. Does your institution have a formal AI policy? Do you follow it, adapt it, or ignore it?
10. When a student submits AI-assisted work, how do you know whether they understood
    the material?
11. Have you tried any AI tools that let you set per-assignment rules about what AI can
    or can't do? How did that work?
12. If you could control AI use differently for a take-home essay vs. a problem set vs.
    a final project, what would each policy look like?

### Section 3 — Concept check and verification (probing submission-grounded checks gap)

13. After a student submits work, do you ever follow up with questions to verify they
    understand what they submitted? How often? How do you do it?
14. If a tool could automatically generate 2–3 short questions from a student's own
    submission and ask them to answer, would that change how you grade?
15. What would make you trust an automated follow-up question more than a detection score?

### Section 4 — Grading modes (probing configurable modes gap)

16. For which assignments would you want a verification check to be required (student
    must pass to get credit)? For which would you just want a signal?
17. If a student failed a post-submission verification check, what should happen?
    Who should decide?

### Section 5 — Decision authority and procurement

18. Have you ever paid for a course tool out of pocket? What was it and why?
19. If something proved it solved your integrity problem in one semester, how would
    you go about getting your department or institution to adopt it?
20. Who in your institution would need to approve a new tool that handles student data?

---

## Persona: Department chair / academic administrator

### Section 1 — Integrity at scale

1. How many academic integrity cases does your department handle in a typical semester?
   What does that cost in faculty time?
2. Who is responsible when a grade dispute escalates past the department level?
   What evidence do they typically have?
3. Has your department ever had a case where the evidence was insufficient to defend
   the grade? What happened?
4. Do you have a consistent AI policy across all faculty in your department, or does
   each instructor set their own?

### Section 2 — Accreditation and evidence (probing accreditation-ready export gap)

5. Has your accreditation body asked any questions about AI use in your program
   in the last two years?
6. If ABET (or your accreditor) asked you to document how student learning was verified
   in an AI-era course, what would you show them today?
7. Are there specific learning outcomes in your program that are hardest to verify?
   Which ones?

### Section 3 — Procurement

8. How do tools typically get adopted in your department — faculty requests, dean mandate,
   IT procurement, or some combination?
9. What would make you confident enough in a new tool to run a pilot with 3–5 faculty?
10. What data handling questions would your IT or legal team ask before approving a tool
    that processes student submissions?

---

## Persona: Provost / VP Academic Affairs

### Section 1 — Institutional exposure

1. What is the institution's current exposure from AI-related grade disputes or
   academic integrity cases? Have any escalated to legal counsel?
2. Has anyone in your institution been sued or formally threatened over an AI detection
   decision? How was it handled?
3. What does your current AI policy say about verification of student understanding?
   Who owns enforcement?

### Section 2 — Accreditation and evidence (probing accreditation export and signed ledger gap)

4. When a regional accreditor or ABET reviewer asks about AI in your curriculum,
   what documentation do you currently provide?
5. If you had a cryptographically signed record of every student's post-submission
   verification — exportable on demand — would that change how you approach
   accreditation reviews?
6. Is the EU AI Act on your radar? Do you have programs or partnerships with EU exposure?

### Section 3 — Faculty adoption and burden

7. What has been the biggest barrier to faculty adopting new integrity tools in the
   last two years?
8. If a tool added 5 minutes of setup per assignment but eliminated integrity case
   overhead for the semester, would faculty accept it? Have you tested assumptions
   like this before?

---

## Persona: IT / LMS administrator (probing LMS integration depth — Q5)

1. What LMS are you running? Is it centrally managed or do departments have autonomy?
2. Have you integrated any third-party AI tools via LTI? What was that process like?
3. What data governance requirements does any tool need to meet before you'll allow
   it to access student submission data?
4. Who in your institution signs a data processing agreement with an edtech vendor?
   How long does that process take?
5. If a tool needed access to student submissions via the LMS API, what review process
   would that trigger?

---

## Capability gap → interview question mapping

| Gap from matrix | Interview question IDs | What we're testing |
|----------------|----------------------|-------------------|
| Submission-grounded concept checks | F-13, F-14, F-15 | Would faculty value check generation from student work? |
| Signed provenance ledger | F-1, F-2, F-3, F-4, DC-3, PR-1, PR-5 | Is grade-defense evidence a real unsolved pain? |
| Configurable grading modes | F-12, F-16, F-17 | Do faculty want mode control per assignment? |
| Accreditation-ready export | DC-5, DC-6, DC-7, PR-4, PR-5 | Is accreditation evidence a real driver? |
| Multi-modal oral verification | F-15 (partial) | Is oral verification a wanted capability? |
| Multi-LMS neutrality | IT-1, IT-5 | Does LMS lock-in affect buying decision? |

---

## Open questions for founder

- **Q1:** Which persona do you want to prioritize for the first discovery calls?
- **Q6:** Are the first 3–5 design partners institutional contracts or individual faculty?
  This determines whether the Provost questions or Faculty questions are used first.
- **[Nursing flag]:** Should nursing-specific accreditation questions (ACEN/CCNE) be
  added to the Dept. Chair / Provost tracks?
