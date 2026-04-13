import { redirect } from "next/navigation"

const tabToSlug: Record<string, string> = {
  account: "account",
  notifications: "notifications",
  academy: "academy",
  team: "team",
  integrations: "integrations",
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { subdomain } = await params
  const { tab } = await searchParams

  const base = `/${subdomain}/settings`

  if (tab) {
    const slug = tabToSlug[tab.toLowerCase()]
    if (slug) redirect(`${base}/${slug}`)
  }

  redirect(`${base}/account`)
}