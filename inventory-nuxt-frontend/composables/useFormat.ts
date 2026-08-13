export function useFormat() {
  const currency = (value: string | number | null | undefined, code = 'USD') => {
    const n = Number(value ?? 0)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2
    }).format(Number.isFinite(n) ? n : 0)
  }

  const number = (value: string | number | null | undefined) =>
    new Intl.NumberFormat('en-US').format(Number(value ?? 0))

  const datetime = (value: string | null | undefined) => {
    if (!value) return '—'
    const d = new Date(value)
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
  }

  return { currency, number, datetime }
}
