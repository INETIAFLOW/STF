# Claude Code Security Audit Guide for Existing Codebases

## Purpose and use

Use this guide to instruct Claude Code to assess an existing project for security vulnerabilities and produce an evidence-based remediation plan. It is designed for projects you own or are explicitly authorized to test. Paste it into a temporary audit task, or retain the safe development rules in the repository's `CLAUDE.md`.

This is defensive code review and authorized testing. Do not target third-party systems, attempt to access real accounts or production data, evade controls, run denial-of-service tests, exfiltrate data, or change production systems. Prefer static analysis, local development environments, test accounts, and minimal proof of concept evidence. Stop and ask before any test could affect availability, data integrity, user data, external services, or spend.

## Claude Code audit instruction

> You are an independent application-security auditor reviewing an existing codebase that I am authorized to assess. First map the stack, entry points, trust boundaries, authentication and authorization model, data stores, secret sources, deployment configuration, dependency manifests, and test commands. Then perform a safe, evidence-based review of the risks in this guide and any framework-specific equivalents. Do not exploit external systems, access production data, conduct denial-of-service testing, use real credentials, or make security-affecting changes without approval. For every finding, provide: severity, confidence, affected files/components, evidence with precise code references, preconditions, realistic impact in plain language, safe validation approach, exact remediation, regression test, owner, and release recommendation. Distinguish confirmed vulnerabilities from risks, missing controls, and false positives. Finish with an executive summary, a prioritized remediation plan, and a retest checklist.

## Required audit deliverables

Create or update the following Markdown records in the repository's agreed documentation location:

- `security/audit-scope.md` - authorization, environments, systems in/out of scope, constraints, reviewers, dates, and rules of engagement.
- `security/system-map.md` - stack, entry points, data flows, trust boundaries, external services, assets, and high-value data.
- `security/findings.md` - all findings using the required format below.
- `security/remediation-plan.md` - prioritized fixes, owners, deadlines, validation requirements, dependencies, and accepted risks.
- `security/retest.md` - evidence that fixes were verified and whether any related regression remains.

If the project has an established documentation structure, use it rather than introducing parallel folders. Do not overwrite existing security records; append dated audit sections or make a reviewable update.

## Audit workflow

### 1. Establish scope and safety boundaries

Before examining code in depth, record:

- confirmation that the owner authorized the audit;
- repository/commit or branch being reviewed;
- development, staging, and production boundaries;
- approved test accounts and synthetic data only;
- explicit out-of-scope systems and prohibited actions;
- whether changes are allowed or the task is report-only;
- incident contact and stop conditions.

Never call destructive endpoints, send high-volume traffic, alter privileged roles, delete data, or test credentials against a live environment without specific approval. For availability risks such as ReDoS and long-password CPU exhaustion, use source review, bounded local tests, and static analysis - never a production load attempt.

### 2. Build a system and trust-boundary map

Identify and document:

- languages, frameworks, runtime, package manager, build system, and deployment model;
- public routes, admin routes, APIs, webhooks, background workers, CLI commands, uploads, message queues, and scheduled jobs;
- authentication, session/token storage, role/permission model, tenancy/ownership model, and account recovery;
- databases, caches, object storage, third-party APIs, payment/email/identity services, and their credentials;
- sources and sinks for user input, HTML rendering, database queries, shell/process execution, template rendering, URLs, file paths, redirects, and logs;
- client/server boundaries, environment-variable exposure, CDN/static assets, and build-time configuration;
- sensitive data classification: credentials, tokens, financial information, health data, personal data, internal URLs, and backups.

Pay special attention to code written or substantially modified by AI agents, since fast feature generation often prioritizes functionality over non-functional security controls.

### 3. Review the seven core risks from the source guide

The following risks are mandatory review areas. Preserve these checks even if the stack changes; map each to its framework-specific form.

#### 3.1 Critical - Server-Side Template Injection (SSTI)

**Risk:** Raw user input concatenated into server-side template expressions, evaluation functions, or custom rendering logic can become executable template code. In some template engines this can lead to arbitrary server-side behavior.

