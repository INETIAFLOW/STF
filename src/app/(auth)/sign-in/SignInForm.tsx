"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const schema = z.object({
  email: z
    .string()
    .min(1, "Enter your email to sign in.")
    .email("Check the email address — it doesn't look complete."),
  password: z.string().min(8, "Passwords have at least 8 characters."),
});

type FormValues = z.infer<typeof schema>;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const supabaseReady = isSupabaseConfigured();

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      // What happened + what to do next — never "Something went wrong."
      setFormError(
        'Wrong email or password. Try again, or ask your admin to reset it.',
      );
      return;
    }
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-1">
      {formError && (
        <Alert variant="error" title={formError} live className="mb-3" />
      )}
      {!supabaseReady && (
        <Alert
          variant="info"
          title="Sign-in isn't connected yet."
          className="mb-3"
        >
          Supabase credentials are missing from this environment. See SETUP.md
          — or use the dev preview session described in SECURITY-NOTES.md.
        </Alert>
      )}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@company.example"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        helper="At least 8 characters."
        error={errors.password?.message}
        {...register("password")}
      />

      <Button
        type="submit"
        size="xl"
        loading={isSubmitting}
        disabled={!supabaseReady}
        disabledReason={
          !supabaseReady ? "Waiting for Supabase configuration." : undefined
        }
        className="mt-2"
      >
        Sign in
      </Button>
    </form>
  );
}
