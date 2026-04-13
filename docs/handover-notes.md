# 開発担当者向け 引き継ぎ資料（Handover Notes）

本システムは「バックエンドを持たないSPA（シングルページアプリケーション）」として動作します。以下の実装上の注意点（ハマりどころ）を確認の上、開発を進めてください。

---

## ① CORS（Cross-Origin Resource Sharing）の突破

ブラウザから直接外部APIを叩くため、CORSエラーが最大の壁になります。

- **GitHub API / OpenAI / Anthropic**: 基本的にブラウザからの直接リクエストが許可されている、または公式SDK側で対応可能です（Anthropic等はヘッダー設定に注意が必要な場合があります）。
- **Local LLM (Ollama等)**: デフォルトではローカルホスト（PWA側）からのリクエストを弾きます。ユーザーのPC側でOllamaを起動する際、環境変数 `OLLAMA_ORIGINS="*"` またはPWAのドメインを許可するよう設定マニュアルを用意してください。

---

## ② AI出力のJSONパースの堅牢化

LLMにファイルパスとコンテンツを生成させる際、必ずJSON配列形式で出力させます。LLMが前後に余計なテキスト（「わかりました、以下の通りです」等）を含めることがあるため、レスポンス文字列から `[` と `]` の間だけを正規表現で抽出してから `JSON.parse` するロジックを必ず実装してください。

```typescript
// 実装例
function extractJsonArray(rawResponse: string): any[] {
  const match = rawResponse.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");
  return JSON.parse(match[0]);
}
```

---

## ③ GitHub API更新時の競合（Conflict）対策

既存のMarkdown（例: `Work_Log.md`）に追記（Append）や上書きをする場合、Octokitの `createOrUpdateFileContents` には**対象ファイルの最新の `sha`（ハッシュ値）**が必要です。

更新処理の直前に必ず `getContent` で最新の `sha` を取得してからコミットを投げるフローにしてください。

```typescript
// 実装フロー
const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
const sha = Array.isArray(data) ? undefined : data.sha;

await octokit.rest.repos.createOrUpdateFileContents({
  owner, repo, path,
  message: "Auto-update by AI agent",
  content: btoa(unescape(encodeURIComponent(newContent))),
  sha, // 必須: 最新のshaを渡す
});
```

---

## ④ プロンプトインジェクション（動的構築）

ユーザーのチャット入力に対し、リポジトリの `schemas/` ディレクトリから取得したルールテキストと、`[[リンク]]` 先のファイルテキストをバックグラウンドで結合し、1つの巨大な `system` および `user` プロンプトとしてLLMに送信してください。

```typescript
// プロンプト組み立てイメージ
const systemPrompt = [
  baseSchema,        // schemas/base.md
  personaSchema,     // schemas/persona-ios.md など（UIで選択）
].join("\n\n---\n\n");

const userPrompt = await expandWikiLinks(userInput); // [[ファイル名]] を展開
```
