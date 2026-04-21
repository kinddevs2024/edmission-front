import { useMemo, useState } from 'react'
import type { ApexOptions } from 'apexcharts'
import merge from 'deepmerge'
import Chart from 'react-apexcharts'
import {
  Menu,
  Card,
  Button,
  CardBody,
  MenuItem,
  MenuList,
  CardHeader,
  Typography,
  MenuHandler,
} from '@material-tailwind/react'
import { ChevronDown } from 'lucide-react'

const MTCard = Card as any
const MTCardHeader = CardHeader as any
const MTCardBody = CardBody as any
const MTTypography = Typography as any
const MTButton = Button as any
const MTMenuList = MenuList as any
const MTMenuItem = MenuItem as any

type RangeKey = '12h' | '24h' | '7d'

interface MiniAreaAnalyticsCardProps {
  title: string
  value: string
  delta?: string
  colors?: string[]
  categories: string[]
  seriesByRange: Record<RangeKey, number[]>
  metricOneLabel: string
  metricOneValue: string
  metricTwoLabel: string
  metricTwoValue: string
  className?: string
}

const RANGE_LABELS: Record<RangeKey, string> = {
  '12h': 'last 12h',
  '24h': 'last 24h',
  '7d': 'last 7d',
}

export function MiniAreaAnalyticsCard({
  title,
  value,
  delta,
  colors = ['#84CC16'],
  categories,
  seriesByRange,
  metricOneLabel,
  metricOneValue,
  metricTwoLabel,
  metricTwoValue,
  className,
}: MiniAreaAnalyticsCardProps) {
  const [range, setRange] = useState<RangeKey>('24h')
  const chartSeries = useMemo(() => [{ name: title, data: seriesByRange[range] ?? [] }], [range, seriesByRange, title])

  const chartOptions = useMemo<ApexOptions>(
    () => ({
      colors,
      ...merge<ApexOptions, ApexOptions>(
        {
          chart: {
            height: 260,
            type: 'area',
            zoom: { enabled: false },
            toolbar: { show: false },
            background: 'transparent',
          },
          dataLabels: { enabled: false },
          legend: { show: false },
          markers: {
            size: 0,
            strokeWidth: 0,
            strokeColors: 'transparent',
          },
          stroke: {
            curve: 'smooth',
            width: 2.5,
          },
          grid: {
            show: true,
            borderColor: '#E5E7EB',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
          },
          tooltip: {
            theme: 'light',
          },
          xaxis: {
            axisTicks: { show: false },
            axisBorder: { show: false },
            labels: { show: true },
            categories,
          },
          yaxis: {
            labels: { show: false },
          },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.35,
              opacityTo: 0.03,
              stops: [0, 100],
            },
          },
        },
        {}
      ),
    }),
    [categories, colors]
  )

  return (
    <MTCard className={className ?? 'h-fit w-full border border-gray-200 shadow-md'}>
      <MTCardHeader
        shadow={false}
        floated={false}
        className="mb-0 flex items-start justify-between overflow-visible rounded-none bg-transparent px-4 pt-4"
      >
        <div>
          <MTTypography variant="small" className="mb-1 font-medium text-gray-600">
            {title}
          </MTTypography>
          <MTTypography variant="h4" color="blue-gray">
            {value} {delta ? <span className="text-base font-medium text-gray-500">{delta}</span> : null}
          </MTTypography>
        </div>
        <Menu placement="bottom-end">
          <MenuHandler>
            <MTButton
              size="sm"
              color="gray"
              variant="outlined"
              className="flex items-center gap-1 !border-gray-300 !px-3 !py-2 text-xs normal-case"
            >
              {RANGE_LABELS[range]}
              <ChevronDown className="h-3 w-3 text-gray-900" strokeWidth={2.5} />
            </MTButton>
          </MenuHandler>
          <MTMenuList>
            {(['12h', '24h', '7d'] as const).map((option) => (
              <MTMenuItem key={option} onClick={() => setRange(option)}>
                {RANGE_LABELS[option]}
              </MTMenuItem>
            ))}
          </MTMenuList>
        </Menu>
      </MTCardHeader>

      <MTCardBody className="px-2 pb-2 pt-1">
        <Chart type="area" height={260} series={chartSeries} options={chartOptions} />
        <div className="flex flex-wrap justify-between gap-y-4 px-4 pb-3">
          <div>
            <MTTypography variant="small" className="mb-1 font-medium text-gray-600">
              {metricOneLabel}
            </MTTypography>
            <MTTypography variant="h5" color="blue-gray">
              {metricOneValue}
            </MTTypography>
          </div>
          <div>
            <MTTypography variant="small" className="mb-1 font-medium text-gray-600">
              {metricTwoLabel}
            </MTTypography>
            <MTTypography variant="h5" color="blue-gray">
              {metricTwoValue}
            </MTTypography>
          </div>
        </div>
      </MTCardBody>
    </MTCard>
  )
}
