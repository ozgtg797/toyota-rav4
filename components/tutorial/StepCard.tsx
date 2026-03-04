import { TutorialStep } from '@/lib/types'
import { WarningBadge } from './WarningBadge'
import { TorqueSpec } from './TorqueSpec'
import { DiagramImage } from './DiagramImage'

export function StepCard({ step }: { step: TutorialStep }) {
  return (
    <div className="step-card bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="step-number flex-shrink-0 w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center text-xl font-bold">
          {step.step_number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
          <p className="text-gray-700 mb-2">{step.description}</p>

          {step.details && (
            <p className="text-gray-600 text-sm bg-gray-50 rounded p-2 mb-2 italic">
              {step.details}
            </p>
          )}

          {/* Diagrams */}
          {step.page_images?.map((img, i) => (
            <DiagramImage key={i} image={img} stepNumber={step.step_number} />
          ))}

          {/* Warnings */}
          {step.warnings?.map((w, i) => (
            <WarningBadge key={i} warning={w} />
          ))}

          {/* Torque specs */}
          {step.torque_specs && step.torque_specs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {step.torque_specs.map((spec, i) => (
                <TorqueSpec key={i} spec={spec} />
              ))}
            </div>
          )}

          {/* Tools used in this step */}
          {step.tools_used && step.tools_used.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 self-center mr-1">Tools:</span>
              {step.tools_used.map((tool, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
