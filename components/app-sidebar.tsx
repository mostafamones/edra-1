"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconDashboard, IconListDetails, IconChartBar, IconFolder, IconUsers, IconCamera, IconFileDescription, IconFileAi, IconSettings, IconHelp, IconSearch, IconDatabase, IconReport, IconFileWord, IconInnerShadowTop } from "@tabler/icons-react"
import { MainSidebarData, SecondarySidebarData, SidebarNotes } from "@/components/helpers/sidebar"
import { useAuth } from "./auth-provider"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: (
        <IconDashboard
        />
      ),
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: (
        <IconListDetails
        />
      ),
    },
    {
      title: "Analytics",
      url: "#",
      icon: (
        <IconChartBar
        />
      ),
    },
    {
      title: "Projects",
      url: "#",
      icon: (
        <IconFolder
        />
      ),
    },
    {
      title: "Team",
      url: "#",
      icon: (
        <IconUsers
        />
      ),
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: (
        <IconCamera />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: (
        <IconFileDescription />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <IconFileAi />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: (
        <IconSettings />
      ),
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <IconHelp />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <IconSearch />
      ),
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: (
        <IconDatabase />
      ),
    },
    {
      name: "Reports",
      url: "#",
      icon: (
        <IconReport />
      ),
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: (
        <IconFileWord />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const userEmail = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! "
            >
              <div>
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-bold">Edra Academy</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
