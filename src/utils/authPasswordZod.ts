import { z } from 'zod'

/** Matches backend `passwordSchema` (auth.validator.ts). */
export function newPasswordValueSchema(messages: {
  min: string
  uppercase?: string
  lowercase: string
  number: string
}) {
  return z
    .string()
    .min(8, messages.min)
    .refine((p) => /[a-z]/.test(p), { message: messages.lowercase })
    .refine((p) => /\d/.test(p), { message: messages.number })
}
