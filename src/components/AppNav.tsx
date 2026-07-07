"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  HandCoins,
  Package,
  Receipt,
  Truck,
  ClipboardList,
  UserCog,
  MoreHorizontal,
} from "lucide-react";

const primary = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/ventes", label: "Ventes", icon: ShoppingCart },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/dettes", label: "Dettes", icon: HandCoins },
];

export const secondary = [
  { href: "/produits", label: "Produits & stock", icon: Package },
  { href: "/depenses", label: "Dépenses", icon: Receipt },
  { href: "/fournisseurs", label: "Fournisseurs", icon: Truck },
  { href: "/livraisons", label: "Livraisons", icon: ClipboardList },
  { href: "/employes", label: "Employés", icon: UserCog },
];

export default function AppNav() {
  const pathname = usePathname();
  const onSecondaryPage = secondary.some((s) => pathname?.startsWith(s.href));

  return (
    <>
      {/* Barre d'onglets fixe en bas — mobile uniquement */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-black/[0.06] pb-[env(safe-area-inset-bottom)]">
        <ul className="flex justify-around">
          {primary.map(({ href, label, icon: Icon }) => {
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
          <li className="flex-1">
            <Link
              href="/plus"
              className={`flex flex-col items-center gap-1 py-2 active:scale-[0.97] transition-transform ${
                onSecondaryPage || pathname === "/plus" ? "text-accent" : "text-ink-faint"
              }`}
            >
              <MoreHorizontal size={22} strokeWidth={onSecondaryPage || pathname === "/plus" ? 2.2 : 1.8} />
              <span className="text-[11px]">Plus</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Sidebar — tablette / desktop */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:h-screen md:sticky md:top-0 md:border-r md:border-black/[0.06] md:bg-white md:py-6 md:px-3">
        <div className="px-3 mb-8">
          <span className="text-lg font-medium text-accent">Boutik+</span>
        </div>
        <ul className="flex flex-col gap-1">
          {[...primary, ...secondary].map(({ href, label, icon: Icon }) => {
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
