"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tabs } from "@/components/helpers/settings"
import { resolveAcademyBasePath } from "@/components/helpers/sidebar"
import { useAuth } from "@/components/auth-provider"

export function SettingsTabs({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { activeAcademy } = useAuth()

  const [activeTab, setActiveTab] = useState<string>(() => {
    const currentTab = searchParams.get("tab")
    const matchedTab = currentTab
      ? tabs.find(t => t.title.toLowerCase() === currentTab.toLowerCase()) || tabs[0]
      : defaultValue
        ? tabs.find(t => t.title.toLowerCase() === defaultValue.toLowerCase()) || tabs[0]
        : tabs[0]

    return matchedTab.title
  })

  const academyId = activeAcademy?.id ?? null

  useEffect(() => {
    const currentTab = searchParams.get("tab")
    if (currentTab) {
      const matched = tabs.find(t => t.title.toLowerCase() === currentTab.toLowerCase())
      if (matched) {
        setActiveTab(matched.title)
      }

      const params = new URLSearchParams(searchParams.toString())
      params.delete("tab")
      const academyBase = resolveAcademyBasePath(pathname)
      router.replace(
        `${academyBase}/settings${params.toString() ? `?${params.toString()}` : ""}`,
        { scroll: false }
      )
    }
  }, [pathname, searchParams, router])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-4xl mx-auto px-10 lg:px-12">
      <TabsList variant={"line"}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.title} value={tab.title} disabled={tab.disabled} className="text-base px-2">
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.title} value={tab.title}>
          {academyId ? tab.content?.({ disabled: false, academyId }) : null}
        </TabsContent>
      ))}
    </Tabs>
  )
}