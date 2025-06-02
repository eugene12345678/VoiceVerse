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

/**
 * Sends a subscription confirmation email
 * @param {string} to - Recipient email address
 * @param {object} subscription - Subscription details
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendSubscriptionConfirmationEmail = async (to, subscription) => {
  const { planType, billingPeriod, currentPeriodEnd } = subscription;
  const formattedEndDate = new Date(currentPeriodEnd).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const planName = planType === 'PRO' ? 'Pro' : planType === 'PREMIUM' ? 'Premium' : 'Enterprise';
  const billingCycle = billingPeriod === 'YEARLY' ? 'Yearly' : 'Monthly';
  
  const subject = `Welcome to VoiceVerse ${planName}!`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366f1;">VoiceVerse</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #111827;">Subscription Confirmed!</h2>
        <p style="color: #4b5563;">Thank you for subscribing to VoiceVerse ${planName}. Your subscription is now active.</p>
        
        <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #111827;">Subscription Details</h3>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Billing Cycle:</strong> ${billingCycle}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Current Period Ends:</strong> ${formattedEndDate}</p>
        </div>
        
        <p style="color: #4b5563;">You now have access to all ${planName} features. Start exploring and creating amazing voice transformations today!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://voiceverse.app'}/studio" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Creating</a>
        </div>
      </div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center;">
        <p>If you have any questions about your subscription, please contact our support team.</p>
        <p>&copy; ${new Date().getFullYear()} VoiceVerse. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

/**
 * Sends a payment receipt email
 * @param {string} to - Recipient email address
 * @param {object} invoice - Invoice details
 * @param {object} subscription - Subscription details
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendPaymentReceiptEmail = async (to, invoice, subscription) => {
  const { amount, currency, invoiceUrl, createdAt } = invoice;
  const { planType, billingPeriod } = subscription;
  
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const planName = planType === 'PRO' ? 'Pro' : planType === 'PREMIUM' ? 'Premium' : 'Enterprise';
  const billingCycle = billingPeriod === 'YEARLY' ? 'Yearly' : 'Monthly';
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
  
  const subject = `VoiceVerse - Payment Receipt`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366f1;">VoiceVerse</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #111827;">Payment Receipt</h2>
        <p style="color: #4b5563;">Thank you for your payment. Here's your receipt for your VoiceVerse subscription.</p>
        
        <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #111827;">Payment Details</h3>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Amount:</strong> ${formattedAmount}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Plan:</strong> ${planName} (${billingCycle})</p>
        </div>
        
        <p style="color: #4b5563;">You can view your invoice details by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Invoice</a>
        </div>
      </div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center;">
        <p>If you have any questions about this payment, please contact our support team.</p>
        <p>&copy; ${new Date().getFullYear()} VoiceVerse. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

/**
 * Sends a payment failure email
 * @param {string} to - Recipient email address
 * @param {object} invoice - Invoice details
 * @param {object} subscription - Subscription details
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendPaymentFailureEmail = async (to, invoice, subscription) => {
  const { amount, currency, invoiceUrl } = invoice;
  const { planType } = subscription;
  
  const planName = planType === 'PRO' ? 'Pro' : planType === 'PREMIUM' ? 'Premium' : 'Enterprise';
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
  
  const subject = `VoiceVerse - Payment Failed`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366f1;">VoiceVerse</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #111827;">Payment Failed</h2>
        <p style="color: #4b5563;">We were unable to process your payment of ${formattedAmount} for your VoiceVerse ${planName} subscription.</p>
        
        <p style="color: #4b5563;">To ensure continued access to all ${planName} features, please update your payment information as soon as possible.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://voiceverse.app'}/settings/billing" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Update Payment Method</a>
        </div>
        
        <p style="color: #4b5563;">You can also view your invoice details by clicking <a href="${invoiceUrl}" style="color: #6366f1; text-decoration: none;">here</a>.</p>
      </div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center;">
        <p>If you have any questions, please contact our support team.</p>
        <p>&copy; ${new Date().getFullYear()} VoiceVerse. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

/**
 * Sends a subscription cancellation email
 * @param {string} to - Recipient email address
 * @param {object} subscription - Subscription details
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendSubscriptionCancellationEmail = async (to, subscription) => {
  const { planType, currentPeriodEnd } = subscription;
  const formattedEndDate = new Date(currentPeriodEnd).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const planName = planType === 'PRO' ? 'Pro' : planType === 'PREMIUM' ? 'Premium' : 'Enterprise';
  
  const subject = `VoiceVerse - Subscription Cancelled`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366f1;">VoiceVerse</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #111827;">Subscription Cancelled</h2>
        <p style="color: #4b5563;">We're sorry to see you go. Your VoiceVerse ${planName} subscription has been cancelled.</p>
        
        <p style="color: #4b5563;">You will continue to have access to ${planName} features until the end of your current billing period on <strong>${formattedEndDate}</strong>.</p>
        
        <p style="color: #4b5563;">If you change your mind, you can reactivate your subscription at any time before the end date.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://voiceverse.app'}/subscription" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reactivate Subscription</a>
        </div>
      </div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center;">
        <p>We'd love to hear your feedback on why you decided to cancel. Please reply to this email to let us know.</p>
        <p>&copy; ${new Date().getFullYear()} VoiceVerse. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendSubscriptionConfirmationEmail,
  sendPaymentReceiptEmail,
  sendPaymentFailureEmail,
  sendSubscriptionCancellationEmail
};