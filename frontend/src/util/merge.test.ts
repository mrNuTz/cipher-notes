import {describe, it, expect} from 'vitest'
import {longestCommonSubsequence, threeWayMerge, twoWayMerge} from './merge'

describe('threeWayMerge', () => {
  it('should merge notes text', () => {
    const baseText = 'line1\nline2\nline3\nline4\nline5'
    const localText = baseText
    const serverText = baseText
    const mergedText = threeWayMerge(baseText, localText, serverText)
    expect(mergedText).toBe(baseText)
  })
  it('should merge notes text with insertion', () => {
    const baseText = 'line1\nline2\nline3\nline4\nline5'
    const localText = 'line1\nline2\nline3\nline3.5\nline4\nline5'
    const serverText = 'line1\nline2\nline3\nline4\nline5'
    const mergedText = threeWayMerge(baseText, localText, serverText)
    expect(mergedText).toBe(localText)
  })
  it('should merge notes text with deletion', () => {
    const baseText = 'line1\nline2\nline3\nline4\nline5'
    const localText = 'line1\nline2\nline4\nline5'
    const serverText = 'line1\nline2\nline3\nline4\nline5'
    const mergedText = threeWayMerge(baseText, localText, serverText)
    expect(mergedText).toBe(localText)
  })
  it('should merge notes text with 2 deletion', () => {
    const baseText = 'line1\nline2\nline3\nline4\nline5'
    const localText = 'line1\nline4\nline5'
    const serverText = 'line1\nline2\nline3\nline4\nline5'
    const mergedText = threeWayMerge(baseText, localText, serverText)
    expect(mergedText).toBe(localText)
  })
  it('should merge notes text with 2 deletion 2', () => {
    const baseText = 'line1\nline2\nline3\nline4\nline5'
    const localText = 'line2\nline3\nline4\nline5'
    const serverText = 'line1\nline2\nline4\nline5'
    const mergedText = threeWayMerge(baseText, localText, serverText)
    expect(mergedText).toBe('line2\nline4\nline5')
  })
  it('duplicate lines', () => {
    const baseText = 'line1\nline2\nline2\nline4\nline4\nline5'
    const localText = 'line1\nline2\nline2\nline4\nline5'
    const serverText = 'line1\nline2\nline4\nline4\nline5'
    const mergedText = threeWayMerge(baseText, localText, serverText)
    expect(mergedText).toBe('line1\nline2\nline4\nline5')
  })
  it('merges with conflict', () => {
    const baseText = 'line1\nline2\nline3\nline4\nline5'
    const localText = 'line1\nline2\nline3.1\nline4\nline5'
    const serverText = 'line1\nline2\nline3.2\nline4\nline5'
    const mergedText = threeWayMerge(baseText, localText, serverText)
    expect(mergedText).toBe(`line1
line2\n<<<<<<< LOCAL
line3.1
=======
line3.2
>>>>>>> SERVER
line4
line5`)
  })
})

describe('twoWayMerge', () => {
  it('should merge notes text', () => {
    const localText = 'line1\nline2\nline3\nline4\nline5'
    const serverText = 'line1\nline2\nline3\nline4\nline5'
    const mergedText = twoWayMerge(serverText, localText)
    expect(mergedText).toBe(localText)
  })
  it('should merge notes text with insertions', () => {
    const localText = 'line1\nline2\nline4\nline5'
    const serverText = 'line1\nline2\nline3\nline4\nline5'
    const mergedText = twoWayMerge(serverText, localText)
    expect(mergedText).toBe(serverText)
  })
  it('should merge notes text with insertions', () => {
    const localText = 'line1\nline2\nline4\nline5'
    const serverText = 'line2\nline3\nline4\nline5'
    const mergedText = twoWayMerge(serverText, localText)
    expect(mergedText).toBe('line1\nline2\nline3\nline4\nline5')
  })
  it('should merge notes text with conflict', () => {
    const localText = 'line1\nline2\nline3\nline4\nline5'
    const serverText = 'line1\nline2\nline3.1\nline4\nline5'
    const mergedText = twoWayMerge(serverText, localText)
    expect(mergedText).toBe(`line1
line2\n<<<<<<< LOCAL
line3
=======
line3.1
>>>>>>> SERVER
line4
line5`)
  })
})

describe('longestCommonSubsequence', () => {
  it('should return the longest common subsequence', () => {
    const a = ['line1', 'line2', 'line3', 'line4', 'line5']
    const b = ['line1', 'line2', 'line3', 'line4', 'line5']
    const lcs = longestCommonSubsequence(a, b)
    expect(lcs).toStrictEqual(['line1', 'line2', 'line3', 'line4', 'line5'])
  })
  it('should return the longest common subsequence 2', () => {
    const a = ['line2', 'line3', 'line4', 'line5']
    const b = ['line1', 'line2', 'line3', 'line4']
    const lcs = longestCommonSubsequence(a, b)
    expect(lcs).toStrictEqual(['line2', 'line3', 'line4'])
  })
  it('should return the longest common subsequence 3', () => {
    const a = ['line1', 'line2', 'line3', 'line4', 'line5']
    const b = ['line1', 'line2', 'line4', 'line5']
    const lcs = longestCommonSubsequence(a, b)
    expect(lcs).toStrictEqual(['line1', 'line2', 'line4', 'line5'])
  })
})
