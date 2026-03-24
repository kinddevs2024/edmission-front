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
  HeartHandshake,
  Logs,
  Activity,
  Bot,
  Bell,
  Trash2,
  Check,
  HelpCircle,
  CreditCard,
  Building2,
  Award,
  Clock,
  Settings,
  Image,
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
  Building2,
  Award,
  ClipboardList,
  Heart,
  HeartHandshake,
  Logs,
  Activity,
  Bot,
  Bell,
  Trash2,
  Check,
  HelpCircle,
  CreditCard,
  Clock,
  Settings,
  Image,
}

export type NavIconName = keyof typeof iconMap

export function getNavIcon(name: string | undefined, className?: string, size = 20): React.ReactNode {
  if (!name) return <span aria-hidden />
  const Icon = iconMap[name]
  if (!Icon) return <span aria-hidden />
  return <Icon className={className} size={size} aria-hidden />
}

export { iconMap }
