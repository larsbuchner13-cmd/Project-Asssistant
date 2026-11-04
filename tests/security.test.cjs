const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");

// Execute actual action/guard modules. Only infrastructure is substituted.
function loader(overrides) {
  const cache = new Map();
  return function load(name) {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (!name.startsWith("@/")) return require(name);
    if (cache.has(name)) return cache.get(name).exports;
    const file = path.join(root, "src", name.slice(2) + ".ts");
    const module = { exports: {} }; cache.set(name, module);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText;
    vm.runInNewContext("(function(require,module,exports){" + code + "\n})", {
      Date, Set, Map, TextEncoder, process, console,
    }, { filename: file })(load, module, module.exports);
    return module.exports;
  };
}

function fixture() {
  const db = { tables: {
    project: [{ id: "p1", ownerId: "u1" }, { id: "p2", ownerId: "u2" }],
    user: [{ id: "u1", role: "USER", status: "ACTIVE", sessionVersion: 0 }],
    task: [{ id: "own", projectId: "p1", status: "BACKLOG", order: 0 }, { id: "foreign", projectId: "p2", status: "BACKLOG", order: 0 }],
    backlogItem: [{ id: "own", projectId: "p1", status: "BACKLOG", order: 0 }, { id: "foreign", projectId: "p2", status: "BACKLOG", order: 0 }],
    sprint: [{ id: "s1", projectId: "p1" }, { id: "s2", projectId: "p2" }],
    workPackage: [{ id: "w1", projectId: "p1", parentId: null, level: 1 }, { id: "w2", projectId: "p2", parentId: null, level: 1 }],
    processTemplate: [{ id: "t1", createdById: "u1" }, { id: "t2", createdById: "u2" }],
    processStepTemplate: [{ id: "own", templateId: "t1" }, { id: "foreign", templateId: "t2" }],
    processRunStep: [{ id: "step1", runId: "r1", status: "READY", approvalStatus: "NOT_REQUIRED", order: 0, run: { status: "ACTIVE" }, checklistItems: [] }],
    processRunChecklistItem: [{ id: "own", runStepId: "step1", done: false }, { id: "foreign", runStepId: "locked-step", done: false }],
  } };
  function matches(row, where = {}) {
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (key === "decision") return matches(db.tables.decision.find(r => r.id === row.decisionId), value);
      if (key === "successor") return matches(db.tables.workPackage.find(r => r.id === row.successorId), value);
      if (!row) return false;
      if (value && typeof value === "object") {
        if ("in" in value) return value.in.includes(row[key]);
        if ("gt" in value) return row[key] > value.gt;
        if ("lt" in value) return row[key] < value.lt;
      }
      return row[key] === value;
    });
  }
  for (const name of ["project", "user", "task", "risk", "backlogItem", "sprint", "workPackage", "workPackageDependency", "processTemplate", "processStepTemplate", "processRunStep", "processRunChecklistItem", "processRun", "assumption", "dependency", "changeRequest", "lessonLearned", "issue", "decision", "actionItem", "stageGate", "stakeholder", "statusReport", "closureChecklistItem"]) {
    db.tables[name] ||= [];
    const find = (where) => db.tables[name].find(r => matches(r, where));
    const required = (where) => { const row = find(where); if (!row) throw new Error("Record not found"); return row; };
    db[name] = {
      findUnique: async ({ where }) => structuredClone(find(where) || null),
      findUniqueOrThrow: async ({ where }) => structuredClone(required(where)),
      findFirst: async ({ where }) => structuredClone(find(where) || null),
      findMany: async ({ where } = {}) => structuredClone(db.tables[name].filter(r => matches(r, where))),
      count: async ({ where } = {}) => db.tables[name].filter(r => matches(r, where)).length,
      create: async ({ data }) => { const row = { id: "new", ...structuredClone(data) }; db.tables[name].push(row); return row; },
      createMany: async ({ data }) => { db.tables[name].push(...structuredClone(data)); },
      update: async ({ where, data }) => {
        const row = required(where);
        for (const [key, value] of Object.entries(data)) row[key] = value && typeof value === "object" && "increment" in value ? (row[key] || 0) + value.increment : structuredClone(value);
        return structuredClone(row);
      },
      delete: async ({ where }) => { const row = required(where); db.tables[name] = db.tables[name].filter(r => r !== row); return row; },
      deleteMany: async ({ where }) => { db.tables[name] = db.tables[name].filter(r => !matches(r, where)); },
    };
  }
  db.$transaction = async (work) => {
    const snapshot = structuredClone(db.tables);
    try { return await work(db); } catch (e) { db.tables = snapshot; throw e; }
  };
  const load = loader({
    "@/lib/prisma": { prisma: db },
    "@/lib/auth": { authOptions: {} },
    "next-auth": { getServerSession: async () => ({ user: { id: "u1", role: "USER", status: "ACTIVE" } }) },
    "next/cache": { revalidatePath() {} },
  });
  return { db, load, actions: (file) => load("@/app/[locale]/actions/" + file) };
}

