import { useState } from 'react'

export interface EditFormHandle<T> {
  open: boolean
  editing: T | null
  formData: Record<string, unknown>
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  openNew: (defaults?: Record<string, unknown>) => void
  openEdit: (row: T) => void
  close: () => void
}

export function useEditForm<T>(): EditFormHandle<T> {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  return {
    open,
    editing,
    formData,
    setFormData,
    openNew: (defaults = {}) => { setEditing(null); setFormData(defaults); setOpen(true) },
    openEdit: (row) => { setEditing(row); setFormData({ ...(row as Record<string, unknown>) }); setOpen(true) },
    close: () => { setOpen(false); setEditing(null); setFormData({}) },
  }
}
