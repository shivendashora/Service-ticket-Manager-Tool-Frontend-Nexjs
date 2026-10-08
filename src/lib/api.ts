import type {
  AssignResult,
  Attachment,
  AttachmentDraft,
  Role,
  Ticket,
  TicketChanges,
  TicketStatus,
  User,
} from './types';

// Defaults to /api, which next.config.ts rewrites to BACKEND_URL
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ValidationIssue {
  loc?: (string | number)[];
  msg: string;
}

interface ErrorBody {
  detail?: string | ValidationIssue[];
  message?: string;
}

// Both backends return `detail` as a string, or as a list of validation errors
const extractMessage = (body: ErrorBody | null, fallback: string): string => {
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        return field && typeof field === 'string' ? `${field}: ${d.msg}` : d.msg;
      })
      .join(', ');
  }
  return body?.message || fallback;
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
  query?: Record<string, string | number | null | undefined>;
}

async function request<T>(path: string, { method = 'GET', body, form, query }: RequestOptions = {}): Promise<T> {
  let url = `${API_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
    if ([...params].length) url += `?${params}`;
  }

  const options: RequestInit = { method, credentials: 'include', headers: {} };
  if (form) {
    options.body = form;
  } else if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Cookie expired or missing: let the auth layer sign the user out
    if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/me')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new ApiError(extractMessage(data, `Request failed (${res.status})`), res.status);
  }

  return data as T;
}

const buildAttachmentForm = (form: FormData, { links = [], images = [] }: Partial<AttachmentDraft>) => {
  links.filter(Boolean).forEach((link) => form.append('links', link));
  images.forEach((file) => form.append('images', file));
  return form;
};

interface AuthResponse {
  message: string;
  user: User;
}

export const authApi = {
  me: () => request<User>('/auth/me'),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password } }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  googleLoginUrl: `${API_URL}/auth/google/login`,
};

interface NewTicket extends AttachmentDraft {
  title: string;
  description: string;
  estimated_time: number | null;
}

export const ticketsApi = {
  list: (status?: TicketStatus) =>
    request<{ tickets: Ticket[] }>('/tickets', { query: { status } }).then((d) => d.tickets),
  get: (id: number | string) => request<{ ticket: Ticket }>(`/tickets/${id}`).then((d) => d.ticket),
  create: ({ title, description, estimated_time, links, images }: NewTicket) => {
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    if (estimated_time !== null && estimated_time !== undefined) {
      form.append('estimated_time', String(estimated_time));
    }
    buildAttachmentForm(form, { links, images });
    return request<{ ticket: Ticket }>('/tickets', { method: 'POST', form }).then((d) => d.ticket);
  },
  update: (id: number, changes: TicketChanges) =>
    request<{ ticket: Ticket }>(`/tickets/${id}`, { method: 'PATCH', body: changes }).then((d) => d.ticket),
  remove: (id: number) => request<{ message: string }>(`/tickets/${id}`, { method: 'DELETE' }),
  addAttachments: (id: number, payload: AttachmentDraft) =>
    request<{ ticket: Ticket }>(`/tickets/${id}/attachments`, {
      method: 'POST',
      form: buildAttachmentForm(new FormData(), payload),
    }).then((d) => d.ticket),
  removeAttachment: (id: number, attachmentId: number) =>
    request<{ message: string }>(`/tickets/${id}/attachments/${attachmentId}`, { method: 'DELETE' }),
  assign: (ticketIds: number[], userId: number) =>
    request<AssignResult>('/assign-tickets', {
      method: 'POST',
      body: { ticket_id: ticketIds, to_user_id: userId },
    }),
  unassign: (id: number, userId: number) =>
    request<{ message: string }>(`/tickets/${id}/assignees/${userId}`, { method: 'DELETE' }),
};

export const usersApi = {
  list: (role?: Role) => request<{ users: User[] }>('/users', { query: { role } }).then((d) => d.users),
  updateRole: (id: number, role: Role) =>
    request<{ user: User }>(`/users/${id}/role`, { method: 'PATCH', body: { role } }).then((d) => d.user),
};

export const attachmentUrl = (attachment: Attachment) =>
  attachment.type === 'image' ? `${API_URL}${attachment.url}` : attachment.url;
