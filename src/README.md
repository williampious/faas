
# AgriFAAS Connect - A Firebase Studio Project

This is a Next.js starter project for a collaborative, cloud-based farm management platform, built in Firebase Studio.

**For full setup instructions, please refer to the main `README.md` file in the project's root directory.**

This file contains the necessary Firestore Security Rules and Indexes for your project.

---

### Firestore Security Rules

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

    // New helper function for office management roles
    function isOfficeManager(farmId) {
      return isFarmMember(farmId) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin', 'OfficeManager', 'FinanceManager']);
    }

    // User Profile Rules
    match /users/{userId} {
      // Allow user creation by a logged-in user for their own account (registration),
      // OR by an Admin for any account (invitations).
      allow create: if request.auth != null &&
                       (request.auth.uid == userId || isUserAdmin());

      // Allow a user to read their own profile, an admin to read any profile,
      // and an AEO to read profiles of farmers they manage.
      allow read: if request.auth != null && (
                    request.auth.uid == userId ||
                    isUserAdmin() ||
                    (isUserAEO() && resource.data.managedByAEO == request.auth.uid)
                  );

      // A user can update their own profile.
      // An admin can update any user profile (e.g., to assign roles).
      // An AEO can update profiles of farmers they manage.
      allow update: if request.auth != null && (
                      request.auth.uid == userId ||
                      isUserAdmin() ||
                      (isUserAEO() && resource.data.managedByAEO == request.auth.uid)
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
    
    // Admin-only Collections
    match /promotionalCodes/{codeId} {
        // Only Admins can manage promotional codes
        allow read, write, create, delete: if isUserAdmin();
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

    match /breedingRecords/{recordId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /feedingRecords/{recordId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /soilTestRecords/{recordId} {
        allow create: if isFarmMember(request.resource.data.farmId);
        allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /payrollRecords/{recordId} {
      // Only Admins or HRManagers can manage payroll records
      allow create, read, update, delete: if isFarmManager(request.resource.data.farmId);
    }

    match /resources/{resourceId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /budgets/{budgetId} {
        // Only Admins or HRManagers (or Managers) can manage budgets
      allow create: if isFarmManager(request.resource.data.farmId);
      allow read, update, delete: if isFarmManager(request.resource.data.farmId);
    }
    
    match /farmingYears/{yearId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /financialYears/{yearId} {
      // Only users with office roles can manage financial years
      allow create: if isOfficeManager(request.resource.data.farmId);
      allow read, update, delete: if isOfficeManager(resource.data.farmId);
    }

    match /tasks/{taskId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }

    match /farmEvents/{eventId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read, update, delete: if isFarmMember(resource.data.farmId);
    }
    
    match /technologyAssets/{assetId} {
      allow create: if isOfficeManager(request.resource.data.farmId);
      allow read, update, delete: if isOfficeManager(resource.data.farmId);
    }

    match /facilityManagementRecords/{recordId} {
      allow create: if isOfficeManager(request.resource.data.farmId);
      allow read, update, delete: if isOfficeManager(resource.data.farmId);
    }

    match /recordsManagementRecords/{recordId} {
      allow create: if isOfficeManager(request.resource.data.farmId);
      allow read, update, delete: if isOfficeManager(resource.data.farmId);
    }
    
    match /safetySecurityRecords/{recordId} {
      allow create: if isOfficeManager(request.resource.data.farmId);
      allow read, update, delete: if isOfficeManager(resource.data.farmId);
    }

    match /officeEvents/{eventId} {
      allow create: if isOfficeManager(request.resource.data.farmId);
      allow read, update, delete: if isOfficeManager(resource.data.farmId);
    }
    
    match /knowledgeArticles/{articleId} {
      // AEOs can create articles for themselves.
      allow create: if isUserAEO() && request.auth.uid == request.resource.data.authorId;
      // An AEO can read/update/delete their own articles.
      // NOTE: Farmers cannot read this yet. A future rule change would be needed for sharing.
      allow read, update, delete: if isUserAEO() && request.auth.uid == resource.data.authorId;
    }
    
    match /supportLogs/{logId} {
        allow create: if isUserAEO() && request.auth.uid == request.resource.data.aeoId;
        allow read, update, delete: if isUserAEO() && request.auth.uid == resource.data.aeoId;
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

### Firebase Storage Security Rules

If you see a `storage/unauthorized` error in the browser console when trying to **upload a profile photo**, you must update your Firebase Storage Security Rules.

Copy and paste the entire ruleset below into your **Firebase Console -> Storage -> Rules**.

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to read and write to their own profile photo directory.
    // The path must match the structure 'profile-photos/{userId}/{fileName}'.
    match /profile-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firestore Indexes (Important)

As the app's features grow, Firestore will require specific indexes for complex queries (like sorting or filtering by multiple fields) to work efficiently. If you see long loading times or errors in the browser console about missing indexes, you must create them.

**The most common cause of slow load times is missing indexes.**

**Method 1: Automatic (Recommended)**

1.  **Run the App:** Use the application and navigate to pages that load lists of data (e.g., Financial Dashboard, AEO Farmer Directory, Promo Codes page).
2.  **Check for Errors:** If a query requires an index that doesn't exist, **an error will appear in your browser's developer console**.
3.  **Click the Link:** This error message will contain a direct link to the Firebase Console. Click this link.
4.  **Create the Index:** The link will pre-fill all the necessary information to create the index. Simply review the details and click the "Create Index" button.

**Method 2: Manual Creation**

Below are the composite indexes required by the application. Go to **Firebase Console -> Firestore Database -> Indexes** to create them.

*   **For Admin User Management:**
    *   Collection: `users`
    *   Fields: `farmId` (Ascending), `fullName` (Ascending)
    *   Query Scope: Collection
*   **For AEO Farmer Directory:**
    *   Collection: `users`
    *   Fields: `managedByAEO` (Ascending), `fullName` (Ascending)
    *   Query Scope: Collection
*   **For Admin Promo Codes:**
    *   Collection: `promotionalCodes`
    *   Fields: `createdAt` (Descending)
    *   Query Scope: Collection
*   **For Financial Dashboard & Reports:**
    *   Collection: `transactions`
    *   Fields: `farmId` (Ascending), `date` (Ascending/Descending - both are fine)
    *   Query Scope: Collection
*   **For AEO Support Logs:**
    *   Collection: `supportLogs`
    *   Fields: `aeoId` (Ascending), `interactionDate` (Descending)
    *   Query Scope: Collection

The index will take a few minutes to build. Once it's done, the feature that caused the error will work correctly.
