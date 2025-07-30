'use server';

import nodemailer from 'nodemailer';
import sendmail from 'sendmail';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendmailPromise = sendmail({
    // logger: {
    //     debug: console.log,
    //     info: console.info,
    //     warn: console.warn,
    //     error: console.error
    // },
    silent: false, // set to false for debugging
});

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  const { to, subject, html } = options;
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SENDER } = process.env;

  const fromAddress = EMAIL_SENDER || '"AgriFAAS Connect" <noreply@agrifaasconnect.com>';

  // If SMTP variables are not set, use sendmail as a fallback for local dev
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
      console.warn("SMTP environment variables not set. Falling back to sendmail for local development.");
      try {
        await sendmailPromise({
            from: fromAddress,
            to: to,
            subject: subject,
            html: html,
        });
        console.log(`Email sent successfully to ${to} via sendmail fallback.`);
        return { success: true, message: 'Email sent successfully via fallback method.' };
      } catch (error: any) {
          console.error(`Failed to send email to ${to} via sendmail:`, error);
          return { success: false, message: `Failed to send email via fallback: ${error.message}` };
      }
  }

  // Original nodemailer logic for production SMTP
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} via SMTP.`);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error: any) {
    console.error(`Failed to send email to ${to} via SMTP:`, error);
    return { success: false, message: `Failed to send email via SMTP: ${error.message}` };
  }
}
