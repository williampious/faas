# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Important Note on Firestore Security Rules

If you encounter permission errors, especially during **Farm Setup** ("Failed to create farm: MISSING_PERMISSION") or when **inviting users**, you must update your Firestore Security Rules. The default rules are too restrictive.

The setup process requires permission to:
1.  Create a document in the `farms` collection.
2.  Update the `users` document with the new `farmId`.

Here is a recommended ruleset that enables these core functionalities. Copy and paste this into your Firebase Console -> Firestore Database -> Rules.

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
      // Users need to be able to update their own profile, including adding the farmId during setup.
      allow update: if request.auth != null && (request.auth.uid == userId || isUserAdmin());
      allow delete: if isUserAdmin();
    }

    match /farms/{farmId} {
      // Any authenticated user can create a farm, as long as they set themselves as the owner.
      // This is essential for the initial farm setup process.
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;

      // For now, allow any authenticated user to read farm data.
      // For stricter rules, you could check if the user is associated with the farm:
      // allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.farmId == farmId;
      allow read: if request.auth != null;

      // Only the farm owner or an admin can update or delete the farm.
      allow update, delete: if request.auth != null && (resource.data.ownerId == request.auth.uid || isUserAdmin());
    }

    // Default deny for other paths. It's important to keep this to ensure
    // collections you haven't explicitly defined rules for remain secure.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
Apply these rules in your Firebase Console, and the farm setup process should work perfectly.
