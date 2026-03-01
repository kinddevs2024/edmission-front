import {
  LayoutDashboard,
  User,
  GraduationCap,
  FileCheck,
  FileText,
  Gift,
  GitCompare,
  MessageCircle,
  Users,
  GitBranch,
  Wallet,
  BarChart3,
  ShieldCheck,
  BookOpen,
  ClipboardList,
  Heart,
  Logs,
  Activity,
  Bot,
  Bell,
  Trash2,
  Check,
  HelpCircle,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  User,
  GraduationCap,
  FileCheck,
  FileText,
  Gift,
  GitCompare,
  MessageCircle,
  Users,
  GitBranch,
  Wallet,
  BarChart3,
  ShieldCheck,
  BookOpen,
  ClipboardList,
  Heart,
  Logs,
  Activity,
  Bot,
  Bell,
  Trash2,
  Check,
  HelpCircle,
  CreditCard,
}

export type NavIconName = keyof typeof iconMap

export function getNavIcon(name: string | undefined, className?: string, size = 20): React.ReactNode {
  if (!name) return null
  const Icon = iconMap[name]
  if (!Icon) return null
  return <Icon className={className} size={size} aria-hidden />
}

export { iconMap }
