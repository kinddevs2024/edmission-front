import { useParams } from 'react-router-dom'
import { BackLink } from '@/components/ui/BackLink'
import { StudentDocuments } from '@/pages/student/StudentDocuments'

export function CounsellorStudentDocuments() {
  const { studentId } = useParams<{ studentId: string }>()

  if (!studentId) {
    return (
      <div className="space-y-4">
        <BackLink to="/school/my-students">Back</BackLink>
        <p className="text-[var(--color-text-muted)]">Invalid student.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <BackLink to={`/school/students/${studentId}/profile`}>Back</BackLink>
      <StudentDocuments counsellorMode studentUserId={studentId} />
    </div>
  )
}
