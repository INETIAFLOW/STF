# STF Desktop Admin Guidelines — v1.0

Desktop exists so an owner, HR or manager can review many records quickly and decide safely. Dense is fine; ambiguous is not.

## 1. Frame
- Sidebar `layout.sidebarWidth` 240px at `lg+`, 72px rail at `md`, drawer below.
- Top bar `layout.topBarHeightDesktop` 64px: page title, global search, branch/date context, notifications, avatar menu. **The tenant company name is always visible** — multi-tenant safety.
- Content max width 1440px, centred beyond `2xl`.
- Canvas `color.surface.canvas` (cool). Cards `radius.card` 12px. **No warm tokens anywhere on admin surfaces.**

## 2. Density
| Element | Desktop value |
|---|---|
| Table row height | 52px (48px minimum) |
| Row divider | 1px `color.border.subtle` |
| Card padding | `space.5` 20px |
| Grid gap | `space.4` 16px |
| Body / label / caption | 15 / 13 / 12px |
| Numeric cells | `font.size.data` 14px mono, right-aligned, tabular |
| Icon buttons | 40×40px (32×32 only inside rows ≥48px) |

Dense does not mean small: 13px is the label floor and 12px is only for micro-labels and timestamps.

## 3. Tables
- Sticky header on `color.surface.sunken`; uppercase 11–12px micro-labels with `letter-spacing: .08em`.
- Name column left and sticky; times, hours and amounts right-aligned mono; status column fixed width; actions right-most, maximum three.
- Sortable headers are buttons with `aria-sort`. Selection shows a bulk bar with the count and a previewed impact.
- Payroll totals pin to the bottom and always reconcile to the sum of visible lines.
- Editable cells exist **only** in payroll adjustments, with an explicit Save and a required reason.

## 4. Review and approval work
This is the core desktop job. Every approval surface follows the Approval card contract:
requester → one-sentence request statement → evidence → **computed impact line** → decision actions → persistent audit line.
- Reject always requires a reason. Bulk approval is allowed only for identical exception types and always previews the combined count and impact.
- Keyboard shortcuts (`A` approve, `R` reject) are permitted with a confirmation step; the whole queue must be completable by keyboard including reason entry.
- Detail opens in a right drawer at `lg`, or a side panel at `xl`. The drawer is deep-linkable so an admin can share one exception.
- Stale decisions are handled explicitly: "Already approved by Priya at 10:04 AM" with a link to the audit entry.

## 5. Configuration surfaces (Module Management, roles, policy, settings)
- Every governed switch shows its state as a **word**, its affected-user count, its dependencies, and when it was last changed by whom.
- Destructive or wide-reaching changes use the **impact confirm** pattern: consequence sentence → what stops → affected counts → data-retention reassurance → required reason → typed confirmation for irreversible module disables.
- Governed switches never flip optimistically. They show a spinner until the server confirms, and revert with a plain reason on failure.
- Permission screens show record scope before permissions and warn, in advance, what a change lets people see.

## 6. Payroll surfaces
- Never animate a figure. Never show a partial number.
- Always display the inputs, the policy version and the period alongside the totals.
- Approval is a locking action and says so. Post-approval changes exist only as auditable adjustments.
- Statutory language is never asserted: "checked with your accountant", not "compliant".

## 7. Multi-tenant and support safety
- Tenant name in the top bar on every screen; branch context explicit on every data view.
- Impersonation/support sessions show a persistent, non-dismissible `status.warning` band: "Support session — actions are logged."
- Sensitive data (salary, bank, documents, location) requires an explicit action to reveal, and revealing it is an audit event.

## 8. Admin screen checklist
- [ ] Tenant name and branch/date context visible
- [ ] Only enabled modules present in the sidebar
- [ ] Every table has its stacked mobile alternative defined
- [ ] Every decision surface shows a computed impact line before the action
- [ ] Reject/disable paths require a reason
- [ ] Audit line persists on the record after the decision
- [ ] No warm tokens; no casual copy
- [ ] Fully keyboard-completable, including bulk review
- [ ] Sensitive data gated and logged
