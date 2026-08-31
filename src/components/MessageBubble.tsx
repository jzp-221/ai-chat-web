import { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'
import type { Message } from '../types/chat'

type MessageBubbleProps = {
  message: Message
}

type MarkdownCodeProps = {
  className?: string
  children?: ReactNode
}

function MarkdownCode({ className, children }: MarkdownCodeProps) {
  const [copied, setCopied] = useState(false)
  const language = /language-(\w+)/.exec(className ?? '')?.[1]
  const code = String(children).replace(/\n$/, '')

  if (!language) {
    return <code className={className}>{children}</code>
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span>{language}</span>
        <button type="button" onClick={handleCopy}>
          {copied ? '已复制' : '复制代码'}
        </button>
      </div>
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

function MessageBubble({ message }: MessageBubbleProps) {
  if (!message.content) {
    return null
  }

  const className =
    message.role === 'user'
      ? 'message user-message'
      : 'message ai-message'

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: MarkdownCode,
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  )
}

export default MessageBubble
