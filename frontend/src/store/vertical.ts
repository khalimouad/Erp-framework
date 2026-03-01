import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vertical } from '@/types'

interface VerticalState {
  vertical: Vertical
  setVertical: (v: Vertical) => void
}

export const useVerticalStore = create<VerticalState>()(
  persist(
    (set) => ({
      vertical: 'general',
      setVertical: (v) => set({ vertical: v }),
    }),
    { name: 'erp-vertical' },
  ),
)
