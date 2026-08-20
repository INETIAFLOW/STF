"use client";

import { useId, useState, useTransition } from "react";
import { submitDemoRequestAction } from "@/lib/platform/actions";
import { HONEYPOT_FIELD, validateDemoRequest } from "@/lib/platform/demo-requests";

/**
 * Demo request form (screen M6), restyled to the marketing surface.
 *
 * The logic is unchanged and deliberately so: the same validator runs here
 * and again on the server — the one that counts, since this form is
 * reachable by anything with a network connection — and the same honeypot
 * catches bots.
 *
 * Only the fields on this form are kept. No email, no IP address, no
 * referrer, no analytics: someone asking for a call back has not agreed to
 * be profiled, and the honest version of "we only use this to call you" is
 * to not collect the rest. The notice under the button says so before
 * anyone types anything, rather than in a policy nobody opens.
 */
export function DemoForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ message: string; detail?: string } | null>(null);

  const ids = {
    name: useId(),
    company: useId(),
    phone: useId(),
    teamSize: useId(),
    notes: useId(),
    error: useId(),
  };

  function submit() {
    setError(null);
    setFieldError(null);

    const payload = { name, company, phone, teamSize, notes, website: honeypot };
    const problems = validateDemoRequest(payload);
    if (problems.length > 0) {
      setError(problems[0].message);
      setFieldError(problems[0].field === "form" ? null : problems[0].field);
      return;
    }

    startTransition(async () => {
      const result = await submitDemoRequestAction(payload);
      if (result.ok) {
        setSent({ message: result.message, detail: result.detail });
      } else {
        setError(result.error);
        setFieldError(result.field ?? null);
      }
    });
  }

  if (sent) {
    return (
      <div className="m-card p-7 text-center">
        <span
          className="inline-flex size-14 items-center justify-center rounded-full bg-[color:var(--m-green)] text-2xl text-white shadow-[0_6px_18px_rgba(47,158,111,.35)]"
          aria-hidden="true"
        >
          ✓
        </span>
        <h2 className="m-h3 mt-5 text-[22px]">{sent.message}</h2>
        {sent.detail && (
          <p role="status" className="mt-2 text-[14.5px] text-[color:var(--m-muted)]">
            {sent.detail}
          </p>
        )}
      </div>
    );
  }

  const invalid = (field: string) => (fieldError === field ? true : undefined);

  return (
    <form
      className="m-card p-7"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <Field id={ids.name} label="Your name">
        <input
          id={ids.name}
          className="m-field"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={invalid("name")}
          aria-describedby={error ? ids.error : undefined}
        />
      </Field>

      <Field id={ids.company} label="Company">
        <input
          id={ids.company}
          className="m-field"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          aria-invalid={invalid("company")}
          aria-describedby={error ? ids.error : undefined}
        />
      </Field>

      <Field
        id={ids.phone}
        label="Phone number"
        helper="We use your number only to arrange the walkthrough. No marketing messages."
      >
        <div className="flex">
          <span
            className="flex items-center rounded-l-xl border border-r-0 border-[color:var(--m-border-strong)] bg-[color:var(--m-cream-inset)] px-3.5 text-[15px] font-semibold text-[color:var(--m-muted)]"
            aria-hidden="true"
          >
            +91
          </span>
          {/* flex-1 + min-w-0 rather than the class's own width:100% — in a
              flex row that 100% resolves against the whole container and
              then the +91 prefix pushes it past the edge, which is exactly
              what it did at 360px. */}
          <input
            id={ids.phone}
            className="m-field min-w-0 flex-1 rounded-l-none"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={invalid("phone")}
            aria-describedby={error ? ids.error : undefined}
          />
        </div>
      </Field>

      <Field id={ids.teamSize} label="Team size" optional>
        <input
          id={ids.teamSize}
          className="m-field"
          type="number"
          inputMode="numeric"
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
          aria-invalid={invalid("teamSize")}
        />
      </Field>

      <Field id={ids.notes} label="What would you like to see?" optional>
        <textarea
          id={ids.notes}
          className="m-field min-h-[96px] resize-y"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-invalid={invalid("notes")}
          aria-describedby={error ? ids.error : undefined}
        />
      </Field>

      {/* Left empty by a person, filled by most bots. Hidden from sight AND
          from screen readers, and never focusable, so it cannot trap
          somebody navigating by keyboard. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="m-btn-primary mt-2 w-full p-[15px] text-base font-bold disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending && (
          <span
            aria-hidden="true"
            className="inline-block size-4 rounded-full border-[2.5px] border-white/40 border-t-white"
            style={{ animation: "m-spin .7s linear infinite" }}
          />
        )}
        {pending ? "Sending…" : "Request a demo"}
      </button>

      {error && (
        <p
          id={ids.error}
          role="alert"
          className="mt-2.5 text-[12.5px] font-semibold text-[color:var(--m-red-deep)]"
          style={{ animation: "m-seq-in .25s ease both" }}
        >
          {error}
        </p>
      )}

      <p className="mt-3.5 text-[12.5px] leading-[1.6] text-[color:var(--m-muted-2)]">
        We keep your name, company, phone number and anything you write here, so we can call you
        back about STF. Nothing else is collected. We do not share it, and we will not add you to a
        mailing list. Ask us and we will delete it.
      </p>
    </form>
  );
}

/** Label above the field, never floating; the optional marker is a word. */
function Field({
  id,
  label,
  helper,
  optional,
  children,
}: {
  id: string;
  label: string;
  helper?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[18px]">
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal text-[color:var(--m-muted-2)]">(optional)</span>
        )}
      </label>
      {children}
      {helper && (
        <p className="mt-1.5 text-[12px] leading-[1.5] text-[color:var(--m-muted-2)]">{helper}</p>
      )}
    </div>
  );
}
