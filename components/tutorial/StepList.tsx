import { TutorialStep } from '@/lib/types'
import { StepCard } from './StepCard'

export function StepList({ steps }: { steps: TutorialStep[] }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No steps available for this procedure.
      </div>
    )
  }

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Steps</h2>
      <div className="space-y-4">
        {steps.map((step) => (
          <StepCard key={step.step_number} step={step} />
        ))}
      </div>
    </section>
  )
}
