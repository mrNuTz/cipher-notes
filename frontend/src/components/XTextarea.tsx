export type XTextareaProps = {
  value: string
  onChange: (value: string) => void
  onUndo: () => void
  onRedo: () => void
  onUp: () => void
}
export const XTextarea = ({value, onChange, onUndo, onRedo, onUp}: XTextareaProps) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (
          (e.key === 'Backspace' || e.key === 'ArrowUp') &&
          e.currentTarget.selectionStart === 0
        ) {
          e.preventDefault()
          onUp()
        }
        if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey) {
          e.preventDefault()
          const target = e.currentTarget
          const cursor = target.selectionStart
          const value = target.value
          onChange(value.slice(0, cursor) + '\t' + value.slice(cursor))
          Promise.resolve().then(() => {
            target.selectionStart = cursor + 1
            target.selectionEnd = cursor + 1
          })
        }

        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
            onRedo()
          } else {
            onUndo()
          }
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault()
          onRedo()
        }
      }}
      style={{
        fontFamily: "Monaco, 'Cascadia Code', Consolas, monospace",
        resize: 'none',
        flex: '1 1 0',
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        margin: '4px 0',
        tabSize: 4,
      }}
    />
  )
}
