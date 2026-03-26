import {
  IconUserCircle,
  IconNotification,
  IconUsersGroup,
  IconListCheck,
  IconDashboard,
  IconCalendar,
  IconClockRecord,
  IconReport,
  IconUser,
  IconSettings,
  IconUserPlus
} from "@tabler/icons-react";

export const MainSidebarData = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <IconDashboard />,
  },
  {
    title: "Students",
    url: "/students",
    icon: <IconUsersGroup />,
  },
  {
    title: "Schedules",
    url: "/schedules",
    icon: <IconCalendar />,
  },
  {
    title: "Sessions",
    url: "/sessions",
    icon: <IconClockRecord />,
  },
  {
    title: "Assignments",
    url: "/assignments",
    icon: <IconListCheck />,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: <IconReport />,
  }
]

export const SidebarNotes = [
  {
    name: "Mostafa Mones",
    url: "#",
    icon: <IconUser />,
  },
  {
    name: "Sec 2 - Lesson 3",
    url: "#",
    icon: <IconReport />,
  },
  {
    name: "Ezzeldin",
    url: "#",
    icon: <IconUser />,
  },
]

export const QuickCreateData = [
  {
    title: "Student",
    url: "/students/create",
    icon: <IconUserPlus />,
  },
  {
    title: "Session",
    url: "/sessions/create",
    icon: <IconClockRecord />,
  },
  {
    title: "Schedule",
    url: "/schedules/create",
    icon: <IconCalendar />,
  },
  {
    title: "Assignment",
    url: "/assignments/create",
    icon: <IconListCheck />,
  },
]

const RESERVED_ROUTE_PREFIXES = new Set(["login", "signup", "create"])

export function resolveAcademyBasePath(pathname: string): string {
  const [first] = pathname.split("/").filter(Boolean)
  if (!first || RESERVED_ROUTE_PREFIXES.has(first)) return ""
  return `/${first}`
}

export function withAcademyPath(pathname: string, url: string): string {
  if (!url || url.startsWith("#") || /^https?:\/\//.test(url)) return url

  const academyBase = resolveAcademyBasePath(pathname)
  if (!academyBase) return url.startsWith("/") ? url : `/${url}`

  if (url.startsWith("/")) return `${academyBase}${url}`
  return `${academyBase}/${url}`
}

export const UserDropdown = {
  items: [
    {
      title: "Account",
      url: "/settings?tab=account",
      icon: IconUserCircle
    },
    {
      title: "Notifications",
      url: "/settings?tab=notifications",
      icon: IconNotification
    },
  ],
}

export const SecondarySidebarData = [
  {
    title: "Settings",
    url: "/settings",
    icon: (
      <IconSettings />
    ),
  }
]
