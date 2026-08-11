// src/services/emailService.ts
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'uoLYWA_RX6OzN3C1u',
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_teclyx8',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_aqbu41b',
};

// Initialize EmailJS with public key
export const initEmailJS = () => {
  console.log('Initializing EmailJS with public key:', EMAILJS_CONFIG.PUBLIC_KEY);
  emailjs.init({
    publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
    // blockHeadless: true, // Optional: prevents headless browsers
  });
};

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  message: string,
  fromName?: string
) => {
  try {
    // Ensure EmailJS is initialized before sending
    if (!emailjs) {
      console.error('EmailJS not initialized');
      return { 
        success: false, 
        error: 'Email service not initialized' 
      };
    }

    console.log('Sending email with params:', {
      to,
      subject,
      message,
      fromName
    });

    const templateParams = {
      to_email: to,
      to_name: to.split('@')[0],
      subject: subject,
      message: message,
      from_name: fromName || 'Workflow Editor',
      // Add these if your template uses them
      reply_to: 'noreply@workflow.com',
    };

    console.log('Template params:', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    console.log('Email sent successfully:', response);
    return { 
      success: true, 
      data: response,
      messageId: response?.text || 'Email sent successfully'
    };
  } catch (error: any) {
    console.error('Email sending failed:', error);
    return { 
      success: false, 
      error: error?.text || error?.message || 'Failed to send email'
    };
  }
};

// Test email function with better error handling
export const testEmailService = async () => {
  try {
    // First, ensure EmailJS is initialized
    initEmailJS();
    
    // Small delay to ensure initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Send test email
    const result = await sendEmail(
      'anandknpr6992@gmail.com', 
      'Test Email from Workflow Editor',
      'This is a test email to verify the email service is working correctly. 🚀'
    );
    
    console.log('Test result:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error.message };
  }
};