**Inspect for:** EJS, Pug, Jinja, Handlebars, template compilation, string interpolation passed to a renderer, `eval`-like functions, dynamic expressions, custom email/PDF templates, and error pages that place raw input into templates.

**Required controls:**

- Never use raw string interpolation or evaluation logic (`eval()` or custom dynamic rendering) on incoming request data.
- Pass untrusted values as data parameters, not template source.
- Enable contextual auto-escaping and use the framework's safe rendering primitives.
- Treat any request data, imported content, query parameter, profile field, and webhook field as untrusted.
- Add a regression test that demonstrates untrusted content remains text and cannot alter the template structure.

#### 3.2 Critical - Regular Expression Denial of Service (ReDoS)

**Risk:** An AI-generated or improvised regular expression can exhibit catastrophic backtracking on deliberately malformed long strings. In single-threaded Node.js services, that can block the event loop and affect all users.

**Inspect for:** Nested quantifiers, ambiguous alternatives, unbounded wildcards, lookaheads/lookbehinds, regexes generated from user input, validation regexes, route matching, search features, log parsing, and regex use before input-size validation.

**Required controls:**

- Prefer standard, battle-tested validators such as `validator.js` instead of custom lookahead-heavy validation regexes.
- Cap input lengths before regex evaluation.
- Use static analysis or a safe-regex analyzer for custom patterns.
- Implement appropriate request and process timeouts; avoid relying on timeouts as the only control.
- Add bounded local tests for worst-case input and keep them out of production traffic.

#### 3.3 Critical - Long-password denial of service

**Risk:** Applying expensive cryptographic password hashing (for example bcrypt or scrypt) to unbounded input can allow a very long password request to exhaust CPU and make the host unavailable.

**Inspect for:** Login, signup, password reset/change, API keys, passphrases, hashing before validation, body parsers with no limits, and endpoints that accept credentials through JSON, forms, or alternate protocols.

**Required controls:**

- Enforce a hard maximum password length before database access or hashing; 128 characters is a practical example unless the selected scheme/policy documents a different bound.
- Enforce request/body limits in upstream middleware, reverse proxies, and application validation.
- Keep hashing cost appropriate to the environment and monitor CPU saturation.
- Add tests proving oversize credentials receive a safe validation response without invoking the hash function.

#### 3.4 Critical - AWS S3 client-side secret leakage

**Risk:** Framework conventions that expose environment variables to browser bundles - for example `NEXT_PUBLIC_` or `VITE_` prefixes - can accidentally publish AWS credentials or other private secrets. A secret committed to source or embedded in a historical build is compromised even if later removed.

**Inspect for:** Client-exposed environment prefixes, frontend build configuration, `.env` files, CI logs, deployment variables, committed secrets, S3 configuration, source maps, generated bundles, hard-coded credentials, cloud root keys, and long-lived access keys.

**Required controls:**

- Keep credentials only in protected runtime secret stores/environment configuration; never use a public environment prefix for a secret.
- Use AWS IAM roles and short-lived/ephemeral credentials rather than static root or broad access keys.
- Apply least-privilege policies, bucket-level restrictions, encryption, logging, and rotation.
- Scan current code, version history where authorized, CI configuration, and built client assets for secrets.
- If exposure is confirmed, revoke/rotate the credential immediately, assess access logs, and treat the secret as compromised. Do not merely remove the string from code.

#### 3.5 High - NoSQL injection

**Risk:** Passing raw, unsanitized JSON request objects into MongoDB or similar query logic can let an attacker supply operators or nested predicates instead of expected strings, potentially bypassing a login or filter.

**Inspect for:** Direct use of `req.body`, spread operators into queries, dynamic filters/sorts, query operators supplied by clients, login lookups, ORM escape hatches, aggregation pipelines, and object fields assumed to be strings.

**Required controls:**

