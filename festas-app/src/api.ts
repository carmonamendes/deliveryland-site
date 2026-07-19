import type {
  Catalogo,
  ReservaCriada,
  Reserva,
  KitAdmin,
  ConfigNegocio,
  Dashboard,
} from './types';

const API_BASE = (
  window.__FESTAS_API__ ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:3333'
).replace(/\/$/, '');

const TOKEN_KEY = 'festas_admin_token';

export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY) || '',
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  isLogged: () => !!localStorage.getItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, useAuth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.headers) Object.assign(headers, options.headers);
  if (useAuth) {
    const t = auth.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* resposta sem corpo */
  }

  if (!res.ok || (data && data.ok === false)) {
    if (res.status === 401 && useAuth) auth.clear();
    throw new ApiError((data && data.erro) || `Erro ${res.status}`, res.status);
  }
  return data as T;
}

export const isApiConfigured = () => !/SUA_API|localhost/.test(API_BASE);

// ── Público ────────────────────────────────────────────────────
export const getCatalogo = () => request<Catalogo>('/catalogo');

export const criarReserva = (payload: Record<string, unknown>) =>
  request<ReservaCriada>('/reservas', { method: 'POST', body: JSON.stringify(payload) });

// ── Admin ──────────────────────────────────────────────────────
export const login = (email: string, senha: string) =>
  request<{ token: string; admin: { email: string; nome: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });

export const getDashboard = () => request<Dashboard>('/admin/dashboard', {}, true);

export const listarKits = () => request<{ kits: KitAdmin[] }>('/admin/kits', {}, true);
export const criarKit = (kit: Record<string, unknown>) =>
  request<{ kit: KitAdmin }>('/admin/kits', { method: 'POST', body: JSON.stringify(kit) }, true);
export const atualizarKit = (id: number, kit: Record<string, unknown>) =>
  request<{ kit: KitAdmin }>(`/admin/kits/${id}`, { method: 'PATCH', body: JSON.stringify(kit) }, true);
export const excluirKit = (id: number) =>
  request<{ ok: boolean }>(`/admin/kits/${id}`, { method: 'DELETE' }, true);

export const listarReservas = (status?: string) =>
  request<{ reservas: Reserva[] }>(`/admin/reservas${status && status !== 'TODAS' ? `?status=${status}` : ''}`, {}, true);
export const confirmarReserva = (id: string) =>
  request<{ status: string }>(`/admin/reservas/${id}/confirmar`, { method: 'POST' }, true);
export const cancelarReserva = (id: string) =>
  request<{ status: string }>(`/admin/reservas/${id}/cancelar`, { method: 'POST' }, true);

export const getConfig = () => request<{ config: ConfigNegocio }>('/admin/config', {}, true);
export const salvarConfig = (config: ConfigNegocio) =>
  request<{ config: ConfigNegocio }>('/admin/config', { method: 'PUT', body: JSON.stringify(config) }, true);
