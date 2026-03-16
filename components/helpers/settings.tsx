import {
  AcademySettings,
  AccountSettings,
  IntegerationSettings,
  NotificationsSettings,
  TeamSettings
} from "@/components/settings/tabs"

export type SettingsTabProps = {
  disabled: boolean
  academyId: string
}

export const tabs = [
  {
    title: "Account",
    url: "/settings?tab=account",
    content: ({ ...props }: SettingsTabProps) => {
      return (
        <AccountSettings {...props} />
      )
    }
  },
  {
    title: "Notifications",
    url: "/settings?tab=notifications",
    content: ({ ...props }: SettingsTabProps) => {
      return (
        <NotificationsSettings {...props} />
      )
    },
    disabled: true
  },
  {
    title: "Academy",
    url: "/settings?tab=academy",
    content: ({ ...props }: SettingsTabProps) => {
      return (
        <AcademySettings {...props} />
      )
    }
  },
  {
    title: "Team",
    url: "/settings?tab=team",
    content: ({ ...props }: SettingsTabProps) => {
      return (
        <TeamSettings {...props} />
      )
    }
  },
  {
    title: "Integrations",
    url: "/settings?tab=integrations",
    content: ({ ...props }: SettingsTabProps) => {
      return (
        <IntegerationSettings {...props} />
      )
    }
  },
]