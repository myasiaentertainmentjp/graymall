// src/lib/browserNotifications.ts

const NOTIFICATION_PERMISSION_KEY = 'notification_permission_requested';

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!isNotificationSupported()) return null;

  const permission = await Notification.requestPermission();
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
  return permission;
}

export function hasRequestedPermission(): boolean {
  return localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true';
}

export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void }
): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  const notification = new Notification(title, {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    ...options,
  });

  if (options?.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  return notification;
}

// 通知タイプに応じたメッセージを生成
export function getNotificationMessage(type: string, data?: any): { title: string; body: string } {
  switch (type) {
    case 'new_follower':
      return {
        title: '新しいフォロワー',
        body: `${data?.followerName || 'ユーザー'}さんにフォローされました`,
      };
    case 'article_liked':
      return {
        title: '記事にいいねがつきました',
        body: `「${data?.articleTitle || '記事'}」にいいねがつきました`,
      };
    case 'article_purchased':
      return {
        title: '記事が購入されました',
        body: `「${data?.articleTitle || '記事'}」が購入されました`,
      };
    case 'new_comment':
      return {
        title: '新しいコメント',
        body: `「${data?.articleTitle || '記事'}」にコメントがつきました`,
      };
    default:
      return {
        title: 'お知らせ',
        body: '新しい通知があります',
      };
  }
}
