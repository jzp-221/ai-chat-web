import { lazy, Suspense, type RefObject } from 'react'
import type { Message } from '../types/chat'

const MessageBubble = lazy(() => import('./MessageBubble'))

type MessageListProps = {
  messages: Message[]
  isLoading: boolean
  endRef: RefObject<HTMLDivElement | null>
}

function MessageList({ messages, isLoading, endRef }: MessageListProps) {
  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <p>开始一段新对话</p>
          <span>在下方输入问题，我会为你生成模拟回复</span>
        </div>
      )}

      {messages.map((message, index) => (
        <Suspense
          key={index}
          fallback={
            <p
              className={
                message.role === 'user'
                  ? 'message user-message'
                  : 'message ai-message'
              }
            >
              {message.content}
            </p>
          }
        >
          <MessageBubble message={message} />
        </Suspense>
      ))}

      {isLoading && (
        <div
          className="message ai-message typing-indicator"
          aria-label="AI 正在输入"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}

      <div ref={endRef}></div>
    </div>
  )
}

export default MessageList
