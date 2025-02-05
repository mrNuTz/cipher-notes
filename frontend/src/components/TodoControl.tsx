import {Checkbox, Flex, Stack, Textarea} from '@mantine/core'
import {Todos} from '../business/models'

export type TodoControlProps = {
  todos: Todos
  onTodoChecked?: (index: number, checked: boolean) => void
  onTodoChanged?: (index: number, txt: string) => void
  onInsertTodo?: (bellow: number) => void
  onTodoDeleted?: (index: number) => void
  onUndo?: () => void
  onRedo?: () => void
  onUp?: () => void
}
export const TodoControl = ({
  todos,
  onTodoChecked,
  onTodoChanged,
  onInsertTodo,
  onTodoDeleted,
  onUndo,
  onRedo,
  onUp,
}: TodoControlProps) => {
  return (
    <Stack flex={1} gap='xs' style={{overflowY: 'auto'}}>
      {todos.map((todo, i) => (
        <Flex key={i} align='center' gap='xs' className='todo-list-item'>
          <Checkbox
            tabIndex={onTodoChecked ? undefined : -1}
            size='md'
            checked={todo.done}
            readOnly={!onTodoChecked}
            onChange={(e) => onTodoChecked?.(i, e.target.checked)}
          />
          <Textarea
            tabIndex={onTodoChanged ? undefined : -1}
            placeholder='To do...'
            styles={{input: {border: 'none', backgroundColor: 'transparent'}}}
            flex={1}
            autosize
            minRows={1}
            maxRows={10}
            value={todo.txt}
            readOnly={!onTodoChanged}
            onChange={(e) => onTodoChanged?.(i, e.target.value)}
            onKeyDown={(e) => {
              if (
                i === 0 &&
                e.currentTarget.selectionStart === 0 &&
                (e.key === 'Backspace' || e.key === 'ArrowUp')
              ) {
                e.preventDefault()
                onUp?.()
              }
              if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault()
                if (e.shiftKey) {
                  onRedo?.()
                } else {
                  onUndo?.()
                }
              }
              if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault()
                onRedo?.()
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onInsertTodo?.(i)
                const target = e.currentTarget
                Promise.resolve().then(() => {
                  target
                    .closest('.todo-list-item')
                    ?.nextElementSibling?.querySelector('textarea')
                    ?.focus()
                })
              }
              if (e.key === 'Backspace' && todo.txt === '') {
                e.preventDefault()
                e.currentTarget
                  .closest('.todo-list-item')
                  ?.previousElementSibling?.querySelector('textarea')
                  ?.focus()
                onTodoDeleted?.(i)
              }
              const target = e.currentTarget
              if (e.key === 'ArrowDown' && target.selectionEnd === todo.txt.length) {
                target
                  .closest('.todo-list-item')
                  ?.nextElementSibling?.querySelector('textarea')
                  ?.focus()
              }
              if (e.key === 'ArrowUp' && target.selectionEnd === 0) {
                target
                  .closest('.todo-list-item')
                  ?.previousElementSibling?.querySelector('textarea')
                  ?.focus()
              }
            }}
          />
        </Flex>
      ))}
    </Stack>
  )
}
