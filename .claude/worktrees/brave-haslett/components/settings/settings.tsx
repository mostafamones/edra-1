import { SettingsTabs } from "./settings-tabs";

export function SettingsWrapper({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-4">
      <SettingsTabs defaultValue={defaultValue} />
    </div>
  )
}