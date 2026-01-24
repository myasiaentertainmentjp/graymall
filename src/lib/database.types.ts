export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          is_admin: boolean
          can_publish: boolean
          affiliate_code: string | null
          // Stripe Connect
          stripe_account_id: string | null
          stripe_account_status: 'none' | 'onboarding' | 'active' | 'restricted'
          stripe_payouts_enabled: boolean
          stripe_charges_enabled: boolean
          stripe_onboarding_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          is_admin?: boolean
          can_publish?: boolean
          affiliate_code?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: 'none' | 'onboarding' | 'active' | 'restricted'
          stripe_payouts_enabled?: boolean
          stripe_charges_enabled?: boolean
          stripe_onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          is_admin?: boolean
          can_publish?: boolean
          affiliate_code?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: 'none' | 'onboarding' | 'active' | 'restricted'
          stripe_payouts_enabled?: boolean
          stripe_charges_enabled?: boolean
          stripe_onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          is_admin: boolean
          can_publish: boolean
          affiliate_code: string | null
          avatar_url: string | null
          bio: string | null
          sns_x: string | null
          sns_instagram: string | null
          sns_tiktok: string | null
          sns_youtube: string | null
          custom_link_1_url: string | null
          custom_link_1_label: string | null
          custom_link_2_url: string | null
          custom_link_2_label: string | null
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          is_admin?: boolean
          can_publish?: boolean
          affiliate_code?: string | null
          avatar_url?: string | null
          bio?: string | null
          sns_x?: string | null
          sns_instagram?: string | null
          sns_tiktok?: string | null
          sns_youtube?: string | null
          custom_link_1_url?: string | null
          custom_link_1_label?: string | null
          custom_link_2_url?: string | null
          custom_link_2_label?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          is_admin?: boolean
          can_publish?: boolean
          affiliate_code?: string | null
          avatar_url?: string | null
          bio?: string | null
          sns_x?: string | null
          sns_instagram?: string | null
          sns_tiktok?: string | null
          sns_youtube?: string | null
          custom_link_1_url?: string | null
          custom_link_1_label?: string | null
          custom_link_2_url?: string | null
          custom_link_2_label?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          parent_id: string | null
          name: string
          slug: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          parent_id?: string | null
          name: string
          slug: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string | null
          name?: string
          slug?: string
          sort_order?: number
          created_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          author_id: string
          title: string
          slug: string
          excerpt: string
          content: string
          price: number
          is_subscription_product: boolean
          cover_image_url: string | null
          status: 'draft' | 'pending_review' | 'published' | 'rejected'
          admin_comment: string | null
          has_partial_paywall: boolean
          primary_category_id: string | null
          sub_category_id: string | null
          parent_article_id: string | null
          is_archived: boolean
          published_at: string | null
          created_at: string
          updated_at: string
          // Affiliate
          affiliate_enabled: boolean
          affiliate_target: 'all' | 'buyers' | null
          affiliate_rate: number | null
          affiliate_rate_last_changed_at: string | null
          // Tags
          tags: string[]
          // Fake favorite count for initial boost
          fake_favorite_count: number
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          slug: string
          excerpt: string
          content: string
          price?: number
          is_subscription_product?: boolean
          cover_image_url?: string | null
          status?: 'draft' | 'pending_review' | 'published' | 'rejected'
          admin_comment?: string | null
          has_partial_paywall?: boolean
          primary_category_id?: string | null
          sub_category_id?: string | null
          parent_article_id?: string | null
          is_archived?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
          affiliate_enabled?: boolean
          affiliate_target?: 'all' | 'buyers' | null
          affiliate_rate?: number | null
          affiliate_rate_last_changed_at?: string | null
          tags?: string[]
          fake_favorite_count?: number
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          slug?: string
          excerpt?: string
          content?: string
          price?: number
          is_subscription_product?: boolean
          cover_image_url?: string | null
          status?: 'draft' | 'pending_review' | 'published' | 'rejected'
          admin_comment?: string | null
          has_partial_paywall?: boolean
          primary_category_id?: string | null
          sub_category_id?: string | null
          parent_article_id?: string | null
          is_archived?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
          affiliate_enabled?: boolean
          affiliate_target?: 'all' | 'buyers' | null
          affiliate_rate?: number | null
          affiliate_rate_last_changed_at?: string | null
          tags?: string[]
          fake_favorite_count?: number
        }
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          article_id: string
          author_id: string
          affiliate_user_id: string | null
          amount: number
          status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_provider: string
          payment_session_id: string | null
          // Stripe fields
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          paid_at: string | null
          processed_event_id: string | null
          // Distribution
          purchase_affiliate_rate: number
          platform_fee: number
          author_amount: number
          affiliate_amount: number
          // Transfer
          transfer_status: 'pending' | 'ready' | 'held' | 'completed' | 'failed'
          author_transfer_id: string | null
          affiliate_transfer_id: string | null
          refunded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          article_id: string
          author_id: string
          affiliate_user_id?: string | null
          amount: number
          status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_provider?: string
          payment_session_id?: string | null
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          paid_at?: string | null
          processed_event_id?: string | null
          purchase_affiliate_rate?: number
          platform_fee?: number
          author_amount?: number
          affiliate_amount?: number
          transfer_status?: 'pending' | 'ready' | 'held' | 'completed' | 'failed'
          author_transfer_id?: string | null
          affiliate_transfer_id?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          article_id?: string
          author_id?: string
          affiliate_user_id?: string | null
          amount?: number
          status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_provider?: string
          payment_session_id?: string | null
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          paid_at?: string | null
          processed_event_id?: string | null
          purchase_affiliate_rate?: number
          platform_fee?: number
          author_amount?: number
          affiliate_amount?: number
          transfer_status?: 'pending' | 'ready' | 'held' | 'completed' | 'failed'
          author_transfer_id?: string | null
          affiliate_transfer_id?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          author_id: string
          status: 'active' | 'canceled' | 'expired'
          current_period_start: string
          current_period_end: string
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          author_id: string
          status?: 'active' | 'canceled' | 'expired'
          current_period_start: string
          current_period_end: string
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          author_id?: string
          status?: 'active' | 'canceled' | 'expired'
          current_period_start?: string
          current_period_end?: string
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payouts: {
        Row: {
          id: string
          user_id: string
          period: string
          amount: number
          status: 'scheduled' | 'paid'
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period: string
          amount: number
          status?: 'scheduled' | 'paid'
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period?: string
          amount?: number
          status?: 'scheduled' | 'paid'
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stripe_webhook_events: {
        Row: {
          id: string
          event_id: string
          event_type: string
          processed_at: string
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          event_type: string
          processed_at?: string
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          event_type?: string
          processed_at?: string
          payload?: Json | null
          created_at?: string
        }
      }
      affiliate_rate_changes: {
        Row: {
          id: string
          article_id: string
          old_rate: number | null
          new_rate: number
          changed_by: string
          changed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          old_rate?: number | null
          new_rate: number
          changed_by: string
          changed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          old_rate?: number | null
          new_rate?: number
          changed_by?: string
          changed_at?: string
          created_at?: string
        }
      }
      withdraw_requests: {
        Row: {
          id: string
          user_id: string
          amount_jpy: number
          status: 'requested' | 'queued' | 'processing' | 'paid' | 'failed' | 'canceled'
          requested_at: string
          queued_at: string | null
          processing_started_at: string | null
          processed_at: string | null
          canceled_at: string | null
          stripe_transfer_id: string | null
          failure_reason: string | null
          target_year: number | null
          target_month: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount_jpy: number
          status?: 'requested' | 'queued' | 'processing' | 'paid' | 'failed' | 'canceled'
          requested_at?: string
          queued_at?: string | null
          processing_started_at?: string | null
          processed_at?: string | null
          canceled_at?: string | null
          stripe_transfer_id?: string | null
          failure_reason?: string | null
          target_year?: number | null
          target_month?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount_jpy?: number
          status?: 'requested' | 'queued' | 'processing' | 'paid' | 'failed' | 'canceled'
          requested_at?: string
          queued_at?: string | null
          processing_started_at?: string | null
          processed_at?: string | null
          canceled_at?: string | null
          stripe_transfer_id?: string | null
          failure_reason?: string | null
          target_year?: number | null
          target_month?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'purchase_complete' | 'withdrawal_requested' | 'withdrawal_completed' | 'withdrawal_failed' | 'new_follower' | 'article_liked' | 'article_purchased'
          title: string
          message: string
          metadata: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'purchase_complete' | 'withdrawal_requested' | 'withdrawal_completed' | 'withdrawal_failed' | 'new_follower' | 'article_liked' | 'article_purchased'
          title: string
          message: string
          metadata?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'purchase_complete' | 'withdrawal_requested' | 'withdrawal_completed' | 'withdrawal_failed' | 'new_follower' | 'article_liked' | 'article_purchased'
          title?: string
          message?: string
          metadata?: Json
          is_read?: boolean
          created_at?: string
        }
      }
      homepage_sections: {
        Row: {
          id: string
          section_key: string
          title: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_key: string
          title: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section_key?: string
          title?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      homepage_section_articles: {
        Row: {
          id: string
          section_id: string
          article_id: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          article_id: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          article_id?: string
          sort_order?: number
          created_at?: string
        }
      }
      ad_banners: {
        Row: {
          id: string
          image_url: string
          link_url: string | null
          alt_text: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_url: string
          link_url?: string | null
          alt_text?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          link_url?: string | null
          alt_text?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      article_likes: {
        Row: {
          id: string
          user_id: string
          article_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          created_at?: string
        }
      }
      article_favorites: {
        Row: {
          id: string
          user_id: string
          article_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      article_comments: {
        Row: {
          id: string
          article_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          article_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      article_views: {
        Row: {
          id: string
          user_id: string
          article_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          viewed_at?: string
        }
      }
    }
    Functions: {
      update_affiliate_rate: {
        Args: {
          p_article_id: string
          p_user_id: string
          p_new_rate: number
        }
        Returns: Json
      }
      process_checkout_completed: {
        Args: {
          p_event_id: string
          p_session_id: string
          p_payment_intent_id: string
          p_order_id: string
        }
        Returns: Json
      }
      retry_held_transfers: {
        Args: Record<string, never>
        Returns: number
      }
      get_withdrawable_balance: {
        Args: {
          p_user_id: string
        }
        Returns: {
          author_amount: number
          affiliate_amount: number
          total_amount: number
          pending_withdrawal_amount: number
          withdrawable_amount: number
        }[]
      }
      create_withdrawal_request: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: Json
      }
      cancel_withdrawal_request: {
        Args: {
          p_user_id: string
          p_request_id: string
        }
        Returns: Json
      }
    }
  }
}
