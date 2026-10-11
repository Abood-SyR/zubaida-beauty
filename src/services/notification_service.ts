/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api_client';

export class NotificationService {
  async getNotifications(): Promise<any[]> {
    try {
      const data = await apiClient('/auth/me/notifications');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      throw new Error(`فشل جلب الإشعارات: ${e}`);
    }
  }
}