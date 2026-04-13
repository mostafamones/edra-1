"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { withAcademyPath } from "@/components/helpers/sidebar"

const subNavItems = [
  { title: "General", slug: "/settings/academy" },
  { title: "Structure", slug: "/settings/academy/structure" },
  { title: "Form", slug: "/settings/academy/form" },
]

export function AcademySubNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-fit w-44 shrink-0">
      {subNavItems.map((item) => {
        const href = withAcademyPath(pathname, item.slug)
        // "General" uses exact match to avoid matching structure/form paths
        const isActive =
          item.slug === "/settings/academy"
            ? pathname === href
            : pathname.startsWith(href)

        return (
          <Link
            key={item.title}
            href={href}
            className={cn(
              "relative w-full inline-flex justify-start items-center rounded-md border border-transparent px-3 py-1.5 text-base font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground",
              "after:absolute after:inset-y-0 after:-right-1 after:w-0.5 after:bg-foreground after:opacity-0 after:transition-opacity",
              isActive && "bg-card text-foreground"
            )}
          >
            {item.title}
          </Link>
        )
      })}
    </div>
  )
}
