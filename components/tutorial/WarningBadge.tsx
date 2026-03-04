'use client'

import { Warning } from '@/lib/types'

const STYLES: Record<string, string> = {
  danger: 'bg-red-50 border-red-500 text-red-900 warning-danger',
  warning: 'bg-orange-50 border-orange-500 text-orange-900',
  caution: 'bg-yellow-50 border-yellow-400 text-yellow-900 warning-caution',
  note: 'bg-blue-50 border-blue-400 text-blue-900',
}

const ICONS: Record<string, string> = {
  danger: '🚨',
  warning: '⚠️',
  caution: '⚠️',
  note: 'ℹ️',
}

const LABELS: Record<string, string> = {
  danger: 'DANGER',
  warning: 'WARNING',
  caution: 'CAUTION',
  note: 'NOTE',
}

export function WarningBadge({ warning }: { warning: Warning }) {
  const style = STYLES[warning.type] || STYLES.note
  const icon = ICONS[warning.type] || ICONS.note
  const label = LABELS[warning.type] || 'NOTE'

  return (
    <div className={`border-l-4 p-3 rounded-r ${style} my-2`}>
      <span className="font-bold text-sm">
        {icon} {label}:
      </span>{' '}
      <span className="text-sm">{warning.message}</span>
    </div>
  )
}
