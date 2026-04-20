import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbNavItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb"

export type SiteHeaderCrumb = {
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
  breadcrumb?: SiteHeaderCrumb[]
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
      "flex h-(--header-height) w-full items-center gap-2 border-b border-border mb-6", separator && "border-b", className
    )}>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        {trigger && (
          <>
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className={`mx-2 data-[orientation=vertical]:h-10 ${back ? "mr-0" : "mr-3"}`}
            />
          </>
        )}
        
        <div className="flex min-w-0 font-[Outfit] gap-2 items-center">
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
                    <BreadcrumbNavItem>
                      {index === breadcrumb.length - 1 ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbNavItem>
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

        {(tabs || actions) && (
          <div className="ml-auto flex gap-2">
            {tabs && <div className="flex items-center p-1 gap-3 bg-card rounded-xl drop-shadow-md">
              {tabs}
            </div>}
            {actions && (
              <div className={cn(
                "flex items-center p-1 bg-card rounded-xl drop-shadow-md",
                !tabs && "ml-auto"
              )}>
                {/* ModeToggle hidden – dark mode forced globally */}
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
