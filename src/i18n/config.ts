export const supportedLngs = ['en', 'ru', 'uz'] as const
export type SupportedLng = (typeof supportedLngs)[number]

export const defaultNS = 'common'
export const fallbackLng = 'en'

export const namespaces = ['common', 'auth', 'student', 'university', 'admin'] as const
