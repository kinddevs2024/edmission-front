import { Card, CardTitle } from '@/components/ui/Card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const MOCK_LINE = [
  { month: 'Jan', interest: 12 },
  { month: 'Feb', interest: 19 },
  { month: 'Mar', interest: 28 },
  { month: 'Apr', interest: 35 },
  { month: 'May', interest: 42 },
]
const MOCK_BAR = [
  { stage: 'Interested', count: 45 },
  { stage: 'Contacted', count: 32 },
  { stage: 'Evaluating', count: 18 },
  { stage: 'Offer Sent', count: 12 },
  { stage: 'Accepted', count: 8 },
]
const MOCK_PIE = [
  { name: 'Full scholarship', value: 40, color: '#84CC16' },
  { name: 'Partial', value: 35, color: '#3B82F6' },
  { name: 'Budget', value: 25, color: '#64748B' },
]

export function UniversityAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1">Analytics</h1>

      <Card>
        <CardTitle>Interest over time</CardTitle>
        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_LINE}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="interest" stroke="var(--color-primary-accent)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Pipeline conversion</CardTitle>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_BAR} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="stage" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
                <Bar dataKey="count" fill="var(--color-primary-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>Scholarship distribution</CardTitle>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_PIE}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {MOCK_PIE.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
