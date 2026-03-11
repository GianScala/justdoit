export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
  emailVerified: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};