- Enforce strict request schemas, using tools such as Zod or Joi where appropriate, so expected scalar fields are plain strings/numbers/enums rather than arbitrary objects.
- Allow-list filter fields and sort keys; build queries server-side.
- Sanitize fields with a suitable MongoDB sanitization mechanism where relevant.
- Add authorization and tenant filters server-side; validation alone is not authorization.
- Add negative tests showing operator-shaped objects and unexpected nested objects are rejected safely.

#### 3.6 High - Clipboard copy attack (pastejacking)

**Risk:** Malicious page code, a compromised dependency, or unsafe copy behavior can replace a user's copied text with terminal-executable content. This is particularly dangerous on sites that present code snippets.

**Inspect for:** Clipboard event handlers, DOM selection manipulation, third-party scripts, copy buttons, injected documentation/content, browser extensions within the test scope, and code blocks that differ from copied values.

**Required controls:**

- Use secure programmatic copy buttons such as `navigator.clipboard.writeText` with the exact visible, sanitized text rather than uncontrolled selections.
- Do not secretly modify clipboard contents, add hidden commands, or execute copied content.
- Keep dependencies and content-rendering paths reviewed; apply Content Security Policy where appropriate.
- Encourage terminal users to inspect pasted commands; bracketed paste mode is a useful defense-in-depth measure.
- Add UI tests confirming copied text exactly matches the visible intended command/text.

#### 3.7 Low - Login replay attack / insecure transit

**Risk:** Plaintext or poorly protected session/authentication data in transit can be intercepted and replayed while valid. The risk is more accurately mitigated by HTTPS/TLS, secure sessions, replay-resistant request design, and token lifecycle controls.

**Inspect for:** HTTP endpoints, mixed content, cookies missing `Secure`/`HttpOnly`/appropriate `SameSite`, tokens in URLs or logs, overly long token lifetimes, missing session rotation, unauthenticated sensitive requests, weak webhook verification, and API requests without replay controls where required.

**Required controls:**

- Enforce HTTPS/TLS end-to-end and redirect/block insecure HTTP in production.
- Use secure cookie attributes and prevent sensitive tokens from appearing in URLs, referrers, analytics, or logs.
- Rotate sessions on login/privilege change; expire and revoke sessions/tokens appropriately.
- Use nonces, timestamps, signed requests, idempotency keys, or time-based one-time mechanisms where the protocol warrants replay protection.
- Add tests/configuration checks for TLS enforcement and secure cookie/session behavior.

#### 3.8 Creator bonus - single-thread guardrail

**Risk:** In Node.js, blocking operations and unhandled errors before or during authentication can degrade or crash a single worker, impacting all users of that worker.

**Inspect for:** Synchronous CPU/file operations, unbounded parsing/serialization, unhandled promise rejections, blocking cryptography beyond controlled password hashing, errors in validation/authentication middleware, and a lack of health checks or restart strategy.

**Required controls:**

- Remove or bound blocking work; move expensive jobs to workers/queues where appropriate.
- Add global error handling that logs safely and fails closed without leaking internals; do not use it as a substitute for local error handling.
- Run production services under a resilient process/orchestration model, such as a cluster/process manager (for example PM2) or auto-scaling container tasks (for example AWS ECS), with health checks and restart policies.
- Monitor event-loop lag, restarts, CPU, memory, error rates, and auth endpoint latency.
- Verify that one invalid request cannot crash or stall the service in a controlled local/staging test.

## 4. Additional required checks

These checks extend the source material and are required because they commonly affect modern web applications.

### Authentication and authorization

- Verify authentication on every protected server-side route, worker, websocket, and API endpoint.
- Verify resource-level authorization and tenant isolation on every read, update, delete, export, and action. Client-side route guards are not sufficient.
- Review role changes, invitations, impersonation, admin actions, password reset, MFA/recovery, session fixation, and token verification.
- Confirm deny-by-default behavior and audit logs for sensitive actions.

### Input, output, files, and external requests

