"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { withAcademyPath } from "@/components/helpers/sidebar"

const navItems = [
  { title: "Account", slug: "/settings/account" },
  { title: "Notifications", slug: "/settings/notifications", disabled: true },
  { title: "Academy", slug: "/settings/academy" },
  { title: "Team", slug: "/settings/team" },
  { title: "Integrations", slug: "/settings/integrations" },
]

export function SettingsTopNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 h-8">
      {navItems.map((item) => {
        const href = withAcademyPath(pathname, item.slug)
        const isActive = pathname === href || pathname.startsWith(href + "/")

        if (item.disabled) {
          return (
            <span
              key={item.title}
              className="relative inline-flex h-[calc(100%-1px)] cursor-not-allowed items-center rounded-md border border-transparent px-2 py-0.5 text-base font-medium whitespace-nowrap text-foreground/30"
            >
              {item.title}
            </span>
          )
        }

        return (
          <Link
            key={item.title}
            href={href}
            className={cn(
              "relative inline-flex h-[calc(100%-1px)] items-center rounded-md border border-transparent px-2 py-0.5 text-base font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground",
              "after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity",
              isActive && "after:opacity-100 text-foreground"
            )}
          >
            {item.title}
          </Link>
        )
      })}
    </div>
  )
}
