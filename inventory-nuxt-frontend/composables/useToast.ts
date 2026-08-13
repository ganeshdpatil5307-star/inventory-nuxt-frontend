export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let counter = 0

export function useToast() {
  function push(message: string, type: Toast['type'] = 'info', timeout = 4000) {
    const id = ++counter
    toasts.value.push({ id, message, type })
    if (import.meta.client) {
      setTimeout(() => dismiss(id), timeout)
    }
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    dismiss,
    success: (m: string) => push(m, 'success'),
    error: (m: string) => push(m, 'error'),
    info: (m: string) => push(m, 'info')
  }
}
