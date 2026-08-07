# STF Empty, Loading, Error and Offline States — v1.0

Copy here is final; use it verbatim. Component behaviour is in `../04-components/component-specifications.md` §22–24.

## 1. Principles
1. Every empty region **explains itself** and offers a next step, or reassures ("Attendance for today is clear").
2. Never show a number, hour total or salary figure in a partially loaded state — skeleton until final.
3. Errors say what happened and what to do next. Never "Something went wrong."
4. Offline never loses work. Locally confirmed actions stay confirmed and carry a `Waiting to send` chip.
5. A blocked action always states its reason next to the control.

## 2. Empty states

| Screen | Title | Body | Action |
|---|---|---|---|
| My tasks | No tasks today. | New tasks from your manager will appear here. | — |
| My tasks (first run) | Your tasks will appear here. | When your manager assigns work, you'll get a notification. | — |
| Attendance history | No records yet. | Your attendance will appear here after your first check-in. | Check In |
| My leave | No leave requests. | Request leave when you need it. Your manager is notified straight away. | Request Leave |
| My payslips | No payslips yet. | Payslips appear here after payroll is approved for a month. | — |
| My documents | No documents yet. | HR may ask you for ID or address proof. | Add a document |
| Notifications | Nothing new. | Task, leave and payslip updates will show here. | — |
| Admin exceptions | No exceptions to review. | Attendance for today is clear. | — |
| Admin leave queue | No leave to approve. | New requests appear here as soon as they are sent. | — |
| Admin tasks | No tasks yet. | Assign the first task to see it here. | New task |
| Employee search | No employee matches "xyz". | Check the spelling or search by phone number. | Clear search |
| Payroll run | No payroll for this month yet. | Payroll can be calculated once attendance is recorded for the period. | Calculate |
| Activity log (filtered) | No activity of this type. | Try a wider date range or a different type. | Clear filters |
| Module disabled | Tasks is turned off for your company. | Your company owner can turn it on in Module Management. | — |
| No permission | You don't have access to Payroll. | Ask your company owner if you need it. | — |

Illustration rule: circles, rounded rectangles and the three logo bars only. Employee screens may use warm tokens; admin screens use indigo tints.

## 3. Loading states

| Context | Treatment |
|---|---|
| Employee home | Skeleton for the attendance card, then 2 task-card skeletons. Bottom nav renders immediately. |
| Check-in screen | Clock and date render immediately (client time until the server responds); the **location chip and primary button** show a skeleton until the location and policy are resolved. Never a tappable Check In whose consequence is unknown. |
| Attendance history / tables | Header first, then 3 row skeletons (mobile) or 6 (desktop). Fixed count so nothing jumps. |
| Metric cards | Skeleton block in place of the value. Never `0`. |
| Search | Spinner in the field after 400 ms; results replace skeleton rows. |
| Payroll calculation | Progress card with a plain step: "Calculating attendance for 55 employees…" · then "Applying leave and adjustments…". Interruptible where safe. |
| Report export | Inline progress with a cancel option; completion arrives as a toast plus an entry in Recent exports. |
| Button-level | Label replaced by a spinner, width locked, control inert but focusable. |
| Photo upload | Per-file progress bar with Cancel; other files unaffected. |

Spinners appear only after 400 ms. Skeleton shimmer becomes a static tint under `prefers-reduced-motion`.

## 4. Error states

| Case | Message | Next step |
|---|---|---|
| Wrong credentials | Wrong phone number or password. | Try again, or use "Forgot password". |
| OTP expired | That code has expired. | Send a new code |
| No connection (load) | We couldn't load today's attendance. Check your connection and try again. | Retry (+ small `REF 8F2C-41`) |
| Location off | Location is off. | Turn on location to check in, or ask your manager to record it for you. |
| File too large | Photo is too large (12 MB). | Take a new photo or choose a file under 10 MB. |
| Unsupported file | This file type isn't supported. Use a photo or a PDF. | Choose File |
| Upload failed (one file) | challan-4821.pdf didn't upload. | Retry — other files are unaffected |
| Submit failed | Your request wasn't sent. Your details are still here. | Retry |
| No permission | You don't have access to Payroll. | Ask your company owner if you need it. |
| Already decided | Already approved by Priya at 10:04 AM. | View in activity log |
| Payroll blocked | Payroll can't be approved. 1 employee has no salary structure. | Fix salary structure |
| Dependency blocked | Payroll needs Attendance to be on. | Turn on Attendance |
| Session expired | You were signed out. Your work is saved. | Sign in to continue |
| Server error | Something on our side failed. Nothing you entered was lost. | Retry · reference ID shown |

Form submit failures move focus to a banner at the top of the form listing each failing field as a link.

## 5. Offline

| Situation | Behaviour |
|---|---|
| Connection drops | Persistent info bar: "No internet — working offline". It is not dismissible while offline. |
| Check-in / check-out offline | Confirmed locally with the warm confirmation **and** a neutral `Waiting to send` chip. Explanation card: "Your check-in is saved on this phone and will be sent when you're back online. Nothing is lost." |
| Task proof offline | Files queued; task shows `Waiting to send`; the employee can carry on. |
| Leave request offline | Queued and clearly marked; the employee is told it has not reached the manager yet. |
| Read-only data offline | Last synced data shown with a timestamp: "Last updated 9:42 AM". |
| Reconnection | Queue sends automatically; a single summary toast confirms ("2 items sent"). Conflicts become exceptions with both versions shown to the admin. |
| Admin screens offline | Approvals, payroll and configuration are **not** available offline. The screen says so plainly rather than accepting an action it cannot guarantee. |
