import { Button } from "@/components/ui/button"
import { IconRefresh } from "@tabler/icons-react"

export function Refresh({
  func,
  variant = "outline",
  size = "icon",
}: {
  func: () => void
  variant?: "outline" | "ghost"
  size?: "icon" | "icon-sm"
}) {
  return (
    <Button
      variant={variant}
      onClick={func}
      size={size}
      aria-label="Refresh"
      title="Refresh"
    >
      <IconRefresh className="size-4" />
    </Button>
  )
}