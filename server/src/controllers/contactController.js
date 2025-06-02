const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../utils/emailUtils');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

// Configure multer storage for contact form attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'contact');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to accept common file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) and documents (PDF, DOC, DOCX) are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Middleware to handle file uploads for contact form
const uploadAttachments = upload.array('attachments', 5); // Allow up to 5 files

/**
 * Submit a contact form message
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const submitContactForm = async (req, res) => {
  // Use multer to handle multipart/form-data
  uploadAttachments(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
      });
    }
    
    try {
      // Extract form fields from req.body
      const { name, email, subject, message, priority, type } = req.body;
      
      // Log received data for debugging
      console.log('Received form data:', {
        name,
        email,
        subject,
        message,
        priority,
        type,
        files: req.files ? req.files.length : 0
      });
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          errors: [
            { type: 'field', msg: 'Name must be at least 2 characters', path: 'name' },
            { type: 'field', msg: 'Please provide a valid email address', path: 'email' },
            { type: 'field', msg: 'Subject must be at least 5 characters', path: 'subject' },
            { type: 'field', msg: 'Message must be at least 20 characters', path: 'message' }
          ].filter(err => {
            if (err.path === 'name') return !name || name.length < 2;
            if (err.path === 'email') return !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (err.path === 'subject') return !subject || subject.length < 5;
            if (err.path === 'message') return !message || message.length < 20;
            return false;
          })
        });
      }
      
      // Process file attachments
      let attachmentsData = null;
      if (req.files && req.files.length > 0) {
        attachmentsData = req.files.map(file => ({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        }));
      }
      
      // Get user ID if authenticated
      const userId = req.user?.id || null;
      
      // Create contact message in database
      const contactMessage = await prisma.contactMessage.create({
        data: {
          name,
          email,
          subject,
          message,
          priority: priority || 'MEDIUM',
          type: type || 'GENERAL',
          userId,
          attachments: attachmentsData ? JSON.stringify(attachmentsData) : null,
        },
      });
    
    // Send email notification
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #6366f1;">New Contact Form Submission</h1>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Priority:</strong> ${priority || 'Medium'}</p>
            <p><strong>Type:</strong> ${type || 'General'}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-line;">${message}</p>
            ${attachmentsData ? `
            <p><strong>Attachments:</strong></p>
            <ul>
              ${attachmentsData.map(file => `<li>${file.filename} (${(file.size / 1024).toFixed(1)} KB)</li>`).join('')}
            </ul>
            ` : ''}
          </div>
        </div>
      `;
      
      await sendEmail(
        process.env.ADMIN_EMAIL || process.env.EMAIL_FROM,
        `New Contact Form: ${subject}`,
        emailHtml
      );
      
      // Send confirmation email to user
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6366f1;">VoiceVerse</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #111827;">Thank You for Contacting Us</h2>
            <p style="color: #4b5563;">We've received your message and will get back to you as soon as possible.</p>
            
            <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #111827;">Your Message Details</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              ${attachmentsData ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Attachments:</strong> ${attachmentsData.length} file(s)</p>` : ''}
            </div>
            
            <p style="color: #4b5563;">Our team will review your message and respond to ${email}. Please ensure this email address is correct and check your spam folder if you don't receive a response within 48 hours.</p>
          </div>
          
          <div style="color: #6b7280; font-size: 14px; text-align: center;">
            <p>If you have any urgent concerns, please call our support line at +254 700 581 615.</p>
            <p>&copy; ${new Date().getFullYear()} VoiceVerse. All rights reserved.</p>
          </div>
        </div>
      `;
      
      await sendEmail(
        email,
        'We\'ve received your message - VoiceVerse Support',
        confirmationHtml
      );
      
      res.status(201).json({
        success: true,
        message: 'Contact form submitted successfully',
        data: contactMessage
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit contact form',
        error: error.message
      });
    }
  });
};

/**
 * Initialize a new AI Assistant chat session
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const initAIChat = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Initial welcome message
    const initialMessages = [
      {
        role: 'assistant',
        content: 'Hello! I\'m your VoiceVerse AI assistant. How can I help you today?',
        timestamp: new Date()
      }
    ];
    
    // Create new chat session
    const chatSession = await prisma.aIAssistantChat.create({
      data: {
        sessionId,
        userId,
        messages: initialMessages
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'AI chat session initialized',
      data: {
        sessionId: chatSession.sessionId,
        messages: initialMessages
      }
    });
  } catch (error) {
    console.error('Error initializing AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize AI chat',
      error: error.message
    });
  }
};

/**
 * Send a message to the AI Assistant
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const sendAIMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and message are required'
      });
    }
    
    // Get existing chat session
    const chatSession = await prisma.aIAssistantChat.findUnique({
      where: { sessionId }
    });
    
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Add user message to chat history
    const messages = [...chatSession.messages];
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Process the message and generate AI response
    const aiResponse = generateAIResponse(message, messages);
    
    // Add AI response to chat history
    messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });
    
    // Update chat session
    const updatedSession = await prisma.aIAssistantChat.update({
      where: { sessionId },
      data: { messages }
    });
    
    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        sessionId,
        messages: updatedSession.messages
      }
    });
  } catch (error) {
    console.error('Error sending AI message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

/**
 * Generate AI response based on user message and chat history
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Chat history
 * @returns {string} - AI response
 */
