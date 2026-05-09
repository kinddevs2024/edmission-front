import axios from 'axios'

type ApiErrorBody = {
  message?: string
  code?: string
  errors?: Array<{ field?: string; message?: string }>
}

/** Prefer first field error or concrete message for forms; fallback to i18n key. */
export function getFormSubmitErrorMessage(error: unknown, t: (key: string) => string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as ApiErrorBody
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors.find((e) => e?.message?.trim())
      if (first?.message) return first.message
    }
    const msg = typeof data.message === 'string' ? data.message.trim() : ''
    if (msg && msg.toLowerCase() !== 'validation failed') return msg
  }
  const key = getApiErrorKey(error)
  return t(`errors:${key}`)
}

/** Map backend error message to errors namespace key. Returns key or empty string (then use raw message). */
export function getApiErrorKey(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const code = (error.response.data as { code?: string }).code
    if (code === 'OAUTH_SIGNUP_REQUIRED') return 'oauthSignUpRequired'
    if (error.response.status === 401) return 'invalidCredentials'
    if (error.response.status === 403) return 'forbidden'
    if (error.response.status === 429) return 'rateLimit'
    if (error.response.status >= 500) return 'serverError'
  }
  const msg = getMessage(error).toLowerCase()
  if (!msg) return 'default'
  if (msg.includes('invalid credentials') || msg.includes('unauthorized')) return 'invalidCredentials'
  if (msg.includes('email already registered') || msg.includes('already exists')) return 'userExists'
  if (msg.includes('verify') && (msg.includes('email') || msg.includes('first'))) return 'emailNotVerified'
  if (msg.includes('pending approval') || msg.includes('administrator')) return 'accountPendingApproval'
  if (msg.includes('suspended') && msg.includes('account')) return 'accountSuspended'
  if (msg.includes('university account must be verified') || msg.includes('verified to access this resource')) return 'universityVerificationRequired'
  if (msg.includes('invalid') && (msg.includes('token') || msg.includes('expired') || msg.includes('verification') || msg.includes('reset'))) return 'invalidToken'
  if (msg.includes('invalid') && msg.includes('email')) return 'invalidEmail'
  if (msg.includes('password') && msg.includes('required')) return 'passwordRequired'
  if (msg.includes('name') && msg.includes('required')) return 'nameRequired'
  if (msg.includes('not found') && msg.includes('user')) return 'notFound'
  if (msg.includes('forbidden') || msg.includes("don't have permission")) return 'forbidden'
  if (msg.includes('not found')) return 'notFound'
  if (msg.includes('network') || msg.includes('connection') || msg.includes('unreachable')) return 'networkError'
  if (msg.includes('server') || msg.includes('500')) return 'serverError'
  if (msg.includes('temporarily unavailable') || msg.includes('try again later') || msg.includes('503')) return 'serviceUnavailable'
  if (msg.includes('validation failed')) return 'validationFailed'
  if (msg.includes('too many') || msg.includes('rate limit')) return 'rateLimit'
  return 'default'
}

function getMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string }
    return data.message ?? ''
  }
  if (error instanceof Error) return error.message
  return ''
}
