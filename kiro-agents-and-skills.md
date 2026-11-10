# Kiro Agents and Skills — setup guide and findings

A practical guide to setting up custom agents and skills in Kiro on any project — frontend,
backend, or mobile.

Written after a hands-on session building and testing this on a real project. Findings are labelled
by confidence:

- **Verified** — observed directly in the IDE
- **Documented** — from kiro.dev docs, but we did not test it
- **Unverified** — neither; treat with scepticism

Kiro is moving quickly and some behaviour is version-sensitive, so re-check anything load-bearing
on your own build rather than assuming it still holds. Section 8 has the tests.

Examples throughout are drawn from a TypeScript/Express backend, but nothing here is
backend-specific. Section 11 has starting sets for frontend and mobile.

---

## 1. Agents vs skills

Both are Markdown files with YAML frontmatter. The frontmatter tells you which is which.

```yaml
# AGENT — describes WHO is working
tools: ["read", "write", "shell", "todo_list"]
permissions:
  rules:
    - capability: fs_write        # note: fs_write, NOT write — see §7
      match: ["tests/**"]
      effect: allow
```

```yaml
# SKILL — describes WHAT TO KNOW
name: integration-testing
description: How to write and run integration tests in this project...
```

A skill's frontmatter has only `name` and `description`. **It cannot grant or deny a single
capability.** That is the fundamental split.

| | Agent | Skill |
| --- | --- | --- |
| Defines | behaviour, model, tools, permissions | knowledge, conventions, checklists |
| Enforcement | structural — a capability absent from `tools` cannot be used | none — advisory text only |
| How many active | exactly one | many, simultaneously |
| Loaded | whole body, always, from session start | body loaded on demand when relevant |
| Reuse | serves only that agent | shared by every agent |
| Chosen by | you, in the picker (or automatically, when dispatched as a subagent) | automatically, by description match |

### A caveat on permissions — read before relying on them

Two different mechanisms are easy to conflate:

- **Omitting a capability from `tools`** — e.g. no `write` at all — means the tool does not exist
  for that agent. Structural and dependable.
- **Narrowing a capability with `permissions.rules`** — depends entirely on getting the schema
  right, and the schema is easy to get wrong in ways nothing warns you about. See §7.

Our first attempt used `capability: write`, which is **not a valid capability name** — the rules
were silently inert for weeks. Read §7 before you write any permission rule, and prefer withholding
a capability outright when you need a hard guarantee.

An explicit deny is the correct way to express "this agent must not write":

```yaml
permissions:
  rules:
   
```

### The rule for deciding where content goes

Ask whether it is **how to behave** or **what is true about the codebase**.

- Behaviour, permissions, verification steps, when to stop and ask → **agent**
- Conventions, patterns, code shapes, checklists → **skill**

Worked example. A `test-writer` agent says "you write tests, you cannot touch application source,
report when the implementation is wrong rather than fixing it." Its companion skill says "clean up
fixtures in `afterAll`, close the DB pool, name fixtures so cleanup can find them."

The write restriction *has* to be an agent — that is the only place capability lives. The testing
conventions *should* be a skill, because your dev and reviewer agents need them too, and one file
beats three copies that drift apart.

### Deliberate duplication is fine

Our dev agent repeats three rules that are also in its skill: import extension rules, "no
pagination," "no linter configured." Intentional. Skill activation is probabilistic; an agent's
prompt body is guaranteed to be in context. So the highest-frequency failures live in both places,
and the detail lives only in the skill.

---

## 2. File locations and scope

**Documented:**

| | Workspace | Global |
| --- | --- | --- |
| Agents | `.kiro/agents/` | `~/.kiro/agents/` |
| Skills | `.kiro/skills/<name>/SKILL.md` | `~/.kiro/skills/<name>/SKILL.md` |

Workspace wins on name conflicts. Commit workspace files to share with the team; global is for
personal preferences that travel between projects.

Keep project-specific rules in the workspace. Global skills that reference one project's
conventions will misfire on your next project.

### Agent format

Markdown with frontmatter works — **Verified**. JSON is also accepted (**Documented**), with
`"prompt": "file://path.md"` if you want to keep the prompt body in Markdown.

Fields used in the examples here: `name`, `description`, `tools`, `resources`,
`permissions.rules`. Others exist (`model`, `excludedTools`, `hooks`, `mcpServers`,
`keyboardShortcut`, `welcomeMessage`) — see the config reference.

