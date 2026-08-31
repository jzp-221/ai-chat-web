import {
  createMockReply,
  getMockDelay,
} from '../constants/models'
import type { ModelId } from '../types/chat'

type StreamMockReplyOptions = {
  model: ModelId
  prompt: string
  signal: AbortSignal
  onChunk: (chunk: string) => void
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve()
    }, ms)

    const handleAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('生成已停止', 'AbortError'))
    }

    if (signal.aborted) {
      handleAbort()
      return
    }

    signal.addEventListener('abort', handleAbort, { once: true })
  })
}

export async function streamMockReply({
  model,
  prompt,
  signal,
  onChunk,
}: StreamMockReplyOptions) {
  if (prompt.includes('模拟失败')) {
    await wait(400, signal)
    throw new Error('模拟网络请求失败')
  }

  if (prompt.includes('模拟超时')) {
    await wait(10_000, signal)
  }

  const reply = createMockReply(model, prompt)
  const chunkDelay = Math.max(12, Math.round(getMockDelay(model) / 35))

  await wait(250, signal)

  for (const character of reply) {
    await wait(chunkDelay, signal)
    onChunk(character)
  }
}
