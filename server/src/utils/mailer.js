// Re-export mailService Resend functions for clean backwards compatibility
export {
  sendAdminNotification,
  sendWelcomeEmail,
  sendBookingEmail,
  sendAppointmentConfirmedEmail,
  sendEnquiryAdminEmail,
  sendNewsletterWelcomeEmail,
  sendNewsletterSubscriptionEmails,
  sendBriefingsSubscriptionEmails,
  sendCareerApplicationEmail,
  sendResetPasswordEmail,
  sendCaseUpdateEmail,
  sendLawyerCredentialsEmail,
  sendLawyerProfileSubmittedAdminEmail,
  sendLawyerProfileApprovedEmail,
  sendLawyerProfileRejectedEmail,
  sendCaseAllotmentEmail,
  sendCaseUnassignedEmail,
  escapeHtml
} from './mailService.js';

