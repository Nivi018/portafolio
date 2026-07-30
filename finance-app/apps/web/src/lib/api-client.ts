export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

type ApiEnvelope<T> = { data: T }

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response

  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiClientError('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.', 0)
  }

  if (response.status === 204) return undefined as T

  const payload = (await response.json().catch(() => ({}))) as
    | ApiEnvelope<T>
    | { error?: string }

  if (!response.ok) {
    const fallbackMessage = response.status === 401
      ? 'Tu sesión venció. Inicia sesión de nuevo para continuar.'
      : response.status === 403
        ? 'No tienes permiso para realizar esta acción.'
        : response.status === 429
          ? 'Hiciste varias solicitudes seguidas. Espera un momento e inténtalo de nuevo.'
          : response.status >= 500
            ? 'Tuvimos un problema temporal. Inténtalo de nuevo en unos segundos.'
            : 'Revisa los datos e inténtalo de nuevo.'

    throw new ApiClientError(
      'error' in payload && payload.error ? payload.error : fallbackMessage,
      response.status
    )
  }

  return (payload as ApiEnvelope<T>).data
}
