# @hanzo/auth-firebase

Firebase authentication provider for `@hanzo/auth`.

## Installation

This package is **OPTIONAL**. Only install if you need Firebase authentication.

```bash
pnpm add @hanzo/auth-firebase firebase firebase-admin
```

## Usage

### Client-side Setup

Register the Firebase auth provider in your app's entry point:

```tsx
// app/providers.tsx or similar
import { FirebaseAuthService, isFirebaseConfigured } from '@hanzo/auth-firebase'
import { registerAuthProvider } from '@hanzo/auth'

// Register Firebase as the auth provider (only if configured)
if (isFirebaseConfigured()) {
  registerAuthProvider('firebase', FirebaseAuthService)
}
```

### Server-side Setup

For server-side authentication (Next.js Server Components, API routes):

```tsx
// In Server Components or API routes
import { getUserServerSide, createSessionCookie } from '@hanzo/auth-firebase/server'

// Get current user from session cookie
const user = await getUserServerSide()

// Create session cookie after login
const sessionCookie = await createSessionCookie(idToken, { expiresIn: 60 * 60 * 24 * 5 * 1000 })
```

## Environment Variables

### Client-side (NEXT_PUBLIC_*)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Server-side (Firebase Admin)

```env
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Without Firebase

If you don't need Firebase, simply don't install this package. The `@hanzo/auth` package works without Firebase - it will use a stub implementation that returns graceful failures for all auth operations.

## Exports

### Main (`@hanzo/auth-firebase`)

- `FirebaseAuthService` - The Firebase auth service implementation
- `isFirebaseConfigured()` - Check if Firebase client config is present

### Server (`@hanzo/auth-firebase/server`)

- `getUserServerSide()` - Get current user from session cookie
- `generateCustomToken()` - Generate a custom token
- `createSessionCookie()` - Create a session cookie from ID token
- `revokeAllSessions()` - Revoke all sessions for current user
- `isFirebaseAdminConfigured()` - Check if Firebase Admin is configured

### Service (`@hanzo/auth-firebase/service`)

- Low-level Firebase auth functions (for advanced use)
