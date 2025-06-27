
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Important Note on Firestore Security Rules

If you encounter permission errors, especially during **Farm Setup**, **inviting users**, **managing farm plots**, or when an **AEO manages farmers**, you must update your Firestore Security Rules. The default rules are too restrictive.

The setup and multi-tenancy features require permission to:
1.  Create a document in the `farms` collection.
2.  Update the `users` document with the new `farmId`.
3.  Read and write to collections (like `plots`) where the document's `farmId` matches the user's `farmId`.
4.  Allow Agric Extension Officers (AEOs) to create and manage farmer profiles.

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
    
    function isUserAEO() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Agric Extension Officer']);
    }

    // A helper function to check if a user is part of a specific farm.
    function isFarmMember(farmId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.farmId == farmId;
    }

    match /users/{userId} {
      // Who can create a user document?
      // 1. A user registering themselves.
      // 2. An Admin inviting a user.
      // 3. An AEO adding a farmer.
      allow create: if request.auth != null && (
                      request.auth.uid == userId || 
                      isUserAdmin() ||
                      (isUserAEO() && request.resource.data.managedByAEO == request.auth.uid)
                    );

      // Who can read a user document?
      // 1. The user themselves.
      // 2. An Admin.
      // 3. An AEO reading a profile of a farmer they manage (for 'get' operations).
      //    The 'list' operation in the farmer directory is secured by the 'where' clause in the client query.
      allow read: if request.auth != null && (
                    request.auth.uid == userId ||
                    isUserAdmin() ||
                    (isUserAEO() && resource.data.managedByAEO == request.auth.uid)
                  );

      // Who can update a user document?
      // 1. The user themselves.
      // 2. An Admin.
      // 3. An AEO updating a farmer they manage.
      allow update: if request.auth != null && (
                      request.auth.uid == userId ||
                      isUserAdmin() ||
                      (isUserAEO() && resource.data.managedByAEO == request.auth.uid)
                    );

      // Only admins can delete user profiles.
      allow delete: if isUserAdmin();
    }


    match /farms/{farmId} {
      // Any authenticated user can create a farm, as long as they set themselves as the owner.
      // This is essential for the initial farm setup process.
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      
      // For now, allow any authenticated member of the farm to read the farm details.
      allow read: if isFarmMember(farmId);

      // Only the farm owner or an admin can update or delete the farm.
      allow update, delete: if request.auth != null && (resource.data.ownerId == request.auth.uid || isUserAdmin());
    }

    // Rules for multi-tenant collections
    match /plots/{plotId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /landPreparationActivities/{activityId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /plantingRecords/{recordId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /cropMaintenanceActivities/{activityId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /harvestingRecords/{recordId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /animalHousingRecords/{recordId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /animalHealthRecords/{recordId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /resources/{resourceId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /budgets/{budgetId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /tasks/{taskId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /farmEvents/{eventId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /transactions/{transactionId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read: if isFarmMember(resource.data.farmId);
      // Prevent direct modification of financial records. This should be handled by the app logic.
      allow update, delete: if false;
    }

    // Default deny for other paths. It's important to keep this to ensure
    // collections you haven't explicitly defined rules for remain secure.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
Apply these rules in your Firebase Console, and the farm setup and plot management features should work perfectly.

## Important Note on Firestore Indexes

As you add more features, Firestore may require you to create indexes for more complex queries to work efficiently and securely. If you see an error in your browser console that says `The query requires an index...` followed by a long URL, you must create the specified index.

**Required Indexes:**

1.  **For the Financial Dashboard:**
    *   **Collection ID:** `transactions`
    *   **Fields:** `farmId` (Ascending), `date` (Ascending)
    *   **Query scope:** Collection group
2.  **For the AEO Farmer Directory:**
    *   **Collection ID:** `users`
    *   **Fields:** `managedByAEO` (Ascending), `fullName` (Ascending)
    *   **Query scope:** Collection

You can create these by following the link provided in the console error, or by going to your **Firebase Console -> Firestore Database -> Indexes** tab and creating them manually. The app will not function correctly without them.
