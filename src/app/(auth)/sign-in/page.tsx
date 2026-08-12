import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Loading";
import { getAppSession } from "@/lib/auth/session";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Sign-in (screen E1). Employee surface — warm canvas, generous spacing.
 * Note: the approved design specifies phone-number sign-in; Phase 1 ships
 * email + password until the SMS/OTP provider decision is approved
 * (DECISIONS.md D-P1-05, raised in the completion report).
 *
 * The "already signed in, go to your surface" redirect lives here rather
 * than in the proxy because it is only correct if the person actually has
 * an STF account, and only the database knows that.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAppSession();
  if (session) redirect("/");

  const { error } = await searchParams;
  const noAccess = error === "no-access";

  return (
    <main
      data-surface="employee"
      className="flex min-h-dvh flex-col px-5 pt-14 pb-8"
    >
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col">
        <Image
          src="/brand/STF-logo-primary.svg"
          alt="Sudarshan Task Force"
          width={174}
          height={33}
          priority
        />
        <h1 className="mt-8 font-heading text-h1 text-text-primary">
          Sign in to STF
        </h1>
        <p className="mt-1 text-body text-text-secondary">
          Use the email your company registered.
        </p>

        {noAccess && (
          <div className="mt-6">
            <Alert
              variant="warning"
              title="That account can't open STF right now."
              live
            >
              <p>
                Your password was accepted, so the account exists — but it
                has no active company here. Usually that means it was
                deactivated, or the company was closed. Your admin or owner
                can tell you which, and put it back.
              </p>
              {/* The escape hatch. Without this, someone holding a stale
                  session cannot even reach the form as a different person:
                  sign-out otherwise lives inside the app they can't open. */}
              <form action="/auth/sign-out" method="post" className="mt-3">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center text-label text-brand-primary underline underline-offset-2"
                >
                  Sign out and use a different account
                </button>
              </form>
            </Alert>
          </div>
        )}

        <div className="mt-7">
          {/* Suspense: useSearchParams (the ?next redirect) opts the form
              out of static prerendering. */}
          <Suspense
            fallback={
              <div aria-busy="true" className="flex flex-col gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-14 rounded-button-mobile-primary" />
              </div>
            }
          >
            <SignInForm />
          </Suspense>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center text-label text-brand-primary underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="flex-1" />

        <div className="mt-8 rounded-surface-card border border-border-default bg-surface-default p-4">
          <p className="text-caption text-text-secondary">
            Only your company can create your STF account. If you can&apos;t
            sign in, ask your admin or owner.
          </p>
        </div>
      </div>
    </main>
  );
}
