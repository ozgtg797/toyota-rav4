import { ChunkWithDocument } from '@/lib/types'

export const SYSTEM_PROMPT = `You are an expert automotive technician specializing in the 1997 Toyota RAV4 (1st generation).
You have access to factory service manual (FSM) content for this specific vehicle.

CRITICAL RULES:
- Use the provided factory service manual content as your PRIMARY source. Extract all specs, torque values, part numbers, and warnings directly from it.
- You may use your automotive expertise to fill in STANDARD procedural steps that are implied by the manual but not explicitly written out (e.g. "warm up engine", "place drain pan"). Clearly distinguish these from manual-sourced steps.
- NEVER invent torque specs, part numbers, or fluid capacities — only use values explicitly stated in the source material.
- Always include ALL warnings and cautions from the manual verbatim.
- Use metric measurements first, with imperial in parentheses: "27 N·m (20 ft-lbs)"
- Be precise and safety-conscious — mechanics rely on this information.
- Output ONLY valid JSON, no markdown, no explanation.`

export function buildUserPrompt(query: string, chunks: ChunkWithDocument[]): string {
  const sourceText = chunks
    .map((chunk, i) => {
      const docName = chunk.documents?.display_name || 'Unknown Document'
      const section = chunk.section_heading || 'Unknown Section'
      const pages = chunk.page_start
        ? `Pages ${chunk.page_start}${chunk.page_end && chunk.page_end !== chunk.page_start ? `-${chunk.page_end}` : ''}`
        : ''
      return `--- SOURCE ${i + 1}: ${docName} | ${section} | ${pages} ---
${chunk.content}`
    })
    .join('\n\n')

  return `Generate a complete step-by-step tutorial for: "${query}"

Using ONLY the following source material from the 1997 Toyota RAV4 factory service manual:

${sourceText}

Output a JSON object with this exact structure:
{
  "title": "Descriptive title for this procedure",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "time_estimate": "e.g. 30-45 minutes",
  "overview": "Brief 1-2 sentence description of what this procedure accomplishes",
  "tools": ["list", "of", "required", "tools"],
  "parts": [
    {"name": "Part name", "quantity": "1", "part_number": "optional"}
  ],
  "top_warnings": [
    {"type": "danger|warning|caution|note", "message": "Warning text from manual"}
  ],
  "steps": [
    {
      "step_number": 1,
      "title": "Short step title",
      "description": "Main instruction for this step",
      "details": "Additional details, measurements, or clarifications",
      "warnings": [{"type": "caution", "message": "Step-specific warning"}],
      "torque_specs": [{"component": "Drain plug", "metric": "27 N·m", "imperial": "20 ft-lbs"}],
      "tools_used": ["14mm socket"],
      "page_images": [
        {"document_id": "use_chunk_document_id", "page_number": 142, "storage_path": "will_be_resolved"}
      ]
    }
  ],
  "post_checks": ["List of verification steps after procedure"],
  "notes": "Any additional notes or tips",
  "sources": [
    {"document_name": "Document name", "section": "Section heading", "pages": "142-145"}
  ]
}

For page_images in each step: reference the page numbers from the source material that contain relevant diagrams for that step. Use the chunk's page_start and page_end values as guidance.

Important:
- Include ALL relevant warnings from the source material
- If no torque spec is provided in source, omit torque_specs array
- Steps should be granular and actionable — one clear action per step
- If the PDF documents are attached, use them as the primary visual reference for diagrams and procedures
- Generate the BEST tutorial you can from the available source material. If some steps are only implied, include them with a note that they are standard procedure.`
}
