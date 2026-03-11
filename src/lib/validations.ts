export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Please enter your email.";
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(trimmed)) return "Please enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters.";
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username.trim()) return "Please enter a username.";
  return null;
}

export function validateTaskName(name: string): string | null {
  if (!name.trim()) return "Task name is required.";
  if (name.length > 200) return "Task name is too long.";
  return null;
}

export function getFirebaseErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait.",
    "auth/email-already-in-use": "That email is already in use.",
    "auth/weak-password": "Password is too weak.",
    "auth/invalid-email": "Please enter a valid email.",
    "auth/popup-blocked": "Pop-up was blocked. Enable pop-ups for this site.",
    "auth/account-exists-with-different-credential":
      "An account exists with this email using a different method.",
  };
  return map[code] || "Authentication failed. Please try again.";
}
