import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { HamburgerMenuDropdown } from "./HamburgerMenuDropdown";

export async function HamburgerMenu() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  return <HamburgerMenuDropdown showLegend={settings.show_legend} />;
}
