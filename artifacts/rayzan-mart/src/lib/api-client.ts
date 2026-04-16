/**
 * API Client — replaces the Supabase SDK.
 * Wraps all HTTP calls to the Express backend with JWT auth via localStorage.
 */

const API_BASE = "/api";
const TOKEN_KEY = "rm_auth_token";
const USER_KEY = "rm_auth_user";

export type AppRole = "customer" | "affiliate" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed: boolean;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
}

type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";
type AuthChangeCallback = (event: AuthChangeEvent, session: AuthSession | null) => void;

const authChangeListeners: AuthChangeCallback[] = [];

function notifyAuthChange(event: AuthChangeEvent, session: AuthSession | null) {
  authChangeListeners.forEach((cb) => cb(event, session));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
  extraHeaders?: Record<string, string>
): Promise<{ data: T | null; error: { message: string; code?: string } | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: (method !== "GET" && method !== "HEAD" && body != null) ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* empty */ }

    if (!res.ok) {
      return { data: null, error: { message: json?.error || json?.message || text || "Request failed", code: json?.code } };
    }
    return { data: json as T, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err?.message || "Network error" } };
  }
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const auth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const { data, error } = await request<{ session: AuthSession }>("POST", "/auth/login", { email, password });
    if (data?.session) {
      setToken(data.session.access_token);
      notifyAuthChange("SIGNED_IN", data.session);
    }
    return { data, error };
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, any> } }) {
    const { data, error } = await request<{ user: AuthUser; message?: string; affiliate_pending?: boolean }>("POST", "/auth/register", {
      email,
      password,
      name: options?.data?.name,
      phone: options?.data?.phone,
      role: options?.data?.role,
    });
    return { data, error };
  },

  async signOut() {
    await request("POST", "/auth/logout");
    clearToken();
    notifyAuthChange("SIGNED_OUT", null);
    return { error: null };
  },

  async getSession(): Promise<{ data: { session: AuthSession | null }; error: null }> {
    const token = getToken();
    if (!token) return { data: { session: null }, error: null };

    const { data, error } = await request<AuthSession>("GET", "/auth/me");
    if (error || !data) {
      clearToken();
      return { data: { session: null }, error: null };
    }
    return { data: { session: { user: data, access_token: token } }, error: null };
  },

  onAuthStateChange(callback: AuthChangeCallback) {
    authChangeListeners.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe() {
            const idx = authChangeListeners.indexOf(callback);
            if (idx > -1) authChangeListeners.splice(idx, 1);
          },
        },
      },
    };
  },

  async updateUser({ password }: { password: string }) {
    const { data, error } = await request("PUT", "/auth/update-password", { password });
    return { data, error };
  },

  async resetPasswordForEmail(email: string) {
    const { data, error } = await request("POST", "/auth/forgot-password", { email });
    return { data, error };
  },

  async resend({ type, email }: { type: string; email: string }) {
    const { data, error } = await request("POST", "/auth/resend-verification", { email });
    return { data, error };
  },

  // Phone OTP — disabled
  async signInWithOtp(_params: any) {
    return { data: null, error: { message: "Phone OTP is currently disabled." } };
  },

  async verifyOtp(_params: any) {
    return { data: null, error: { message: "Phone OTP is currently disabled." } };
  },

  // MFA — deferred
  mfa: {
    async getAuthenticatorAssuranceLevel() {
      return { data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null };
    },
    async listFactors() {
      return { data: { totp: [] }, error: null };
    },
    async enroll(_params: any) {
      return { data: null, error: { message: "MFA is currently unavailable." } };
    },
    async challenge(_params: any) {
      return { data: null, error: { message: "MFA is currently unavailable." } };
    },
    async verify(_params: any) {
      return { data: null, error: { message: "MFA is currently unavailable." } };
    },
    async unenroll(_params: any) {
      return { data: null, error: { message: "MFA is currently unavailable." } };
    },
  },
};

// ─── Query Builder (mimics supabase.from() chaining) ────────────────────────

class QueryBuilder<T = any> {
  private _table: string;
  private _method = "GET";
  private _filters: Record<string, any> = {};
  private _orFilters: string[] = [];
  private _selectCols = "*";
  private _orderBy: { col: string; asc: boolean }[] = [];
  private _limit: number | null = null;
  private _single = false;
  private _maybeSingle = false;
  private _body: any = null;
  private _upsertConflict: string | null = null;
  private _rangeFilters: Array<{ col: string; op: "gte" | "lte" | "gt" | "lt"; val: any }> = [];
  private _inFilters: Array<{ col: string; vals: any[] }> = [];
  private _notNullFilters: string[] = [];
  private _ilikeFilters: Array<{ col: string; pattern: string }> = [];

