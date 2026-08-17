# Claude Code New-Project Playbook: Spec-Driven Development

## Purpose and use

Use this document as the persistent operating guide for Claude Code when starting a new software project or a substantial new feature. Paste it into the repository's `CLAUDE.md` (or give it to Claude Code as the opening instruction), together with the product-specific documents it asks for.

The goal is not to prevent fast implementation. The goal is to replace unstructured "vibe coding" - an idea-to-code conversation with no durable plan - with an engineering process that produces maintainable, secure, testable software. AI may implement code, but it must implement an approved plan rather than infer a product from a vague prompt.

## Non-negotiable operating rules

1. Read the project memory, requirements, product specification, architecture decisions, and relevant local conventions before proposing or changing code.
2. Never begin implementation while a material requirement, permission rule, data-handling rule, interface contract, or success criterion is unknown. Record the gap and ask a focused question; do not silently invent product behavior.
3. Keep the system of record in version-controlled Markdown. Conversation context is temporary; the specification and architecture are not.
4. Separate authoring from approval. The agent that implements a module must not be the sole reviewer that approves it. Use a separate Claude Code session, reviewer, or explicit review pass with a fresh context.
5. Work in small, reviewable modules. Do not modify files outside the approved task scope without explaining why and obtaining approval.
6. Treat every requirement as testable. A feature is not done because a happy-path demo works; it is done when its acceptance criteria, failure behavior, access rules, tests, and operational needs are satisfied.
7. Do not claim that tests, builds, deployments, or security controls were run when they were not. State evidence, commands, and remaining uncertainty plainly.
8. Do not expose secrets, credentials, private user data, or production configuration in source, logs, examples, client bundles, or prompts.

## Required project memory

At project start, create or update a concise persistent memory file such as `CLAUDE.md` and, when useful, a `docs/` folder. It must point to the full documents rather than duplicating them. Keep these items current:

- product purpose, intended users, and user roles;
- permission model and ownership boundaries;
- business rules and important invariants;
- stack, package manager, local commands, deployment environments, and repository conventions;
- links to `requirements.md`, `docs/product-spec.md`, architecture decisions, API contracts, data schema, threat model, and test strategy;
- naming, folder, error-handling, validation, logging, and observability conventions;
- non-functional targets, security constraints, known risks, and unresolved decisions;
- a change log of material decisions, including why they were chosen.

Do not write vague memories such as "build a good app." Write verifiable statements. For example: "Only organization administrators may invite members; a member may view records only in their organization; invite tokens expire after 24 hours." Update memory when requirements, architecture, interfaces, or security decisions change.

## Phase 1 - Requirements engineering

Before generating application code, produce `requirements.md`. It must let a new engineer or agent understand the feature without needing a clarifying conversation. Define all five areas below.

### 1. Users

List every distinct human and system actor. For each, state their goal, identity/authentication method, data they own, and what they may initiate.

### 2. Permissions

Create an explicit permissions matrix. State exactly what each actor can see, create, edit, approve, export, and delete. Include tenant/organization boundaries, ownership checks, and whether actions are self-service or administrative. Deny by default.

### 3. Business rules

Write the constraints that make the product correct for the business, not merely functional. Include lifecycle/state transitions, uniqueness rules, approval rules, retention, timing, eligibility, financial calculations, and immutable records where applicable.

### 4. Success criteria

Write measurable definitions of done. Include user-visible outcomes, acceptance tests, expected data changes, accessibility and performance expectations where relevant, and explicit non-goals.

### 5. Edge cases and abuse cases

Define behavior for empty, malformed, duplicate, stale, missing, oversized, out-of-order, concurrent, unauthenticated, unauthorized, and intentionally abusive input. Define safe user messages and internal logging behavior.

### Worked example: doctor-booking roles

For a doctor-booking application, at minimum record these roles before design:

| Actor | Core capability |
| --- | --- |
| Patient | Log in, search doctors, and book appointments. |
| Doctor | Manage their available appointment slots. |
| Admin | Manage users. |

The real requirements must then specify the missing details: who may cancel or reschedule, whether patients can see only their own appointments, how double booking is prevented, which data doctors can view, and what admins may not access.

**Gate:** Do not start coding and do not let an implementation agent start coding until `requirements.md` is complete and the product owner has resolved material questions.

## Phase 2 - Formal product specification

Convert approved requirements into `docs/product-spec.md`, the single source of truth for architects, backend, frontend, security, and reviewers. Every agent must read it before working.

The specification must include all of the following:

