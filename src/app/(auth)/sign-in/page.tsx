import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { safeRedirectPath } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;
  return (
    <AuthForm mode="sign-in" next={safeRedirectPath(typeof next === "string" ? next : null)} />
  );
}
