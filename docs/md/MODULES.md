# Sudarshan Task Force - Modules and Dependencies

Version: 0.1  |  Date: 07 August 2026  |  Status: Draft for approval

## Core platform
Identity and Tenant Settings manage company profile, branches, users, roles, access, and policies. Module Management controls tenant and user eligibility. Notifications delivers in-app, push, email, SMS, or WhatsApp through configured providers. Audit and Reporting provide evidence and exports.

## V1 modules
Employee Management: profiles, employment information, reporting manager, documents, status, and timeline. Attendance: check-in/out, time/location capture, shifts, exceptions, calendar, late rules, and admin review. Leave: request, approve/reject, half-day/emergency leave, and payroll effect. Payroll: salary structures, period calculations, adjustments, review, and payslips. Tasks: assignments, priority, due date/time optional, notes, files, proof, status, and recurring templates. Daily Reporting: summaries of attendance, task status, exceptions, and configured delivery. Performance and Leaderboards: attendance and task-derived indicators only, with transparent definitions.

## Optional V1 modules
Expenses, Assets, Announcements, Approvals, and GPS Tracking may be enabled per tenant only when their detailed rules are approved. "GPS Tracking" refers to event-based attendance/task proof, not continuous covert tracking by default.

## Dependency rules
Payroll requires Employee Management and Attendance; it may consume approved Leave. Leave requires Employee Management. Tasks requires Employee Management. Performance requires Attendance or Tasks. Leaderboards require their source module and a published scoring definition. Daily Reporting depends on the modules included in the selected summary. Disabling a required module must show impact and block or require a safe migration decision.

## Excluded from V1
Visitor Register, biometric hardware sync, face recognition, QR/RFID attendance, bank transfer generation, Tally/Busy/Zoho integrations, CRM, inventory, and continuous location tracking.

## Give this to Claude
Use these modules and dependencies to create the information architecture. Show only enabled modules in a tenant's navigation. Before designing an optional module, ask whether its detailed requirement document is approved.

---

# Amendment 1 — Onboarding and Departments
*Approved 10 August 2026. Appended, not rewritten.*

## Employee Management — extended

Employee Management now covers the whole lifecycle, not just the record:

- **Add and invite.** Name, mobile number, email (optional), employee ID,
  department, designation, reporting manager, joining date, employment
  type and role. Only name, mobile and role are required.
- **Invitation state** on the directory and the profile: Pending,
  Accepted, Expired, Revoked, or "Not invited" for someone with no email.
- **Resend** (new token, old one dies), **withdraw**, and **deactivate**
  with a reason.
- **Departments** and their heads, configured under Settings.

Deactivation never deletes. Attendance, leave, tasks and payslips are
evidence and stay exactly as recorded.

## Notifications — extended

Notifications now has two distinct outputs, and the distinction is load-
bearing:

| | The bell | The action tile |
|---|---|---|
| Says | something happened | someone must decide |
| Raised for | assignments, decisions, arrivals | exceptions, leave, proof |
| Clears when | read | **decided** — reading is not deciding |
| Audience | the person concerned | everyone who can decide, plus the department head |

The tile carries Approve (only where approving needs no further input),
a link to the full decision screen, and Snooze. It is not a modal: a
decision request arrives while someone is doing something else, and
blocking their screen to demand attention is how a queue gets ignored.

**Deliberately not raising a tile:** ordinary check-ins, check-outs, task
assignments to oneself, and anything else with no decision attached. Those
go to the bell.

## Dependency rules — addition

Departments belong to Employee Management. With Employee Management
disabled, departments are unreachable and action tiles fall back to
tenant admins — they are never silently dropped.
