import { describe, it, expect } from 'vitest'
import { hwfHex } from '../src/components/ui/halftone-wordmark-footer'

describe('hwfHex', () => {
  it('parses 6-character hex with hash', () => {
    expect(hwfHex('#ff0000')).toEqual([255, 0, 0])
    expect(hwfHex('#00ff00')).toEqual([0, 255, 0])
    expect(hwfHex('#0000ff')).toEqual([0, 0, 255])
    expect(hwfHex('#ffffff')).toEqual([255, 255, 255])
    expect(hwfHex('#000000')).toEqual([0, 0, 0])
    expect(hwfHex('#123456')).toEqual([18, 52, 86])
  })

  it('parses 6-character hex without hash', () => {
    expect(hwfHex('ff0000')).toEqual([255, 0, 0])
    expect(hwfHex('123456')).toEqual([18, 52, 86])
  })

  it('parses 3-character hex with hash', () => {
    expect(hwfHex('#f00')).toEqual([255, 0, 0])
    expect(hwfHex('#0f0')).toEqual([0, 255, 0])
    expect(hwfHex('#00f')).toEqual([0, 0, 255])
    expect(hwfHex('#fff')).toEqual([255, 255, 255])
    expect(hwfHex('#000')).toEqual([0, 0, 0])
    expect(hwfHex('#123')).toEqual([17, 34, 51])
  })

  it('parses 3-character hex without hash', () => {
    expect(hwfHex('f00')).toEqual([255, 0, 0])
    expect(hwfHex('123')).toEqual([17, 34, 51])
  })

  it('ignores case', () => {
    expect(hwfHex('#FF0000')).toEqual([255, 0, 0])
    expect(hwfHex('#Ff0000')).toEqual([255, 0, 0])
    expect(hwfHex('AbC')).toEqual([170, 187, 204])
  })

  it('ignores surrounding whitespace', () => {
    expect(hwfHex('  #ff0000  ')).toEqual([255, 0, 0])
    expect(hwfHex('\n#ff0000\t')).toEqual([255, 0, 0])
  })

  it('returns null for invalid hex strings', () => {
    expect(hwfHex('')).toBeNull()
    expect(hwfHex(' ')).toBeNull()
    expect(hwfHex('red')).toBeNull()
    expect(hwfHex('#ff')).toBeNull() // Too short
    expect(hwfHex('#ffff')).toBeNull() // Invalid length
    expect(hwfHex('#ff00000')).toBeNull() // Too long
    expect(hwfHex('#gg0000')).toBeNull() // Invalid characters
    expect(hwfHex('ff 00 00')).toBeNull() // Spaces inside
    expect(hwfHex('##ff0000')).toBeNull() // Multiple hashes
  })
})
