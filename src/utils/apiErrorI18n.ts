import axios from 'axios'

/** Map backend error message to errors namespace key. Returns key or empty string (then use raw message). */
export function getApiErrorKey(error: unknown): string {
  const msg = getMessage(error).toLowerCase()
  if (!msg) return 'default'
  if (msg.includes('invalid credentials') || msg.includes('unauthorized')) return 'invalidCredentials'
  if (msg.includes('email already registered') || msg.includes('already exists')) return 'userExists'
  if (msg.includes('verify') && (msg.includes('email') || msg.includes('first'))) return 'emailNotVerified'
  if (msg.includes('invalid') && (msg.includes('token') || msg.includes('expired') || msg.includes('verification') || msg.includes('reset'))) return 'invalidToken'
  if (msg.includes('invalid') && msg.includes('email')) return 'invalidEmail'
  if (msg.includes('password') && msg.includes('required')) return 'passwordRequired'
  if (msg.includes('name') && msg.includes('required')) return 'nameRequired'
  if (msg.includes('not found') && msg.includes('user')) return 'notFound'
  if (msg.includes('forbidden') || msg.includes("don't have permission")) return 'forbidden'
  if (msg.includes('not found')) return 'notFound'
  if (msg.includes('network') || msg.includes('connection') || msg.includes('unreachable')) return 'networkError'
  if (msg.includes('server') || msg.includes('500')) return 'serverError'
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