`tools` accepts tags: `read`, `write`, `shell`, `web`, `subagent`, `knowledge`, `todo_list`,
`@builtin`, `@mcp`, `*`.

### Skill format

A folder with a required `SKILL.md`; optional `scripts/`, `references/`, `assets/`.

- `name` is required, must match the folder name, lowercase/numbers/hyphens, ≤64 chars
- `description` is required, ≤1024 chars, and **drives activation**

### Wiring skills into custom agents

**Documented, and it matters:** custom agents do not necessarily inherit skills. Add the glob
explicitly:

```yaml
resources:
  - "skill://.kiro/skills/*/SKILL.md"
```

Use `skill://`, not `file://`. `skill://` is progressive — metadata at startup, full body on
demand. `file://` globs load content in full at startup and defeat the point.

---

## 3. How skill activation actually works

**Verified.**

At session start Kiro loads only each skill's `name` + `description`, not the body. Your request is
matched against those descriptions, and only the matching skill's full body is pulled into context.
This is why descriptions matter more than anything else you write in a skill.

Loading is **visible in the UI** as its own tool call: `Loaded skill: <name>`. You never have to
infer it from output quality.

Observed example: the prompt "Audit `src/modules/<x>/` for authorization and SQL issues" caused
three skills to load — security review, SQL conventions, and module conventions — interleaved with
the agent's first directory listings, before it opened any source file. The testing skill correctly
did *not* load, since an audit is not test-writing.

### Consequence for writing descriptions

Write descriptions about **when to use**, not what is inside. Vague descriptions mean the skill
silently never loads.

Good:

```yaml
description: Rules for writing raw parameterized SQL, plus geospatial query patterns,
  transactions, and row locks. Use when editing any repository file, writing or reviewing SQL,
  working with coordinates or distance, or adding a transaction.
```

Bad: `description: SQL guidelines.`

The pattern that works: *what it covers* + **"Use when ..."** + concrete triggers (file paths,
task types, symptoms).

### Forcing a skill

Activation is fuzzy. When it matters, invoke explicitly with `/skill-name`, or just say "follow the
<name> skill."

---

## 4. Context behaviour — the main finding

The part worth reading twice.

### Manual agent switch: context is PRESERVED

**Verified.** Switching the agent in the picker mid-conversation keeps the entire conversation. Only
the system prompt and permissions change.

Test used: switched agents mid-thread and asked "Without reading any files, what did we decide
earlier?" It recalled the prior findings accurately with no file reads.

### Subagent delegation: context is LOST

**Verified.** A subagent receives **only the prompt the parent writes** and returns **only a final
summary**. It cannot see the parent's conversation, the files the parent read, or decisions
discussed with you. It also cannot ask you a clarifying question — if confused, it guesses.

Observed: a delegated reviewer re-read an entire module from scratch and loaded its own skills,
because none of the parent's context reached it.

### Three separate gaps in delegation

1. **Parent → subagent** — one-way, explicit only. The parent forwards what it thinks to type, and
   does not know which offhand detail turns out to matter.
2. **Subagent → subagent** — no channel at all. Results return to the parent, which must restate
   them for the next one. Two lossy hops.
3. **Subagent → you** — nothing direct.

Sharpest failure mode: after a schema-change phase, the parent holds only a prose summary. If it
never reads the file itself it cannot state exact field names, so it paraphrases — and the next
agent writes `phoneVerified` where the column is `phone_verified`.

### Mitigations

- **The repo is shared memory.** Every agent reads the same filesystem, so pass **file paths, not
  descriptions**. The artifact is authoritative; a summary is not.
- **Diff between phases.** Give the coordinating agent read + shell access so it can run
  `git diff` and verify what changed rather than trusting a report.
- **Do the nuanced phase manually.** If a decision took a long back-and-forth, don't delegate the
  follow-up — switch agents and keep talking.

### This is not a Kiro defect

Context isolation is deliberate and universal across agent frameworks. Isolation is *why*
delegation is useful — it keeps a reviewer's twenty file reads out of your main context. The lossy
handoff is the price, and you cannot have one without the other.

---

## 5. Recommended workflow

**Default: switch agents manually as the work changes phase.** Example for a backend feature:

```
schema agent  → migration and data model
dev agent     → implementation
test agent    → tests
reviewer      → audit
```

Every phase inherits the full conversation. No restating decisions, no paraphrased names, and you
see each phase's result before the next begins.

**Delegate instead when you specifically want isolation:**

- An **uncontaminated review**. Switching into a reviewer mid-thread means it inherits your framing
  and is predisposed to agree. Isolation gives a clean-room audit.
