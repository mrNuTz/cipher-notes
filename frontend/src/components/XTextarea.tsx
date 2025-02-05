import Editor from 'react-simple-code-editor'

export type XTextareaProps = {
  value: string
  onChange: (value: string) => void
  onUndo: () => void
  onRedo: () => void
  onUp: () => void
}
export const XTextarea = ({value, onChange, onUndo, onRedo, onUp}: XTextareaProps) => {
  return (
    <Editor
      className='x-textarea'
      tabSize={2}
      insertSpaces={true}
      value={value}
      onValueChange={onChange}
      highlight={(value) => <>{value}</>}
      onKeyDown={(e) => {
        if (
          e.currentTarget instanceof HTMLTextAreaElement &&
          (e.key === 'Backspace' || e.key === 'ArrowUp') &&
          e.currentTarget.selectionStart === 0
        ) {
          e.preventDefault()
          onUp()
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
            onRedo()
          } else {
            onUndo()
          }
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault()
          onRedo()
        }
      }}
      style={{
        fontFamily: "Monaco, 'Cascadia Code', Consolas, monospace",
        flex: '1 1 0',
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        margin: '4px 0',
        tabSize: 2,
      }}
    />
  )
}
