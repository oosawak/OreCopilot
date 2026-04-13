import { Octokit } from '@octokit/rest'

let _octokit: Octokit | null = null

export function getOctokit(): Octokit {
  const token = localStorage.getItem('github_token')
  if (!token) throw new Error('GitHub token not set. Please configure in Settings.')
  if (!_octokit) _octokit = new Octokit({ auth: token })
  return _octokit
}

export function resetOctokit() {
  _octokit = null
}

export function getRepoConfig() {
  const owner = localStorage.getItem('github_owner') || ''
  const repo = localStorage.getItem('github_repo') || ''
  if (!owner || !repo) throw new Error('GitHub owner/repo not set. Please configure in Settings.')
  return { owner, repo }
}

export async function getFileContent(path: string): Promise<{ content: string; sha: string }> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoConfig()
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
  if (Array.isArray(data)) throw new Error(`${path} is a directory, not a file.`)
  if (data.type !== 'file') throw new Error(`${path} is not a regular file.`)
  const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
  return { content, sha: data.sha }
}

export async function upsertFile(path: string, content: string, commitMessage: string): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoConfig()
  let sha: string | undefined
  try {
    const existing = await getFileContent(path)
    sha = existing.sha
  } catch {
    // new file
  }
  const encoded = btoa(unescape(encodeURIComponent(content)))
  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path, message: commitMessage, content: encoded, sha,
  })
}

export interface FileOperation {
  path: string
  content: string
  commitMessage: string
}

export async function applyFileOperations(ops: FileOperation[]): Promise<void> {
  for (const op of ops) {
    await upsertFile(op.path, op.content, op.commitMessage)
  }
}

export async function listDirectory(path: string): Promise<string[]> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoConfig()
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
  if (!Array.isArray(data)) return []
  return data.map(item => item.path)
}
