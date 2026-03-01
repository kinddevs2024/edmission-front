import { api } from './api'
import type { Ticket } from './tickets'

export interface AdminTicket extends Ticket {
  userEmail?: string
}

export interface AdminTicketsResponse {
  data: AdminTicket[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getAdminTickets(params?: {
  page?: number
  limit?: number
  status?: string
  role?: string
}): Promise<AdminTicketsResponse> {
  const { data } = await api.get<AdminTicketsResponse>('/admin/tickets', { params })
  return data
}

export async function getAdminTicket(id: string): Promise<AdminTicket> {
  const { data } = await api.get<AdminTicket>(`/admin/tickets/${id}`)
  return data
}

export async function updateTicketStatus(id: string, status: string): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/admin/tickets/${id}/status`, { status })
  return data
}

export async function addAdminTicketReply(id: string, message: string): Promise<Ticket | null> {
  const { data } = await api.post<Ticket | null>(`/admin/tickets/${id}/reply`, { message })
  return data
}
