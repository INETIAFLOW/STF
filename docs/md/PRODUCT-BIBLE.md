# Sudarshan Task Force - Product Bible

Version: 0.1  |  Date: 07 August 2026  |  Status: Draft for approval

## Product statement
Sudarshan Task Force (STF) is a configurable workforce operating system for SMEs. It helps owners know who is working, where they are, what was assigned, what was completed, and what salary is due.

## Primary users
Platform Super Admin operates the SaaS. Tenant Owner controls a company. Admin and HR run people operations. Manager and Team Leader assign and review work. Employees check in, receive tasks, request leave, submit proof, and view their own records.

## V1 jobs to be done
An employee checks in or out with a large mobile action and location/time capture. An admin reviews exceptions and authorizes leave. Payroll uses approved leave, attendance, late policy, half-days, advances, incentives, and deductions. A supervisor assigns tasks with an optional time frame and receives proof. The platform sends a daily summary link by configured channels to the Super Admin.

## Product boundaries
STF is not an ERP, accounting ledger, visitor register, biometric system, or mandatory holiday/earned-leave system in V1. Those ideas remain in a future backlog. Legal payroll calculations and statutory compliance must be configured and reviewed by a qualified local professional before production use.

## Core concepts
Tenant: one customer company with isolated data. User: login identity. Employee: workforce profile linked to a user where relevant. Module: large capability such as Payroll. Feature: a controlled capability inside a module. Permission: action a role may perform. Policy: tenant-configured business rule. Approval: recorded decision and reason. Audit event: immutable who/what/when record.

## Non-negotiable experience
Mobile first, fast for non-technical workers, clear language, large primary actions, low data entry, explicit statuses, safe approval trails, and no hidden calculations. All sensitive actions must show their effect before confirmation.

## Success measures
Daily attendance completion, on-time checkout rate, task completion rate, exception resolution time, payroll review accuracy, and active use by managers and employees.

## Give this to Claude
Design STF as a practical mobile-first SME SaaS. Prioritize the V1 jobs above, make status and approvals obvious, and keep future modules out of V1 screens unless shown as disabled configuration.

---

# Amendment 1 — Employee onboarding and the action queue
*Approved by the product owner, 10 August 2026. Appended rather than
rewritten: the text above is the pack as delivered, and this records what
changed after it. The original archive under
`docs/STF-Pack-01-v0.1/` is left untouched.*

## Two new nouns

**Department** — an organisational unit inside a tenant: Dispatch,
Accounts, Housekeeping. Distinct from **Branch**, which is a *place*. One
warehouse can hold three departments; one department can span three
warehouses. A department may have a **head**, who is asked to decide on
their team's requests alongside the admins.

**Invitation** — a time-limited, single-use link that turns an employee
record into a login. It has exactly four states: Pending, Accepted,
Expired, Revoked.

## Onboarding is now a V1 job

Added to the V1 jobs: *an owner or HR adds a person from their phone, and
that person sets their own password without anyone handling it.*

STF never sets, sees, or transmits a password an employee has chosen. The
admin types a name, a mobile number and a role; the employee chooses the
password. This is deliberate — an SME admin who sets passwords for their
staff ends up storing them in a notebook.

**A person without an email address is still an employee.** Their record,
attendance and payslips work exactly the same; only the login is missing,
and the screen says so in those words rather than implying the record is
incomplete. Phone sign-in remains blocked on an SMS provider (D-P1-05).

## The action queue

A decision awaiting a human is now a record, not a derived query. It
carries who must decide, why it reached them, and — if they snooze it —
when to ask again. It survives a restart, because a promise that does not
is not a promise.

**What raises one, and what does not.** Only work that genuinely needs a
human ruling: an out-of-area check-in, a leave request, submitted proof.
An ordinary on-time check-in raises nothing. This is not a shortcut; it is
the point. A product that interrupts thirty times a day is muted within a
week, and then the one that mattered is missed too.

## Non-negotiable experience — addition

An interruption must state **why it reached this person**, and must offer a
way to defer that names a real time ("This evening (6:00 pm)"), never a
vague one ("Later"). Sound is off until the person turns it on.
