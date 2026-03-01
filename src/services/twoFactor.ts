import { api } from './api'

export interface Setup2FAResponse {
  secret: string
  qrUrl: string
}

export async function setup2FA(): Promise<Setup2FAResponse> {
  const { data } = await api.post<Setup2FAResponse>('/auth/2fa/setup')
  if (!data) throw new Error('Setup failed')
  return data
}

export async function verifyAndEnable2FA(code: string): Promise<void> {
  await api.post('/auth/2fa/verify', { code })
}

export async function disable2FA(code: string): Promise<void> {
  await api.post('/auth/2fa/disable', { code })
}
