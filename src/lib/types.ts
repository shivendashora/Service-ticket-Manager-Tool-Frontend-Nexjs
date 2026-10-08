// Shapes returned by the backend (same for the FastAPI and Flask versions)

export type Role = 'user' | 'admin';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Assignee extends User {
  assigned_by: number | null;
  assigned_at: string;
}

export interface Attachment {
  id: number;
  type: 'link' | 'image';
  url: string;
  file_name: string | null;
  content_type: string | null;
  size: number | null;
  uploaded_by: number | null;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  estimated_time: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  assignees: Assignee[];
  attachments: Attachment[];
}

export interface AttachmentDraft {
  links: string[];
  images: File[];
}

export interface AssignResult {
  message: string;
  assigned: number[];
  already_assigned: number[];
}

export type TicketChanges = Partial<Pick<Ticket, 'title' | 'description' | 'estimated_time' | 'status'>>;