- **Read-heavy investigation**, where you want conclusions without a dozen file reads clogging your
  session.

Rough rule: **transfer context when you want continuity, withhold it when you want an independent
opinion.** For an audit you intend to trust, start a fresh session with the reviewer rather than
switching into it.

### Coordinator agents

An agent needs `"subagent"` in `tools` to dispatch other agents. It then picks them automatically
by description match.

We built a coordinator agent for this and confirmed it could dispatch a specialist and relay the
result, then deleted it once we learned manual switching preserves context — it saved a couple of
clicks and cost us the lossiest handoff available. Its plan-approval gate and multi-phase write
coordination were never exercised, so treat that part as unproven. Worth having only for unattended
runs on well-understood work.

If you do build one: give it no `write` capability, require plan approval before it dispatches any
writing agent, and never give `subagent` to a read-only reviewer. A read-only agent that can spawn
a writing subagent is not read-only.

### What "orchestration" does and does not mean here

Single-level delegation with a coordinator is **supervised fan-out**, not orchestration. You get
task decomposition, capability partitioning, and context isolation. You do not get durable state
(close the session and the plan is gone), retry or rollback across phases, or deterministic
routing.

For genuinely multi-phase work, Kiro's **Spec** workflow is the better primitive — it persists
requirements, design, and tasks to disk so they survive sessions. Agents give you capability
isolation; specs give you shared, persistent context. Use both for anything large.

---

## 6. Practical gotchas

**Reload the window after adding or renaming an agent.** Discovery happens at startup. A newly
created `.kiro/agents/` directory will not appear in the picker until
`Ctrl+Shift+P` → `Developer: Reload Window`. **Verified** — our agents were invisible until reload,
and the picker showed only built-ins.

Whether *editing* an existing agent's prompt body requires a reload is **Unverified**. Reloading
after any agent change is the safe habit.

**Shell allowlists need maintaining.** Each agent's `permissions.rules` lists specific commands.
Add a new package script and the allowlist needs it too, or the agent gets blocked. One-line fix.

**`git status` is your ground truth.** More reliable than what an agent reports it did. Especially
useful for confirming a read-only agent stayed read-only.

**Skills are shared; agent prompts are not.** Fix a convention once in the skill rather than
copying it into four agents.

---

## 7. Troubleshooting — agents not appearing in the picker

**Verified** — hit by two people on this team independently.

Symptom: the picker shows only the built-ins (Default, Spec, Quick Spec, Bug Fix, Plan) and none of
your `.kiro/agents/*.md` files, with **no error message anywhere**.

Work through these in order.

### 1. Reload the window

Discovery happens at startup. `Ctrl+Shift+P` → `Developer: Reload Window`. This alone fixes the
common case of a newly created `.kiro/agents/` directory.

### 2. A config that fails schema validation is silently dropped

This is the trap. If an agent's front-matter does not validate, Kiro removes that agent from the
picker entirely rather than reporting the problem. The file looks perfectly fine.

Three causes we have actually seen:

**Invalid capability name in `permissions.rules`.** The short tags used in `tools` are *not* valid in
`permissions.rules`. Two different vocabularies:

| Context | Valid values |
| --- | --- |
| `tools` | `read`, `write`, `shell`, `web`, `subagent`, `knowledge`, `todo_list`, `@builtin`, `@mcp`, `*` |
| `permissions.rules` → `capability` | `fs_read`, `fs_write`, `shell`, `web_fetch`, `web_search`, `mcp`, `subagent`, `all` |

So `capability: write` is wrong and must be `capability: fs_write`. This one is nasty because it can
fail *soft* — depending on version you may get an agent that loads normally but whose permission
rule does nothing at all, which is worse than being dropped.

**Missing `effect`.** Every rule requires `effect: allow`, `ask`, or `deny`. Omitting it invalidates
the rule.

**A `hooks` field.** Present in the config reference, but including it makes the IDE drop the agent.
Leave it out.

### 3. `match: []` does not mean "deny everything"

An empty match list accomplishes nothing. To express read-only, use an explicit deny over `**/*` as
shown in §1.

### Correct minimal shape

```yaml
---
name: my-agent
description: What it does, and when to pick it.
tools: ["read", "write", "shell", "todo_list"]
resources:
  - "skill://.kiro/skills/*/SKILL.md"
permissions:
  rules:
    - capability: fs_write
      match: ["tests/**"]
      effect: allow
    
    - capability: shell
      match: ["npm test", "npm run typecheck"]
      effect: allow
---

Your system prompt goes here.
```

