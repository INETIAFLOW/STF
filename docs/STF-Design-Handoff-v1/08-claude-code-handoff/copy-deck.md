# STF Copy Deck — v1.0

Implementation-ready strings. Sentence case throughout. Placeholders in `{braces}`.
Voice rules: `../01-brand/voice-and-microcopy.md`. **Status labels and consequence sentences are fixed — do not paraphrase.**

## 1. Status labels (fixed)
`Present` · `Late {n} min` · `Absent` · `On Leave` · `Half Day` · `Pending review` · `Outside area — needs approval` · `Exempted` · `Not recorded` · `Approved` · `Rejected` · `Waiting to send` · `Not started` · `In progress` · `Submitted for review` · `Completed` · `Overdue` · `Overdue {n} day` · `Draft` · `Ready` · `Locked` · `Paid` · `Not ready` · `Verified` · `Needs review` · `Active` · `Inactive` · `Enabled` · `Disabled` · `Not available`
Priority: `High` · `Medium` · `Low`

## 2. Buttons
`Check In` · `Check Out` · `Check In — needs approval` · `Request Leave` · `Send request` · `Cancel request` · `Submit Proof` · `Send for review` · `Take Photo` · `Choose File` · `Start` · `Add a note` · `Approve` · `Reject` · `Ask for details` · `Approve completion` · `Reject proof` · `Approve as paid` · `Approve as unpaid` · `Review` · `View all` · `Assign Task` · `New task` · `Save as draft` · `Review payroll` · `Review & approve` · `Approve and lock payroll` · `Recalculate` · `Download PDF` · `Export` · `Save changes` · `Add employee` · `Add branch` · `Add shift` · `Upload` · `Verify` · `Show payroll details` · `Retry` · `Sign in` · `Sign out` · `Request a demo` · `Get a quote`
Destructive buttons name the consequence: `Turn off Attendance`, not `Confirm`.

## 3. Navigation
Employee bottom nav: `Home` · `Tasks` · `Attendance` · `Profile`
Admin sidebar: `Dashboard` · `Attendance` · `Employees` · `Leave` · `Tasks` · `Payroll` · `Reports` — group `CONFIGURATION`: `Module Management` · `Roles & permissions` · `Company settings` · `Activity log`
Attendance sub-nav: `Today` · `Exceptions ({n})` · `Policy & shifts`

## 4. Consequence sentences (fixed)
| Situation | Sentence | Detail line |
|---|---|---|
| Late check-in | Checking in now will record a late arrival of {n} minutes. | Your manager will see this in today's attendance review. |
| Outside area | You are {d} km outside the {branch} area. | You can still check in. It will be sent to your manager for approval with your reason. |
| Leave affecting pay | {n} unpaid days will be applied to {month} payroll. | Your manager can change this before payroll is approved. |
| Approving an outside-area check-in | Approving marks this Present. No payroll change. | — |
| Approving a missed check-out | Approving records {h} for {date} and adds {ot} of overtime to {month} payroll. | — |
| Approving leave | Approving applies {n} unpaid days to {month} payroll for {name}. | — |
| Approving task proof | Approving marks this task Completed. It will appear in today's summary and in {name}'s task record. | — |
| Payroll approval | Approving locks {month} payroll for {n} employees. | After this, changes need an auditable adjustment. |
| Module disable | {Dependent} cannot {do X} without {Module}. | No {module} data is deleted. |
| Permission change | You are about to change what {n} people can see. | {Explanation of exactly what becomes visible.} |

