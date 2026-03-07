import { toast } from 'sonner'
import { getApiError } from '@/services/api'

/** Show API error in toast. Use in .catch() instead of empty () => {}. */
export function toastApiError(error: unknown): void {
  toast.error(getApiError(error).message)
}
