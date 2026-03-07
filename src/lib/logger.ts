// 本番環境では最小限のログのみ出力
const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  // 開発環境のみ出力
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  // 開発環境のみ出力
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log('[INFO]', ...args)
    }
  },

  // 警告は常に出力
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },

  // エラーは常に出力（本番でも必要）
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  },
}
