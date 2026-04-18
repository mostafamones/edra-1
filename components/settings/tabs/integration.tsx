import { SettingsTabProps } from "@/components/helpers/settings"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export function IntegrationSettings({ disabled: _disabled, academyId: _academyId }: SettingsTabProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Integrations</EmptyTitle>
        <EmptyDescription>
          Connect external tools and services to your academy. More options will appear here as they
          become available.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
