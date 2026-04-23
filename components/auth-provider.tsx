"use client"

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { User, Session } from "@supabase/supabase-js"
import { IconSchool } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { useAcademy, type AcademyWithMeta } from "@/lib/hooks/use-data"
import { cn } from "@/lib/utils"
import type { MembershipRole } from "@/lib/constants/roles"

// ── Types ─────────────────────────────────────────────────────────────────────

export type AcademyEntry = {
  id: string
  name: string
  slug: string
  icon: string | null
  role: MembershipRole
}

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  // Academy list
  academies: AcademyEntry[]
  activeAcademy: AcademyEntry | null
  setActiveAcademy: (academy: AcademyEntry) => void
  academiesLoading: boolean
  // Full cached academy details
  academyDetails: AcademyWithMeta | null
  academyDetailsLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  academies: [],
  activeAcademy: null,
  setActiveAcademy: () => {},
  academiesLoading: false,
  academyDetails: null,
  academyDetailsLoading: false,
})

// ── Constants ─────────────────────────────────────────────────────────────────

const LAST_ACADEMY_KEY = "edra_last_academy_id"

const isPublicRoute = (path: string) =>
  path === "/login" || path === "/signup" || path === "/" || path === "/onboarding"

// ── Inner provider (manages gating and UI) ───────────────────────────────────

