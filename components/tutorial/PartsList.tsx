import { TutorialPart } from '@/lib/types'

export function PartsList({ parts }: { parts: TutorialPart[] }) {
  if (!parts || parts.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">Parts & Materials</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border border-gray-200 font-semibold">Part</th>
              <th className="text-center p-2 border border-gray-200 font-semibold w-20">Qty</th>
              <th className="text-left p-2 border border-gray-200 font-semibold hidden sm:table-cell">Part Number</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 border border-gray-200">{part.name}</td>
                <td className="p-2 border border-gray-200 text-center">{part.quantity}</td>
                <td className="p-2 border border-gray-200 text-gray-500 font-mono text-xs hidden sm:table-cell">
                  {part.part_number || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
