import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export type LlmMode = 'pro' | 'cheap' | 'free'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callOpenAICompatible(baseURL: string, apiKey: string, model: string, messages: Message[]): Promise<string> {
  const client = new OpenAI({ baseURL, apiKey, dangerouslyAllowBrowser: true })
  const res = await client.chat.completions.create({ model, messages })
  return res.choices[0].message.content ?? ''
}

async function callAnthropic(messages: Message[]): Promise<string> {
  const apiKey = localStorage.getItem('anthropic_key') || ''
  const model = localStorage.getItem('cheap_model') || 'claude-haiku-4-5'
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const system = messages.find(m => m.role === 'system')?.content
  const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
  const res = await client.messages.create({
    model,
    max_tokens: 4096,
    system,
    messages: userMessages,
  })
  const block = res.content[0]
  return block.type === 'text' ? block.text : ''
}

export async function chat(messages: Message[], mode?: LlmMode): Promise<string> {
  const activeMode: LlmMode = mode || (localStorage.getItem('llm_mode') as LlmMode) || 'cheap'

  if (activeMode === 'pro') {
    const baseURL = localStorage.getItem('pro_base_url') || 'https://api.openai.com/v1'
    const apiKey = localStorage.getItem('pro_key') || ''
    const model = localStorage.getItem('pro_model') || 'gpt-4o'
    return callOpenAICompatible(baseURL, apiKey, model, messages)
  }

  if (activeMode === 'cheap') {
    const provider = localStorage.getItem('cheap_provider') || 'anthropic'
    if (provider === 'anthropic') return callAnthropic(messages)
    const baseURL = localStorage.getItem('cheap_base_url') || 'https://api.openai.com/v1'
    const apiKey = localStorage.getItem('cheap_key') || ''
    const model = localStorage.getItem('cheap_model') || 'gpt-4o-mini'
    return callOpenAICompatible(baseURL, apiKey, model, messages)
  }

  // free / local
  const baseURL = localStorage.getItem('local_base_url') || 'http://localhost:11434/v1'
  const model = localStorage.getItem('local_model') || 'llama3'
  return callOpenAICompatible(baseURL, 'ollama', model, messages)
}

export function extractJsonArray(raw: string): FileOperation[] {
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('AIの応答にJSON配列が見つかりませんでした。')
  return JSON.parse(match[0])
}

interface FileOperation {
  path: string
  content: string
  commitMessage: string
}
