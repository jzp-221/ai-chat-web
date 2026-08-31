import { useEffect, useRef, useState } from 'react'
import './App.css'
import ChatHeader from './components/ChatHeader'
import ChatInput from './components/ChatInput'
import MessageList from './components/MessageList'
import ModelSelector from './components/ModelSelector'
import Sidebar from './components/Sidebar'
import { streamChatReply } from './services/chatApi'
import type { Conversation, Message, ModelId } from './types/chat'

const EMPTY_MESSAGES: Message[] = []

const createConversation = (messages: Message[] = []): Conversation => ({
  id: crypto.randomUUID(),
  title:
    messages.find((message) => message.role === 'user')?.content.slice(0, 22) ||
    '新对话',
  model: 'mock-fast',
  messages,
  updatedAt: Date.now(),
})

const loadConversations = (): Conversation[] => {
  try {
    const savedConversations = localStorage.getItem('ai-chat-conversations')

    if (savedConversations) {
      const conversations = JSON.parse(savedConversations) as Array<
        Conversation & { model?: ModelId }
      >

      if (conversations.length > 0) {
        return conversations.map((conversation) => ({
          ...conversation,
          model: conversation.model ?? 'mock-fast',
        }))
      }
    }

    const savedMessages = localStorage.getItem('ai-chat-messages')
    const legacyMessages = savedMessages
      ? (JSON.parse(savedMessages) as Message[])
      : []

    return [createConversation(legacyMessages)]
  } catch {
    return [createConversation()]
  }
}

