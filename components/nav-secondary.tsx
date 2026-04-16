"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { withAcademyPath } from "@/components/helpers/sidebar"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Kbd } from "./ui/kbd"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  const { open } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>

          {/* {open && (
            <Card className="border-1 mb-5 bg-radial-[at_25%_75%] from-primary/30 to-sidebar pb-20">
            <CardHeader>
              <CardTitle>Command Center</CardTitle>
              <CardAction>
                <Badge variant="outline">New</Badge>
                </CardAction>
                <CardDescription className="text-xs">Try the new command center by using <Kbd>⌘ K</Kbd></CardDescription>
              </CardHeader>
            </Card>
          )} */}

          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={withAcademyPath(pathname, item.url)}>
                  {item.icon}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