## 5. Employee screens
**Login** — "Sign in to STF" / "Use the phone number your company registered." / helper: "At least 8 characters." / footer: "Only your company can create your STF account. If you can't sign in, ask your admin or owner."
**OTP** — "Reset password" / "We sent a 6-digit code to {phone}." / "You can paste the code from your messages." / "Didn't get the code?" · "Resend in {mm:ss}" / helper: "Enter all 6 digits to continue."
**Home** — "Good morning, {name}" / "Attendance today" / "Today's tasks" / "Quick actions" / "ANNOUNCEMENT"
**Check-in** — "Inside {branch} area" / "Outside permitted area — {d} km away" / "Shift {start} – {end}" / "Today's hours" / "This week" / privacy note: "Your location is captured only when you check in or out, to confirm you were at a permitted place of work."
**Confirmation** — "Checked in at {time}" / "Have a good shift, {name}." / "Recorded at {branch}" / "Late by {n} min · sent for review" / "Working now" / "Shift ends {time}. Remember to check out before you leave."
**Outside area** — "What your manager will see" / "Nothing else about your location is recorded or shared."
**Leave request** — "Request leave" / types: "Full day" ("One or more full days") · "Half day" ("First or second half of a shift") · "Emergency" ("Same-day, needs a reason") / "Reason · Required" / placeholder: "Tell your manager why you need these days" / "Goes to {manager}"
**Leave status** — "Sent {date}" · "Waiting for {manager}" · "Payroll effect applied after approval" / "Reason from {manager}: {reason}"
**Tasks** — tabs "Today ({n})" · "Open ({n})" · "In review" · "Done" / "By {time}" / "Photo proof required" / "Repeats daily" / "Proof approved by {manager} · {date}"
**Submit proof** — "For {task}" / "JPG, PNG or PDF · up to 10 MB each · up to 5 files" / "Note · Optional" / "Your photo shows the time and nearest place it was taken. {Manager} will review it."
**Documents** — "Your documents are visible to you, HR and your company owner. They are not shared with other employees." / "Add a document" / "HR may ask you for ID or address proof."
**Payslip** — "Net pay · {month}" / "ATTENDANCE USED" · "EARNINGS" · "DEDUCTIONS" / "Policy version {v} applied for {month}. If something looks wrong, ask HR to review — changes are recorded."
**Profile** — "Your company records your check-in time and permitted location. You can see everything recorded about you in Attendance history."

## 6. Admin screens
**Dashboard** — "Needs your review" / "August payroll" · "Not yet calculated. Attendance closes on {date}." / "Daily summary" · "Today's summary is scheduled for {time} to the owner by email and WhatsApp." / "Recent activity"
**Attendance** — "Review exceptions ({n})" / search placeholder: "Search employee or phone…" / "Showing {n} of {total} employees"
**Exceptions** — "Pending by type" / "Bulk approve" · "{n} records will be marked Present. No payroll change. One audit event per record." / "Why exceptions happen" · "Delivery and field staff often work away from a branch. Exceptions are normal — they are a record to confirm, not a fault to punish."
**Leave queue** — "{Month} payroll is not yet approved. Leave decisions made now will be included in this month's calculation." / "Rejecting needs a reason."
**Create task** — "What {name} will see" / "{name}'s load today" · "{n} open tasks · {n} already due today · checked in at {time}" / "Require proof on completion" · "{name} must attach a photo or file before this task can be closed." / "Multiple assignees is off for your company."
**Payroll** — "Draft — not approved" / "{n} attendance exceptions are still unreviewed. Their hours are counted as recorded. Reviewing them may change {n} payslips." / "Inputs used" / "Before you approve" · "Statutory calculations must be checked by your accountant. STF does not certify compliance." / modal checkbox: "I have checked these figures with our accountant. STF does not certify statutory compliance."
**Module Management** — "Turning a module off removes it from navigation, blocks it in the app, stops its notifications and scheduled jobs, and is recorded in the activity log. No business data is deleted." / "FEATURE CONTROLS" / "LAST CHANGED {date} BY {name}" / unavailable: "Ask your STF contact to enable this after its rules are approved."
**Dependency warning** — "Turn off {Module} for {company}?" / "WHAT STOPS IMMEDIATELY" / "Employees affected" · "Admin users affected" / "Type {MODULE} to confirm" / "Reason · Required, recorded in the activity log" / "AN AUDIT EVENT WILL BE CREATED" / "Keep {Module} on"
**Roles** — "Record scope" · "Scope is applied before every permission below." / "Sensitive"
**Activity log** — "Audit events cannot be edited or deleted. Every entry keeps who acted, what changed, when, and the reason given."
**Reports** — "This export includes names, dates, times and hours. It does not include salary or bank details — your role does not allow exporting those. Exports are recorded in the activity log."
**Notifications** — "SMS is not configured. Add an SMS provider in Company settings to switch these on." / "Quiet hours for employees" · "No push between 9:00 PM and 7:00 AM, except urgent task changes."
**Company settings** — "Appears on payslips and reports. PNG or SVG, at least 256px." / "Employees can ask for a copy of their own records. Deletion requests are handled subject to legal obligations."

