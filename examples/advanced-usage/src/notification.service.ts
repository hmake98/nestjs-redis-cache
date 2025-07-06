import { Injectable } from '@nestjs/common';
import { Cacheable } from '../../../src/decorators/cacheable.decorator';

@Injectable()
export class NotificationService {
  // Simulate notification data
  private notifications = new Map([
    [
      'user1',
      [
        {
          id: '1',
          type: 'order',
          message: 'Your order #12345 has been shipped',
          read: false,
          createdAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          type: 'promotion',
          message: '20% off on all electronics!',
          read: true,
          createdAt: '2024-01-01T09:00:00Z',
        },
        {
          id: '3',
          type: 'system',
          message: 'Welcome to our platform!',
          read: false,
          createdAt: '2024-01-01T08:00:00Z',
        },
      ],
    ],
    [
      'user2',
      [
        {
          id: '4',
          type: 'order',
          message: 'Your order #12346 has been delivered',
          read: false,
          createdAt: '2024-01-01T11:00:00Z',
        },
        {
          id: '5',
          type: 'promotion',
          message: 'Free shipping on orders over $50',
          read: false,
          createdAt: '2024-01-01T10:30:00Z',
        },
      ],
    ],
    [
      'user3',
      [
        {
          id: '6',
          type: 'system',
          message: 'Your account has been verified',
          read: true,
          createdAt: '2024-01-01T07:00:00Z',
        },
      ],
    ],
  ]);

  @Cacheable({
    key: 'notifications:user',
    ttl: 600, // 10 minutes
    scope: 'module',
    moduleName: 'NotificationModule',
  })
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const userNotifications = this.notifications.get(userId) || [];

    let filteredNotifications = userNotifications;
    if (unreadOnly) {
      filteredNotifications = userNotifications.filter((n) => !n.read);
    }

    return {
      userId,
      notifications: filteredNotifications,
      total: filteredNotifications.length,
      unread: userNotifications.filter((n) => !n.read).length,
      timestamp: new Date().toISOString(),
    };
  }

  @Cacheable({
    key: 'notifications:send',
    ttl: 300, // 5 minutes
    scope: 'global',
  })
  async sendNotification(userId: string, type: string, message: string) {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const notification = {
      id: Date.now().toString(),
      type,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Add to user's notifications
    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.unshift(notification);
    this.notifications.set(userId, userNotifications);

    return {
      success: true,
      notification,
      userId,
      timestamp: new Date().toISOString(),
    };
  }

  @Cacheable({
    key: 'notifications:read',
    ttl: 180, // 3 minutes
    scope: 'module',
    moduleName: 'NotificationModule',
  })
  async markAsRead(notificationId: string) {
    await new Promise((resolve) => setTimeout(resolve, 80));

    let found = false;

    // Find and mark notification as read
    for (const [userId, notifications] of this.notifications.entries()) {
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification) {
        notification.read = true;
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Notification with id ${notificationId} not found`);
    }

    return {
      success: true,
      notificationId,
      timestamp: new Date().toISOString(),
    };
  }

  // Method without caching for comparison
  async getUserNotificationsWithoutCache(
    userId: string,
    unreadOnly: boolean = false,
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const userNotifications = this.notifications.get(userId) || [];

    let filteredNotifications = userNotifications;
    if (unreadOnly) {
      filteredNotifications = userNotifications.filter((n) => !n.read);
    }

    return {
      userId,
      notifications: filteredNotifications,
      total: filteredNotifications.length,
      unread: userNotifications.filter((n) => !n.read).length,
      timestamp: new Date().toISOString(),
    };
  }
}
