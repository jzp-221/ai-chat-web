import type { ModelId } from '../types/chat'

export const MODEL_OPTIONS: Array<{ id: ModelId; name: string }> = [
  { id: 'mock-fast', name: 'Mock Fast' },
  { id: 'mock-balanced', name: 'Mock Balanced' },
  { id: 'mock-creative', name: 'Mock Creative' },
  { id: 'real-ai', name: 'Real AI（后端）' },
]

export function getMockDelay(model: ModelId) {
  if (model === 'mock-fast') {
    return 500
  }

  if (model === 'mock-creative') {
    return 1500
  }

  return 1000
}

export function createMockReply(model: ModelId, prompt: string) {
  if (/代码|code|typescript|javascript/i.test(prompt)) {
    return [
      '下面是一段支持语法高亮的 TypeScript 示例：',
      '',
      '```ts',
      "function greet(name: string) {",
      "  return `Hello, ${name}!`",
      '}',
      '',
      "console.log(greet('AI'))",
      '```',
    ].join('\n')
  }

  if (model === 'mock-fast') {
    return `收到：“${prompt}”`
  }

  if (model === 'mock-creative') {
    return `关于“${prompt}”，我们可以换一个更有想象力的角度来思考。`
  }

  return `我收到了你的消息：“${prompt}”。这是一个均衡、清晰的模拟回复。`
}
