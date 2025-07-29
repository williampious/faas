
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

### **Part 2: Server-Side Secrets & Credentials**

Backend features like user invitations and payment processing require secure credentials. This section has been updated to reflect the best practice for both local development and production deployment.

#### **Step 2A: Local Development (Using a File Path)**

This is the **recommended** way to run the app on your local machine. It avoids formatting issues with JSON strings.

1.  **Download your Service Account Key**: Go to your **[Firebase Console](https://console.firebase.google.com/) -> Project settings -> Service accounts**. Click **Generate new private key** and save the downloaded JSON file in the root of your project as `serviceAccountKey.json`.
    *   **Important**: This file is automatically ignored by Git (via `.gitignore`) to prevent you from accidentally committing your private keys.
2.  **Set the Environment Variable**: In your `.env` file, add the following line:
    ```
    GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
    ```
    The Admin SDK will now automatically use this file for authentication when you run `npm run dev`.

#### **Step 2B: Deployed Environment (Using Secret Manager)**

For security, when you deploy your app to Firebase App Hosting, you **must** use Google Cloud Secret Manager.

1.  Go to the **[Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)** for your project.
2.  Enable the API if it's not already enabled.
3.  Create secrets with the following **exact names**. The names must match what is in `apphosting.yaml`.

*   **`FIREBASE_SERVICE_ACCOUNT_JSON`**: This is the most important secret for the backend.
    *   **To get the value:** Open the `serviceAccountKey.json` file you downloaded. Copy the **ENTIRE content** of the file and paste it as the secret's value in Secret Manager.
*   **`FIREBASE_STORAGE_BUCKET`**: The name of your Firebase Storage bucket (e.g., `your-project-id.appspot.com`).
*   **`PAYSTACK_SECRET_KEY`**: Your Paystack Secret Key from your developer dashboard.
*   **`PAYPAL_CLIENT_SECRET`**: Your PayPal application's Client Secret.

#### **Email Sending Secrets (Optional):**
These are only needed if you want to send invitation emails to new users. Store them in Secret Manager for production.
*   `EMAIL_HOST`
*   `EMAIL_PORT`
*   `EMAIL_USER`
*   `EMAIL_PASS`
*   `EMAIL_SENDER`

---

### **Part 3: Firebase Console Configuration (Also Critical)**

You must update the security rules in your Firebase project to allow the app to function. Refer to `src/README.md` for the full security rules and Firestore index requirements.

---

### **Part 4: Redeploy Your App (The Final, Essential Step)**

After you have set up your `.env` file and created all the necessary secrets in Secret Manager, you **MUST redeploy your application** to Firebase App Hosting. The new server secrets will only be loaded on a new deployment.