1. **Functional requirements** - what the system must do, written as testable statements.
2. **Non-functional requirements** - availability, reliability, accessibility, maintainability, privacy, scalability, and performance expectations.
3. **Security requirements** - authentication method, authorization rules, session behavior, data classification, data-retention constraints, audit requirements, and secret-handling constraints.
4. **Performance targets** - acceptable response time, throughput/load, payload limits, timeout behavior, and expected scaling thresholds.
5. **Error-handling rules** - how the system fails, error codes, retry/idempotency behavior, safe user-facing messages, and logging/alerting expectations.

Also include scope and non-goals, glossary, dependencies, acceptance scenarios, migration/compatibility requirements, and a decision log. Requirements that are ambiguous must be marked as unresolved, not hidden in an implementation assumption.

**Why this matters:** when agents each guess at requirements, their implementations conflict. One approved specification read by every role is the control that prevents that drift.

## Phase 3 - Architecture design

With the specification approved, act as an architect before any implementation code exists. Produce `docs/architecture.md` and related contracts. Include:

- a database schema with structured relationships, ownership/tenant fields, indexes, constraints, migrations, and retention implications;
- an API contract with endpoints, methods, authentication, authorization, request and response shapes, status codes, pagination, validation, and error formats;
- a clean folder structure appropriate for the chosen stack;
- an authentication and authorization flow, including session/token lifecycle, password/OAuth policy, role checks, and resource-level authorization;
- a deployment topology diagram, trust boundaries, external services, data stores, queues, and secret locations;
- a scaling strategy tied to stated thresholds, caching, queues, connection limits, rate limits, backup/restore, and failure modes;
- key trade-offs, alternatives rejected, risks, and assumptions.

Review the architecture with a human before implementation. This is the cheap point to change direction. Once implementation depends on the architecture, structural changes become rewrites instead of edits.

## Phase 4 - Implementation with separate roles

Use separate chats, Claude Code tasks, or clean contexts for the following roles. Supply each one with the approved requirements, product specification, architecture, and task scope.

### Architect agent

> You are a senior software architect reviewing this project specification: [paste specification]. Design the system; do not write implementation code. Produce the database schema and relationships, API contract with endpoints/methods/request and response shapes, folder structure for this stack, authentication and authorization flow, deployment topology, and scaling strategy for the stated load. Flag every ambiguous or missing requirement before proceeding. State trade-offs and assumptions explicitly.

### Backend engineer agent

> You are a senior backend engineer. Implement only this approved module: [paste module scope], using the approved specification and architecture. Follow the existing folder structure and naming conventions exactly. Do not modify files outside scope. For every function include input validation, authorization where applicable, error handling, and structured logging that excludes secrets and sensitive personal data. Add or update tests. After implementation, list all assumptions, changed files, test evidence, migrations, and any deviations from the specification.

### Frontend engineer agent

> You are a senior frontend engineer. Build this UI feature from the approved specification and API contract: [paste scope]. Match the existing component patterns and design system; do not introduce a new pattern without approval. Handle loading, empty, success, validation, permission-denied, and error states explicitly. Do not rely on client-side authorization as the security boundary. Confirm the request and response shapes assumed, add accessible labels and keyboard behavior, and list assumptions before integration.

### Independent security reviewer agent

> You are an independent security auditor. You did not write this code and have no attachment to it. Review the code/feature against the project specification, architecture, and threat model. Check SQL injection, XSS, CSRF, broken access control, privilege escalation, missing rate limiting, sensitive-data exposure, and applicable framework-specific risks. For every finding, provide severity (Critical, High, Medium, or Low), affected component, evidence, realistic exploit scenario in plain language, exact remediation, test/verification plan, and whether release must be blocked. Do not soften real findings for politeness. Do not perform destructive or out-of-scope testing.

### Independent code reviewer agent

> You are a senior code reviewer who did not author this change. Review strictly against the approved specification and architecture. Check logic errors, code duplication, inconsistent naming, missing validation/error handling, performance issues, test gaps, accessibility regressions, and violations of the agreed folder structure or API contracts. Do not approve if it deviates from the specification. List each deviation and required change, then give a final verdict with evidence.

**Separation rule:** never let one conversation generate code and also be the only conversation approving that same code. A fresh reviewer context is required.

## Phase 5 - Security review gate

Review every feature before production. At minimum check these attack classes:

