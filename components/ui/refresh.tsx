import { Button } from "@/components/ui/button"
import { IconRefresh } from "@tabler/icons-react"

export function Refresh({ func, variant = "outline" }: { func: () => void, variant?: "outline" | "ghost" }) {
  return (
    <Button
      variant={variant}
      onClick={func}
      size="icon"
    >
      <IconRefresh className="size-4" />
    </Button>
  )
}