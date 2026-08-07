import { Suspense } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/Loading";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Sign-in (screen E1). Employee surface — warm canvas, generous spacing.
 * Note: the approved design specifies phone-number sign-in; Phase 1 ships
 * email + password until the SMS/OTP provider decision is approved
 * (DECISIONS.md D-P1-05, raised in the completion report).
 */
export default function SignInPage() {
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