## 7. Notifications (≤60 chars)
`Task due today: {task}` · `Leave approved: {dates}` · `Leave rejected: {dates}` · `Attendance needs your review: {n} exceptions` · `Payslip ready: {month}` · `You have not checked out yet` (sub: "Tap to check out or tell your manager what happened.") · `Proof approved: {task}` · `New task from {manager}`
Never guilt-framed. State the fact and the next action.

## 8. Errors
`Wrong phone number or password. Try again, or use "Forgot password".`
`That code has expired. Send a new code.`
`We couldn't load today's attendance. Check your connection and try again.`
`Location is off. Turn on location to check in, or ask your manager to record it for you.`
`Photo is too large ({n} MB). Take a new photo or choose a file under 10 MB.`
`This file type isn't supported. Use a photo or a PDF.`
`{filename} didn't upload. Retry — other files are unaffected.`
`Your request wasn't sent. Your details are still here. Retry.`
`You don't have access to {Module}. Ask your company owner if you need it.`
`Already approved by {name} at {time}.`
`Payroll can't be approved. {n} employee has no salary structure.`
`Payroll needs Attendance to be on.`
`You were signed out. Your work is saved. Sign in to continue.`
`Something on our side failed. Nothing you entered was lost. Retry.` (+ `REF {id}`)

## 9. Empty states
Full table in `../06-user-flows/empty-loading-error-states.md` §2.

## 10. Offline
Bar: `No internet — working offline`
Card: `Your check-in is saved on this phone and will be sent when you're back online. Nothing is lost.`
Chip: `Waiting to send` · Reconnect toast: `{n} items sent`

## 11. Marketing
**Hero** — eyebrow "DESIGNED FOR INDIAN SMES" / headline "Know who is working, what got done, and what you owe." / sub "Sudarshan Task Force runs attendance, tasks, leave and payroll inputs from one phone-first system — so your day stops running on calls, registers and memory." / tagline strip "WORKFORCE • TASKS • ATTENDANCE • PAYROLL" / CTAs "Request a demo" · "See how it works" / support "Built for hardware and trading businesses, warehouses, dispatch, delivery and field teams."
**Capabilities** — "Five things that decide your day" / "Not a smaller version of corporate HR software. A working tool for businesses where presence, movement and follow-through are the job." / Attendance · Task ownership · Leave approval · Payroll visibility · Accountability
**Trust section** — "RESPECTFUL BY DESIGN" / "Evidence, not surveillance" / "Location is captured at check-in and check-out — not continuously. Employees see exactly what was recorded about them, in the same words their manager sees. Working outside a branch is a normal event to confirm, not a fault to catch."
**Closing CTA** — "See it with your own team's day" / "A 30-minute walkthrough using your shifts, branches and one real week of work."
**Pricing** — "Pricing is being finalised" / "We are working with our first businesses to set pricing that makes sense for a 15-person shop and a 300-person warehouse alike. Talk to us and we will quote for your team size and modules." / all prices render as `₹ —`
**Demo form** — "30 minutes, using your shifts and branches. We will show attendance, tasks and a payroll preview with sample data." / "We use your number only to arrange the walkthrough. No marketing messages."
**Sign in** — "STF accounts are created by your company." / "Can't sign in? Ask your company's admin or owner to check your number and role. STF support cannot open your company's data without a logged, time-bound request from your owner."

**Forbidden in marketing:** customer names or logos, adoption/accuracy/uptime statistics, compliance or security badges, prices, "Made in India", and any wording implying statutory payroll compliance is guaranteed.
