"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, TextArea } from "@/components/ui/Input";

/**
 * Demo request form (screen M6).
 *
 * No submission endpoint exists yet: routing enquiries needs an approved
 * destination (inbox, CRM or WhatsApp) and a privacy notice for storing
 * a prospect's details. Rather than silently dropping a request, the form
 * says plainly that it is not connected and offers a direct alternative.
 */
export function DemoForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Card>
      <Alert variant="info" title="This form is not connected yet.">
        Where demo requests should go — an inbox, a CRM or WhatsApp — has
        not been decided, and we will not store your details until it is.
        Nothing you type here is sent or saved.
      </Alert>

      <form
        className="mt-4 flex flex-col gap-1"
        onSubmit={(e) => e.preventDefault()}
        aria-describedby="demo-disabled"
      >
        <Input
          label="Your name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Company"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <Input
          label="Phone number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          prefix="+91"
          helper="We use your number only to arrange the walkthrough. No marketing messages."
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
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="mt-4">
          <Button
            type="submit"
            disabled
            disabledReason="Sending is switched off until a destination for enquiries is agreed."
          >
            Request a demo
          </Button>
          <p id="demo-disabled" className="mt-2 text-caption text-text-secondary">
            In the meantime, contact the person who shared STF with you and
            they will arrange the walkthrough.
          </p>
        </div>
      </form>
    </Card>
  );
}
