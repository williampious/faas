# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Important Note on Firestore Security Rules

If you encounter permission errors when administrators try to create or manage users (e.g., inviting new users), ensure your Firestore Security Rules allow these operations. Specifically, the `create` rule for the `users` collection needs to permit an admin to create user documents.

Example rule structure:
```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isUserAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin']);
    }

    match /users/{userId} {
      allow create: if request.auth != null && (request.auth.uid == userId || isUserAdmin());
      allow read: if request.auth != null && (request.auth.uid == userId || isUserAdmin());
      allow update: if request.auth != null && (request.auth.uid == userId || isUserAdmin());
      allow delete: if isUserAdmin();
    }

    // Default deny for other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
Apply these rules in your Firebase Console -> Firestore Database -> Rules.
