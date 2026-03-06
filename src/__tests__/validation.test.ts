import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Zodバリデーションスキーマのテスト

describe('SignIn Schema', () => {
  const signInSchema = z.object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  })

  it('should pass with valid email and password', () => {
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid email', () => {
    const result = signInSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください')
    }
  })

  it('should fail with short password', () => {
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワードは6文字以上で入力してください')
    }
  })

  it('should fail with empty fields', () => {
    const result = signInSchema.safeParse({
      email: '',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('Profile Schema', () => {
  const profileSchema = z.object({
    displayName: z.string().max(50, '表示名は50文字以内で入力してください').optional(),
    bio: z.string().max(500, '自己紹介は500文字以内で入力してください').optional(),
  })

  it('should pass with valid profile data', () => {
    const result = profileSchema.safeParse({
      displayName: 'テストユーザー',
      bio: 'これは自己紹介です。',
    })
    expect(result.success).toBe(true)
  })

  it('should pass with empty optional fields', () => {
    const result = profileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should fail with too long display name', () => {
    const result = profileSchema.safeParse({
      displayName: 'a'.repeat(51),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('表示名は50文字以内で入力してください')
    }
  })

  it('should fail with too long bio', () => {
    const result = profileSchema.safeParse({
      bio: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('自己紹介は500文字以内で入力してください')
    }
  })
})

describe('Article Schema', () => {
  const articleSchema = z.object({
    title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
    price: z.number().min(0, '価格は0以上で入力してください').max(100000, '価格は100,000円以下で入力してください'),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'スラッグは英小文字、数字、ハイフンのみ使用可能です'),
  })

  it('should pass with valid article data', () => {
    const result = articleSchema.safeParse({
      title: 'テスト記事',
      price: 1000,
      slug: 'test-article-123',
    })
    expect(result.success).toBe(true)
  })

  it('should fail with empty title', () => {
    const result = articleSchema.safeParse({
      title: '',
      price: 1000,
      slug: 'test',
    })
    expect(result.success).toBe(false)
  })

  it('should fail with negative price', () => {
    const result = articleSchema.safeParse({
      title: 'テスト',
      price: -100,
      slug: 'test',
    })
    expect(result.success).toBe(false)
  })

  it('should fail with invalid slug characters', () => {
    const result = articleSchema.safeParse({
      title: 'テスト',
      price: 0,
      slug: 'Test_Article',
    })
    expect(result.success).toBe(false)
  })
})