function AuthProviderInner({
  children,
  user,
  session,
  loading,
  progress,
  showFancyLoader,
  academies,
  activeAcademy,
  setActiveAcademy,
  academiesLoading,
}: {
  children: React.ReactNode
  user: User | null
  session: Session | null
  loading: boolean
  progress: number
  showFancyLoader: boolean
  academies: AcademyEntry[]
  activeAcademy: AcademyEntry | null
  setActiveAcademy: (a: AcademyEntry) => void
  academiesLoading: boolean
}) {
  const pathname = usePathname()

  // Cached academy details
  const {
    data: academyDetails,
    loading: academyDetailsLoading,
  } = useAcademy(activeAcademy?.id ?? null)

  // Determine gating states
  const academyResolved = !academiesLoading && (activeAcademy !== null || academies.length === 0)
  const isProtected = !isPublicRoute(pathname)
  const isAuthWaiting = loading || (isProtected && !academyResolved)

  // Show loader overlay ONLY if threshold is passed
  const shouldRenderLoader = isAuthWaiting && showFancyLoader

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        academies,
        activeAcademy,
        setActiveAcademy,
        academiesLoading,
        academyDetails: academyDetails ?? null,
        academyDetailsLoading,
      }}
    >
      <AnimatePresence mode="wait">
        {shouldRenderLoader ? (
          <motion.div
            key="auth-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-screen w-screen items-center justify-center gap-4 bg-background fixed inset-0 z-50"
          >
            <div className="flex flex-col items-center gap-2 self-center font-medium">
              <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-md animate-pulse">
                <IconSchool className="size-5" />
              </div>
              <h1 className="text-2xl font-semibold animate-pulse">Edra Academy</h1>
            </div>
            <div className="transition-all duration-1000 ease-out">
              <Progress value={progress} className="w-[400px] h-0.5 rounded-full bg-muted" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Plain div (not motion): filter/transform on an ancestor breaks `position: fixed` for the app sidebar. */}
      <div
        className={cn(
          "min-h-screen w-full flex flex-col transition-opacity duration-500 ease-out",
          isAuthWaiting && isProtected ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        {children}
      </div>
    </AuthContext.Provider>
  )
}

// ── Root provider (auth & academy state) ───────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(13)
  const [showFancyLoader, setShowFancyLoader] = useState(false)

  const [academies, setAcademies] = useState<AcademyEntry[]>([])
  const [activeAcademy, setActiveAcademyState] = useState<AcademyEntry | null>(null)
  const [academiesLoading, setAcademiesLoading] = useState(false)

  const initialized = useRef(false)
  const fetchLock = useRef(false)

  // Fancy loader delay threshold (prevent flashes on fast data)
  useEffect(() => {
    if (!loading && !academiesLoading) { setShowFancyLoader(false); return }
    const t = setTimeout(() => setShowFancyLoader(true), 800)
    return () => clearTimeout(t)
  }, [loading, academiesLoading])

  // Progress simulation
  useEffect(() => {
    if (!loading && !academiesLoading) { setProgress(100); return }
    const t = setInterval(() => {
      setProgress((p) => p >= 90 ? p : Math.min(p + Math.random() * 10 + 2, 90))
    }, 250)
    return () => clearInterval(t)
  }, [loading, academiesLoading])

  // Load academies via path-aware logic
  const loadAcademies = useCallback(async () => {
    if (fetchLock.current) return
    fetchLock.current = true
    
    setAcademiesLoading(true)
    try {
      const res = await fetch("/api/academy/me")
      const json = res.ok ? await res.json() : { academies: [] }
      const entries: AcademyEntry[] = json.academies ?? []
      setAcademies(entries)

      // ── Resolve active academy ─────────────────────────────────────────────
      // Order of preference: 
      // 1. Path parameter [slug] (if we are in a slug route)
      // 2. localStorage last-used
      // 3. First entry in list
      
      const pathSlug = params?.slug as string | undefined
      const fromUrl = entries.find(e => e.slug === pathSlug)
      
      const fromLastUsed = (() => {
        try {
          const id = localStorage.getItem(LAST_ACADEMY_KEY)
          return entries.find(e => e.id === id)
        } catch { return null }
      })()

      const preferred = fromUrl ?? fromLastUsed ?? entries[0] ?? null
      setActiveAcademyState(preferred)
      if (preferred) try { localStorage.setItem(LAST_ACADEMY_KEY, preferred.id) } catch { /* ignore */ }

      // ── Access Control & Auto Redirections ───────────────────────────────────
      if (!isPublicRoute(pathname)) {
        if (entries.length === 0) {
          // Rule 1: No academies at all? Back to root "/"
          router.push("/")
          return
        }

        const parts = pathname.split('/').filter(Boolean)
        const currentPathSlug = parts[0]
        
        // Rule 2: Accessing an academy they don't belong to?
        // If current path starts with a subdomain that doesn't match any of their entries.
        const matchesAnyOfMine = entries.some(e => e.slug === currentPathSlug)
        
        if (!matchesAnyOfMine && preferred) {
          // Protect them by redirecting to their own active dashboard
          router.push(`/${preferred.slug}/dashboard`)
        }
      }
    } catch (err) {
      console.error("Failed to load academies:", err)
    } finally {
      setAcademiesLoading(false)
      fetchLock.current = false
    }
  }, [pathname, params?.slug, router])

  // Auth state
  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (!initialized.current) {
          initialized.current = true
          if (!session && !isPublicRoute(pathname)) {
            router.push("/login")
          } else if (session) {
            loadAcademies()
          }
        }
      } catch (err) {
        console.error("Auth init failed:", err)
        if (mounted) setLoading(false)
      }
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (event === "SIGNED_OUT") {
        setAcademies([])
        setActiveAcademyState(null)
        if (!isPublicRoute(pathname)) router.push("/login")
        setLoading(false)
        return
      }
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session && academies.length === 0) {
        loadAcademies()
      }
      setLoading(false)
    })
    return () => { mounted = false; subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academies.length])

  // Switching academy: uses standard router.push with the new path
  const setActiveAcademy = useCallback((academy: AcademyEntry) => {
    setActiveAcademyState(academy)
    try { localStorage.setItem(LAST_ACADEMY_KEY, academy.id) } catch { /* ignore */ }
    router.push(`/${academy.slug}/dashboard`)
  }, [router])

  return (
    <AuthProviderInner
      user={user}
      session={session}
      loading={loading}
      progress={progress}
      showFancyLoader={showFancyLoader}
      academies={academies}
      activeAcademy={activeAcademy}
      setActiveAcademy={setActiveAcademy}
      academiesLoading={academiesLoading}
    >
      {children}
    </AuthProviderInner>
  )
}

export const useAuth = () => useContext(AuthContext)
