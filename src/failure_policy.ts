export type AgentRun = { agent: string; step: string; releaseId: string; attempts: number; error: Error };

export function shouldRollback(run: AgentRun): boolean {
  return run.attempts >= 3 || run.step === "publish";
}

export function diagnostic(run: AgentRun): Record<string, unknown> {
  return {
    title: `${run.agent}/${run.step} failed`, message: run.error.message, level: "error",
    fingerprint: [run.agent, run.step], exception: run.error.stack ?? run.error.name,
    context: { agent: run.agent, step: run.step, releaseId: run.releaseId, attempts: run.attempts }
  };
}
