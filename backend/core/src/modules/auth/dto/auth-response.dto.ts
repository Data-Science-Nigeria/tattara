export class AuthResponse {
  message?: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified?: boolean;
    roles: string[];
    permissions: string[];
    createdAt?: Date;
  };
}
