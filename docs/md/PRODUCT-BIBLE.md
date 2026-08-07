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
