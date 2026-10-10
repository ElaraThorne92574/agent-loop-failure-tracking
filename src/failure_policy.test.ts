import assert from "node:assert/strict";
import { shouldRollback } from "./failure_policy.ts";

const base = { agent: "release-agent", step: "validate", releaseId: "rel-7", error: new Error("bad config") };
assert.equal(shouldRollback({ ...base, attempts: 1 }), false);
assert.equal(shouldRollback({ ...base, attempts: 3 }), true);
assert.equal(shouldRollback({ ...base, step: "publish", attempts: 1 }), true);
console.log("failure policy decisions verified");
