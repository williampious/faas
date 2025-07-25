
# AgriFAAS Connect - A Firebase Studio Project

This is a Next.js starter project for a collaborative, cloud-based farm management platform, built in Firebase Studio.

## **CRITICAL SETUP INSTRUCTIONS**

To run this application successfully, you **MUST** configure several secrets in **Google Cloud Secret Manager**. The application will not start or function correctly without them.

---

### **Action Required: Create Secrets in Secret Manager**

1.  Navigate to the **[Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)** for your Firebase project.
2.  Ensure you are in the correct Google Cloud project.
3.  Create secrets with the **exact names** listed below. The secret's value should be the corresponding key from your Firebase project or payment provider dashboard.

#### **Core Firebase Secrets (REQUIRED FOR APP TO LOAD)**

*   `FIREBASE_SERVICE_ACCOUNT_JSON`: **(Critical Server Secret)**
    *   **To get value:** In Firebase Console -> Project Settings -> Service accounts, click **Generate new private key**. Copy the **ENTIRE content** of the downloaded JSON file and use it as the secret's value.
*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`
    *   **To get these values:** In Firebase Console -> Project Settings, select your web app from the "Your apps" card. All these values are listed in the "Firebase SDK snippet" section under "Config".

#### **Application & Payment Secrets (REQUIRED FOR KEY FEATURES)**

*   `NEXT_PUBLIC_BASE_URL`: The full public URL of your deployed application (e.g., `https://your-app-name.web.app`). This is **crucial** for payment callbacks.
*   `PAYSTACK_SECRET_KEY`: Your Paystack **Secret Key** from your developer dashboard.
*   `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: Your PayPal application's public **Client ID**.
*   `PAYPAL_CLIENT_SECRET`: Your PayPal application's **Client Secret**.

#### **Email Sending Secrets (OPTIONAL)**
These are only needed if you configure SMTP for sending invitation emails.
*   `EMAIL_HOST`
*   `EMAIL_PORT`
*   `EMAIL_USER`
*   `EMAIL_PASS`
*   `EMAIL_SENDER`

---

### **Part 2: Firestore & Storage Rules**

If you encounter permission errors during app usage (e.g., creating a farm, uploading a photo), you must update your Firestore and Storage security rules. Copy the complete rulesets from the `src/README.md` file into the corresponding sections of your Firebase console.

---

### **Part 3: Redeploy Your App (VERY IMPORTANT)**

After you have created all the necessary secrets in Secret Manager, you **MUST redeploy your application** to Firebase App Hosting. The new settings will only take effect on a new deployment.

