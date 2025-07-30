import { useState } from 'react';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'compliance' | 'resources' | 'completion' | 'general';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_text?: string;
}

export const useNotifications = () => {
  // Simplified mock implementation for now
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const createNotification = async (
    title: string,
    message: string,
    type: NotificationData['type'] = 'info',
    category: NotificationData['category'] = 'general'
  ) => {
    const newNotification: NotificationData = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      category,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const refreshNotifications = async () => {
    // Mock implementation
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications,
  };
};