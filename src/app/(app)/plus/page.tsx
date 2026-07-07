"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { secondary } from "@/components/AppNav";

export default function PlusPage() {
  return (
    <div className="md:hidden">
      <h1 className="text-[20px] font-medium text-ink mb-5">Plus</h1>
      <ul className="flex flex-col gap-2">
        {secondary.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                <Icon size={18} className="text-accent" />
              </div>
              <span className="flex-1 text-[15px] font-medium text-ink">{label}</span>
              <ChevronRight size={18} className="text-ink-faint" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