### Quick audit of your own files

```
grep -rn "capability:\|effect:\|^hooks:" .kiro/agents/
```

Every `capability:` should be one of the `fs_*`/`shell`/`web_*`/`mcp`/`subagent`/`all` names, every
rule should have an `effect:`, and there should be no `hooks:` at all.

---

## 8. What we did not verify

- **The write path.** In our session no agent wrote application code. Whether a specialist produces
  correct code from a restated prompt is untested.
- **Whether a correctly written `permissions.rules` entry actually restricts anything.** We now know
  the *wrong* capability name makes a rule inert (§7), and we have fixed ours to `fs_write` with an
  explicit deny. What we have still not done is try to make a path-scoped agent write outside its
  allowed paths and observe the result. Test 5 in §9 does this. Worth doing before anyone treats a
  scoped agent as a safety boundary.
- **Plan-approval gates.** Whether a coordinator reliably stops and waits before writing.
- **Steering interaction.** The docs contradict themselves on whether custom agents inherit
  `.kiro/steering/` by default. One page says you must add
  `file://.kiro/steering/**/*.md` to `resources`; another says inheritance is the default. Adding
  the glob explicitly is safe under either reading.
- **Steering as a skill router.** There is no documented mechanism by which naming a skill in a
  steering file causes it to load. Activation is description-matched. A routing table in steering is
  just suggestion text, with no guarantee.
- **Nested delegation.** Untested.
- **Activation reliability across phrasings.** It fired correctly when observed, but it is
  probabilistic, not deterministic.

---

## 9. How to test your own setup

Read-only tests first.

**Test 1 — skills load.** Session agent: your reviewer. Bare prompt, e.g. `Audit <module> for
security issues.` Watch for `Loaded skill:` tool calls. Pass is the skills loading *and* the output
naming your codebase's own patterns rather than generic best-practice advice.

Keep the prompt short. A detailed prompt contaminates the test — if you name the patterns yourself,
you cannot tell what the skill contributed. We made this mistake and had to discard the result.

**Test 2 — the trap test (strongest signal).** Ask your dev agent for something your project
deliberately forbids. Ours: "add pagination to this endpoint," where V1 has no pagination by design.
Pass is it pushing back before writing. A model without the skill has no reason to object, so
hesitation is strong evidence the skill is in context. Say "don't implement it" afterward.

Pick your own trap from whatever your project does unusually — a state library you rejected, a
styling approach you banned, a pattern you migrated away from.

**Test 3 — context transfer.** Mid-thread, switch agents and ask `Without reading any files, what
did we just decide?` Accurate recall means context transferred.

**Test 4 — write path.** On a throwaway branch, ask for one small contained change, then check
`git status` and run your build and test commands.

**Test 5 — do permission rules bite?** On a throwaway branch, ask your path-scoped agent to edit a
file outside its allowed paths. Blocked or prompted means the rule works; a silent successful edit
means it does not, and you should withhold the capability instead of scoping it. Worth doing before
anyone treats a scoped agent as a safety boundary.

---

## 10. Writing a good skill

1. **Quote real code from your repo.** Generic advice adds nothing a capable model already has.
2. **Encode what differs from ecosystem defaults.** That is the category models get wrong. If your
   project does something the mainstream tutorial does not, that is skill material.
3. **Say what NOT to do.** "Do not add pagination or a linter" prevents more damage than most
   positive guidance, because a helpful model will otherwise add both.
4. **Point at a reference implementation.** "Match `src/modules/<example>/`" beats a paragraph of
   prose.
5. **Keep `SKILL.md` actionable.** Bulk reference material belongs in `references/`.
6. **Write the description as a trigger,** not a summary.

Skills are worth writing in proportion to how unusual your project is. A vanilla app needs few; a
codebase with strong local conventions needs several.

---

## 11. Worked example — the setup we built

A TypeScript/Express backend with strict ESM, raw SQL, and role-based area scoping. Four agents,
four skills.

```
.kiro/agents/
  backend-dev.md       feature work; read/write/shell
  db-migrator.md       migrations + the schema ripple; write to migrations/ and src/
  test-writer.md       integration tests; write limited to tests/
  code-reviewer.md     read-only audit; no write capability at all

.kiro/skills/
  module-conventions/        file layering, import rules, controller/service/repository shape
  sql-and-postgis/           parameterized SQL, geospatial patterns, transactions, migrations
  backend-security-review/   object-level authorization, injection, privilege escalation, secrets
  integration-testing/       test patterns, fixtures, cleanup, geospatial test data
```

