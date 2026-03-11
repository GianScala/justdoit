export type PendingVerification = {
  email: string;
  userId: string;
  username?: string;
  timestamp?: number;
} | null;

export type RedirectResult = {
  isNewUser: boolean;
  hasHandle: boolean;
} | null;
