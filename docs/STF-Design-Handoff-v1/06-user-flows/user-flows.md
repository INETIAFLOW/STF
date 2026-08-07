# STF User Flows — v1.0

Notation: `[Screen]` · `<decision>` · `{system action}` · **bold** = the moment a consequence is shown before an action.

---

## 1. Employee check-in inside a permitted location

```
[Home dashboard] or [Check-in screen]
  {device requests location once, at tap time}
  <inside permitted area?> YES
[Check-in screen: success chip "Inside Shivaji Market area"]
  <late by more than grace period?> NO
  → tap "Check In"
  {server records time (server clock wins), branch, distance, device}
[Warm confirmation: "Checked in at 9:42 AM · Have a good shift, Ravi."]
  {action becomes Check Out; today's hours start counting}
  {audit event: attendance.checkin}
```
**Notes:** location is requested at the tap, not held open. The recorded time is the server's, echoed back to the employee. Double taps are debounced; a second tap within the same minute produces no second record and no error.

---

## 2. Outside-area attendance requiring approval

```
[Check-in screen]
  <inside permitted area?> NO — 1.4 km away
[Warning chip + banner: "You are 1.4 km outside the Shivaji Market area."]
  **"You can still check in. It will be sent to your manager for approval with your reason."**
  → Reason field appears · Required
  <reason entered?> NO → primary button stays disabled with the reason stated
  YES → button label becomes "Check In — needs approval"
  → tap
  {record created with status = Pending review; exception raised to the reporting manager}
[Confirmation: "Checked in at 9:12 AM · sent to Suresh for approval"]
  {employee sees "What your manager will see": time, distance, reason — nothing more}
     ↓
[Admin: Attendance exceptions → Approval card]
  Evidence: time, distance, reason. **Impact: "Approving marks this Present. No payroll change."**
  <decision>
    Approve → status Present · audit line on card · employee notified
    Reject  → reason REQUIRED · status stays an exception · employee notified with the reason
    Ask for details → status "Details requested" · returns to employee with a note
```
**Edge:** if two admins open the same card, the second sees *"Already approved by Priya at 10:04 AM"* and a link to the audit entry.

---

## 3. Late arrival and late exemption

```
[Check-in screen]
  {shift start 09:30, grace 10 min, now 09:42}
  **Consequence banner: "Checking in now will record a late arrival of 12 minutes."**
  → tap Check In (button's accessible name includes the consequence)
  {record: Present, late_minutes = 12, policy_version = 2}
[Confirmation repeats what was recorded: "Late by 12 min · sent for review"]
     ↓
[Employee] may open the record and "Request exemption" with a reason
     ↓
[Manager: exception card]
  **Impact: "Exempting removes the late mark. It will not count towards the 3-late deduction."**
  <exemption feature enabled for tenant?> NO → the action is absent, not greyed
  YES → Approve → status "Exempted", reason stored, audit event
     ↓
{Payroll reads late_minutes and exemptions when the month is calculated}
```

---

## 4. Leave request → approval → payroll impact

```
[Employee: Request leave]
  type (Full / Half / Emergency) · from–to · reason (required)
  {system computes payroll effect from policy}
  **"2 unpaid days will be applied to August payroll. Your manager can change this before payroll is approved."**
  → Send request
[Leave status: Pending · timeline shows Sent → Waiting for Suresh → Payroll effect after approval]
     ↓
[Manager/HR: Leave approval queue]
  Banner if the period's payroll is still open: "Decisions made now will be included in this month's calculation."
  **Impact line per request, computed: "Approving applies 2 unpaid days to August payroll for Ravi Kumar."**
  <decision>
    Approve as unpaid → leave approved, payroll input created
    Approve as paid   → leave approved, no deduction, reason recorded
    Reject            → reason REQUIRED, employee sees the reason verbatim
  {audit event with before/after values}
     ↓
[Payroll: August run] the approved leave appears as an input line, traceable to the approval
     ↓
<payroll already approved and locked for that period?>
  YES → the leave cannot silently change pay; it creates an adjustment for the next period, flagged to HR
```

---

## 5. Task creation → assignment → proof → closure

```
[Manager: New task]
  title · description · assignee · priority · due date · optional due time · optional time frame
  proof requirement (photo / file — video only if the flag is on)
  Preview panel: "What Ravi will see" + his current load ("3 open tasks, 1 already due today")
  → Assign Task
  {push to employee; reminder scheduled before the due time}
     ↓
[Employee: My tasks] → Start → status In progress
     ↓
[Employee: Submit task proof]
  Take Photo (default) / Choose File · limits stated up front · optional note
  {photo downscaled client-side; capture time and nearest place shown in plain words}
  → Send for review → status Submitted for review
  <offline?> → files queued, chip "Waiting to send", nothing lost
     ↓
[Manager: Task proof review drawer]
  proof image + files + employee note
  **Impact: "Approving marks this task Completed. It will appear in today's summary and in Ravi's task record."**
  <decision>
    Approve completion → status Completed, audit line
    Ask for details    → returns to employee with a note, status In progress
    Reject proof       → reason REQUIRED, status In progress, employee notified
```
**Rule:** a task with a proof requirement can never reach Completed without proof on file.

