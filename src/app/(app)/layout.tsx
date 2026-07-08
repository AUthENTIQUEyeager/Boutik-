import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import SyncIndicator from "@/components/SyncIndicator";
import BlockedGuard from "@/components/BlockedGuard";
import InstallPrompt from "@/components/InstallPrompt";
import NotificationsBell from "@/components/NotificationsBell";
import LogoutButton from "@/components/LogoutButton";
import AssistantWidget from "@/components/AssistantWidget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("shop_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "superadmin") redirect("/admin");

  return (
    <div className="md:flex md:min-h-screen">
      <AppNav />
      <div className="flex-1 min-h-screen pb-20 md:pb-0">
        <header className="sticky top-0 z-20 bg-surfacealt/90 backdrop-blur border-b border-black/[0.04] px-4 py-3 flex items-center justify-between">
          <span className="text-[15px] font-medium text-ink">{profile?.shop_name ?? "Boutik+"}</span>
          <div className="flex items-center gap-4">
            <NotificationsBell shopId={user.id} />
            <SyncIndicator />
            <LogoutButton />
          </div>
        </header>
        <main className="px-4 py-5 max-w-3xl mx-auto">{children}</main>
      </div>
      <BlockedGuard userId={user.id} />
      <InstallPrompt />
      <AssistantWidget />
    </div>
  );
}
