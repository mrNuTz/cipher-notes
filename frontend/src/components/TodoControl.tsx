import {Checkbox, Divider, Flex, Stack, Textarea} from '@mantine/core'
import {Todo, Todos} from '../business/models'
import {useEffect, useMemo, useRef, useState} from 'react'
import {draggable, dropTargetForElements} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  attachClosestEdge,
  Edge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import {getReorderDestinationIndex} from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index'
import {IconGridDots} from './icons/IconGridDots'

export type TodoControlProps = {
  todos: Todos
  onTodoChecked?: (index: number, checked: boolean) => void
  onTodoChanged?: (index: number, txt: string) => void
  onInsertTodo?: (bellow: number) => void
  onTodoDeleted?: (index: number) => void
  onUndo?: () => void
  onRedo?: () => void
  onUp?: () => void
  onMoveTodo?: (source: number, target: number) => void
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
  onMoveTodo,
}: TodoControlProps) => (
  <Stack flex={1} style={{overflowY: 'auto'}} gap={0}>
    {todos.map((todo, i) =>
      todo.done ? null : (
        <TodoItem
          key={i}
          todo={todo}
          i={i}
          onTodoChecked={onTodoChecked}
          onTodoChanged={onTodoChanged}
          onInsertTodo={onInsertTodo}
          onTodoDeleted={onTodoDeleted}
          onUndo={onUndo}
          onRedo={onRedo}
          onUp={onUp}
          onMoveTodo={onMoveTodo}
        />
      )
    )}
    <Divider m='5px 0' />
    {todos.map((todo, i) =>
      todo.done ? <TodoItem key={i} todo={todo} i={i} onTodoChecked={onTodoChecked} /> : null
    )}
  </Stack>
)

const TodoItem = ({
  todo,
  i,
  onTodoChecked,
  onTodoChanged,
  onInsertTodo,
  onTodoDeleted,
  onUndo,
  onRedo,
  onUp,
  onMoveTodo,
}: {
  todo: Todo
  i: number
  onTodoChecked?: (index: number, checked: boolean) => void
  onTodoChanged?: (index: number, txt: string) => void
  onInsertTodo?: (bellow: number) => void
  onTodoDeleted?: (index: number) => void
  onUndo?: () => void
  onRedo?: () => void
  onUp?: () => void
  onMoveTodo?: (source: number, target: number) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const [highlightedEdge, setHighlightedEdge] = useState<Edge | null>(null)
  const data = useMemo(() => ({i}), [i])

  useEffect(() => {
    const draggableCleanup = draggable({
      element: containerRef.current!,
      dragHandle: handleRef.current!,
      getInitialData: () => data,
      canDrag: () => !todo.done,
    })
    const dropTargetCleanup = dropTargetForElements({
      element: containerRef.current!,
      canDrop: () => !todo.done,
      getData({input}) {
        return attachClosestEdge(data, {
          element: containerRef.current!,
          input,
          allowedEdges: ['top', 'bottom'],
        })
      },
      onDrag({self, source}) {
        if (self.element === source.element) return
        setHighlightedEdge(extractClosestEdge(self.data))
      },
      onDragLeave() {
        setHighlightedEdge(null)
      },
      onDrop({self, source}) {
        setHighlightedEdge(null)
        if (
          source.data.i !== self.data.i &&
          typeof source.data.i === 'number' &&
          typeof self.data.i === 'number'
        ) {
          const edge = extractClosestEdge(self.data)
          const dest = getReorderDestinationIndex({
            startIndex: source.data.i,
            closestEdgeOfTarget: edge,
            indexOfTarget: self.data.i,
            axis: 'vertical',
          })
          if (source.data.i !== dest) {
            onMoveTodo?.(source.data.i, dest)
          }
        }
      },
    })
    return () => {
      draggableCleanup()
      dropTargetCleanup()
    }
  }, [i, todo.done, data, onMoveTodo])

  return (
    <Flex
      ref={containerRef}
      align='center'
      p='2px 0'
      gap={0}
      className='todo-list-item'
      pos='relative'
    >
      <div ref={handleRef} style={{padding: '0 12px 0 0'}}>
        <IconGridDots style={{display: 'block', opacity: todo.done ? 0.2 : 0.5}} />
      </div>
      <Checkbox
        tabIndex={onTodoChecked ? undefined : -1}
        size='md'
        checked={todo.done}
        readOnly={!onTodoChecked}
        onChange={(e) => onTodoChecked?.(i, e.target.checked)}
        style={{userSelect: 'none'}}
      />
      <Textarea
        tabIndex={onTodoChanged ? undefined : -1}
        placeholder='To do...'
        styles={{
          input: {
            border: 'none',
            backgroundColor: 'transparent',
            textDecoration: todo.done ? 'line-through' : 'none',
          },
        }}
        flex={1}
        autosize
        minRows={1}
        maxRows={10}
        value={todo.txt}
        disabled={todo.done}
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
      <DropIndicator edge={highlightedEdge} />
    </Flex>
  )
}

const DropIndicator = ({edge}: {edge: Edge | null}) =>
  edge !== null &&
  (edge === 'top' || edge === 'bottom') && (
    <div
      style={{
        position: 'absolute',
        top: edge === 'top' ? 0 : undefined,
        left: 0,
        right: 0,
        bottom: edge === 'bottom' ? 0 : undefined,
        border: '2px solid var(--mantine-primary-color-filled)',
      }}
    />
  )
