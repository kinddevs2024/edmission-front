import { Check, PencilLine, Plus } from 'lucide-react'
import type { StudentProfileData } from '@/services/student'
import { cn } from '@/utils/cn'
import {
  getAcademicCertificateCompletion,
  getAcademicFocus,
  getPrimaryGrade,
  getPrimaryLanguage,
  getPrimarySchool,
  type AcademicCertificateFieldId,
} from '@/utils/academicCertificate'

interface AcademicCertificateProps {
  profile: StudentProfileData | null
  onFieldClick?: (field: AcademicCertificateFieldId) => void
  compact?: boolean
  className?: string
}
interface CertificateFieldProps {
  id: AcademicCertificateFieldId
  label: string
  value: string
  placeholder: string
  onClick?: (field: AcademicCertificateFieldId) => void
  compact?: boolean
}

function CertificateField({ id, label, value, placeholder, onClick, compact }: CertificateFieldProps) {
  const filled = value.trim().length > 0
  const content = (
    <>
      <span className="block text-[8px] font-semibold uppercase tracking-[0.13em] text-[#5b6471] sm:text-[10px]">{label}</span>
      <span className={cn('mt-0.5 flex min-w-0 items-center gap-1 border-b pb-1 font-medium', compact ? 'text-[10px] sm:text-xs' : 'text-[10px] sm:text-sm', filled ? 'border-[#132238]/25 text-[#132238]' : 'border-dashed border-[#84cc16]/65 text-[#56720e]')}>
        {filled ? <Check className="h-3 w-3 shrink-0 text-[#65a30d]" aria-hidden /> : <Plus className="h-3 w-3 shrink-0" aria-hidden />}
        <span className="truncate">{filled ? value : placeholder}</span>
        {onClick ? <PencilLine className="ml-auto hidden h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/field:block group-hover/field:opacity-60 sm:block" aria-hidden /> : null}
      </span>
    </>
  )

  if (!onClick) return <div className="min-w-0">{content}</div>

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="group/field min-w-0 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-[#84cc16]/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16]"
      aria-label={`${filled ? 'Edit' : 'Add'} ${label}`}
    >
      {content}
    </button>
  )
}

export function AcademicCertificate({ profile, onFieldClick, compact = false, className }: AcademicCertificateProps) {
  const completion = getAcademicCertificateCompletion(profile)
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
  const location = [profile?.city, profile?.country].filter(Boolean).join(', ')
  const degree = profile?.targetDegreeLevel ? `${profile.targetDegreeLevel.charAt(0).toUpperCase()}${profile.targetDegreeLevel.slice(1)}` : ''

  return (
    <div className={cn('relative isolate overflow-hidden rounded-[20px] bg-[#fbfaf4] shadow-[0_28px_70px_-35px_rgba(19,34,56,0.55)]', compact ? 'min-h-[300px] sm:aspect-[3/2] sm:min-h-0' : 'min-h-[430px] sm:aspect-[3/2] sm:min-h-0', className)}>
      <img
        src="/student/academic-certificate-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-fill"
        aria-hidden
      />
      <div className={cn('relative z-[1] flex h-full min-h-[inherit] flex-col text-[#132238]', compact ? 'px-[8%] py-[7%]' : 'px-[8%] py-[7%]')}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <img src="/landing/edmission-logo.svg" alt="Edmission" className={cn('w-auto object-contain', compact ? 'h-5 sm:h-6' : 'h-6 sm:h-8')} />
            <p className="mt-2 text-[7px] font-semibold uppercase tracking-[0.24em] text-[#5b6471] sm:text-[9px]">Academic identity · verified by progress</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#5b6471] sm:text-[10px]">Certificate</p>
            <p className="mt-1 text-lg font-semibold text-[#65a30d] sm:text-2xl">{completion}%</p>
          </div>
        </div>

        <div className={cn('text-center', compact ? 'mt-4 sm:mt-[5%]' : 'mt-5 sm:mt-[6%]')}>
          <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#68717d] sm:text-[10px]">Edmission Academic Certificate</p>
          <p className="mt-1 text-[9px] text-[#68717d] sm:text-xs">This certificate represents the academic profile of</p>
          <button
            type="button"
            onClick={() => onFieldClick?.('name')}
            disabled={!onFieldClick}
            className="mx-auto mt-1 block max-w-[85%] truncate border-b border-[#c8ae74]/65 px-4 pb-1 font-serif text-xl font-semibold tracking-[0.015em] text-[#132238] transition-colors enabled:hover:border-[#84cc16] enabled:focus:outline-none enabled:focus-visible:ring-2 enabled:focus-visible:ring-[#84cc16] sm:text-3xl"
          >
            {fullName || 'Add your full name'}
          </button>
        </div>

        <div className={cn('mt-auto grid grid-cols-2 gap-x-[5%] gap-y-2 sm:grid-cols-4 sm:gap-y-3', compact && 'gap-y-1.5')}>
          <CertificateField id="location" label="Location" value={location} placeholder="Add city & country" onClick={onFieldClick} compact={compact} />
          <CertificateField id="school" label="Institution" value={getPrimarySchool(profile)} placeholder="Add school or college" onClick={onFieldClick} compact={compact} />
          <CertificateField id="graduationYear" label="Graduation" value={profile?.graduationYear ? String(profile.graduationYear) : ''} placeholder="Add year" onClick={onFieldClick} compact={compact} />
          <CertificateField id="gpa" label="Academic result" value={getPrimaryGrade(profile)} placeholder="Add GPA or grade" onClick={onFieldClick} compact={compact} />
          <CertificateField id="degree" label="Degree goal" value={degree} placeholder="Choose degree" onClick={onFieldClick} compact={compact} />
          <CertificateField id="language" label="Language" value={getPrimaryLanguage(profile)} placeholder="Add English level" onClick={onFieldClick} compact={compact} />
          <CertificateField id="academicFocus" label="Academic focus" value={getAcademicFocus(profile)} placeholder="Add interests" onClick={onFieldClick} compact={compact} />
          <CertificateField id="destinations" label="Study destinations" value={profile?.preferredCountries?.slice(0, 2).join(' · ') ?? ''} placeholder="Add countries" onClick={onFieldClick} compact={compact} />
        </div>

        <div className="mt-3 flex items-center gap-3 sm:mt-[4%]">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#132238]/10">
            <div className="h-full rounded-full bg-[#84cc16] transition-[width] duration-700 ease-out" style={{ width: `${completion}%` }} />
          </div>
          <span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#5b6471] sm:text-[10px]">Build · discover · choose</span>
        </div>
      </div>
    </div>
  )
}
