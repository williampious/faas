

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

    // --- HELPER FUNCTIONS ---
    function isSuperAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             'Super Admin' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isUserAEO(userId) {
      return exists(/databases/$(database)/documents/users/$(userId)) &&
             'Agric Extension Officer' in get(/databases/$(database)/documents/users/$(userId)).data.role;
    }

    function isMemberOfTenant(tenantId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantId == tenantId;
    }
    
    // Checks if the user has a Managerial role within a specific tenant.
    function isManagerOfTenant(tenantId) {
        return isMemberOfTenant(tenantId) &&
               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin', 'Manager', 'HRManager']);
    }

    // Checks if the user has an Office Management role within a specific tenant.
    function isOfficeManagerOfTenant(tenantId) {
        return isMemberOfTenant(tenantId) &&
               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin', 'OfficeManager', 'FinanceManager']);
    }


    // --- GLOBAL COLLECTIONS ---
    
    // Users collection can be listed by Super Admins.
    // Individual user documents can be read/written by themselves, or by Admins of their tenant.
    match /users/{userId} {
      // Rule to allow reading the whole collection (list)
      allow list: if isSuperAdmin();
    
      allow read: if isSuperAdmin() ||
                     request.auth.uid == userId ||
                     (isMemberOfTenant(resource.data.tenantId) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin'])) ||
                     (isUserAEO(request.auth.uid) && resource.data.managedByAEO == request.auth.uid);
                     
      allow create: if request.auth != null; // User registration or admin invites
      
      allow update: if isSuperAdmin() ||
                       request.auth.uid == userId || 
                       (isMemberOfTenant(resource.data.tenantId) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin'])) ||
                       (isUserAEO(request.auth.uid) && resource.data.managedByAEO == request.auth.uid);

      allow delete: if isSuperAdmin() || (isMemberOfTenant(resource.data.tenantId) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin']));
    }
    
    // Only SuperAdmins can manage promotional codes
    match /promotionalCodes/{codeId} {
        allow read, write, create, delete: if isSuperAdmin();
    }
    
    // Users can write to this collection to attempt to activate a code. The rule validates the attempt.
    match /promoCodeActivations/{activationId} {
        allow create: if request.auth != null &&
                       request.resource.data.userId == request.auth.uid &&
                       exists(/databases/$(database)/documents/promotionalCodes/$(request.resource.data.code)) &&
                       get(/databases/$(database)/documents/promotionalCodes/$(request.resource.data.code)).data.isActive == true &&
                       get(/databases/$(database)/documents/promotionalCodes/$(request.resource.data.code)).data.timesUsed < get(/databases/$(database)/documents/promotionalCodes/$(request.resource.data.code)).data.usageLimit &&
                       get(/databases/$(database)/documents/promotionalCodes/$(request.resource.data.code)).data.expiryDate > request.time.toMillis();
        allow read, update, delete: if false;
    }


    // --- MULTI-TENANT DATA MODEL ---
    // All farm-specific data is nested under a tenant document.
    match /tenants/{tenantId} {
      // Allow tenant members to read their own farm/tenant document.
      // SuperAdmins can read any tenant document for platform management.
      allow read, list: if isMemberOfTenant(tenantId) || isSuperAdmin();

      // Only Admins of that tenant or a SuperAdmin can create/update the main tenant doc.
      allow create, update, delete: if isSuperAdmin() || (isMemberOfTenant(tenantId) && 'Admin' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role);

      // --- GENERAL FARM OPERATIONS ---
      match /plots/{plotId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /landPreparationActivities/{activityId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /plantingRecords/{recordId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /cropMaintenanceActivities/{activityId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /harvestingRecords/{recordId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /soilTestRecords/{recordId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /resources/{resourceId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /tasks/{taskId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /farmEvents/{eventId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /plantingAdviceRecords/{recordId} { allow read, write: if isMemberOfTenant(tenantId); }
      
      // --- ANIMAL PRODUCTION ---
      match /animalHousingRecords/{recordId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /animalHealthRecords/{recordId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /breedingRecords/{recordId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /feedingRecords/{recordId} { allow read, write: if isMemberOfTenant(tenantId); }

      // --- FINANCIAL & PLANNING (Managed by specific roles) ---
      match /transactions/{transactionId} { 
          allow read: if isMemberOfTenant(tenantId);
          allow create: if isMemberOfTenant(tenantId); // Transactions are created programmatically by other modules.
          allow update, delete: if false; // Prevent direct modification of financial records.
      }
      match /budgets/{budgetId} { allow read, write: if isManagerOfTenant(tenantId); }
      match /farmingYears/{yearId} { allow read, write: if isMemberOfTenant(tenantId); }
      match /financialYears/{yearId} { allow read, write: if isOfficeManagerOfTenant(tenantId); }
      
      // --- OFFICE & HR MANAGEMENT (Managed by specific roles) ---
      match /payrollRecords/{recordId} { allow read, write: if isManagerOfTenant(tenantId); }
      match /technologyAssets/{assetId} { allow read, write: if isOfficeManagerOfTenant(tenantId); }
      match /facilityManagementRecords/{recordId} { allow read, write: if isOfficeManagerOfTenant(tenantId); }
      match /recordsManagementRecords/{recordId} { allow read, write: if isOfficeManagerOfTenant(tenantId); }
      match /safetySecurityRecords/{recordId} { allow read, write: if isOfficeManagerOfTenant(tenantId); }
      match /officeEvents/{eventId} { allow read, write: if isOfficeManagerOfTenant(tenantId); }
    }
    
    // --- AEO SPECIFIC COLLECTIONS (Not nested under tenants) ---
    match /knowledgeArticles/{articleId} {
      allow create: if isUserAEO(request.auth.uid) && request.auth.uid == request.resource.data.authorId;
      allow read, update, delete: if isUserAEO(request.auth.uid) && request.auth.uid == resource.data.authorId;
    }
    
    match /supportLogs/{logId} {
      allow create: if isUserAEO(request.auth.uid) && request.auth.uid == request.resource.data.aeoId;
      allow read, update, delete: if isUserAEO(request.auth.uid) && request.auth.uid == resource.data.aeoId;
    }

    // Default deny for any other path to ensure security.
    match /{path=**} {
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

**Method 1: Automatic (Recommended)**

The best way to create indexes is to **let Firebase tell you which ones you need**.

1.  **Run the App:** Use the application and navigate to pages that load lists of data (e.g., Financial Dashboard, Transaction Ledger, AEO Farmer Directory, Promo Codes page).
2.  **Check for Errors:** If a query requires an index that doesn't exist, **an error will appear in your browser's developer console**.
3.  **Click the Link:** This error message will contain a direct link to the Firebase Console. Click this link.
4.  **Create the Index:** The link will pre-fill all the necessary information to create the index. Simply review the details and click the "Create Index" button.

The index will take a few minutes to build. Once it's done, the feature that caused the error will work correctly.

**Required Indexes So Far:**

*   **Collection ID:** `users`, Fields to index: `farmId` (Ascending), `fullName` (Ascending).
*   **Collection ID:** `tenants`, Fields to index: `name` (Ascending / Descending), `country` (Ascending / Descending), `region` (Ascending / Descending).
*   **Collection ID:** `transactions`, Fields to index: `farmId` (Ascending), `date` (Descending).
*   **Collection ID:** `promotionalCodes`, Fields to index: `createdAt` (Descending).
*   **Collection ID:** `supportLogs`, Fields to index: `aeoId` (Ascending), `interactionDate` (Descending).
*   **Collection ID:** `knowledgeArticles`, Fields to index: `authorId` (Ascending), `createdAt` (Descending).
*   **Collection ID:** `plantingAdviceRecords`, Fields to index: `farmId` (Ascending), `createdAt` (Descending).
*   **Collection ID:** `payrollRecords`, Fields to index: `farmId` (Ascending), `paymentDate` (Descending).
*   **Collection ID:** `facilityManagementRecords`, Fields to index: `farmId` (Ascending), `paymentDate` (Descending).
*   **Collection ID:** `safetySecurityRecords`, Fields to index: `farmId` (Ascending), `paymentDate` (Descending).
*   **Collection ID:** `recordsManagementRecords`, Fields to index: `farmId` (Ascending), `paymentDate` (Descending).
*   **Collection ID:** `technologyAssets`, Fields to index: `farmId` (Ascending), `purchaseDate` (Descending).
*   **Collection ID:** `officeEvents`, Fields to index: `farmId` (Ascending), `eventDate` (Descending).
*   **Collection ID:** `soilTestRecords`, Fields to index: `farmId` (Ascending), `testDate` (Descending).
*   **Collection ID:** `animalHealthRecords`, Fields to index: `farmId` (Ascending), `date` (Descending).
*   **Collection ID:** `feedingRecords`, Fields to index: `farmId` (Ascending), `date` (Descending).
*   **Collection ID:** `harvestingRecords`, Fields to index: `farmId` (Ascending), `createdAt` (Descending).
*   **Collection ID:** `plantingRecords`, Fields to index: `farmId` (Ascending), `createdAt` (Descending).
*   **Collection ID:** `landPreparationActivities`, Fields to index: `farmId` (Ascending), `createdAt` (Descending).
*   **Collection ID:** `tasks`, Fields to index: `farmId` (Ascending), `createdAt` (Descending).
*   **Collection ID:** `farmEvents`, Fields to index: `farmId` (Ascending), `createdAt` (Descending).
*   **Collection ID:** `budgets`, Fields to index: `farmId` (Ascending).


