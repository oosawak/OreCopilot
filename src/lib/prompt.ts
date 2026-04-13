import { getFileContent, listDirectory } from './github'
import { type Message } from './llm'

const SCHEMAS_PATH = 'schemas'

export async function loadSchema(filename: string): Promise<string> {
  try {
    const { content } = await getFileContent(`${SCHEMAS_PATH}/${filename}`)
    return content
  } catch {
    return ''
  }
}

export async function buildSystemPrompt(personaFile?: string): Promise<string> {
  const base = await loadSchema('base.md')
  const persona = personaFile ? await loadSchema(personaFile) : ''
  return [base, persona].filter(Boolean).join('\n\n---\n\n')
}

async function expandWikiLinks(text: string): Promise<string> {
  const pattern = /\[\[([^\]]+)\]\]/g
  const matches = [...text.matchAll(pattern)]
  if (matches.length === 0) return text

  let expanded = text
  for (const match of matches) {
    const filename = match[1]
    const paths = [
      `🧠Brain/01_Inbox/${filename}.md`,
      `🧠Brain/02_Projects/${filename}.md`,
      `💻src/${filename}`,
      filename,
    ]
    for (const path of paths) {
      try {
        const { content } = await getFileContent(path)
        expanded = expanded.replace(match[0], `\n\n--- ${path} ---\n${content}\n---\n`)
        break
      } catch {
        // try next path
      }
    }
  }
  return expanded
}

export async function buildMessages(userInput: string, personaFile?: string): Promise<Message[]> {
  const [systemPrompt, expandedUser] = await Promise.all([
    buildSystemPrompt(personaFile),
    expandWikiLinks(userInput),
  ])
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: expandedUser },
  ]
}

export async function buildIngestMessages(rawInput: string): Promise<Message[]> {
  const ingestSchema = await loadSchema('ingest.md')
  const systemPrompt = await loadSchema('base.md')
  const userContent = ingestSchema.replace('{{USER_INPUT_OR_NOTEBOOKLM_DUMP}}', rawInput)
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ]
}

export async function listProjects(): Promise<string[]> {
  try {
    const entries = await listDirectory('🧠Brain/02_Projects')
    return entries.map(e => e.split('/').pop() || e)
  } catch {
    return []
  }
}
