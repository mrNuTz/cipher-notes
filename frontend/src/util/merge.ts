import {diff3Merge} from 'node-diff3'

export function threeWayMerge(baseText: string, localText: string, serverText: string): string {
  const diff = diff3Merge(localText.split('\n'), baseText.split('\n'), serverText.split('\n'))
  return diff
    .flatMap((block) =>
      block.ok
        ? block.ok
        : block.conflict
        ? ['<<<<<<< LOCAL', ...block.conflict.a, '=======', ...block.conflict.b, '>>>>>>> SERVER']
        : []
    )
    .join('\n')
}
