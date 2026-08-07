# STF Voice & Microcopy — v1.0

## 1. Voice in one line
Speak like a dependable supervisor who respects everyone in the room: short, active, specific, never scolding and never vague.

## 2. Four rules
1. **Short active sentences.** "Check in", "Task due today", "Leave approved", "Review payroll".
2. **State the consequence before the action.** "Checking in now will record a late arrival of 18 minutes."
3. **Errors say what happened and what to do next.** Never "Something went wrong."
4. **Same respect for owner and worker.** No language that implies suspicion, monitoring, or ranking people as resources.

## 3. Words we use / avoid

| Use | Avoid | Why |
|---|---|---|
| Check In / Check Out | Punch in, Clock, Log attendance | Plain English, matches the physical action |
| Permitted location / Branch area | Geofence (user-facing), Tracking zone | "Geofence" is admin/config vocabulary only |
| Needs approval | Violation, Breach, Offence | Exceptions are normal, not accusations |
| Late by 18 min | Late (defaulter), Irregular | Specific and neutral |
| Request Leave | Apply for leave sanction | Fewer words, no bureaucracy |
| Review Payroll | Process salary run | Review implies human judgement, which is required |
| Task Due Today | Pending deliverable | Worker's language |
| Attach proof | Upload evidence of work done | Short, non-suspicious |
| Not recorded | Missing/failed punch | Describes data, not the person |
| Location captured at check-in | You are being tracked / Live location | STF captures events, not continuous tracking |

Banned: "surveillance", "monitor your staff", "catch late employees", "resource utilisation", "manpower", "leverage", "seamless", "revolutionary", "empower" (as filler).

## 4. Status labels (fixed strings — do not paraphrase)
`Present` · `Late 18 min` · `Absent` · `On Leave` · `Half Day` · `Pending review` · `Approved` · `Rejected` · `Not recorded` · `Outside area — needs approval` · `Exempted` · `Not started` · `In progress` · `Submitted for review` · `Completed` · `Overdue` · `Draft` · `Locked`

## 5. Buttons
Verb + object, sentence case, ≤3 words: `Check In`, `Check Out`, `Request Leave`, `Submit Proof`, `Approve`, `Reject`, `Assign Task`, `Review Payroll`, `Approve Payroll`, `Save Changes`, `Enable Module`, `Disable Module`, `Download Payslip`, `Export Report`.
Destructive/irreversible buttons name the consequence: `Disable Attendance module`, not `Confirm`.

## 6. Consequence-before-action patterns
- Late check-in: **"Checking in now will record a late arrival of 12 minutes."** Sub: "Your manager will see this in today's attendance review."
- Outside permitted area: **"You are 1.4 km outside the Shivaji Market area."** Sub: "You can still check in. It will be sent to your manager for approval with your reason."
- Leave affecting pay: **"2 unpaid days will be applied to August payroll."** Sub: "Your manager can change this before payroll is approved."
- Payroll approval: **"Approving locks August payroll for 55 employees."** Sub: "Later changes need an auditable adjustment."
- Module disable: **"Disabling Attendance will stop payroll from calculating hours for 55 employees."** Sub: "No attendance data is deleted. You can enable it again."

## 7. Confirmations and success (employee — warm; admin — plain)
- Employee check-in: **"Checked in at 9:42 AM."** Sub: "Have a good shift, Ravi." *(warm card)*
- Employee proof submitted: **"Proof sent to Suresh."** Sub: "You'll get a note when it's reviewed."
- Employee leave: **"Leave request sent."** Sub: "Suresh usually responds the same day."
- Admin approve exception: **"Approved. Meena's attendance is updated."** *(neutral, no warmth)*
- Admin payroll: **"August payroll approved and locked. 55 payslips ready."**

## 8. Errors (what happened + what next)
- `No internet. Your check-in is saved on this phone and will be sent when you're back online.`
- `Location is off. Turn on location to check in, or ask your manager to record it for you.`
- `Photo is too large (12 MB). Take a new photo or choose a file under 10 MB.`
- `Wrong phone number or password. Try again, or use "Forgot password".`
- `We couldn't load today's attendance. Check your connection and tap Retry.`
- `You don't have access to Payroll. Ask your company owner if you need it.`

## 9. Empty states (title / body / action)
- My tasks: **"No tasks today."** / "New tasks from your manager will appear here." / —
- Attendance history: **"No records yet."** / "Your attendance will appear here after your first check-in." / `Check In`
- Leave: **"No leave requests."** / "Request leave when you need it. Your manager is notified straight away." / `Request Leave`
- Admin exceptions: **"No exceptions to review."** / "Attendance for today is clear." / —
- Payslips: **"No payslips yet."** / "Payslips appear here after payroll is approved for a month." / —
- Search: **"No employee matches 'xyz'."** / "Check the spelling or search by phone number." / `Clear search`

## 10. Notifications (≤60 chars title)
- `Task due today: Deliver order #4821`
- `Leave approved: 12–13 August`
- `Attendance needs your review: 3 exceptions`
- `Payslip ready: July 2026`
- `You have not checked out yet` — sub: "Tap to check out or tell your manager what happened."
Never send guilt-framed pushes ("You are late again"). State the fact and the next action.

## 11. Marketing copy rules
Allowed positioning: **"Designed for Indian SMEs."** Concrete daily-operations claims only — attendance, task ownership, leave approval, payroll visibility, accountability.
Forbidden until proven and approved: customer names or logos, adoption numbers, uptime or accuracy statistics, compliance/statutory certifications, security badges, pricing. Payroll wording must never imply statutory compliance is guaranteed; use "payroll inputs you can review before you pay".
