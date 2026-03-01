import { api } from './api'

export interface TicketReply {
  userId: string
  role: string
  message: string
  isStaff?: boolean
  createdAt: string
}

export interface Ticket {
  id: string
  userId: string
  role: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  replies?: TicketReply[]
  createdAt: string
  updatedAt?: string
}

export interface TicketsResponse {
  data: Ticket[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function createTicket(subject: string, message: string): Promise<Ticket> {
  const { data } = await api.post<Ticket>('/tickets', { subject, message })
  return data
}

export async function getMyTickets(params?: { page?: number; limit?: number; status?: string }): Promise<TicketsResponse> {
  const { data } = await api.get<TicketsResponse>('/tickets', { params })
  return data
}

export async function getTicket(id: string): Promise<Ticket> {
  const { data } = await api.get<Ticket>(`/tickets/${id}`)
  return data
}

export async function addTicketReply(id: string, message: string): Promise<Ticket | null> {
  const { data } = await api.post<Ticket | null>(`/tickets/${id}/reply`, { message })
  return data
}
