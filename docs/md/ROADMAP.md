# Sudarshan Task Force - Product Roadmap

Version: 0.1  |  Date: 07 August 2026  |  Status: Draft for approval

## Phase 0 - Definition and Design
Approve Pack 01. Complete detailed attendance, leave, payroll-rule, notifications, security, API, database, and design-system documents. Finalize brand, logo, assets, landing page, mobile-first UI kit, and interactive prototype. Exit only when V1 scope and core flows are signed off.

## Phase 1 - V1 Foundation
Build tenant identity, authentication, user/employee profiles, roles/permissions, module management, feature flag evaluation, audit foundation, notification plumbing, and mobile-first shell. Verify tenant isolation, server-side authorization, and basic observability before business modules.

## Phase 2 - Daily Operations
Build attendance, leave approval, task delegation, task proof, dashboards, daily reporting, and notification templates. Include the large check-in/out action, location/time capture, outside-area approval flow, late/exemption logic, monthly calendar, and summaries for authorized leaders.

## Phase 3 - Payroll and Reporting
Build approved-input payroll runs, review/approval, payslips, adjustments, exports, and operational reports. Pilot calculations with real but protected sample data. Obtain local payroll/compliance review before real salary processing.

## Phase 4 - Pilot and Launch
Run a controlled tenant pilot, fix high-impact usability and data issues, train admins, prepare support/backup/incident procedures, and launch with a narrow support channel. Measure adoption and accuracy weekly.

## Future backlog, not V1
Biometric/face/QR/RFID attendance, accounting and bank integrations, visitor register, inventory/CRM, advanced AI insights, white-label domains, and additional languages.

Expenses, deferred to E4 (EXPENSES-MODULE.md §16, §19): the receipt retention sweep, and emptying a tenant’s receipt storage prefix on purge — no module’s purge touches storage today. Also open from the E0 review: the `PAYROLL.advances` flag exists with nothing behind it and collides with the E3 expense-advance flag; decide at E3.

## Decision gates
Do not start code before Phase 0 approval. Do not process production payroll before rules, auditability, security, backup, and compliance review are proven. Do not add V2 work merely because it is technically possible.

## Give this to Claude
Turn this roadmap into a design-and-build checklist with approval gates. Keep V1 deliberately focused; place all future ideas in a clearly separated backlog.
