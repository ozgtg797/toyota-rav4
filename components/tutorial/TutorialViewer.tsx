import { Tutorial } from '@/lib/types'
import { TutorialHeader } from './TutorialHeader'
import { ToolsList } from './ToolsList'
import { PartsList } from './PartsList'
import { StepList } from './StepList'
import { WarningBadge } from './WarningBadge'
import { PrintButton } from './PrintButton'

export function TutorialViewer({ tutorial }: { tutorial: Tutorial }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <PrintButton />
      <TutorialHeader tutorial={tutorial} />

      {/* Top-level warnings */}
      {tutorial.top_warnings && tutorial.top_warnings.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Important Warnings</h2>
          <div className="space-y-2">
            {tutorial.top_warnings.map((w, i) => (
              <WarningBadge key={i} warning={w} />
            ))}
          </div>
        </section>
      )}

      <ToolsList tools={tutorial.tools} />
      <PartsList parts={tutorial.parts} />
      <StepList steps={tutorial.steps} />

      {/* Post-checks */}
      {tutorial.post_checks && tutorial.post_checks.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Post-Procedure Checks</h2>
          <ul className="space-y-2">
            {tutorial.post_checks.map((check, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="mt-1 flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                {check}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tutorial.notes && (
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-blue-900 mb-1">Notes</h2>
          <p className="text-sm text-blue-800">{tutorial.notes}</p>
        </section>
      )}
    </div>
  )
}
