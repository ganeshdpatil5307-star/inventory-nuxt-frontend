/**
 * Thin wrapper around $fetch that:
 *  - prefixes every call with the configured API base URL
 *  - attaches the JWT from the auth store
 *  - normalises FastAPI error payloads into readable messages
 *  - logs the user out on a 401
 */
export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    query?: Record<string, any>
    headers?: Record<string, string>
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string> | undefined)
    }
    if (auth.token) headers.Authorization = `Bearer ${auth.token}`

    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase,
        method: options.method,
        body: options.body as any,
        query: options.query,
        headers
      })
    } catch (error: any) {
      const status = error?.response?.status ?? error?.statusCode
      const data = error?.data ?? error?.response?._data

      if (status === 401 && auth.token) {
        auth.logout()
        await navigateTo('/login')
      }

      throw new Error(extractMessage(data, status))
    }
  }

  function extractMessage(data: any, status?: number): string {
    if (!data) {
      return status
        ? `Request failed (${status})`
        : 'Network error — is the API reachable?'
    }
    const detail = data.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(data.errors) && data.errors.length) {
      return data.errors
        .map((e: any) => {
          const field = Array.isArray(e.loc) ? e.loc.slice(1).join('.') : ''
          return field ? `${field}: ${e.msg}` : e.msg
        })
        .join(', ')
    }
    if (Array.isArray(detail) && detail.length) {
      return detail.map((e: any) => e.msg ?? String(e)).join(', ')
    }
    return typeof data === 'string' ? data : `Request failed (${status ?? 'unknown'})`
  }

  return {
    get: <T>(path: string, query?: Record<string, any>) =>
      request<T>(path, { method: 'GET', query: clean(query) }),
    post: <T>(path: string, body?: any, query?: Record<string, any>) =>
      request<T>(path, { method: 'POST', body, query: clean(query) }),
    put: <T>(path: string, body?: any) => request<T>(path, { method: 'PUT', body }),
    patch: <T>(path: string, body?: any, query?: Record<string, any>) =>
      request<T>(path, { method: 'PATCH', body, query: clean(query) }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' })
  }
}

/** Drop null/undefined/empty-string query params so the API sees clean URLs. */
function clean(query?: Record<string, any>) {
  if (!query) return undefined
  return Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}
