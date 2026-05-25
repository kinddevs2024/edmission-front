import { useTranslation } from 'react-i18next'
import { StudentsMapView, type StudentMapItem } from '@/components/maps/StudentsMapView'
import { getStudents } from '@/services/university'
import { getStudentContactEmail, getStudentDisplayName } from '@/utils/studentDisplay'

const MAP_PAGE_LIMIT = 300

export function StudentsMap() {
  const { t } = useTranslation(['university', 'student'])

  return (
    <StudentsMapView
      queryKey={['university', 'students', 'map']}
      queryFn={async () => {
        const response = await getStudents({ page: 1, limit: MAP_PAGE_LIMIT, mapOnly: true })
        return (response.data ?? []).map<StudentMapItem>((item) => {
          const student = item.student ?? {}
          const name = getStudentDisplayName(student)
          return {
            id: item.id,
            name,
            email: getStudentContactEmail(student),
            country: student.country,
            city: student.city,
            avatarUrl: student.avatarUrl,
            schoolName: student.schoolName,
            gpa: student.gpa,
            graduationYear: student.graduationYear,
            verified: Boolean(student.verifiedAt),
            highlighted: item.inPipeline,
            detailTo: `/university/students/${encodeURIComponent(item.id)}`,
            chatTo: `/university/chat?studentId=${encodeURIComponent(item.id)}`,
          }
        })
      }}
      introStorageKey="edmission-university-students-map-intro-dismissed"
      eyebrow={t('university:studentsMapEyebrow', 'Student map')}
      title={t('university:studentsMapTitle', 'Find students by city and country')}
      description={t('university:studentsMapDescription', 'Browse discoverable students geographically, open profiles from the map, and focus outreach by location.')}
      panelTitle={t('university:studentsMapPanel', 'Students on this map')}
      panelHint={t('university:studentsMapPanelHint', 'Select a student to move the map and open profile details.')}
      emptyTitle={t('university:noStudentsFound', 'No students found')}
      emptyDescription={t('university:tryChangingFiltersOrSearchStudents', 'Try changing filters or search to see more students.')}
    />
  )
}
