/**
 * Cliente HTTP de Supabase usando la API REST (PostgREST)
 * Se usa como fallback cuando la conexión directa a PostgreSQL no está disponible
 * (por ejemplo, en redes que no soportan IPv6)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

class SupabaseClient {
  private url: string;
  private key: string;

  constructor() {
    this.url = SUPABASE_URL;
    this.key = SUPABASE_KEY;

    if (!this.url || !this.key) {
      console.warn(
        "⚠️ Supabase no configurado. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
  }

  private async request<T>(
    table: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const url = `${this.url}/rest/v1/${table}`;

    const response = await fetch(url, {
      method,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Métodos helper
  from<T = Record<string, unknown>>(table: string) {
    return {
      select: (columns = "*") =>
        this.request<T[]>(`${table}?select=${columns}`),
      insert: (data: Partial<T> | Partial<T>[]) =>
        this.request<T[]>(table, {
          method: "POST",
          body: Array.isArray(data) ? data : [data],
        }),
      update: (data: Partial<T>) =>
        this.request<T[]>(table, {
          method: "PATCH",
          body: data,
        }),
      delete: () =>
        this.request<T[]>(table, {
          method: "DELETE",
        }),
    };
  }
}

export const supabase = new SupabaseClient();