const deletions = [
  ["tasks", "deleteTask", "task"], ["risks", "deleteRisk", "risk"],
  ["backlog-items", "deleteBacklogItem", "backlogItem"], ["sprints", "deleteSprint", "sprint"],
  ["assumptions", "deleteAssumption", "assumption"], ["dependencies", "deleteDependency", "dependency"],
  ["change-requests", "deleteChangeRequest", "changeRequest"], ["lessons-learned", "deleteLessonLearned", "lessonLearned"],
  ["issues", "deleteIssue", "issue"], ["decisions", "deleteDecision", "decision"],
  ["stage-gates", "deleteStageGate", "stageGate"], ["stakeholders", "deleteStakeholder", "stakeholder"],
  ["status-reports", "deleteStatusReport", "statusReport"], ["closure-checklist", "deleteChecklistItem", "closureChecklistItem"],
  ["work-packages", "deleteWorkPackage", "workPackage"],
];
for (const [file, method, model] of deletions) {
  test(`${method}: deny foreign target and foreign project; allow owned target`, async () => {
    const f = fixture(); f.db.tables[model] = [{ id: "own", projectId: "p1" }, { id: "foreign", projectId: "p2" }];
    const action = f.actions(file)[method]; assert.equal(typeof action, "function");
    await assert.rejects(action("p1", "foreign"));
    await assert.rejects(action("p2", "foreign"));
    assert.equal(f.db.tables[model].length, 2);
    await action("p1", "own");
    assert.deepEqual(f.db.tables[model].map(r => r.id), ["foreign"]);
  });
}
test("task move rolls back earlier writes when sort list contains a foreign record", async () => {
  const f = fixture(); const before = structuredClone(f.db.tables);
  await assert.rejects(f.actions("tasks").moveTask("p1", "own", "DONE", ["own", "foreign"]));
  assert.deepEqual(f.db.tables, before);
  await f.actions("tasks").moveTask("p1", "own", "DONE", ["own"]);
  assert.equal(f.db.tables.task[0].status, "DONE");
});
test("backlog assignment rejects foreign item and foreign sprint; permits own sprint", async () => {
  const f = fixture(), a = f.actions("backlog-items");
  await assert.rejects(a.assignToSprint("p1", "foreign", "s1"));
  await assert.rejects(a.assignToSprint("p1", "own", "s2"));
  assert.equal(f.db.tables.backlogItem[0].sprintId, undefined);
  await a.assignToSprint("p1", "own", "s1");
  assert.equal(f.db.tables.backlogItem[0].sprintId, "s1");
});
test("template step delete checks the step's template", async () => {
  const f = fixture(), a = f.actions("process-templates");
  await assert.rejects(a.deleteProcessStep("t1", "foreign"));
  assert.equal(f.db.tables.processStepTemplate.length, 2);
  await a.deleteProcessStep("t1", "own");
  assert.deepEqual(f.db.tables.processStepTemplate.map(r => r.id), ["foreign"]);
});
test("template update rejects foreign steps before replacing checklists", async () => {
  const f = fixture(); const before = structuredClone(f.db.tables);
  await assert.rejects(f.actions("process-templates").updateProcessStep("t1", "foreign", {
    name: "New name", requiresApproval: false, checklistLabels: ["new item"],
  }));
  assert.deepEqual(f.db.tables, before);
});
test("decision update cannot remove a foreign decision's action items", async () => {
  const f = fixture();
  f.db.tables.decision = [{ id: "foreign", projectId: "p2" }];
  f.db.tables.actionItem = [{ id: "action", decisionId: "foreign", done: false }];
  const before = structuredClone(f.db.tables);
  await assert.rejects(f.actions("decisions").updateDecision("p1", "foreign", {
    meetingDate: "2026-11-04", attendees: "Test", decisionText: "Test", actionItems: [],
  }));
  assert.deepEqual(f.db.tables, before);
  await assert.rejects(f.actions("decisions").toggleActionItem("p1", "action", true));
  assert.equal(f.db.tables.actionItem[0].done, false);
});
test("task creation rejects a work package in a foreign project", async () => {
  const f = fixture(); const before = structuredClone(f.db.tables);
  await assert.rejects(f.actions("tasks").createTask("p1", {
    title: "Test", workPackageId: "w2", priority: "MEDIUM", status: "BACKLOG",
  }));
  assert.deepEqual(f.db.tables, before);
});
test("work package rejects foreign parent/dependencies without partial creation", async () => {
  const f = fixture(); const before = structuredClone(f.db.tables);
  const values = { name: "Test", plannedCost: 0, actualCost: 0, status: "NOT_STARTED", dependencyIds: [] };
  await assert.rejects(f.actions("work-packages").createWorkPackage("p1", "w2", values));
  assert.deepEqual(f.db.tables, before);
  await assert.rejects(f.actions("work-packages").createWorkPackage("p1", null, { ...values, dependencyIds: ["w2"] }));
  assert.deepEqual(f.db.tables, before);
});
test("work package rejects moving a parent under its own child", async () => {
  const f = fixture();
  f.db.tables.workPackage.push({ id: "child", projectId: "p1", parentId: "w1", level: 2 });
  const before = structuredClone(f.db.tables);
  await assert.rejects(f.actions("work-packages").moveWorkPackage("p1", "w1", "child", ["w1"]), /Cyclic/);
  assert.deepEqual(f.db.tables, before);
});
test("backlog move rejects foreign sort IDs and rolls back status change", async () => {
  const f = fixture(); const before = structuredClone(f.db.tables);
  await assert.rejects(f.actions("backlog-items").moveBacklogItemStatus("p1", "own", "DONE", ["own", "foreign"]));
  assert.deepEqual(f.db.tables, before);
});
test("workflow completion rejects locked steps and failed next-step update rolls back", async () => {
  const f = fixture(), a = f.actions("process-runs");
  f.db.tables.processRunStep[0].status = "LOCKED";
  await assert.rejects(a.completeProcessRunStep("step1"));
  f.db.tables.processRunStep[0].status = "IN_PROGRESS";
  const before = structuredClone(f.db.tables);
  f.db.processRunStep.findFirst = async () => ({ id: "missing-next", status: "LOCKED" });
  await assert.rejects(a.completeProcessRunStep("step1"));
  assert.deepEqual(f.db.tables, before);
});
test("workflow approvals require the designated approver and a complete checklist", async () => {
  const f = fixture(), a = f.actions("process-runs");
  Object.assign(f.db.tables.processRunStep[0], { status: "IN_PROGRESS", requiresApproval: true, approvalStatus: "PENDING", approverId: "u2" });
  await assert.rejects(a.approveProcessRunStep("step1", true));
  f.db.tables.processRunStep[0].approverId = "u1";
  f.db.tables.processRunStep[0].checklistItems = [{ done: false }];
  await assert.rejects(a.approveProcessRunStep("step1", true));
  assert.equal(f.db.tables.processRunStep[0].approvalStatus, "PENDING");
});
test("checklist item is bound to its step and rejects closed/pending workflows", async () => {
  const f = fixture(), a = f.actions("process-runs");
  await assert.rejects(a.toggleRunChecklistItem("step1", "foreign", true));
  assert.equal(f.db.tables.processRunChecklistItem[1].done, false);
  await a.toggleRunChecklistItem("step1", "own", true);
  assert.equal(f.db.tables.processRunChecklistItem[0].done, true);
  for (const state of ["CANCELLED", "COMPLETED"]) {
    f.db.tables.processRunStep[0].run.status = state;
    await assert.rejects(a.toggleRunChecklistItem("step1", "own", false));
  }
  f.db.tables.processRunStep[0].run.status = "ACTIVE";
  f.db.tables.processRunStep[0].approvalStatus = "PENDING";
  await assert.rejects(a.toggleRunChecklistItem("step1", "own", false));
  assert.equal(f.db.tables.processRunChecklistItem[0].done, true);
});
test("JWT invalidates deleted users, changed password versions and pre-upgrade tokens", async () => {
  for (const [current, version, valid] of [[null, 0, false], [{ role: "ADMIN", status: "ACTIVE", sessionVersion: 1 }, 0, false], [{ role: "USER", status: "ACTIVE", sessionVersion: 0 }, undefined, false], [{ role: "USER", status: "ACTIVE", sessionVersion: 0 }, 0, true]]) {
    const load = loader({ "@/lib/prisma": { prisma: { user: { findUnique: async () => current } } } });
    const jwt = load("@/lib/auth").authOptions.callbacks.jwt;
    const token = await jwt({ token: { id: "u1", role: "ADMIN", status: "ACTIVE", sessionVersion: version } });
    assert.equal(Boolean(token.id) && token.status === "ACTIVE", valid);
    if (!valid) assert.equal(token.role, "USER");
  }
});
test("password validation rejects bcrypt truncation, including multibyte input", () => {
  const schema = loader({})("@/lib/validations/auth").registerFormSchema;
  const values = { name: "Test User", email: "test@example.com" };
  for (const password of ["x".repeat(73), "ä".repeat(37)]) assert.equal(schema.safeParse({ ...values, password, confirmPassword: password }).success, false);
  const password = "ä".repeat(36);
  assert.equal(schema.safeParse({ ...values, password, confirmPassword: password }).success, true);
});
test("rate limiter shares counters and rejects requests beyond the quota", async () => {
  const counters = new Map();
  const load = loader({ "@/lib/prisma": { prisma: { rateLimit: {
    deleteMany: async () => {},
    upsert: async ({ where }) => { counters.set(where.id, (counters.get(where.id) || 0) + 1); return { count: counters.get(where.id) }; },
  } } } });
  const limiter = load("@/lib/rate-limit");
  await limiter.consumeRateLimit("login", "user", 2, 900000);
  await limiter.consumeRateLimit("login", "user", 2, 900000);
  await assert.rejects(limiter.consumeRateLimit("login", "user", 2, 900000), /Too many/);
  await limiter.consumeRateLimit("login", "other-user", 2, 900000);
  assert.ok([...counters.keys()].every(k => !k.includes("user")));
});
test("malformed bearer token is treated as unauthenticated by upgraded Auth.js", async () => {
  const { getToken } = require("next-auth/jwt");
  assert.equal(await getToken({ req: { headers: { authorization: "Bearer %" }, cookies: {} }, secret: "test-only" }), null);
});
