import type { Conversation } from '../types/chat'

type SidebarProps = {
  conversations: Conversation[]
  activeConversationId: string
  disabled: boolean
  onNewConversation: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

function Sidebar({
  conversations,
  activeConversationId,
  disabled,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>历史会话</strong>
        <button type="button" onClick={onNewConversation} disabled={disabled}>
          ＋ 新建
        </button>
      </div>

      <div className="conversation-list">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId

          return (
            <div
              key={conversation.id}
              className={
                isActive ? 'conversation-row active' : 'conversation-row'
              }
            >
              <button
                type="button"
                className="conversation-item"
                onClick={() => onSelectConversation(conversation.id)}
                disabled={disabled}
              >
                <span>{conversation.title}</span>
                <time>
                  {new Date(conversation.updatedAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </button>

              <button
                type="button"
                className="delete-conversation"
                aria-label={`删除会话：${conversation.title}`}
                title="删除会话"
                onClick={() => onDeleteConversation(conversation.id)}
                disabled={disabled}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
