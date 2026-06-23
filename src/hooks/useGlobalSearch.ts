import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { search, type SearchResult, type SearchUserItem } from '@/services/search'
import { searchSitePages } from '@/constants/sitePages'
import { isUniversityLikeRole, type Role } from '@/types/user'

const DEBOUNCE_MS = 300

export function useGlobalSearch(options?: { afterNavigate?: () => void }) {
  const { afterNavigate } = options ?? {}
  const { t } = useTranslation(['common', 'student', 'university', 'admin'])
  const { user } = useAuth()
  const role = ((user as { role?: string })?.role ?? 'student') as Role
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [value])

  const runSearch = useCallback(async () => {
    if (!debounced.trim()) {
      setResult(null)
      return
    }
    setLoading(true)
    try {
      const data = await search(debounced)
      setResult(data)
    } catch {
      setResult({ universities: [], students: [], users: [] })
    } finally {
      setLoading(false)
    }
  }, [debounced])

  useEffect(() => {
    if (!debounced.trim()) {
      setResult(null)
      return
    }
    runSearch()
  }, [debounced, runSearch])

  const sitePages = useMemo(() => searchSitePages(debounced, role), [debounced, role])
  const chatMessages = result?.chatMessages ?? []
  const users = result?.users ?? []
  const hasResults =
    result &&
    (result.universities.length > 0 ||
      result.students.length > 0 ||
      users.length > 0 ||
      chatMessages.length > 0 ||
      sitePages.length > 0)
  const isEmpty =
    result &&
    result.universities.length === 0 &&
    result.students.length === 0 &&
    users.length === 0 &&
    chatMessages.length === 0 &&
    sitePages.length === 0

  const reset = useCallback(() => {
    setValue('')
    setDebounced('')
    setResult(null)
  }, [])

  const handleSelectUniversity = useCallback(
    (id: string) => {
      afterNavigate?.()
      setValue('')
      setResult(null)
      navigate(`/student/universities/${id}`)
    },
    [afterNavigate, navigate]
  )

  const handleSelectStudent = useCallback(
    (id: string) => {
      afterNavigate?.()
      setValue('')
      setResult(null)
      if (isUniversityLikeRole(role)) navigate(`/university/students/${id}`)
      else if (role === 'admin' || role === 'student_admin' || role === 'manager' || role === 'counsellor_coordinator') navigate(`/admin/users`)
      else if (role === 'school_counsellor') navigate(`/school/students/${id}/profile`)
    },
    [afterNavigate, navigate, role]
  )

  const handleSelectUser = useCallback(
    (u: SearchUserItem) => {
      afterNavigate?.()
      setValue('')
      setResult(null)
      if (u.role === 'student') {
        navigate(`/admin/users/${u.id}/student-profile`)
      } else {
        navigate(`/admin/users?search=${encodeURIComponent(u.email)}`)
      }
    },
    [afterNavigate, navigate]
  )

  const handleSelectPage = useCallback(
    (path: string) => {
      afterNavigate?.()
      setValue('')
      setResult(null)
      navigate(path)
    },
    [afterNavigate, navigate]
  )

  const handleSelectChatMessage = useCallback(
    (chatId: string) => {
      afterNavigate?.()
      setValue('')
      setResult(null)
      const chatPath = role === 'student' ? '/student/chat' : '/university/chat'
      navigate(`${chatPath}?chat=${chatId}`)
    },
    [afterNavigate, navigate, role]
  )

  const handleSearchWithAI = useCallback(() => {
    afterNavigate?.()
    setValue('')
    setResult(null)
    const chatPath = role === 'student'
      ? '/student/chat'
      : role === 'university' || role === 'university_multi_manager' || role === 'multi_university_admin'
        ? '/university/chat'
        : role === 'school_counsellor'
          ? '/school/chats'
          : role === 'admin'
            ? '/admin/chats'
            : '/support'
    navigate(chatPath)
  }, [afterNavigate, navigate, role])

  return {
    value,
    setValue,
    debounced,
    result,
    loading,
    sitePages,
    chatMessages,
    users,
    hasResults,
    isEmpty,
    t,
    role,
    reset,
    handleSelectUniversity,
    handleSelectStudent,
    handleSelectUser,
    handleSelectPage,
    handleSelectChatMessage,
    handleSearchWithAI,
  }
}
