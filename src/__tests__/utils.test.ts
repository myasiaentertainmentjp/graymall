import { describe, it, expect } from 'vitest'

// ユーティリティ関数のテスト例

describe('formatPrice', () => {
  const formatPrice = (price: number): string => {
    if (price === 0) return '無料'
    return `¥${price.toLocaleString()}`
  }

  it('should return "無料" for price 0', () => {
    expect(formatPrice(0)).toBe('無料')
  })

  it('should format price with yen symbol', () => {
    expect(formatPrice(1000)).toBe('¥1,000')
  })

  it('should format large prices with commas', () => {
    expect(formatPrice(1000000)).toBe('¥1,000,000')
  })
})

describe('formatTimeAgo', () => {
  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return '今'
    if (diffMinutes < 60) return `${diffMinutes}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 30) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  it('should return empty string for null', () => {
    expect(formatTimeAgo(null)).toBe('')
  })

  it('should return "今" for recent time', () => {
    const now = new Date().toISOString()
    expect(formatTimeAgo(now)).toBe('今')
  })

  it('should return minutes ago', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    expect(formatTimeAgo(tenMinutesAgo)).toBe('10分前')
  })

  it('should return hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(formatTimeAgo(twoHoursAgo)).toBe('2時間前')
  })

  it('should return days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatTimeAgo(threeDaysAgo)).toBe('3日前')
  })
})

describe('isValidUrl', () => {
  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString)
      return ['http:', 'https:'].includes(url.protocol) ||
        (url.protocol === 'data:' && urlString.startsWith('data:image/'))
    } catch {
      return false
    }
  }

  it('should return true for valid https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('should return true for valid http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('should return false for invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
  })

  it('should return false for javascript: protocol', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })

  it('should return true for data:image URL', () => {
    expect(isValidUrl('data:image/png;base64,abc123')).toBe(true)
  })
})
