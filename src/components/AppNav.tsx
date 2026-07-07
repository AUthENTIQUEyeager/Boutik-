"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Users, HandCoins, Package, Receipt } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ventes", label: "Ventes", icon: ShoppingCart },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/dettes", label: "Dettes", icon: HandCoins },
];

const sidebarExtra = [
  { href: "/produits", label: "Produits", icon: Package },
  { href: "/depenses", label: "Dépenses", icon: Receipt },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Barre d'onglets fixe en bas — mobile uniquement */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-black/[0.06] pb-[env(safe-area-inset-bottom)]">
        <ul className="flex justify-around">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-1 py-2 active:scale-[0.97] transition-transform ${
                    active ? "text-accent" : "text-ink-faint"
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="text-[11px]">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar — tablette / desktop */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:h-screen md:sticky md:top-0 md:border-r md:border-black/[0.06] md:bg-white md:py-6 md:px-3">
        <div className="px-3 mb-8">
          <span className="text-lg font-medium text-accent">Boutik+</span>
        </div>
        <ul className="flex flex-col gap-1">
          {[...items, ...sidebarExtra].map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    active ? "bg-accent-light text-accent" : "text-ink-soft hover:bg-surfacealt"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="text-[14px] font-medium">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
