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
      allow read, update, delete: if isFarmManager(resource.data.farmId);
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

## 2. Important Note on Firebase Storage Security Rules

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

## 3. Important Note on Firestore Indexes

As the app's features grow, Firestore will require specific indexes for complex queries to work securely and efficiently. If you see an error in your browser console that says `The query requires an index...` followed by a long URL, you must create the specified index.

You can create these by following the link provided in the console error, or by going to your **Firebase Console -> Firestore Database -> Indexes** tab and creating them manually. The app will not function correctly without them.

### Comprehensive List of Required Indexes:

#### For User and Directory Management:

1.  **HR Employee Directory:**
    *   Collection: `users`, Fields: `farmId` (Asc), `fullName` (Asc), Scope: Collection
2.  **AEO Farmer Directory:**
    *   Collection: `users`, Fields: `managedByAEO` (Asc), `fullName` (Asc), Scope: Collection
    
#### For Operational Modules:

3.  **AI Planting Advice History:**
    *   Collection: `plantingAdviceRecords`, Fields: `farmId` (Asc), `createdAt` (Desc), Scope: Collection
4.  **Farm Events:**
    *   Collection: `farmEvents`, Fields: `farmId` (Asc), `createdAt` (Desc), Scope: Collection
5.  **Farm & Financial Years:**
    *   Collection: `farmingYears`, Fields: `farmId` (Asc), `startDate` (Desc), Scope: Collection
    *   Collection: `financialYears`, Fields: `farmId` (Asc), `startDate` (Desc), Scope: Collection
6.  **Animal Production (All modules):**
    *   Collection: `animalHealthRecords`, Fields: `farmId` (Asc), `date` (Desc), Scope: Collection
    *   Collection: `breedingRecords`, Fields: `farmId` (Asc), `matingDate` (Desc), Scope: Collection
    *   Collection: `feedingRecords`, Fields: `farmId` (Asc), `date` (Desc), Scope: Collection
7.  **Soil & Water Management:**
    *   Collection: `soilTestRecords`, Fields: `farmId` (Asc), `testDate` (Desc), Scope: Collection

#### For Office Management Modules:

8.  **Technology Management:**
    *   Collection: `technologyAssets`, Fields: `farmId` (Asc), `purchaseDate` (Desc), Scope: Collection
9.  **Facility Management:**
    *   Collection: `facilityManagementRecords`, Fields: `farmId` (Asc), `paymentDate` (Desc), Scope: Collection
10. **Records Management:**
    *   Collection: `recordsManagementRecords`, Fields: `farmId` (Asc), `paymentDate` (Desc), Scope: Collection
11. **Event Planning:**
    *   Collection: `officeEvents`, Fields: `farmId` (Asc), `eventDate` (Desc), Scope: Collection
12. **Safety & Security Management:**
    *   Collection: `safetySecurityRecords`, Fields: `farmId` (Asc), `paymentDate` (Desc), Scope: Collection

#### For AEO Tools:

13. **AEO Knowledge Base:**
    *   Collection: `knowledgeArticles`, Fields: `authorId` (Asc), `createdAt` (Desc), Scope: Collection
14. **AEO Support Logs:**
    *   Collection: `supportLogs`, Fields: `aeoId` (Asc), `interactionDate` (Desc), Scope: Collection

#### For Financial Reports & Budgeting (Critical):

15. **Transactions Ledger (multiple sort options):**
    *   Collection: `transactions`, Fields: `farmId` (Asc), `date` (Asc/Desc), Scope: Collection
    *   Collection: `transactions`, Fields: `farmId` (Asc), `category` (Asc/Desc), Scope: Collection
    *   Collection: `transactions`, Fields: `farmId` (Asc), `linkedModule` (Asc/Desc), Scope: Collection
    *   Collection: `transactions`, Fields: `farmId` (Asc), `amount` (Asc/Desc), Scope: Collection
16. **Budgeting Module (date range queries):**
    *   Collection: `transactions`, Fields: `farmId` (Asc), `type` (Asc), `date` (Asc/Desc), Scope: Collection

#### For Profitability Report (Sorting):

17. **Harvesting Records (multiple sort options):**
    *   Collection: `harvestingRecords`, Fields: `farmId` (Asc), `dateHarvested` (Asc/Desc), Scope: Collection
    *   Collection: `harvestingRecords`, Fields: `farmId` (Asc), `cropType` (Asc/Desc), Scope: Collection
    *   Collection: `harvestingRecords`, Fields: `farmId` (Asc), `totalSalesIncome` (Asc/Desc), Scope: Collection
    *   Collection: `harvestingRecords`, Fields: `farmId` (Asc), `totalHarvestCost` (Asc/Desc), Scope: Collection
    
#### For Admin-only Features:

18. **Promotional Codes:**
    *   Collection: `promotionalCodes`, Fields: `createdAt` (Desc), Scope: Collection
