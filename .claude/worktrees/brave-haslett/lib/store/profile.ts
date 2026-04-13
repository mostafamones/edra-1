import { create } from 'zustand'

export interface ProfileData {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  original_avatar_path: string | null
  role: string
  is_active: boolean | null
}

interface ProfileStore {
  profile: ProfileData | null
  loading: boolean
  error: string | null
  setProfile: (profile: ProfileData | null) => void
  fetchProfile: (force?: boolean) => Promise<void>
  updateProfile: (data: Partial<ProfileData>) => void
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  setProfile: (profile) => set({ profile }),
  fetchProfile: async (force = false) => {
    // If we already have a profile and we're not forcing, don't fetch
    if (get().profile && !force) return

    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        set({ profile: data, loading: false })
      } else {
        throw new Error('Failed to load profile')
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Error loading profile:', error)
    }
  },
  updateProfile: (data) => {
    const current = get().profile
    if (current) {
      set({ profile: { ...current, ...data } })
    }
  }
}))
