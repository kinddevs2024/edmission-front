export interface ApiError {
  message: string
  code?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
}
