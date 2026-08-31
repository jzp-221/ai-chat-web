type ChatInputProps = {
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSend: () => void
  onStop: () => void
}

function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSend,
  onStop,
}: ChatInputProps) {
  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          placeholder="请输入消息，Shift + Enter 换行"
          value={input}
          rows={2}
          maxLength={2000}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSend()
            }
          }}
        />

        <span className="character-count">{input.length}/2000</span>
      </div>

      <button
        className={isLoading ? 'stop-button' : ''}
        onClick={isLoading ? onStop : onSend}
        disabled={!isLoading && !input.trim()}
      >
        {isLoading ? '停止生成' : '发送消息'}
      </button>
    </div>
  )
}

export default ChatInput