- Validate type, size, range, encoding, and allowed values at every trust boundary.
- Check path traversal, unsafe file upload/download, MIME sniffing, archive extraction, image/document parsing, and object storage permissions.
- Review server-side requests for SSRF protections: allow-listed destinations, URL parsing, DNS/IP restrictions, redirect handling, timeouts, and metadata-service blocking.
- Parameterize SQL queries; allow-list dynamic identifiers/sorts; never concatenate untrusted SQL.
- Apply output encoding and safe rich-text sanitization at the output context.

### Secrets, dependencies, and supply chain

- Scan repository, configuration, CI, container images, and public bundles for secrets.
- Review package lockfiles, known vulnerabilities, abandoned dependencies, install scripts, typosquatting risk, and dependency update policy.
- Verify build provenance, least-privilege CI tokens, branch protection, artifact integrity, and separation of development/staging/production secrets.

### Data protection and operations

- Review encryption in transit and at rest where needed, backup access/restore testing, log redaction, data-retention/deletion behavior, and privacy obligations relevant to the product.
- Review rate limits, quotas, pagination, concurrency controls, resource caps, timeouts, circuit breakers, and abuse monitoring.
- Review error responses for stack traces, identifiers, configuration, query details, and user enumeration.
- Review monitoring, alerting, incident response, rollback, dependency patching, and disaster recovery.

## Finding format and severity policy

For every finding, use this structure:

```md
## [SEVERITY] Short finding title

- Confidence: Confirmed / High / Medium / Low
- Affected assets: paths, service, endpoint, environment
- Evidence: precise code/configuration reference and observed behavior
- Preconditions: role, input, configuration, or access required
- Impact: what could happen, in plain language
- Safe validation: a non-destructive method to reproduce or prove the issue
- Remediation: exact code/configuration/design change
- Regression test: test that prevents reintroduction
- Owner and target date:
- Release decision: block / fix before next release / tracked follow-up
- Related findings and compensating controls:
```

Use this severity policy:

| Severity | Meaning | Action |
| --- | --- | --- |
| Critical | Immediate compromise, arbitrary code/data access, account takeover at scale, or severe availability impact is realistically possible. | Block release; fix and retest before release. |
| High | Major realistic security risk or meaningful exposure of protected resources. | Fix immediately and retest before release. |
| Medium | Plausible attack vector or meaningful weakness with constraints/mitigations. | Track an owned, scheduled fix and document risk acceptance if shipping. |
| Low | Defense-in-depth, sanitation, or design improvement with limited impact. | Put in a tracked backlog with owner. |

Never leave Critical or High issues open for a release. Medium and Low issues are not "ignored"; they need a written decision, owner, and follow-up date.

## Safe validation and remediation process

1. Identify the code path and attack preconditions.
2. Prefer source inspection, unit/integration tests, linters, secret scanners, dependency scanners, and local/staging test data.
3. Validate minimally. Prove the control is missing without extracting data, changing state, creating privileged accounts, or degrading availability.
4. Fix the root cause, not only the observed input. Add layered controls where useful.
5. Add a regression test and review adjacent paths that reuse the same pattern.
6. Retest after the fix, record the evidence, and update project memory/design documents if architecture or policy changed.
7. Escalate suspected credential exposure, active exploitation, or sensitive-data exposure immediately. Rotate credentials and preserve evidence under the organization's incident process.

## Final audit checklist

Before closing an audit, confirm:

- scope and authorization are documented;
- every public and privileged entry point was mapped or explicitly excluded;
- all seven source-guide risks were reviewed and recorded as pass, finding, or not applicable with evidence;
- additional authorization, input/output, SSRF, dependency, secret, operations, and data-protection checks were completed;
- no destructive or out-of-scope testing occurred;
- Critical and High findings are remediated and independently retested before release;
- Medium and Low findings have owners, dates, and a documented decision;
- fixes include regression tests and no new secrets/logging exposure;
- security records and project memory reflect the current approved design and remaining risks.

## Final principle

Security review is not a one-time scan after code is written. Use it as a release gate for every material feature, and keep the system map, threat assumptions, tests, and remediation records current as the codebase changes.