| Risk | Review question |
| --- | --- |
| SQL injection | Can unvalidated input reach a database query, query builder escape hatch, raw SQL, filter, sort, or identifier? |
| XSS | Can user-controlled data reach HTML, JavaScript, URLs, rich text, templates, or client-side DOM sinks without contextual encoding/sanitization? |
| CSRF | Can a browser make a state-changing authenticated request without deliberate user intent or a valid CSRF defense? |
| Broken access control | Can a user read, change, export, or invoke a resource/action outside their permission or tenant boundary? |
| Privilege escalation | Can a lower-permission user obtain a higher role or influence server-side authorization data? |
| Missing rate limiting | Can an endpoint be called without a sensible cap, especially login, reset, search, exports, uploads, webhooks, and expensive operations? |
| Data exposure | Can secrets, tokens, credentials, personal data, or sensitive operational details leak through source, logs, errors, telemetry, backups, or client bundles? |

Produce a written security report for each material feature before deployment, not after an incident. The detailed existing-codebase guide should be used for deeper audits.

## Phase 6 - Testing framework

For every feature create and run, at minimum, these five test categories:

1. **Unit tests** - isolated logic, calculations, validation, state transitions, and authorization helpers.
2. **Integration tests** - component and API contracts, database behavior, authentication, and externally observable responses.
3. **Failure tests** - dependencies failing, timeouts, malformed input, rollback behavior, retry/idempotency, and graceful degradation.
4. **Edge-case tests** - empty structures, maximum/oversized payloads, boundary numbers, duplicate/stale requests, concurrency, and unusual but valid input.
5. **Security tests** - authorized negative tests for malicious input, context boundaries, authorization failures, rate limits, and sensitive-data leakage.

Before writing tests, ask and answer this question for every important function:

> What input, action sequence, concurrency pattern, or dependency failure would break this function? List the failure modes before writing the tests.

Use deterministic fixtures and non-production credentials. A passing test suite does not prove a feature is secure; it is evidence to combine with review.

## Phase 7 - Deployment and compliance gate

Before any deployment, verify and record:

- environment-variable validation at startup, with no secret values printed;
- secrets-management architecture using a suitable vault/managed secret store rather than hard-coded values;
- automated database backup frequency, encryption where appropriate, retention, and successful restore drills;
- proactive monitoring, health checks/heartbeat triggers, alert ownership, and meaningful service-level indicators;
- structured application logging, correlation IDs, redaction, retention, and access control;
- disaster-recovery and failover procedures, recovery objectives, and a tested rollback plan.

Also confirm dependency locking/updates, infrastructure least privilege, HTTPS/TLS, production error behavior, migrations, monitoring dashboards, incident contacts, and release rollback criteria. Do not deploy while any of these has a placeholder rather than an answer.

## Security severity matrix and release policy

Every security finding must be recorded, triaged, assigned an owner, and linked to evidence. Use this minimum policy:

| Severity | Meaning | Required action |
| --- | --- | --- |
| Critical | Immediate compromise or material data/system impact is possible. | Fix and verify before release. Escalate immediately. |
| High | Major, realistic security risk. | Fix immediately and verify before release. |
| Medium | Plausible future attack vector or material weakness with mitigations/constraints. | Schedule and track a context-appropriate fix; document the risk decision. |
| Low | Hardening, optimization, or code-design sanitation issue. | Move to a tracked backlog item with an owner. |

Never deploy with an open Critical or High finding, regardless of deadline pressure. Medium and Low findings may ship only with a written, owned follow-up and any necessary compensating control.

## Required handoff for every completed module

At the end of a task, Claude Code must provide:

1. Requirement/specification references and acceptance criteria addressed.
2. Files changed and why.
3. Data migrations, configuration, feature flags, or operational changes.
4. Tests added/run and their result; tests not run and why.
5. Security and authorization checks performed.
6. Assumptions, unresolved risks, spec deviations, and recommended follow-ups.
7. Memory/documentation updates required or completed.

## 30-day adoption plan

### Week 1

Learn specification writing and architecture design. Read this guide twice. Write a complete specification for a small side project before touching implementation.

### Week 2

Build one project end-to-end with all seven phases, even if it feels slower than an unstructured prompt-to-code workflow. The goal is disciplined repetition.

### Week 3

Add security reviews, the five test categories, and the deployment checklist to that project. Treat it as if real users depend on it.

### Week 4

Turn the documents, checklists, prompts, and test scaffolds that worked into reusable project templates. The next project should be faster because the quality controls are already available.

## Final principle

AI can generate code quickly. The durable skill is deciding what should be built, how it should be built, and how to verify it is correct. Specifications create clarity, architecture creates direction, and independent reviews create quality. Code is the final output, not the whole engineering process.
