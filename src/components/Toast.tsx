import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from './icons'

type Tone = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  tone: Tone
}

type ToastFn = (message: string, tone?: Tone) => void

const ToastContext = createContext<ToastFn>(() => {})

export function useToast(): ToastFn {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const push = useCallback<ToastFn>((message, tone = 'success') => {
    const id = ++counter.current
    setItems((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, 3400)
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast${item.tone === 'error' ? ' toast-error' : ''}`}>
            <Icon name={item.tone === 'error' ? 'x' : 'checkCircle'} size={17} />
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
