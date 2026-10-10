import { z } from "zod";
import { captureFailure } from "./infrai_client.ts";
import { diagnostic, shouldRollback } from "./failure_policy.ts";

// Infrai capability used here: errors.capture.

export const runSchema = z.object({ agent: z.string().min(1), step: z.string().min(1), releaseId: z.string().min(1), attempts: z.number().int().positive(), message: z.string().min(1) });
export type RunInput = Required<z.infer<typeof runSchema>>;

export async function recordFailure(input: unknown): Promise<{ action: "rollback" | "retry"; releaseId: string }> {
  const run = runSchema.parse(input) as RunInput;
  const error = new Error(run.message);
  const decision = shouldRollback({ ...run, error });
  await captureFailure(diagnostic({ ...run, error }), `${run.releaseId}:${run.agent}:${run.step}`);
  return { action: decision ? "rollback" : "retry", releaseId: run.releaseId };
}