Two design decisions worth copying:

**`code-reviewer` has no `write` in `tools` at all.** If it can edit, it fixes problems silently and
you never learn they existed. Withholding the capability is the dependable way to get this.

**`test-writer` writes only tests,** so that when a test fails it must report "the implementation is
wrong, here is why" rather than quietly changing the source to match, or weakening the assertion
until it passes. Expressed as an allow on `tests/**` plus a deny on `**/*`.

Our first version of this used `capability: write` and was therefore inert — see §7. If you copy
this pattern, run Test 5 in §9 to confirm the rule actually bites on your build. The agent's prompt
states the restriction in plain language too, which is a useful backstop either way.

Example agent file:

```markdown
---
name: test-writer
description: Writes and fixes integration tests. Scoped to the tests/ directory.
tools: ["read", "write", "shell", "todo_list"]
resources:
  - "skill://.kiro/skills/*/SKILL.md"
permissions:
  rules:
    - capability: fs_write
      match: ["tests/**"]
      effect: allow
    
    - capability: shell
      match: ["npm test", "npx vitest run *", "npm run typecheck"]
      effect: allow
---

You write integration tests for this project. Read the integration-testing skill first.

You write to tests/ only. This is deliberate: when a test fails, the honest outcomes are "the
test was wrong" or "the implementation is wrong." You must not resolve the second by changing
source code, or the first by weakening the assertion until it passes. Report it instead.

Tests are adversarial. Find the input that breaks the endpoint, not the one that proves it works.
```

---

## 12. Starting sets for other project types

Adapt rather than copy. The list below is a prompt for "what does my project do unusually?"

### Frontend (React/Vue/Svelte)

Agents: `frontend-dev`, `component-builder`, `test-writer` (scoped to test files),
`code-reviewer` (read-only), `a11y-reviewer` (read-only).

Skills worth writing:
- **component-conventions** — file layout, naming, props patterns, where state is allowed to live,
  which primitives to compose rather than reinvent
- **styling** — your actual system (Tailwind config, CSS modules, tokens), what not to use, how
  responsive breakpoints and dark mode are handled
- **state-management** — which library, what belongs in global vs local vs server state, and the
  patterns you have banned
- **api-integration** — data fetching layer, error and loading conventions, generated types
- **accessibility** — semantic HTML, keyboard navigation, ARIA rules, focus management, contrast
- **frontend-testing** — component vs e2e boundaries, what you mock, test-id conventions

### Mobile (React Native / Flutter)

Agents: `mobile-dev`, `platform-specialist` (native modules, permissions), `test-writer`,
`code-reviewer`.

Skills worth writing:
- **screen-conventions** — navigation structure, screen file layout, route params
- **platform-differences** — iOS vs Android divergence, safe areas, permission flows
- **offline-and-state** — cache strategy, optimistic updates, sync and conflict handling
- **api-contract** — the backend contract, especially date/time and ID type handling
- **performance** — list virtualization, image handling, re-render traps
- **mobile-testing** — device matrix, what runs in CI vs on-device

### Any project

- **api-contract** — if you have a live contract another team codes against, encode the shape and
  require the doc be updated when the surface changes. Nothing else enforces that.
- **error-handling** — your error taxonomy and when to add a new type versus reuse one.
- **migration-review** or equivalent for irreversible operations.
- **observability** — logging conventions, what must never be logged, request correlation.

---

## 13. Setup checklist

1. Create `.kiro/agents/` and `.kiro/skills/`.
2. Write **one** skill first, for whatever your project does most unusually.
3. Write one agent that loads it via `resources: ["skill://.kiro/skills/*/SKILL.md"]`.
4. Reload the window.
5. Run the trap test (§9, Test 2). If the agent pushes back, the wiring works.
6. Audit your permission rules against §7 — `fs_write` not `write`, every rule has an `effect`, no
   `hooks` field. A bad rule either drops the agent from the picker or silently does nothing.
6. Add remaining skills and agents. Give the reviewer no `write`. Scope the test agent to test
   files.
7. Commit `.kiro/` so the team shares it.
8. Tell teammates to reload the window after pulling.

---

## Sources

- https://kiro.dev/docs/skills
- https://kiro.dev/docs/custom-agents/creating
- https://kiro.dev/docs/custom-agents/configuration-reference
- https://kiro.dev/docs/custom-agents/subagents
- https://kiro.dev/docs/steering
