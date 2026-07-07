import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "superadmin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-surfacealt">
      <header className="bg-white border-b border-black/[0.06] px-5 py-3 flex items-center justify-between">
        <span className="text-[15px] font-medium text-accent">Boutik+ · Super admin</span>
        <LogoutButton />
      </header>
      <main className="px-5 py-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
