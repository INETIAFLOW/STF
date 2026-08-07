# STF Edge Cases — v1.0

Every case states the **rule** and the **user-visible behaviour**. Where the Product Constitution decides the matter, the clause is named.

## Attendance
| Case | Rule and behaviour |
|---|---|
| Double tap on Check In | Debounced client-side; server is idempotent within the minute. One record. The server time is displayed back. No error shown. |
| Location permission denied | Info chip + "Turn on location to check in, or ask your manager to record it for you." Button disabled **with the reason stated**. Manager can record attendance on the employee's behalf (audited as a correction). |
| GPS accuracy poor (>200 m error) | Treated as "cannot confirm area" → the outside-area approval path, not a silent pass or a silent block. Accuracy is stored with the record. |
| Phone clock wrong / manipulated | Server time is authoritative and is what appears in the confirmation. A large device/server skew is stored on the record for admin review. |
| Offline check-in | Saved on device, confirmed locally, chip "Waiting to send". Synced on reconnect using the **original capture time**, marked as offline-captured. Never lost, never silently re-timed. |
| Sync conflict (record exists after reconnect) | Server record wins; the queued one becomes an exception with both times shown to the admin. |
| Missed check-out | Auto-flagged at end of day as `Not recorded`. Employee can request a correction with a reason; manager sees the **hours and overtime impact** before approving. No automatic check-out time is invented. |
| Working past midnight | The record belongs to the shift's start date. Cross-midnight shifts are configured on the shift, not guessed. |
| Two shifts in one day | Only if "Multiple punches" is enabled; otherwise the second check-in is blocked with an explanation, not a silent no-op. |
| Employee at a different branch | Permitted if their profile allows multi-branch; otherwise it becomes an outside-area approval with the branch name shown. |
| Late exactly at the grace boundary | Grace is inclusive: at exactly 10 minutes the employee is **not** late. The rule is stated in policy settings. |
| Policy changed mid-month | Records keep the `policy_version` in force on that date. Payroll shows which version applied. Changing policy never retroactively rewrites past days. |
| Employee deactivated mid-day | Existing records stand; no new check-in. Their payroll for the period is calculated up to the last worked day. |

## Leave
| Case | Rule and behaviour |
|---|---|
| Leave overlapping an existing request | Blocked at submission with the overlapping dates named and a link to the existing request. |
| Leave for a past date | Allowed only where the period's payroll is open; otherwise it becomes an adjustment request for the next period, stated plainly. |
| Leave for a date already marked Present | Manager sees both facts on the approval card and must choose which stands; the choice is audited. |
| Manager on leave | Requests escalate to the configured second approver after the tenant's threshold; the employee sees who it went to. |
| Employee cancels after approval | Allowed until payroll is approved. Cancellation reverses the payroll input and is audited. |
| Half-day on a late day | Half-day takes precedence for pay; the late mark is still recorded and visible. |
| Emergency leave submitted after the shift started | Permitted when the flag is on; the attendance record becomes an exception resolved by the leave decision. |

## Tasks
| Case | Rule and behaviour |
|---|---|
| Assignee deactivated | Task moves to `Unassigned` with a warning to the creator; it is never silently deleted or auto-reassigned. |
| Proof required but the module's photo flag is turned off later | Existing tasks keep their requirement; new tasks cannot request the disabled proof type. Submitted proof remains viewable. |
| Proof file over the limit / wrong type | Blocked before upload with the exact limit ("Photo is too large (12 MB). Take a new photo or choose a file under 10 MB."). Other queued files continue. |
| Task overdue while the employee is on approved leave | `Overdue` chip is suppressed and replaced with `Paused — on leave`; the manager sees why. |
| Recurring task whose assignee changes role | Next occurrence prompts the creator to confirm the assignee rather than generating silently. |
| Two managers review the same proof | First decision wins; the second sees the decision, who made it, and when. |

## Payroll
| Case | Rule and behaviour |
|---|---|
| Employee with no salary structure | Excluded from the run, shown as `No salary structure`, and named explicitly in the approval modal as "will be left out". |
| Approving with unreviewed exceptions | Permitted but warned with the count and the number of payslips that could change. Recorded in the approval's audit event. |
| Mid-month joiner or leaver | Pro-rated from the joining/leaving date; the payslip shows the worked period, not a full month. |
| Negative net pay (advances exceed earnings) | Blocked from approval. The row is flagged with the reason and a required adjustment before the run can proceed. |
| Change needed after approval | Locked. Only an auditable adjustment in a later period, with a reason and before/after values (Constitution §6). |
| Two people approve simultaneously | Optimistic lock; the second is told it is already approved, by whom and when. |
| Rounding | One documented rule applied consistently and stated on the payslip; totals always reconcile to the sum of lines. |

## Modules, roles and tenancy
| Case | Rule and behaviour |
|---|---|
| Disabling a module with dependents | Dependency warning with impact, affected counts, typed confirmation and reason. Blocked if it would corrupt an open payroll (Constitution §5). |
| Re-enabling a module | Historical data reappears untouched; jobs and notifications resume from the enable date, not backfilled. |
| Feature flag off but a stale client shows the UI | Server denies the API call with a clear message; the client refreshes its configuration. UI hiding alone is never the control (Constitution §5). |
| Permission removed while a user is mid-task | The next request is denied with an explanation and a safe route back; entered work is not silently discarded. |
| Support/impersonation session | Persistent non-dismissible warning band; every action attributed to the real operator; time-bound and logged (Roles doc). |
| Cross-tenant data | Impossible by design. Any cross-tenant access is platform-level, justified, time-bound and audited (Constitution §2). |

## Data, network and device
| Case | Rule and behaviour |
|---|---|
| Slow network (>400 ms) | Skeletons appear; no number, hour total or salary is shown in a partial state. |
| Request fails mid-submit | The form keeps its content; an error banner explains and offers Retry. Nothing is re-entered from scratch (WCAG 2.2 Redundant entry). |
| Session expires | Work is preserved; after re-authentication the user returns to the same screen and state. |
| Very long employee name | Wraps in approval and payroll contexts; truncates with a tooltip only in dense admin tables. |
| Single-word name | Initials fall back to the first two letters; never renders as a blank avatar. |
| 500+ employees in one table | Server-side pagination and search; bulk actions capped and always previewed with a count. |
| Duplicate phone number on employee creation | Blocked with a link to the existing employee record. |
