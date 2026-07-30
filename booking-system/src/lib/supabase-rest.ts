/**
 * Cliente de Supabase para usar la API REST (PostgREST) en lugar de PostgreSQL directo.
 *
 * Esto es útil cuando:
 * - La red local no soporta IPv6 (Supabase expone PostgreSQL por IPv6)
 * - No quieres pagar el IPv4 add-on de Supabase
 * - Quieres desplegar en plataformas que solo tienen IPv4
 *
 * La API REST de Supabase es una capa sobre PostgreSQL que expone
 * las tablas como endpoints HTTP.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

interface QueryOptions {
  select?: string;
  eq?: Record<string, unknown>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  single?: boolean;
}

class SupabaseRestClient {
  private url: string;
  private key: string;

  constructor() {
    this.url = SUPABASE_URL;
    this.key = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!this.url || !this.key) {
      throw new Error(
        "Supabase no configurado. Verifica NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env"
      );
    }
  }

  private buildQuery(table: string, options: QueryOptions = {}): string {
    const params = new URLSearchParams();

    if (options.select) {
      params.append("select", options.select);
    }

    if (options.eq) {
      for (const [key, value] of Object.entries(options.eq)) {
        params.append(key, `eq.${value}`);
      }
    }

    if (options.order) {
      const dir = options.order.ascending === false ? "desc" : "asc";
      params.append("order", `${options.order.column}.${dir}`);
    }

    if (options.limit) {
      params.append("limit", options.limit.toString());
    }

    const queryString = params.toString();
    return `${this.url}/rest/v1/${table}${queryString ? `?${queryString}` : ""}`;
  }

  async findMany<T = Record<string, unknown>>(
    table: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const url = this.buildQuery(table, options);
    const response = await fetch(url, {
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase findMany error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async findUnique<T = Record<string, unknown>>(
    table: string,
    column: string,
    value: unknown
  ): Promise<T | null> {
    const results = await this.findMany<T>(table, { eq: { [column]: value } });
    return results[0] || null;
  }

  async create<T = Record<string, unknown>>(
    table: string,
    data: Partial<T>
  ): Promise<T> {
    const response = await fetch(`${this.url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase create error: ${response.status} - ${error}`);
    }

    const results = await response.json();
    return results[0];
  }

  async update<T = Record<string, unknown>>(
    table: string,
    column: string,
    value: unknown,
    data: Partial<T>
  ): Promise<T> {
    const url = `${this.url}/rest/v1/${table}?${column}=eq.${value}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase update error: ${response.status} - ${error}`);
    }

    const results = await response.json();
    return results[0];
  }

  async delete(table: string, column: string, value: unknown): Promise<void> {
    const url = `${this.url}/rest/v1/${table}?${column}=eq.${value}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase delete error: ${response.status} - ${error}`);
    }
  }
}

let supabaseClient: SupabaseRestClient | null = null;

export function getSupabaseClient(): SupabaseRestClient {
  if (!supabaseClient) {
    supabaseClient = new SupabaseRestClient();
  }
  return supabaseClient;
}
