import { MODEL_OPTIONS } from '../constants/models'
import type { ModelId } from '../types/chat'

type ModelSelectorProps = {
  value: ModelId
  disabled: boolean
  onChange: (value: ModelId) => void
}

function ModelSelector({ value, disabled, onChange }: ModelSelectorProps) {
  return (
    <div className="model-toolbar">
      <label htmlFor="model-select">对话模型</label>

      <select
        id="model-select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ModelId)}
      >
        {MODEL_OPTIONS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ModelSelector
