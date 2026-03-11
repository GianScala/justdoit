# JustDoIt — Task Automation Scheduler

Modular Next.js 14 + Firebase application with clean separation of concerns.

## Architecture

```
src/
  app/                    # Next.js App Router pages
    (marketing)/          # Public: landing, privacy, terms
    (auth)/               # Auth: login, register, verify, reset
    (app)/                # Protected: dashboard, profile
  components/
    ui/                   # Primitives: Button, Input, Modal, Alert, Spinner
    layout/               # Shell, Header, Footer, PageContainer
    marketing/            # Hero, Features, CTA
    auth/                 # AuthCard, AuthHero, LoginForm, RegisterForm
    dashboard/            # FolderNav, SummaryCard, TaskForm, TaskCard, TaskColumn
    profile/              # ProfileCard
  features/
    auth/utils/           # Firebase auth functions
    auth/hooks/           # useAuthRedirect
    tasks/utils/          # Firestore CRUD operations
  context/                # AuthContext, TaskContext
  lib/                    # utils, constants, formatters, validations
  types/                  # auth.ts, task.ts, user.ts
  styles/
    base/                 # fonts, tokens, reset
    ui/                   # buttons, forms, alerts, modal, loading, animations
    layout/               # shell, header, footer, page
    pages/                # marketing, auth, dashboard, tasks, profile, legal
```

## Setup

1. `npm install`
2. Copy `.env.local.example` → `.env.local` with your Firebase config
3. Firestore Rules — paste in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /folders/{folderId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        match /tasks/{taskId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

4. `npm run dev` → http://localhost:3000

## macOS Note
Unzip from Terminal: `unzip justdoit_v5.zip` — Finder mangles parenthesized folder names.
