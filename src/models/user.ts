/* eslint-disable @typescript-eslint/no-explicit-any */
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export function parseUserFromJson(json: Record<string, any>): User {
  return {
    id: json['id'],
    username: json['username'],
    email: json['email'],
    role: json['role'] ?? 'customer',
  };
}