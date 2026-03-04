import { TorqueSpec as TorqueSpecType } from '@/lib/types'

export function TorqueSpec({ spec }: { spec: TorqueSpecType }) {
  return (
    <div className="torque-spec inline-flex items-center gap-2 border-2 border-gray-800 rounded px-3 py-1 bg-gray-50 font-bold text-sm">
      <span className="text-gray-500">TORQUE</span>
      <span>{spec.component}:</span>
      <span className="text-blue-700">{spec.metric}</span>
      <span className="text-gray-400">({spec.imperial})</span>
    </div>
  )
}