---

## 6. Daily summary delivery

```
{Scheduled job at the tenant's configured time (default 7:30 PM)}
  {collects: attendance counts, task counts, exception counts — only for ENABLED modules}
  {payroll figures are excluded from daily summaries by design}
  {scope per recipient: owner = all branches, manager = own branch/tree}
     ↓
<channels configured and enabled?>
  email ✓ → sent
  WhatsApp ✓ → sent
  SMS ✗ not configured → skipped silently, shown as "Off" in settings, never silently failed
     ↓
[Daily report dashboard] shows "Last sent 7:30 PM · delivered · email ✓ WhatsApp ✓"
<delivery failed?> → retry once, then a persistent error card in the dashboard with the reason
```

---

## 7. Payroll review and approval

```
[Payroll: August run — Draft]
  Warning if exceptions are unreviewed: "7 exceptions unreviewed. Their hours are counted as recorded. Reviewing may change 3 payslips."
  Row-level statuses: Ready / Leave pending / No salary structure
  {inputs listed: attendance period, approved leave, late policy version, advances, incentives}
  → adjustments allowed, each requiring a reason (audited)
  → Review & approve
     ↓
[Impact confirm modal]
  **"Approving locks August payroll for 55 employees. After this, changes need an auditable adjustment."**
  net payable · payslips generated · period · policy version
  ERROR block: "1 employee will be left out — Vikas Sharma has no salary structure."
  WARNING block: unreviewed exceptions
  reason (required) + checkbox: "I have checked these figures with our accountant. STF does not certify statutory compliance."
  <both complete?> NO → primary stays disabled
  YES → Approve and lock payroll
     ↓
{payroll locked · 54 payslips generated · employees notified · audit event with totals}
<later change needed?> → adjustment path only, never an overwrite
```

---

## 8. Module enable / disable with dependency warning

```
[Module Management] → toggle "Attendance" to off
  {system computes dependents and affected counts BEFORE showing anything}
[Dependency warning modal]
  **"Payroll cannot calculate hours without Attendance."** + Performance stops updating
  WHAT STOPS IMMEDIATELY: check-in disappears for 55 employees · 7 exceptions unreviewable ·
  daily summary loses its attendance section · late/missed-checkout notifications stop
  affected: 55 employees, 6 admin users
  reassurance: "No attendance data is deleted."
  type "ATTENDANCE" to confirm + reason (required)
  <both complete?> NO → primary disabled
  YES → Turn off Attendance
     ↓
{switch shows a spinner, NOT a flipped state, until the server confirms}
{on success: navigation items removed, APIs deny, jobs unscheduled, notifications suppressed, audit event}
{on failure: switch returns to its previous state with a plain reason}
     ↓
Enabling again restores navigation and jobs; historical data reappears untouched.
```
**Blocked case:** enabling Payroll while Attendance is off → the switch does not silently fail; it opens "Requires Attendance" with a one-tap path to enable the dependency.

---

## 9. Role / permission change

```
[Roles & permissions] → select role (e.g. HR)
  record scope (all / own branch / own reporting tree) applies before every permission
  toggle a sensitive permission (salary view, bank details, location, export, audit log)
     ↓
**Live impact banner: "You are about to change what 2 people can see. Adding Salary amounts — view lets both HR users see every employee's pay."**
  → Save changes
{audit event with before/after permission sets and the acting user}
{affected users' sessions re-evaluate permissions on their next request — server-side, not just UI}
     ↓
<user-level exception needed?> → granted per person, time-bound where possible, always audited
```
**Rule:** a role can never grant more than the tenant's enabled modules allow. Platform controls cannot be bypassed by a Tenant Owner.

---

## 10. Employee document upload

```
[Employee: My documents]
  Notice: "Your documents are visible to you, HR and your company owner."
  → Take Photo / Choose File (PDF or image, ≤10 MB)
  {client-side size check and downscale; clear error if over the limit}
  → uploaded → status "Pending review"
     ↓
[HR: Employee profile → Documents]
  document shown with "Needs review" + who uploaded it and when
  → Verify → status Verified (audit event)
  → or Request a better copy → employee notified with the reason
     ↓
{downloads by HR/admin are recorded in the activity log with name and time}
{retention follows Company settings; deletion requests are handled subject to legal obligations}
```
