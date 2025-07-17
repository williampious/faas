'use server';

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  const mailOptions = {
    from: `"AgriFAAS Connect" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error: any) {
    console.error(`Failed to send email to ${options.to}:`, error);
    return { success: false, message: `Failed to send email: ${error.message}` };
  }
}
