
# AgriFAAS Connect - A Firebase Studio Project

This is a Next.js starter project for a collaborative, cloud-based farm management platform, built in Firebase Studio.

To get started, review the setup instructions below and then run the application.

## 1. Important Note on Firestore Security Rules

If you encounter permission errors, especially during **Farm Setup**, **User Management**, **Plot Management**, or when an **AEO manages farmers**, you MUST update your Firestore Security Rules. The default rules are too restrictive.

Copy and paste the entire ruleset below into your **Firebase Console -> Firestore Database -> Rules**.

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Functions
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

    function isFarmMember(farmId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.farmId == farmId;
    }

    // New helper function to check for manager-level roles within a farm
    function isFarmManager(farmId) {
      return isFarmMember(farmId) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin', 'Manager', 'HRManager']);
    }

    // User Profile Rules
    match /users/{userId} {
      // Who can create a user document?
      // 1. A user registering themselves via the main registration page.
      // 2. An Admin inviting a user.
      // 3. An AEO adding a farmer.
      allow create: if request.auth != null && (
                      request.auth.uid == userId || 
                      isUserAdmin() ||
                      (isUserAEO() && request.resource.data.managedByAEO == request.auth.uid)
                    );

      // Who can read a user document?
      // 1. The user themselves.
      // 2. An Admin, Manager, or HRManager viewing users on the same farm.
      // 3. An AEO reading a profile of a farmer they manage.
      allow read: if request.auth != null && (
                    request.auth.uid == userId ||
                    isFarmManager(resource.data.farmId) ||
                    (isUserAEO() && resource.data.managedByAEO == request.auth.uid)
                  );

      // Who can update a user document?
      // 1. The user themselves.
      // 2. An Admin.
      // 3. An AEO updating a farmer they manage.
      allow update: if request.auth != null && (
                      request.auth.uid == userId ||
                      isUserAdmin() ||
                      (isUserAEO() && request.resource.data.managedByAEO == request.auth.uid)
                    );

      // Only admins can delete user profiles.
      allow delete: if isUserAdmin();
    }

    // Farm Rules
    match /farms/{farmId} {
      // Any authenticated user can create a farm (initial setup).
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      
      // Any member of the farm can read the farm details.
      allow read: if isFarmMember(farmId);

      // Only the farm owner or an admin can update or delete the farm.
      allow update, delete: if request.auth != null && (resource.data.ownerId == request.auth.uid || isUserAdmin());
    }

    // Rules for Multi-Tenant Data Collections
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
    
    match /plantingAdviceRecords/{recordId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read: if isFarmMember(resource.data.farmId);
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
    
    match /payrollRecords/{recordId} {
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
      allow read, update, delete: if isFarmMember(request.resource.data.farmId);
    }

    match /farmEvents/{eventId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /transactions/{transactionId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read: if isFarmMember(resource.data.farmId);
      // Prevent direct modification of financial records.
      allow update, delete: if false;
    }

    // Default deny for all other paths to ensure security.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 2. Important Note on Firestore Indexes

As the app's features grow, Firestore will require specific indexes for complex queries to work securely and efficiently. If you see an error in your browser console that says `The query requires an index...` followed by a long URL, you must create the specified index.

You can create these by following the link provided in the console error, or by going to your **Firebase Console -> Firestore Database -> Indexes** tab and creating them manually. The app will not function correctly without them.

### Required Indexes:

1.  **For the Financial Dashboard:**
    *   **Collection ID:** `transactions`
    *   **Fields:** `farmId` (Ascending), `date` (Ascending)
    *   **Query scope:** Collection

2.  **For the AEO Farmer Directory:**
    *   **Collection ID:** `users`
    *   **Fields:** `managedByAEO` (Ascending), `fullName` (Ascending)
    *   **Query scope:** Collection
    
3.  **For the HR Employee Directory:**
    *   **Collection ID:** `users`
    *   **Fields:** `farmId` (Ascending), `fullName` (Ascending)
    *   **Query scope:** Collection

4.  **For the Budgeting Module:**
    *   **Collection ID:** `transactions`
    *   **Fields:** `farmId` (Ascending), `type` (Ascending), `date` (Ascending)
    *   **Query scope:** Collection
    
5.  **For AI Planting Advice History:**
    *   **Collection ID:** `plantingAdviceRecords`
    *   **Fields:** `farmId` (Ascending), `createdAt` (Descending)
    *   **Query scope:** Collection

    

