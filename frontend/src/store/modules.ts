import { create } from 'zustand'
import { baseApi } from '@/api/client'

export interface Module {
  id: number
  name: string
  label: string
  description: string | null
  version: string
  category: string
  state: 'installed' | 'uninstalled' | 'to_install' | 'to_upgrade'
  depends: string[]
  auto_install: boolean
  installed_at: string | null
}

interface ModulesState {
  modules: Module[]
  loading: boolean
  fetchModules: () => Promise<void>
  installModule: (name: string) => Promise<void>
  uninstallModule: (name: string) => Promise<void>
  isInstalled: (name: string) => boolean
}

export const useModulesStore = create<ModulesState>((set, get) => ({
  modules: [],
  loading: false,

  fetchModules: async () => {
    set({ loading: true })
    try {
      const res = await baseApi.listModules()
      set({ modules: res.data })
    } finally {
      set({ loading: false })
    }
  },

  installModule: async (name: string) => {
    await baseApi.installModule(name)
    // Refresh list to reflect new state
    await get().fetchModules()
  },

  uninstallModule: async (name: string) => {
    await baseApi.uninstallModule(name)
    await get().fetchModules()
  },

  isInstalled: (name: string) => {
    const mod = get().modules.find(m => m.name === name)
    return mod?.state === 'installed'
  },
}))