  constructor(table: string) {
    this._table = table;
  }

  select(cols = "*") { this._selectCols = cols; return this; }
  insert(data: any) { this._method = "POST"; this._body = data; return this; }
  update(data: any) { this._method = "PUT"; this._body = data; return this; }
  upsert(data: any, opts?: { onConflict?: string }) {
    this._method = "PATCH";
    this._body = data;
    this._upsertConflict = opts?.onConflict || null;
    return this;
  }
  delete() { this._method = "DELETE"; return this; }

  eq(col: string, val: any) { this._filters[col] = val; return this; }
  is(col: string, val: any) { this._filters[`${col}__is`] = val; return this; }
  gte(col: string, val: any) { this._rangeFilters.push({ col, op: "gte", val }); return this; }
  lte(col: string, val: any) { this._rangeFilters.push({ col, op: "lte", val }); return this; }
  gt(col: string, val: any) { this._rangeFilters.push({ col, op: "gt", val }); return this; }
  lt(col: string, val: any) { this._rangeFilters.push({ col, op: "lt", val }); return this; }
  in(col: string, vals: any[]) { this._inFilters.push({ col, vals }); return this; }
  ilike(col: string, pattern: string) { this._ilikeFilters.push({ col, pattern }); return this; }
  not(col: string, op: string, _val: any) {
    if (op === "is") this._notNullFilters.push(col);
    return this;
  }
  or(query: string) { this._orFilters.push(query); return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this._orderBy.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }

  async then(resolve: (val: any) => any, reject?: (err: any) => any): Promise<any> {
    try {
      const result = await this._execute();
      return resolve(result);
    } catch (err) {
      if (reject) return reject(err);
      throw err;
    }
  }

  private async _execute(): Promise<{ data: T | T[] | null; error: any }> {
    const params: Record<string, string> = {};
    if (this._selectCols !== "*") params["_select"] = this._selectCols;
    Object.entries(this._filters).forEach(([k, v]) => {
      params[k] = v === null ? "null" : String(v);
    });
    this._rangeFilters.forEach(({ col, op, val }) => { params[`${col}__${op}`] = String(val); });
    this._inFilters.forEach(({ col, vals }) => { params[`${col}__in`] = vals.join(","); });
    this._notNullFilters.forEach((col) => { params[`${col}__not_null`] = "1"; });
    this._ilikeFilters.forEach(({ col, pattern }) => { params[`${col}__ilike`] = pattern; });
    this._orFilters.forEach((q, i) => { params[`__or_${i}`] = q; });
    if (this._orderBy.length) params["_order"] = this._orderBy.map(o => `${o.col}:${o.asc ? "asc" : "desc"}`).join(",");
    if (this._limit !== null) params["_limit"] = String(this._limit);
    if (this._upsertConflict) params["_conflict"] = this._upsertConflict;

    const qs = new URLSearchParams(params).toString();
    const path = `/db/${this._table}${qs ? "?" + qs : ""}`;

    const { data, error } = await request<any>(this._method, path, this._body);

    if (error) return { data: null, error };

    if (this._single) {
      const arr = Array.isArray(data) ? data : (data ? [data] : []);
      if (arr.length === 0) return { data: null, error: { message: "No rows found", code: "PGRST116" } };
      return { data: arr[0] as T, error: null };
    }
    if (this._maybeSingle) {
      const arr = Array.isArray(data) ? data : (data ? [data] : []);
      return { data: (arr[0] ?? null) as T | null, error: null };
    }
    return { data: data as T[], error: null };
  }
}

// ─── RPC ────────────────────────────────────────────────────────────────────

export async function rpc(fn: string, args: Record<string, any> = {}) {
  return request("POST", `/rpc/${fn}`, args);
}

// ─── Real-time channel stub (no-op — replaced by polling) ───────────────────

export const channel = (_name: string) => ({
  on: (_type: string, _filter: any, _cb: any) => ({ subscribe: () => {} }),
  subscribe: () => {},
});
export const removeChannel = (_ch: any) => {};

// ─── Main export (mimics the supabase client) ────────────────────────────────

const apiClient = {
  auth,
  from: <T = any>(table: string) => new QueryBuilder<T>(table),
  rpc,
  channel,
  removeChannel,
};

export default apiClient;
