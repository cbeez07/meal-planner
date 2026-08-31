import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { auth } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");
  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    const callbackUrl = String(formData.get("callbackUrl") || "/");
    await signIn("credentials", {
      username,
      password,
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/",
    });
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <form
        action={login}
        className="w-full max-w-sm rounded-3xl border border-line bg-paper-2 p-6 shadow-sm"
      >
        <p className="text-sm uppercase tracking-widest text-muted">Household</p>
        <h1 className="mt-1 text-3xl">Weekly Meals</h1>
        <p className="mt-2 text-muted">Sign in to plan dinners and shop for five.</p>
        <input type="hidden" name="callbackUrl" value={params.callbackUrl || "/"} />
        <label className="mt-6 block text-sm font-medium">
          Username
          <input
            name="username"
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3"
            autoComplete="username"
            required
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            name="password"
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3"
            autoComplete="current-password"
            required
          />
        </label>
        {params.error ? (
          <p className="mt-3 text-sm text-terracotta">Those credentials did not match.</p>
        ) : null}
        <button type="submit" className="mt-6 w-full rounded-full bg-sage py-3 text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}
