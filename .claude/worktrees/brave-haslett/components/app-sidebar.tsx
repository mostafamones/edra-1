"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { AcademySwitcher } from "@/components/academy-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { MainSidebarData, SecondarySidebarData, SidebarNotes } from "@/components/helpers/sidebar"
import { useAuth } from "./auth-provider"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const userEmail = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AcademySwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={MainSidebarData} />
        <NavDocuments items={SidebarNotes} />
        <NavSecondary items={SecondarySidebarData} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: userName, email: userEmail, avatar: avatarUrl }} />
      </SidebarFooter>
    </Sidebar>
  )
}