const generateAIResponse = (userMessage, chatHistory) => {
  // Define common FAQs and responses
  const faqs = [
    {
      keywords: ['reset', 'password', 'forgot', 'login', 'sign in'],
      response: 'To reset your password, click the "Forgot Password" link on the login page. We\'ll send you an email with instructions to create a new password.'
    },
    {
      keywords: ['subscription', 'plan', 'upgrade', 'downgrade', 'cancel'],
      response: 'You can manage your subscription plan in Settings > Subscription. From there, you can upgrade, downgrade, or cancel your plan. Changes will take effect on your next billing cycle.'
    },
    {
      keywords: ['refund', 'money back', 'payment'],
      response: 'Refunds are typically processed within 3-5 business days. If you have questions about a refund, please contact our billing department at billing@voiceverse.app.'
    },
    {
      keywords: ['voice', 'model', 'create', 'clone'],
      response: 'To create a voice model, go to the Studio section and click "New Voice Model". You can upload audio samples or use our voice cloning technology to create a digital version of your voice.'
    },
    {
      keywords: ['transform', 'effect', 'filter', 'audio'],
      response: 'VoiceVerse offers various voice transformation effects. Upload your audio file in the Studio, select an effect from our library, adjust the settings, and click "Transform" to apply it.'
    },
    {
      keywords: ['download', 'export', 'save', 'file'],
      response: 'You can download your transformed audio files from your Library. Click on the file you want to download and select the "Download" option from the menu.'
    },
    {
      keywords: ['nft', 'marketplace', 'sell', 'buy'],
      response: 'Our NFT marketplace allows you to mint and sell your voice creations as NFTs. Go to the NFT section, connect your wallet, and follow the instructions to create or purchase voice NFTs.'
    },
    {
      keywords: ['contact', 'support', 'help', 'team'],
      response: 'You can reach our support team through email at support@voiceverse.app, by phone at +254 700 581 615, or by using the contact form on our website.'
    },
    {
      keywords: ['free', 'trial', 'demo'],
      response: 'We offer a free trial that includes limited access to our voice transformation features. Sign up on our website to start your free trial today!'
    },
    {
      keywords: ['privacy', 'data', 'security', 'information'],
      response: 'We take your privacy seriously. Your data is encrypted and securely stored. You can review our privacy policy at voiceverse.app/privacy for more details.'
    },
    {
      keywords: ['api', 'integration', 'developer', 'code'],
      response: 'Our API documentation is available at voiceverse.app/developers. You\'ll find guides, examples, and SDKs to help you integrate VoiceVerse into your applications.'
    },
    {
      keywords: ['hello', 'hi', 'hey', 'greetings'],
      response: 'Hello! I\'m the VoiceVerse AI assistant. How can I help you with voice transformation, audio effects, or any other questions about our platform?'
    }
  ];
  
  // Check for keyword matches
  for (const faq of faqs) {
    if (faq.keywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      return faq.response;
    }
  }
  
  // Default response if no keywords match
  return "I'm not sure I understand your question. Could you please provide more details or rephrase? You can ask about voice transformations, subscription plans, technical support, or any other VoiceVerse features.";
};

/**
 * Create a Calendly event webhook
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const handleCalendlyWebhook = async (req, res) => {
  try {
    const { event } = req.body;
    
    // Verify webhook signature if needed
    // Implementation depends on Calendly's webhook signature method
    
    if (event.type === 'invitee.created') {
      // Extract event details
      const {
        event_type: { name: eventName },
        event_type_uuid,
        uri: calendlyEventUri,
        start_time: startTime,
        end_time: endTime,
        invitee: {
          name: inviteeName,
          email: inviteeEmail
        },
        status
      } = event;
      
      // Determine event type based on event name
      let eventType = 'general';
      if (eventName.toLowerCase().includes('video')) {
        eventType = 'video_call';
      } else if (eventName.toLowerCase().includes('demo')) {
        eventType = 'demo';
      }
      
      // Store event in database
      await prisma.calendlyEvent.create({
        data: {
          eventType,
          eventName,
          inviteeEmail,
          inviteeName,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status,
          calendlyEventUri,
          notes: event.questions_and_answers ? JSON.stringify(event.questions_and_answers) : null
        }
      });
      
      // Send confirmation email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6366f1;">VoiceVerse</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #111827;">Your ${eventType === 'video_call' ? 'Video Call' : 'Demo'} is Scheduled!</h2>
            <p style="color: #4b5563;">Thank you for scheduling a ${eventType === 'video_call' ? 'video call' : 'demo'} with VoiceVerse.</p>
            
            <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #111827;">Event Details</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Event:</strong> ${eventName}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Date:</strong> ${new Date(startTime).toLocaleDateString()}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Time:</strong> ${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}</p>
            </div>
            
            <p style="color: #4b5563;">You'll receive a calendar invitation with all the details. If you need to reschedule, please use the link in your confirmation email from Calendly.</p>
          </div>
          
          <div style="color: #6b7280; font-size: 14px; text-align: center;">
            <p>If you have any questions, please contact our support team at support@voiceverse.app.</p>
            <p>&copy; ${new Date().getFullYear()} VoiceVerse. All rights reserved.</p>
          </div>
        </div>
      `;
      
      await sendEmail(
        inviteeEmail,
        `Your VoiceVerse ${eventType === 'video_call' ? 'Video Call' : 'Demo'} is Confirmed`,
        emailHtml
      );
      
      // Also notify admin
      await sendEmail(
        process.env.ADMIN_EMAIL || process.env.EMAIL_FROM,
        `New ${eventType === 'video_call' ? 'Video Call' : 'Demo'} Scheduled`,
        `<p>A new ${eventType} has been scheduled by ${inviteeName} (${inviteeEmail}) for ${new Date(startTime).toLocaleString()}.</p>`
      );
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling Calendly webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Calendly webhook',
      error: error.message
    });
  }
};

module.exports = {
  submitContactForm,
  initAIChat,
  sendAIMessage,
  handleCalendlyWebhook
};