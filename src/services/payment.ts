import { api } from './api'

export interface CreateCheckoutSessionResponse {
  url: string
}

export async function createCheckoutSession(
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const { data } = await api.post<CreateCheckoutSessionResponse>('/payment/create-checkout-session', {
    planId,
    successUrl,
    cancelUrl,
  })
  if (!data?.url) throw new Error('No checkout URL returned')
  return data.url
}