function App() {
  const [input, setInput] = useState('')
  const [conversations, setConversations] =
    useState<Conversation[]>(loadConversations)
  const [activeConversationId, setActiveConversationId] = useState(() => {
    const savedId = localStorage.getItem('ai-chat-active-conversation')

    return conversations.some((conversation) => conversation.id === savedId)
      ? savedId!
      : conversations[0].id
  })
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  )
  const messages = activeConversation?.messages ?? EMPTY_MESSAGES
  const selectedModel = activeConversation?.model ?? 'mock-fast'

  const updateActiveMessages = (
    updater: (currentMessages: Message[]) => Message[],
  ) => {
    setConversations((currentConversations) =>
      currentConversations.map((conversation) => {
        if (conversation.id !== activeConversationId) {
          return conversation
        }

        const nextMessages = updater(conversation.messages)
        const firstUserMessage = nextMessages.find(
          (message) => message.role === 'user',
        )

        return {
          ...conversation,
          title: firstUserMessage?.content.slice(0, 22) || '新对话',
          messages: nextMessages,
          updatedAt: Date.now(),
        }
      }),
    )
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isLoading])
  useEffect(() => {
    localStorage.setItem('ai-chat-conversations', JSON.stringify(conversations))
    localStorage.setItem('ai-chat-active-conversation', activeConversationId)
  }, [conversations, activeConversationId])
  useEffect(() => {
    return () => abortControllerRef.current?.abort()
  }, [])

  const startAssistantReply = async (
    prompt: string,
    requestMessages: Message[],
  ) => {
    const controller = new AbortController()
    let didTimeout = false
    const timeoutTimer = window.setTimeout(() => {
      didTimeout = true
      controller.abort()
    }, 60_000)

    abortControllerRef.current = controller
    setIsLoading(true)

    updateActiveMessages((currentMessages) => [
      ...currentMessages,
      {
        role: 'assistant',
        content: '',
      },
    ])

    try {
      await streamChatReply({
        model: selectedModel,
        prompt,
        messages: requestMessages,
        signal: controller.signal,
        onChunk: (chunk) => {
          updateActiveMessages((currentMessages) => {
            const nextMessages = [...currentMessages]
            const lastMessage = nextMessages[nextMessages.length - 1]

            if (lastMessage?.role !== 'assistant') {
              return currentMessages
            }

            nextMessages[nextMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + chunk,
            }

            return nextMessages
          })
        },
      })
    } catch (error) {
      if (didTimeout) {
        updateActiveMessages((currentMessages) => {
          const nextMessages = [...currentMessages]
          const lastMessage = nextMessages[nextMessages.length - 1]

          if (lastMessage?.role === 'assistant') {
            nextMessages[nextMessages.length - 1] = {
              ...lastMessage,
              content: '请求超时，请检查网络后重新生成。',
            }
          }

          return nextMessages
        })
      } else if (!(error instanceof DOMException && error.name === 'AbortError')) {
        updateActiveMessages((currentMessages) => {
          const nextMessages = [...currentMessages]
          const lastMessage = nextMessages[nextMessages.length - 1]

          if (lastMessage?.role === 'assistant') {
            nextMessages[nextMessages.length - 1] = {
              ...lastMessage,
              content: '请求失败，请稍后重新生成。',
            }
          }

          return nextMessages
        })
      }
    } finally {
      window.clearTimeout(timeoutTimer)

      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
    }
  }

  const handleSend = () => {
    const currentInput = input.trim()

    if (!currentInput || isLoading) {
      return
    }

    const userMessage: Message = {
      role: 'user',
      content: currentInput,
    }

    updateActiveMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ])

    setInput('')
    startAssistantReply(currentInput, [...messages, userMessage])
  }
  const handleStop = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null

    setIsLoading(false)
    updateActiveMessages((currentMessages) => {
      const lastMessage = currentMessages[currentMessages.length - 1]

      return lastMessage?.role === 'assistant' && !lastMessage.content
        ? currentMessages.slice(0, -1)
        : currentMessages
    })
  }

  const handleRegenerate = () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user')

    if (!lastUserMessage || isLoading) {
      return
    }

    const requestMessages =
      messages[messages.length - 1]?.role === 'assistant'
        ? messages.slice(0, -1)
        : messages

    updateActiveMessages((currentMessages) => {
      const lastMessage = currentMessages[currentMessages.length - 1]

      return lastMessage?.role === 'assistant'
        ? currentMessages.slice(0, -1)
        : currentMessages
    })

    startAssistantReply(lastUserMessage.content, requestMessages)
  }

  const handleClear = () => {
    updateActiveMessages(() => [])
  }

  const handleModelChange = (model: ModelId) => {
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === activeConversationId
          ? { ...conversation, model, updatedAt: Date.now() }
          : conversation,
      ),
    )
  }

  const handleNewConversation = () => {
    handleStop()
    const conversation = createConversation()

    setConversations((currentConversations) => [
      conversation,
      ...currentConversations,
    ])
    setActiveConversationId(conversation.id)
    setInput('')
  }

  const handleSelectConversation = (id: string) => {
    if (id === activeConversationId) {
      return
    }

    handleStop()
    setActiveConversationId(id)
    setInput('')
  }

  const handleDeleteConversation = (id: string) => {
    const conversation = conversations.find((item) => item.id === id)

    if (!conversation || !window.confirm(`确定删除“${conversation.title}”吗？`)) {
      return
    }

    handleStop()
    const remainingConversations = conversations.filter((item) => item.id !== id)

    if (remainingConversations.length === 0) {
      const newConversation = createConversation()
      setConversations([newConversation])
      setActiveConversationId(newConversation.id)
    } else {
      setConversations(remainingConversations)

      if (id === activeConversationId) {
        setActiveConversationId(remainingConversations[0].id)
      }
    }

    setInput('')
  }

  return (
    <div className="app-shell">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        disabled={isLoading}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="chat-app">
      <ChatHeader
        isLoading={isLoading}
        hasMessages={messages.length > 0}
        onClear={handleClear}
      />

      <ModelSelector
        value={selectedModel}
        disabled={isLoading}
        onChange={handleModelChange}
      />

      <MessageList
        messages={messages}
        isLoading={isLoading}
        endRef={messagesEndRef}
      />

      {messages[messages.length - 1]?.role === 'assistant' && !isLoading && (
        <div className="message-actions">
          <button type="button" onClick={handleRegenerate}>
            ↻ 重新生成
          </button>
        </div>
      )}

      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSend={handleSend}
        onStop={handleStop}
      />
      </main>
    </div>
  )
}
export default App
