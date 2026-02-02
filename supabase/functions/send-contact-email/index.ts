// supabase/functions/send-contact-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const CONTACT_TO_EMAIL = 'info@graymall.jp'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactRequest {
  name: string
  email: string
  category: string
  message: string
}

const categoryLabels: Record<string, string> = {
  account: 'アカウント・ログインについて',
  purchase: '購入について',
  sales: '出品・販売について',
  payment: '売上・出金について',
  report: 'コンテンツの通報',
  other: 'その他',
}

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, category, message }: ContactRequest = await req.json()

    // Validation
    if (!name || !email || !category || !message) {
      return new Response(
        JSON.stringify({ error: '必須項目が入力されていません' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const categoryLabel = categoryLabels[category] || category

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'グレーモール <noreply@graymall.jp>',
        to: [CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `【お問い合わせ】${categoryLabel} - ${name}様`,
        html: `
          <h2>お問い合わせを受け付けました</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background: #f5f5f5; width: 30%;">お名前</th>
              <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background: #f5f5f5;">メールアドレス</th>
              <td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background: #f5f5f5;">種別</th>
              <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(categoryLabel)}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background: #f5f5f5; vertical-align: top;">お問い合わせ内容</th>
              <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${escapeHtml(message)}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            このメールはグレーモールのお問い合わせフォームから送信されました。<br>
            返信は ${escapeHtml(email)} 宛にお願いします。
          </p>
        `,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      console.error('Resend API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'メール送信に失敗しました' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await res.json()
    console.log('Email sent successfully:', data.id)

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
