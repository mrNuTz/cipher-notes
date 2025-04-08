import {Hue, Label} from '../business/models'
import {db, labelsObservable} from '../db'
import {setState} from './store'

export type LabelsState = {
  labelsCache: Record<string, Label>
}

export const labelsInit: LabelsState = {
  labelsCache: {},
}

labelsObservable.subscribe((labels) => {
  setState((state) => {
    state.labels.labelsCache = labels.reduce((acc, label) => {
      acc[label.id] = label
      return acc
    }, {} as Record<string, Label>)
  })
})

export const createLabel = async (name: string) => {
  const label: Label = {
    id: crypto.randomUUID(),
    name,
    hue: null,
    version: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: 0,
    state: 'dirty',
  }
  await db.labels.add(label)
}

export const updateLabel = (id: string, props: {name?: string; hue?: Hue}) =>
  db.labels
    .where('id')
    .equals(id)
    .and((l) => l.deleted_at === 0)
    .modify((label) => {
      if (props.name !== undefined) {
        label.name = props.name
      }
      if (props.hue !== undefined) {
        label.hue = props.hue
      }
      label.updated_at = Date.now()
      label.state = 'dirty'
    })

export const deleteLabel = async (id: string) => {
  const label = await db.labels.get(id)
  if (!label || label.deleted_at > 0) {
    return
  }
  if (label.state === 'dirty' && label.version === 1) {
    await db.labels.delete(id)
    return
  }
  await db.labels.update(id, {
    deleted_at: Date.now(),
    state: 'dirty',
    version: label.state === 'dirty' ? label.version : label.version + 1,
  })
  await db.notes
    .where('deleted_at')
    .equals(0)
    .and((note) => note.labels?.includes(id) ?? false)
    .modify((note) => {
      note.labels = note.labels?.filter((l) => l !== id)
      if (note.state === 'synced') {
        note.state = 'dirty'
        note.version = note.version + 1
      }
      note.updated_at = Date.now()
    })
}
