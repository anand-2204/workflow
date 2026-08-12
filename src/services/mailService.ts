import emailjs from '@emailjs/browser';

// Initialize EmailJS with public key from environment variables
export const initEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (publicKey) {
    emailjs.init(publicKey);
  }
};

// Send email using EmailJS
export const sendEmail = async (
  to: string,
  subject: string,
  message: string,
  fromName: string = 'Workflow Editor'
) => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      return {
        success: false,
        error: 'EmailJS configuration missing. Please check your environment variables.',
      };
    }

    const result = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: to,
        subject: subject,
        message: message,
        from_name: fromName,
      }
    );
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
};

// Alternative: Send email without EmailJS (for testing)
export const sendEmailMock = async (
  _to: string,
  _subject: string,
  _message: string,
  _fromName: string = 'Workflow Editor'
) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate success (90% success rate)
  if (Math.random() > 0.1) {
    return {
      success: true,
      message: 'Email sent successfully (mock)',
    };
  } else {
    return {
      success: false,
      error: 'Failed to send email (mock)',
    };
  }
};