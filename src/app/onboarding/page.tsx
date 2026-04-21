import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { OnboardingPicker } from "./OnboardingPicker";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.onboarded_at) redirect("/daily");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to bujo.
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Signed in as {user.email}. How are you going to use it?
        </p>
      </div>
      <OnboardingPicker />
    </main>
  );
}
