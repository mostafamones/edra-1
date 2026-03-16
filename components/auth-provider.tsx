"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { User, Session } from "@supabase/supabase-js"
import { IconSchool } from "@tabler/icons-react"
import { Progress } from "./ui/progress"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

const isPublicRoute = (path: string) => {
  return path === "/login" || path === "/signup" || path === "/" || path === "/create"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(13)
  const [showProgress, setShowProgress] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowProgress(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!loading) {
      setProgress(100)
      return
    }

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) return oldProgress
        const diff = Math.random() * 10 + 5
        return Math.min(oldProgress + diff, 90)
      })
    }, 200)

    return () => clearInterval(timer)
  }, [loading])

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)

          // Redirect if no session on protected route (only on initial load)
          if (!initialized.current) {
            initialized.current = true
            if (!session && !isPublicRoute(pathname) && pathname !== "/create") {
              router.push("/login")
            } else if (!session && pathname === "/create") {
              // Special case for create page: it can load outside the auth provider initially 
              // but will eventually need auth to proceed.
              // For a better UX, redirect them quietly slightly later or let the Stepper handle it on Create click.
              // For now, redirect in the background:
              setTimeout(() => {
                if (!supabase.auth.getSession()) {
                  router.push("/login")
                }
              }, 2000)
            }
          }
        }
      } catch (error) {
        console.error("Error checking session:", error)
        if (mounted) setLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)

        // Handle sign out - redirect immediately
        if (event === "SIGNED_OUT") {
          if (!isPublicRoute(pathname)) {
            router.push("/login")
          }
          setLoading(false)
          return
        }

        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      <AnimatePresence mode="wait">
        {loading && !isPublicRoute(pathname) ? (
          <motion.div
            key="auth-loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(4px)", scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-screen w-screen items-center justify-center gap-4 bg-background fixed inset-0 z-50"
          >
            <div className="flex flex-col items-center gap-2 self-center font-medium transition-all duration-700 ease-in-out"
              style={{ transform: showProgress ? 'translateY(-20px)' : 'translateY(0)' }}>
              <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-md animate-pulse">
                <IconSchool className="size-5" />
              </div>
              <h1 className="text-2xl font-semibold animate-pulse">Edra Academy</h1>
            </div>

            <div
              className={cn(
                "transition-all duration-1000 ease-out",
                showProgress ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              )}
            >
              <Progress value={progress} className="w-[400px] h-0.5 rounded-full bg-muted" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="auth-content"
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className="min-h-screen w-full flex flex-col"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
