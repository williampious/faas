
# AgriFAAS Connect - A Firebase Studio Project

This is a Next.js starter project for a collaborative, cloud-based farm management platform, built in Firebase Studio.

## **Important Setup Instructions**

### 1. Setting Server Environment Variables for Firebase App Hosting (CRITICAL)

Server-side features like **User Invitations**, **Subscription Activations**, or **Payment Gateways** require special administrative access to Firebase and other services. This is the **most common point of failure** in setting up the application.

Because you are using **Firebase App Hosting**, these secrets MUST be stored in **Google Cloud Secret Manager**.

**Step 1: Get Your Firebase Service Account JSON File**
1.  Go to your **[Firebase Console](https://console.firebase.google.com/)**.
2.  Click the gear icon next to "Project Overview" and select **Project settings**.
3.  Go to the **Service accounts** tab.
4.  Click **Generate new private key**. A JSON file will download. **Keep this file secure.**

**Step 2: Add Secrets in Google Cloud Secret Manager**

You will need to create several secrets in Google Cloud Secret Manager for the application to function correctly. Go to the **[Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)** for your project and create the following secrets. The secret names must match exactly.

*   **`FIREBASE_SERVICE_ACCOUNT_JSON` (Required)**
    *   **Secret Value:** Open the JSON file you downloaded in Step 1, select and copy the **ENTIRE content**, and paste it here.

*   **`NEXT_PUBLIC_BASE_URL` (Required for Payments)**
    *   **Secret Value:** Enter the full public URL of your deployed application (e.g., `https://your-app-name.web.app`).

*   **`PAYSTACK_SECRET_KEY` (Optional, for Paystack payments)**
    *   **Secret Value:** Your Paystack Secret Key from the developer dashboard.

*   **`NEXT_PUBLIC_PAYPAL_CLIENT_ID` (Optional, for PayPal payments)**
    *   **Secret Value:** Your PayPal application's Client ID.

*   **`PAYPAL_CLIENT_SECRET` (Optional, for PayPal payments)**
    *   **Secret Value:** Your PayPal application's Client Secret.

*   **`EMAIL_HOST` (Optional, for sending invitation emails)**
    *   **Secret Value:** Your SMTP server host (e.g., `smtp.gmail.com`).

*   **`EMAIL_PORT` (Optional, for sending emails)**
    *   **Secret Value:** Your SMTP port (e.g., `587` or `465`).

*   **`EMAIL_USER` (Optional, for sending emails)**
    *   **Secret Value:** Your SMTP username.

*   **`EMAIL_PASS` (Optional, for sending emails)**
    *   **Secret Value:** Your SMTP password or an app-specific password.

*   **`EMAIL_SENDER` (Optional, for sending emails)**
    *   **Secret Value:** The "From" address for emails, e.g., `"Your App Name" <noreply@yourdomain.com>`.

**Step 3: Deploy Your App (VERY IMPORTANT)**
1.  The `apphosting.yaml` file in this project is already configured to look for these secrets.
2.  After you have created the secrets in Secret Manager, you **MUST redeploy your application** to Firebase App Hosting (e.g., via `firebase deploy` or by pushing a new commit). The new settings will only take effect on a new deployment.

---

### 2. Firestore Security Rules

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

**Method 2: Manual Creation**

If you prefer to create indexes manually, here are the details for the ones required by the app:

**User Invitation Link Validation**
*   **Collection ID:** `users`
*   **Fields to index:**
    1.  `invitationToken` - **Ascending**
    2.  `accountStatus` - **Ascending**
*   **Query scope:** Collection

**Promotional Code Validation**
*   **Collection ID:** `promotionalCodes`
*   **Fields to index:**
    1.  `code` - **Ascending**
*   **Query scope:** Collection

---

## Target Audience

AgriFAAS Connect is designed for a range of users within the agricultural ecosystem:

*   **Commercial Farms & Agribusinesses:** Ideal for medium-to-large scale farms that require collaboration between managers, field officers, and staff. Features like multi-user access, role-based permissions, financial dashboards, and detailed operational tracking are built for this scale.
*   **Agricultural Cooperatives & Farmer Associations:** These groups can use the platform to manage member data, provide extension services, and aggregate production information.
*   **Agric Extension Officers (AEOs) & NGOs:** AEOs get a dedicated suite of tools to manage and support a directory of farmers, track their progress, and provide targeted advice.
*   **Individual Tech-Savvy Farmers:** Smaller, modern farms can benefit from the detailed record-keeping for crops, livestock, and finances, helping them make data-driven decisions.
*   **Farm Investors & Financial Institutions:** The robust financial reporting and dashboard features provide the transparency and oversight needed for investment and lending decisions.
*   **Agricultural Consultants:** Consultants can use the platform to manage multiple client farms, track recommendations, and monitor outcomes.


    