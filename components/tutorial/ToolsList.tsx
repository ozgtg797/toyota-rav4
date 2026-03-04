export function ToolsList({ tools }: { tools: string[] }) {
  if (!tools || tools.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">Tools Required</h2>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool, i) => (
          <span
            key={i}
            className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-sm font-medium"
          >
            {tool}
          </span>
        ))}
      </div>
    </section>
  )
}
