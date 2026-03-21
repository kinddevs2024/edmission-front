import { getApiError } from '@/services/api'
import { notifyError } from './notify'

/** Show API error in toast. Use in .catch() instead of empty () => {}. */
export function toastApiError(error: unknown): void {
  notifyError(getApiError(error).message)
}
