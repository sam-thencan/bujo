import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { TopLegend } from "@/components/TopLegend";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.onboarded_at) redirect("/onboarding");
  const settings = await getSettings(user.id);
  return (
    <div className="min-h-dvh">
      <TopLegend show={settings.show_legend} />
      <main className="mx-auto max-w-screen-sm px-3 pb-[120px] pt-2">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
