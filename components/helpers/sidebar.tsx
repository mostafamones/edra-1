import {
  IconUserCircle,
  IconCreditCard,
  IconNotification,
  IconUsersGroup,
  IconListCheck,
  IconDashboard,
  IconCalendar,
  IconClockRecord,
  IconReport,
  IconUser,
  IconSettings
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

export const UserDropdown = {
  items: [
    {
      title: "Account",
      url: "#",
      icon: IconUserCircle
    },
    {
      title: "Billing",
      url: "#",
      icon: IconCreditCard
    },
    {
      title: "Notifications",
      url: "#",
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
