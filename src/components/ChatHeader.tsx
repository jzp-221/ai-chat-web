type ChatHeaderProps = {
  isLoading: boolean
  hasMessages: boolean
  onClear: () => void
}

function ChatHeader({ isLoading, hasMessages, onClear }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div>
        <h1>AI 智能对话助手</h1>
        <p className="subtitle">有什么可以帮助你的吗？</p>
      </div>

      <button
        type="button"
        className="clear-button"
        onClick={onClear}
        disabled={isLoading || !hasMessages}
      >
        清空对话
      </button>
    </header>
  )
}

export default ChatHeader
