
# AgriFAAS Connect - A Firebase Studio Project

This is a Next.js starter project for a collaborative, cloud-based farm management platform, built in Firebase Studio.

## **Important Setup Instructions**

To run this application successfully, you must configure public environment variables and server-side secrets.

---

### **Part 1: Public Environment Variables (CRITICAL for App to Load)**

Your application needs to know how to connect to your Firebase project in the browser. These keys are public and are safely included in your app's code during the build process.

**Action Required:**

1.  Open the file named `.env` in the root of your project.
2.  Replace the placeholder values (`YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc.) with the actual values from your Firebase project.
    *   **To get Firebase values:** Go to your **[Firebase Console](https://console.firebase.google.com/) -> Project settings**. In the "Your apps" card, select your web app. You will find all these values listed in the "Firebase SDK snippet" section under "Config".
    *   **Set `NEXT_PUBLIC_BASE_URL`**: This must be the full public URL of your deployed application (e.g., `https://your-app-name.web.app`). It is crucial for payment callbacks.
    *   **Set `NEXT_PUBLIC_PAYPAL_CLIENT_ID`**: This is your public Client ID from your PayPal developer dashboard.

---

### **Part 2: Server-Side Secrets (Required for Backend Features)**

Backend features like user invitations, payment processing, and subscription management require secret keys. For security, these **must** be stored in **Google Cloud Secret Manager**.

**Action Required:**

1.  Go to the **[Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)** for your project.
2.  Create secrets with the following names. The names must match exactly as they are referenced in `apphosting.yaml`.

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

### **Part 3: Firebase Console Configuration**

You must update the security rules in your Firebase project to allow the app to function. Refer to `src/README.md` for the full security rules and Firestore index requirements.

---

### **Part 4: Deploy Your App (Very Important)**

After you have set up your `.env` file and created all the necessary secrets in Secret Manager, you **MUST redeploy your application** to Firebase App Hosting. The new settings will only take effect on a new deployment.
