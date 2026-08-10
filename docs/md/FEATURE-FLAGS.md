# Sudarshan Task Force - Feature Flag Manual

Version: 0.1  |  Date: 07 August 2026  |  Status: Draft for approval

## Purpose
Feature flags make STF configurable without separate customer builds. They control entitlement, rollout, policy choice, and safe release. They never replace permissions or tenant data isolation.

## Flag scopes
Platform scope enables a capability for STF. Tenant scope decides whether a company has it. User scope allows an approved exception for a selected person. Role scope sets default eligibility for a job function. Policy scope stores a tenant's business choice, such as grace minutes or geofence radius; it is not a simple on/off flag.

## Required enforcement
Each request evaluates tenant, module, feature, role, user exception, and policy. The same decision must be used by navigation, UI actions, API authorization, background jobs, notifications, reports, and mobile offline sync. Server-side denial is mandatory.

## Initial flags
Attendance: GPS capture, geofence, outside-area approval, multiple punch, offline capture, missed-punch correction, late penalty, late exemption. Payroll: overtime, advances, loans, incentives, bonus, payslip delivery. Tasks: multiple assignees, recurring tasks, proof photo/file/video, GPS proof, daily report. Communication: push, email, WhatsApp, SMS. Optional: expenses, assets, announcements, performance, leaderboard.

## Lifecycle
Every flag has key, description, scope, owner, default, dependencies, rollout state, audit log, and retirement date where applicable. A disabled flag must be reversible without deleting business data. Permanent policy decisions should become ordinary configuration and retired flags should be removed.

## Admin panel behavior
Module Management lists modules, dependencies, current scope, users affected, and warnings. Switching off a module displays what disappears, jobs that stop, and data retention behavior. It must require confirmation and create an audit event.

## Give this to Claude
Design a Module Management panel with clear module cards, feature-level controls, dependency warnings, affected-user counts, confirmation states, and audit history. Do not make switches decorative: document their server-side enforcement contract.

---

# Amendment 1 — Onboarding and action tiles
*Approved 10 August 2026. Appended, not rewritten.*

## No new flags

Neither employee invitation nor the action queue is behind a flag, and
that is a decision rather than an omission.

This document requires every flag to have a coherent off-state and a
retirement path. Neither has one:

- **Invitation off** means a workforce product where you cannot add anyone
  to the workforce. That is not a configuration, it is a broken install.
- **Action tiles off** would leave the notifications that already exist and
  remove only the ability to act on them quickly. Nothing is gated that
  was not already gated by the module and permission checks underneath.

Both would be born retired, which the lifecycle rules above forbid.

## What governs them instead

The existing evaluation order does all the work, server-side:

- Inviting requires the **EMPLOYEES** module and `employees.manage`.
- A tile is only raised for a module that is enabled, and only reaches
  someone whose role holds the deciding permission for that kind.
- Turning off **LEAVE** stops leave tiles, because it stops leave
  requests. Nothing separate needs switching.

The one genuinely optional behaviour — the **notification sound** — is a
per-person preference stored on their own device, off by default. It is
not a tenant flag, because whether a warehouse is too loud for a chime is
not a decision an owner should be making for someone else's phone.
