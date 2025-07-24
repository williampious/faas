
# AgriFAAS Connect - A Firebase Studio Project

This is a Next.js starter project for a collaborative, cloud-based farm management platform, built in Firebase Studio.

## **Important Setup Instructions**

To run this application successfully, you must configure several server-side secrets and Firebase settings.

### 1. Required Secrets in Google Cloud Secret Manager

Because you are using Firebase App Hosting, all secrets and environment variables **must** be stored in Google Cloud Secret Manager. Your application will not run correctly without them.

Go to the **[Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)** for your project and create secrets with the following names. The secret names must match exactly.

#### **Firebase Admin SDK Configuration (Required)**
*   **`FIREBASE_SERVICE_ACCOUNT_JSON`**: This is the most critical secret. It allows your server to perform administrative actions.
    *   **To get the value:** Go to your **[Firebase Console](https://console.firebase.google.com/) -> Project settings -> Service accounts**. Click **Generate new private key**. Copy the **ENTIRE content** of the downloaded JSON file and paste it as the secret's value.
*   **`FIREBASE_STORAGE_BUCKET`**: The name of your Firebase Storage bucket.
    *   **To get the value:** Go to your **[Firebase Console](https://console.firebase.google.com/) -> Storage**. Your bucket name is at the top (e.g., `your-project-id.appspot.com`).

#### **Firebase Client SDK Configuration (Required)**
These secrets are needed for the client-side application (your browser) to connect to Firebase services.
*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`
    *   **To get these values:** Go to your **[Firebase Console](https://console.firebase.google.com/) -> Project settings**. In the "Your apps" card, select your web app. You will find all these values listed in the "Firebase SDK snippet" section under "Config".

#### **Application & Payment Gateway Configuration (Required)**
*   **`NEXT_PUBLIC_BASE_URL`**: The full public URL of your deployed application (e.g., `https://your-app-name.web.app`). This is crucial for payment callbacks.
*   **`PAYSTACK_SECRET_KEY`**: Your Paystack Secret Key from your developer dashboard.
*   **`NEXT_PUBLIC_PAYPAL_CLIENT_ID`**: Your PayPal application's Client ID.
*   **`PAYPAL_CLIENT_SECRET`**: Your PayPal application's Client Secret.

#### **Email Sending Configuration (Optional)**
These are needed to send invitation emails to new users.
*   `EMAIL_HOST`: Your SMTP server host (e.g., `smtp.gmail.com`).
*   `EMAIL_PORT`: Your SMTP port (e.g., `587` or `465`).
*   `EMAIL_USER`: Your SMTP username.
*   `EMAIL_PASS`: Your SMTP password or an app-specific password.
*   `EMAIL_SENDER`: The "From" address for emails, e.g., `"AgriFAAS Connect" <noreply@yourdomain.com>`.

---

### 2. Firestore Security Rules

If you encounter permission errors, especially during **Farm Setup**, **User Management**, or when an **AEO manages farmers**, you MUST update your Firestore Security Rules. The default rules are too restrictive.

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

    function isFarmManager(farmId) {
      return isFarmMember(farmId) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin', 'Manager', 'HRManager']);
    }

    function isOfficeManager(farmId) {
      return isFarmMember(farmId) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role.hasAny(['Admin', 'OfficeManager', 'FinanceManager']);
    }

    // User Profile Rules
    match /users/{userId} {
      allow create: if request.auth != null && (request.auth.uid == userId || isUserAdmin());
      allow read: if request.auth != null && (
                    request.auth.uid == userId ||
                    isUserAdmin() ||
                    (isUserAEO() && resource.data.managedByAEO == request.auth.uid)
                  );
      allow update: if request.auth != null && (
                      request.auth.uid == userId ||
                      isUserAdmin() ||
                      (isUserAEO() && resource.data.managedByAEO == request.auth.uid)
                    );
      allow delete: if isUserAdmin();
    }

    // Farm Rules
    match /farms/{farmId} {
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow read: if isFarmMember(farmId);
      allow update, delete: if request.auth != null && (resource.data.ownerId == request.auth.uid || isUserAdmin());
    }
    
    // Admin-only Collections
    match /promotionalCodes/{codeId} {
        allow read, write, create, delete: if isUserAdmin();
    }
    match /promotionalCodes/{codeId}/recordedUsages/{usageId} {
        allow read, write, create, delete: if isUserAdmin();
    }


    // Rules for Multi-Tenant Data Collections
    match /plots/{plotId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /landPreparationActivities/{activityId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /plantingRecords/{recordId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /plantingAdviceRecords/{recordId} { allow create, read: if isFarmMember(request.resource.data.farmId); }
    match /cropMaintenanceActivities/{activityId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /harvestingRecords/{recordId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /animalHousingRecords/{recordId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /animalHealthRecords/{recordId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /breedingRecords/{recordId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /feedingRecords/{recordId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /soilTestRecords/{recordId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /resources/{resourceId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /tasks/{taskId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /farmEvents/{eventId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    
    // HR & Office Management
    match /payrollRecords/{recordId} { allow create, read, update, delete: if isFarmManager(request.resource.data.farmId); }
    match /budgets/{budgetId} { allow create, read, update, delete: if isFarmManager(request.resource.data.farmId); }
    match /farmingYears/{yearId} { allow create, read, update, delete: if isFarmMember(request.resource.data.farmId); }
    match /financialYears/{yearId} { allow create, read, update, delete: if isOfficeManager(request.resource.data.farmId); }
    match /technologyAssets/{assetId} { allow create, read, update, delete: if isOfficeManager(resource.data.farmId); }
    match /facilityManagementRecords/{recordId} { allow create, read, update, delete: if isOfficeManager(resource.data.farmId); }
    match /recordsManagementRecords/{recordId} { allow create, read, update, delete: if isOfficeManager(resource.data.farmId); }
    match /safetySecurityRecords/{recordId} { allow create, read, update, delete: if isOfficeManager(resource.data.farmId); }
    match /officeEvents/{eventId} { allow create, read, update, delete: if isOfficeManager(resource.data.farmId); }
    
    // AEO Tools
    match /knowledgeArticles/{articleId} { allow create, read, update, delete: if isUserAEO() && request.auth.uid == resource.data.authorId; }
    match /supportLogs/{logId} { allow create, read, update, delete: if isUserAEO() && request.auth.uid == resource.data.aeoId; }

    // Financial Transactions
    match /transactions/{transactionId} {
      allow create: if isFarmMember(request.resource.data.farmId);
      allow read: if isFarmMember(resource.data.farmId);
      allow update, delete: if false; // Prevent modification of financial records
    }

    // Default deny for all other paths to ensure security.
    match /{document=**} { allow read, write: if false; }
  }
}
```

### 3. Firebase Storage Security Rules

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

### 4. Firestore Indexes (Important)

As the app's features grow, Firestore will require specific indexes for complex queries (like sorting or filtering by multiple fields) to work efficiently. If you see long loading times or errors in the browser console about missing indexes, you must create them.

**Method 1: Automatic (Recommended)**

The best way to create indexes is to **let Firebase tell you which ones you need**.

1.  **Run the App:** Use the application and navigate to pages that load lists of data (e.g., Financial Dashboard, Transaction Ledger, AEO Farmer Directory, Promo Codes page).
2.  **Check for Errors:** If a query requires an index that doesn't exist, **an error will appear in your browser's developer console**.
3.  **Click the Link:** This error message will contain a direct link to the Firebase Console. Click this link.
4.  **Create the Index:** The link will pre-fill all the necessary information to create the index. Simply review the details and click the "Create Index" button.

The index will take a few minutes to build. Once it's done, the feature that caused the error will work correctly.
