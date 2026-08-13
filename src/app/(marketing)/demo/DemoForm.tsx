"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, TextArea } from "@/components/ui/Input";
import { submitDemoRequestAction } from "@/lib/platform/actions";
import { HONEYPOT_FIELD, validateDemoRequest } from "@/lib/platform/demo-requests";

/**
 * Demo request form (screen M6).
 *
 * This was deliberately disconnected until two things were settled: where
 * enquiries go, and what a prospect is told about their details being
 * stored. Both are now answered — the enquiry is saved and shown in the
 * platform area, and the notice below says so in plain words before anyone
 * types anything.
 *
 * Only the fields on this form are kept. No email, no IP address, no
 * referrer, no analytics: someone asking for a call back has not agreed to
 * be profiled, and the honest version of "we only use this to call you" is
 * to not collect the rest.
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
  const [sent, setSent] = useState<{ message: string; detail?: string } | null>(
    null,
  );

  function submit() {
    setError(null);
    setFieldError(null);

    const payload = { name, company, phone, teamSize, notes, website: honeypot };
    // Checked here for a fast answer and again on the server, which is the
    // one that counts — this form is reachable by anything with a network
    // connection.
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
      <Card>
        <Alert variant="success" title={sent.message} live>
          {sent.detail}
        </Alert>
      </Card>
    );
  }

  return (
    <Card>
      <form
        className="flex flex-col gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        {error && (
          <Alert variant="error" title={error} live className="mb-3" />
        )}

        <Input
          label="Your name"
          autoComplete="name"
          required
          error={fieldError === "name" ? error ?? undefined : undefined}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Company"
          autoComplete="organization"
          required
          error={fieldError === "company" ? error ?? undefined : undefined}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <Input
          label="Phone number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          prefix="+91"
          helper="We use your number only to arrange the walkthrough. No marketing messages."
          error={fieldError === "phone" ? error ?? undefined : undefined}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="Team size"
          type="number"
          inputMode="numeric"
          optional
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
        />
        <TextArea
          label="What would you like to see?"
          optional
          className="max-w-none"
          error={fieldError === "notes" ? error ?? undefined : undefined}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Left empty by a person, filled by most bots. Hidden from sight
            AND from screen readers, and never focusable, so it cannot trap
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

        <div className="mt-4">
          <Button type="submit" loading={pending}>
            Request a demo
          </Button>
          <p className="mt-3 text-caption text-text-secondary">
            We keep your name, company, phone number and anything you write
            here, so we can call you back about STF. Nothing else is
            collected. We do not share it, and we will not add you to a
            mailing list. Ask us and we will delete it.
          </p>
        </div>
      </form>
    </Card>
  );
}
