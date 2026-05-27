import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SigninForm } from "./signin-form";

export const metadata = {
  title: "Ingreso — UJCVx",
};

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;

  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (user) {
    redirect(redirectTo || "/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
      <div className="w-full max-w-sm">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background text-lg font-bold">
            U
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">UJCVx</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Universidad José Cecilio del Valle
          </p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <SigninForm redirectTo={redirectTo} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
