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
