
# AgriFAAS Connect - A Firebase Studio Project

This is a Next.js starter project for a collaborative, cloud-based farm management platform, built in Firebase Studio.

## **CRITICAL SETUP INSTRUCTIONS**

To run this application, you must configure both client-side and server-side variables. The app will not start or function correctly without them.

---

### **Part 1: Client-Side Keys (MUST be done before first deploy)**

Your application needs to know its public URL and how to connect to Firebase in the browser.

**Action Required:**

1.  Open the file named `.env` in the root of your project.
2.  Replace the placeholder values (`YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc.) with the actual values from your Firebase project.
    *   **To get Firebase values:** Go to your **[Firebase Console](https://console.firebase.google.com/) -> Project settings (gear icon) -> General tab**. In the "Your apps" card, select your web app. You will find all these values listed in the "Firebase SDK snippet" section under "Config".
    *   **Set `NEXT_PUBLIC_BASE_URL`**: This is CRITICAL. It must be the full public URL of your deployed application (e.g., `https://your-app-name.web.app`). It is required for user invitations and payment callbacks to work.

---

### **Part 2: Server-Side Secrets (Required for Backend Features)**

Backend features like user invitations, payment processing, and subscription management require secret keys. For security, these **must** be stored in **Google Cloud Secret Manager**.

**Action Required:**

1.  Go to the **[Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)** for your project.
2.  Enable the API if it's not already enabled.
3.  Create secrets with the following **exact names**. The names must match what is in `apphosting.yaml`.

#### **Required Secrets:**

*   **`FIREBASE_SERVICE_ACCOUNT_JSON`**: Allows your server to perform administrative actions.
    *   **To get the value:** Go to your **[Firebase Console](https://console.firebase.google.com/) -> Project settings -> Service accounts**. Click **Generate new private key**. Copy the **ENTIRE content** of the downloaded JSON file and paste it as the secret's value.
*   **`FIREBASE_STORAGE_BUCKET`**: The name of your Firebase Storage bucket (e.g., `your-project-id.appspot.com`).
*   **`PAYSTACK_SECRET_KEY`**: Your Paystack Secret Key from your developer dashboard.
*   **`PAYPAL_CLIENT_SECRET`**: Your PayPal application's Client Secret.

#### **Email Sending Secrets (Optional):**
These are only needed if you want to send invitation emails to new users.
*   `EMAIL_HOST`
*   `EMAIL_PORT`
*   `EMAIL_USER`
*   `EMAIL_PASS`
*   `EMAIL_SENDER`

---

### **Part 3: Firebase Console Configuration (Also Critical)**

You must update the security rules in your Firebase project to allow the app to function. Refer to `src/README.md` for the full security rules and Firestore index requirements.

---

### **Part 4: Deploy Your App**

After you have set up your `.env` file and created all the necessary secrets in Secret Manager, you can deploy your application to Firebase App Hosting. The new settings will take effect on the new deployment.
