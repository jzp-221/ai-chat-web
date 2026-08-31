export type ModelId =
  | 'mock-fast'
  | 'mock-balanced'
  | 'mock-creative'
  | 'real-ai'

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type Conversation = {
  id: string
  title: string
  model: ModelId
  messages: Message[]
  updatedAt: number
}
