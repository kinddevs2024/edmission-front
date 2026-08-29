import type { LucideIcon } from 'lucide-react'
import { Award, Crown, Gem, Medal } from 'lucide-react'

export type StudentLevelId = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface StudentLevelDefinition {
  id: StudentLevelId
  label: string
  rank: number
  icon: LucideIcon
  badgeClassName: string
  iconClassName: string
  progressClassName: string
}

export const STUDENT_LEVELS: StudentLevelDefinition[] = [
  {
    id: 'bronze',
    label: 'Bronze',
    rank: 1,
    icon: Medal,
    badgeClassName: 'border-amber-700/25 bg-amber-700/10 text-amber-800 dark:text-amber-300',
    iconClassName: 'bg-amber-700/12 text-amber-700 dark:text-amber-300',
    progressClassName: 'bg-amber-600',
  },
  {
    id: 'silver',
    label: 'Silver',
    rank: 2,
    icon: Award,
    badgeClassName: 'border-slate-400/35 bg-slate-400/12 text-slate-700 dark:text-slate-200',
    iconClassName: 'bg-slate-400/14 text-slate-600 dark:text-slate-200',
    progressClassName: 'bg-slate-400',
  },
  {
    id: 'gold',
    label: 'Gold',
    rank: 3,
    icon: Crown,
    badgeClassName: 'border-amber-400/35 bg-amber-300/14 text-amber-700 dark:text-amber-200',
    iconClassName: 'bg-amber-300/18 text-amber-600 dark:text-amber-200',
    progressClassName: 'bg-amber-400',
  },
  {
    id: 'platinum',
    label: 'Platinum',
    rank: 4,
    icon: Gem,
    badgeClassName: 'border-cyan-400/30 bg-cyan-300/12 text-cyan-800 dark:text-cyan-200',
    iconClassName: 'bg-cyan-300/14 text-cyan-700 dark:text-cyan-200',
    progressClassName: 'bg-cyan-400',
  },
]

export const STUDENT_LEVEL_CRITERIA = {
  silverProfileCompletion: 75,
  goldOffers: 3,
  platinumOffers: 10,
  platinumGrants: 2,
  grantCoveragePercent: 50,
} as const

export interface StudentLevelState {
  level: StudentLevelId
  nextLevel: StudentLevelId | null
  progressPercent: number
  nextMilestone: string
}

export function getStudentLevelDefinition(level: StudentLevelId): StudentLevelDefinition {
  return STUDENT_LEVELS.find((item) => item.id === level) ?? STUDENT_LEVELS[0]
}

export function resolveStudentLevel(profileCompletionPercent: number, offersCount: number, grantsCount: number): StudentLevelState {
  const completion = Math.max(0, Math.min(100, profileCompletionPercent))
  if (offersCount >= STUDENT_LEVEL_CRITERIA.platinumOffers || grantsCount >= STUDENT_LEVEL_CRITERIA.platinumGrants) {
    return { level: 'platinum', nextLevel: null, progressPercent: 100, nextMilestone: 'Top level unlocked. Keep building your academic story.' }
  }
  if (offersCount >= STUDENT_LEVEL_CRITERIA.goldOffers) {
    return {
      level: 'gold',
      nextLevel: 'platinum',
      progressPercent: Math.min(100, Math.max((offersCount / STUDENT_LEVEL_CRITERIA.platinumOffers) * 100, (grantsCount / STUDENT_LEVEL_CRITERIA.platinumGrants) * 100)),
      nextMilestone: `${Math.max(0, STUDENT_LEVEL_CRITERIA.platinumOffers - offersCount)} more offers or ${Math.max(0, STUDENT_LEVEL_CRITERIA.platinumGrants - grantsCount)} more grants to reach Platinum.`,
    }
  }
  if (completion >= STUDENT_LEVEL_CRITERIA.silverProfileCompletion) {
    return {
      level: 'silver',
      nextLevel: 'gold',
      progressPercent: Math.min(100, (offersCount / STUDENT_LEVEL_CRITERIA.goldOffers) * 100),
      nextMilestone: `${Math.max(0, STUDENT_LEVEL_CRITERIA.goldOffers - offersCount)} more offers to reach Gold.`,
    }
  }
  return {
    level: 'bronze',
    nextLevel: 'silver',
    progressPercent: Math.min(100, (completion / STUDENT_LEVEL_CRITERIA.silverProfileCompletion) * 100),
    nextMilestone: `${Math.max(0, Math.round(STUDENT_LEVEL_CRITERIA.silverProfileCompletion - completion))}% more certificate progress to reach Silver.`,
  }
}
