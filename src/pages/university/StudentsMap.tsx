import { StudentsMapView, type StudentMapItem } from '@/components/maps/StudentsMapView'
import { getStudents } from '@/services/university'
import { getStudentContactEmail, getStudentDisplayName } from '@/utils/studentDisplay'

const MAP_PAGE_LIMIT = 300

export function StudentsMap() {
  return (
    <StudentsMapView
      queryKey={['university', 'students', 'map']}
      queryFn={async () => {
        const response = await getStudents({ page: 1, limit: MAP_PAGE_LIMIT, useProfileFilters: false })
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
      eyebrow="Student map"
      title="Find students by city and country"
      description="Browse discoverable students geographically, open profiles from the map, and focus outreach by location."
      panelTitle="Students on this map"
      panelHint="Select a student to move the map and open profile details."
      emptyTitle="No students found"
      emptyDescription="Try changing filters or search to see more students."
    />
  )
}
