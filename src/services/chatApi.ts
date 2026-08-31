import type { Message, ModelId } from '../types/chat'
import { streamMockReply } from './mockChatApi'

type StreamChatReplyOptions = {
  model: ModelId
  prompt: string
  messages: Message[]
  signal: AbortSignal
  onChunk: (chunk: string) => void
}

const chatMode = import.meta.env.VITE_CHAT_MODE ?? 'backend'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

async function streamBackendReply({
  model,
  messages,
  signal,
  onChunk,
}: StreamChatReplyOptions) {
  const response = await fetch(`${apiBaseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`请求失败：HTTP ${response.status}`)
  }

  if (!response.body) {
    throw new Error('浏览器未收到流式响应')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      const data = event
        .split('\n')
        .find((line) => line.startsWith('data:'))
        ?.slice(5)
        .trim()

      if (!data) {
        continue
      }

      if (data === '[DONE]') {
        return
      }

      const payload = JSON.parse(data) as { content?: string }

      if (payload.content) {
        onChunk(payload.content)
      }
    }
  }
}

export async function streamChatReply(options: StreamChatReplyOptions) {
  if (chatMode === 'mock') {
    await streamMockReply(options)
    return
  }

  await streamBackendReply(options)
}
