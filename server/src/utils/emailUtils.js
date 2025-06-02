const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter using environment variables
 * @returns {object} Nodemailer transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Sends an email using nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `VoiceVerse <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Sends a password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset link
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendPasswordResetEmail = async (to, resetLink) => {
  const subject = 'VoiceVerse - Password Reset';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366f1;">VoiceVerse</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #111827;">Password Reset Request</h2>
        <p style="color: #4b5563;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p style="color: #4b5563;">To reset your password, click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        
        <p style="color: #4b5563;">Or copy and paste this link into your browser:</p>
        <p style="background-color: #e5e7eb; padding: 10px; border-radius: 3px; word-break: break-all; font-size: 14px;">${resetLink}</p>
        
        <p style="color: #4b5563; margin-bottom: 0;">This link will expire in 1 hour for security reasons.</p>
      </div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center;">
        <p>If you have any questions, please contact our support team.</p>
        <p>&copy; ${new Date().getFullYear()} VoiceVerse. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail
};