import { TaLab } from "../../../../components/ta-lab/ta-lab";

/**
 * Acta TA Lab — premium command-center experience for the conversational TA.
 * Server shell only; the interactive surface is the client component below.
 */
export default function TaLabPage({ params }: { params: { id: string } }) {
  return <TaLab assignmentId={params.id} />;
}
