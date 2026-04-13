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
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params
  const { tab } = await searchParams

  const base = `/${slug}/settings`

  if (tab) {
    const slug = tabToSlug[tab.toLowerCase()]
    if (slug) redirect(`${base}/${slug}`)
  }

  redirect(`${base}/account`)
}