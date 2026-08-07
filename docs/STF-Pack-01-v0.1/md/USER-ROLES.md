# Sudarshan Task Force - User Roles and Access Model

Version: 0.1  |  Date: 07 August 2026  |  Status: Draft for approval

## Access model
Access is the intersection of tenant membership, active module/feature, role permission, reporting scope, and record ownership. Roles are templates; granular permissions are the enforcement unit. Tenant Owners may delegate access but cannot bypass platform controls.

## Platform Super Admin
Operates STF across tenants: tenant lifecycle, plans, module catalog, support access policy, platform analytics, and controlled impersonation/support with audit. Cannot casually browse payroll or employee files; exceptional access must be justified, time-bound, and logged.

## Tenant Owner
Full company control: company settings, admins, modules within plan, policies, payroll approval, reports, and retention choices. May appoint Super Admins inside the tenant.

## Tenant Super Admin and Admin
Manage users, employees, policies, attendance exceptions, leave, tasks, reports, and approved modules. Payroll access should be separately permissioned. Super Admin is a delegated operational authority; Admin is configurable by permission set.

## HR
Maintains employee records, documents, leave workflow, attendance review, and payroll inputs. HR cannot change subscription, platform configuration, or sensitive owner controls unless explicitly granted.

## Manager and Team Leader
View and manage their reporting tree; assign/review tasks; approve requests when configured; see limited reports. They should not see confidential payroll, bank, or identity data by default.

## Employee and Viewer
Employee views and acts on own attendance, leave, tasks, documents, payslips, and notices. Viewer is read-only and must have a defined record scope.

## Minimum sensitive permissions
Separate permissions for salary view/edit/approve, bank details view/edit, document download, location view, attendance override, leave approval, policy edit, task reassignment, export, and audit-log view.

## Give this to Claude
Create a role-and-permission management UX that starts with safe role templates and permits granular overrides. Make record scope and sensitive-data access visible before saving changes.
