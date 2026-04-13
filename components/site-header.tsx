import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/theme-switch"
import { Button } from "./ui/button"
import { IconArrowLeft, IconChevronRight, IconLoader2 } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb"

export type BreadcrumbItem = {
  label: string
  href?: string
  onClick?: () => void
}

type SiteHeaderProps = {
  title?: React.ReactNode
  variant?: 'default' | 'mini' | 'transparent'
  trigger?: boolean
  actions?: React.ReactNode
  subtitle?: React.ReactNode
  tabs?: React.ReactNode
  back?: () => void
  breadcrumb?: BreadcrumbItem[]
  loading?: boolean
  className?: string
  separator?: boolean
}

export function SiteHeader({
  title,
  variant = "default",
  trigger = true,
  actions,
  subtitle,
  tabs,
  back,
  breadcrumb,
  loading = false,
  className,
  separator = false,
}: SiteHeaderProps) {
  return (
    <header className={cn(
      "flex h-16 shrink-0 items-center justify-between gap-2 py-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16",
      separator && "border-b", className
    )}>
      <div className="flex w-full justify-between items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {trigger && <SidebarTrigger className="" iconClass="size-4.5" />}
        <Separator
          orientation="vertical"
          className={`mx-2 data-[orientation=vertical]:h-8 ${back ? "mr-0" : "mr-3"}`}
        />
        <div className="flex font-[Outfit] gap-2 items-center">
          {back && <>
            <Button size="icon-sm" variant="ghost" onClick={back}>
              <IconArrowLeft className="size-4" />
            </Button>
          </>}

          {/* Breadcrumb */}
          {breadcrumb && breadcrumb.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumb.map((item, index) => (
                  <div className="flex items-center gap-1.5" key={index}>
                    <BreadcrumbItem>
                      {index === breadcrumb.length - 1 ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumb.length - 1 && <BreadcrumbSeparator />}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}

          {/* Title and Subtitle */}
          {!breadcrumb && <div className={cn("flex flex-col", breadcrumb && "ml-2")}>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-medium">{title}</h1>
              {loading && <IconLoader2 className="size-4 animate-spin text-muted-foreground" />}
            </div>
            {subtitle && <h2 className="text-sm text-muted-foreground -mt-1">{subtitle}</h2>}
          </div>}
        </div>

        <div className="ml-auto flex gap-2">
          {tabs && <div className="flex items-center p-1 gap-3 bg-card rounded-xl drop-shadow-md">
            {tabs}
          </div>}
          <div className={cn(
            "flex items-center p-1 bg-card rounded-xl drop-shadow-md",
            !tabs && "ml-auto"
          )}>
            {/* ModeToggle hidden – dark mode forced globally */}
            {actions}
          </div>
        </div>
      </div>
    </header>
  )
}
