import { apiClient } from './api_client';

export class AuthService {
  // تسجيل الدخول[cite: 5]
  static async login(username: string, password: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiClient('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const token = response.access_token;
      if (typeof window !== 'undefined' && token) {
        localStorage.setItem('access_token', token);
      }
      return true;
    } catch (e) {
      throw new Error(`فشل تسجيل الدخول: ${e}`);
    }
  }

  // تسجيل الخروج[cite: 5]
  static async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }
}