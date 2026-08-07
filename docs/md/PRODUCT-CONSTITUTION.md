# Sudarshan Task Force - Product Constitution

Version: 0.1  |  Date: 07 August 2026  |  Status: Draft for approval

## 1. Configuration before custom code
Tenant policies, modules, features, roles, shifts, late rules, and notification preferences must be data-driven. A customer-specific rule must not require a separate codebase.

## 2. Tenant isolation is mandatory
Every tenant-owned record, query, file, notification, and report is scoped to one tenant. Cross-tenant access is permitted only through explicit platform-super-admin controls and is audited.

## 3. Explicit authority
No leave, correction, payroll change, task closure, or policy override is silently approved. The acting person, decision, timestamp, reason, and before/after values are preserved.

## 4. Practical mobile use wins
Employees must be able to check in, see tasks, submit proof, request leave, and read notices with minimal taps on a phone. Desktop enhances administration; it does not define the product.

## 5. Feature flags are enforced everywhere
When a module or feature is disabled for a tenant or user, it is absent from navigation, denied by APIs, excluded from jobs/notifications, and recorded in configuration. Hiding a menu item alone is not sufficient.

## 6. Payroll needs traceability
Salary output must show inputs, policy versions, adjustments, approvals, and the calculation period. Calculations cannot be overwritten without an auditable adjustment path.

## 7. Privacy and consent
Location, selfie, documents, and payroll data are sensitive. Capture only approved data, explain the purpose, limit access, retain it only as required, and provide export/deletion workflows subject to legal obligations.

## 8. Change control
A new feature enters the Product Bible, Modules, Feature Flags, roles/permissions, UI design, and tests before it enters code. Material decisions are logged.

## Give this to Claude
Use these eight rules as hard constraints. If a requested design conflicts with one, flag the conflict and propose an approved-document change instead of silently bypassing it.
