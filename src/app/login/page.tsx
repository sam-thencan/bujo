import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "../(auth)/AuthForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/daily");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">bujo</h1>
        <p className="mt-1 text-sm text-ink-500">
          A calm, fast bullet journal.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
