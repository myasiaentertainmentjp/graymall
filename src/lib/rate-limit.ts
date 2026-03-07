// シンプルなインメモリレートリミッター
// 本番環境ではRedis等の使用を推奨

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// 古いエントリを定期的にクリーンアップ
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((entry, key) => {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key)
    }
  })
}, 60000) // 1分ごとにクリーンアップ

export interface RateLimitConfig {
  maxRequests: number // 最大リクエスト数
  windowMs: number // ウィンドウ時間（ミリ秒）
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const entry = rateLimitMap.get(key)

  // 新規または期限切れ
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  // リミット超過
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  // カウント増加
  entry.count++
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

// API用のレートリミット設定
export const RATE_LIMITS = {
  checkout: { maxRequests: 10, windowMs: 60000 }, // 1分に10回
  webhook: { maxRequests: 100, windowMs: 60000 }, // 1分に100回
  auth: { maxRequests: 20, windowMs: 60000 }, // 1分に20回
}
