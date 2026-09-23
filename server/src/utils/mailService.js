import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('\n⚠️ RESEND WARNING: No RESEND_API_KEY could be resolved from environment.');
    console.warn('   Form submissions will save to database, but email notifications will be skipped.');
    console.warn('   To enable emails: Set RESEND_API_KEY in your hosting dashboard or server/.env file.\n');
    return null;
  }
  return new Resend(apiKey);
};

const getFromAddress = () => {
  const raw = process.env.RESEND_FROM_EMAIL || 'noreply@lawzunction.in';
  if (raw.includes('<') && raw.includes('>')) return raw;
  return `Lawzunction Legal <${raw.trim()}>`;
};

const getAdminRecipient = () => {
  return process.env.ADMIN_NOTIFICATION_EMAIL || 'lawzunction@gmail.com';
};

export const escapeHtml = (val) => {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const getValidClientEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.includes('no-email-provided') || (trimmed.startsWith('no-email') && trimmed.includes('@lawzunction.in'))) {
    return null;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
};

/**
 * FLOW 1 — Admin notification email (sent TO lawzunction@gmail.com)
 * @param {string} formType - E.g. 'Book Consultation', 'Callback Request', 'Career Application', 'Smart Intake Inquiry'
 * @param {object} fields - Key/value pair submitted by the user
 * @param {Array} attachments - Optional list of attachments { filename, content }
 */
export const sendAdminNotification = async (formType, fields, attachments = []) => {
  console.log(`\n📨 [Email Engine] Preparing Admin Notification for "${formType}" to ${getAdminRecipient()}...`);
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn(`⚠️ [Skipping Resend] Admin notification for "${formType}" - RESEND_API_KEY not configured.`);
      return { success: false, reason: 'RESEND_API_KEY missing' };
    }

    const adminRecipient = getAdminRecipient();
    const clientName = fields.name || fields.candidateName || fields.subscriberName || 'Website Visitor';
    const clientEmail = getValidClientEmail(fields.email || fields.candidateEmail || fields.subscriberEmail);
    const clientPhone = fields.phone || fields.candidatePhone || fields.subscriberPhone;

    // Professional, spam-safe subject line
    let subject;
    switch (formType) {
      case 'Book Consultation':
        subject = `[Consultation Request] ${clientName} - ${fields.practiceArea || 'General Legal'}`;
        break;
      case 'Callback Request':
        subject = `[URGENT Callback Request] ${clientName} (${clientPhone || 'No Phone'}) - Lawzunction`;
        break;
      case 'Smart Intake Inquiry':
        subject = `[Legal Intake] ${fields.subject ? fields.subject.slice(0, 45) + ' - ' : ''}${clientName}`;
        break;
      case 'Career Application':
        subject = `[Career Application] ${fields.targetPosition || 'Position'}: ${clientName}`;
        break;
      case 'Newsletter Subscription':
        subject = `[New Subscriber] Firm Newsletter: ${clientName !== 'Website Visitor' ? clientName : (clientEmail || 'New Subscriber')}`;
        break;
      case 'Briefings Subscription':
        subject = `[New Subscriber] Knowledge Center Briefings: ${clientEmail || clientName}`;
        break;
      default:
        subject = `[Website Notification] ${formType}: ${clientName}`;
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'jwt', '_id', '__v', 'mustchangepassword'];
    let rowsHtml = '';
    for (const [key, value] of Object.entries(fields)) {
      if (sensitiveKeys.includes(key.toLowerCase())) continue;
      if (value !== undefined && value !== null && value !== '') {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());

        let displayValue = String(value);
        if (displayValue.includes('no-email-provided@lawzunction.in')) {
          displayValue = '<span style="color: #64748b; font-style: italic;">Not Provided by User</span>';
        } else if (key.toLowerCase().includes('phone') && displayValue !== 'N/A') {
          displayValue = `<a href="tel:${escapeHtml(displayValue)}" style="color: #2563eb; font-weight: bold; text-decoration: none;">${escapeHtml(displayValue)}</a>`;
        } else if (key.toLowerCase().includes('email') && clientEmail) {
          displayValue = `<a href="mailto:${escapeHtml(clientEmail)}" style="color: #2563eb; font-weight: bold; text-decoration: none;">${escapeHtml(clientEmail)}</a>`;
        } else if (key.toLowerCase().includes('link') && displayValue.startsWith('http')) {
          displayValue = `<a href="${escapeHtml(displayValue)}" style="background: #2563eb; color: #ffffff; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 0.85rem; font-weight: bold;">Open Meeting Room</a>`;
        } else {
          displayValue = escapeHtml(displayValue);
        }

        rowsHtml += `
          <tr>
            <th style="text-align: left; padding: 12px 14px; border: 1px solid #e2e8f0; background: #f8fafc; width: 35%; font-size: 0.88rem; color: #334155;">${escapeHtml(formattedKey)}</th>
            <td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-size: 0.92rem; color: #0f172a;">${displayValue}</td>
          </tr>
        `;
      }
    }

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff;">
        <div style="background: #07172e; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="color: #ffd700; margin: 0; font-size: 1.5rem; letter-spacing: 1px;">LAWZUNCTION INTAKE DESK</h2>
          <p style="margin: 6px 0 0 0; font-size: 0.9rem; color: #cbd5e1; font-weight: 500;">New Form Submission: <strong style="color: #ffffff;">${escapeHtml(formType)}</strong></p>
        </div>
        
        <div style="margin-top: 20px; border-bottom: 2px solid #ffd700; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: #0f172a; margin: 0; font-size: 1.15rem;">Submission Details</h3>
          <span style="font-size: 0.8rem; color: #64748b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 18px 0;">
          ${rowsHtml}
        </table>

        <!-- Direct Action Bar -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 20px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 0.88rem; color: #475569; font-weight: 600;">Direct Contact Actions:</p>
          <div style="display: inline-flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
            ${clientEmail ? `
              <a href="mailto:${escapeHtml(clientEmail)}" style="background: #0f172a; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: bold; display: inline-block;">
                ✉️ Email ${escapeHtml(clientName)}
              </a>
            ` : ''}
            ${clientPhone ? `
              <a href="tel:${escapeHtml(clientPhone)}" style="background: #059669; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: bold; display: inline-block;">
                📞 Call ${escapeHtml(clientPhone)}
              </a>
            ` : ''}
          </div>
          ${clientEmail ? `
            <p style="margin: 10px 0 0 0; font-size: 0.8rem; color: #64748b;">
              💡 <em>Direct Reply Enabled: Hit <strong>Reply</strong> in your email client to respond to ${escapeHtml(clientEmail)} directly.</em>
            </p>
          ` : ''}
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 12px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 0.78rem; margin: 0;">
          Lawzunction Automated Notification Engine • Dispatched to ${adminRecipient}
        </p>
      </div>
    `;

    const payload = {
      from: getFromAddress(),
      to: [adminRecipient],
      subject,
      html
    };

    if (clientEmail) {
      payload.replyTo = clientEmail;
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error(`❌ Resend API Error [Admin Notification - ${formType}]:`, {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode || error.status
      });

      // Sandbox fallback if custom domain encounters temporary verification or policy block
      if (error.statusCode === 403 && (error.message?.includes('not verified') || error.message?.includes('testing emails'))) {
        try {
          console.warn(`⚠️ Attempting sandbox fallback via onboarding@resend.dev...`);
          const fallbackRes = await resend.emails.send({
            ...payload,
            from: 'Lawzunction Legal <onboarding@resend.dev>'
          });
          if (fallbackRes.data) {
            console.log(`✅ [Fallback Success] Delivered via sandbox [Admin Notification - ${formType}] (ID: ${fallbackRes.data.id})`);
            return { success: true, provider: 'RESEND_SANDBOX', id: fallbackRes.data.id };
          }
        } catch (fbErr) {
          console.error('Fallback dispatch error:', fbErr.message);
        }
      }

      return { success: false, provider: 'RESEND', error };
    }

    console.log(`✅ [Success] Resend Admin Notification for "${formType}" delivered to ${adminRecipient} (ID: ${data.id})`);
    return { success: true, provider: 'RESEND', id: data.id };
  } catch (error) {
    console.error(`❌ Exception sending Admin Notification via Resend [${formType}]:`, error.message || error);
    return { success: false, provider: 'RESEND', error: error.message || error };
  }
};

/**
 * FLOW 2 — Welcome / confirmation email (sent TO the customer)
 * @param {string} toEmail - Customer email address
 * @param {string} type - E.g. 'Newsletter', 'Briefings', 'Consultation Request', 'Career Application'
 * @param {string} name - Customer name
 */
export const sendWelcomeEmail = async (toEmail, type = 'Newsletter', name = '') => {
  try {
    if (!toEmail || typeof toEmail !== 'string' || toEmail.includes('no-email-provided')) {
      console.log(`ℹ️ [Skipping Resend] Welcome email for "${type}" - Invalid recipient address: [REDACTED]`);
      return { success: false, reason: 'Invalid recipient email' };
    }

    const resend = getResendClient();
    if (!resend) {
      console.log(`ℹ️ [Skipping Resend] Welcome email for "${type}" to [REDACTED] - RESEND_API_KEY missing.`);
      return { success: false, reason: 'RESEND_API_KEY missing' };
    }

    const recipientName = name || 'Valued Subscriber';
    const subject = `Welcome to Lawzunction ${type}`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #1e293b; font-size: 24px; margin: 0; letter-spacing: 1px;">LAWZUNCTION</h1>
          <p style="color: #c5a880; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; font-weight: 600;">Legal Consultancy & Strategic Advocacy</p>
        </div>
        
        <h2 style="color: #1e293b; font-size: 18px; border-bottom: 2px solid #c5a880; padding-bottom: 8px;">Subscription Confirmed 🎉</h2>
        
        <p style="color: #475569; line-height: 1.6;">Dear <strong>${recipientName}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">Thank you for connecting with <strong>Lawzunction ${type}</strong>! You are now subscribed to receive our latest legal updates, corporate compliance guidelines, case law briefs, and strategic analysis.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #c5a880; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; color: #334155; font-size: 14px; font-weight: 600;">What to expect in your inbox:</p>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #64748b; font-size: 13px; line-height: 1.6;">
            <li>Regulatory & Compliance Bulletins</li>
            <li>Landmark High Court & Supreme Court Case Summaries</li>
            <li>Corporate Governance & Strategic Legal Guides</li>
          </ul>
        </div>

        <p style="color: #475569; line-height: 1.6;">If you ever have any specific legal queries or require formal advisory services, feel free to visit our portal anytime.</p>
        
        <p style="text-align: center; margin-top: 30px;">
          <a href="https://lawzunction.in/#/knowledge" style="background-color: #07172e; color: #ffd700; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Explore Knowledge Center</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 15px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0;">
          Lawzunction Legal • Indore & Timarni Offices • <a href="mailto:lawzunction@gmail.com" style="color: #c5a880;">lawzunction@gmail.com</a>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [toEmail],
      subject,
      html
    });

    if (error) {
      console.error(`❌ Resend API Error [Welcome Email - ${type}]:`, {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode || error.status
      });

      if (error.statusCode === 403 || (error.message && error.message.includes('only send testing emails'))) {
        console.warn(`\n⚠️ RESEND SANDBOX RESTRICTION ENCOUNTERED:`);
        console.warn(`   Resend requires domain verification for external recipients.`);
        console.warn(`   External recipient emails are blocked until lawzunction.in DNS records are verified at https://resend.com/domains\n`);
      }

      return { success: false, provider: 'RESEND', error };
    }

    console.log(`✅ Resend Email Delivered [Welcome Email - ${type}] (ID: ${data.id})`);
    return { success: true, provider: 'RESEND', id: data.id };
  } catch (error) {
    console.error(`❌ Exception sending Welcome Email via Resend [${type}]:`, error.message || error);
    return { success: false, provider: 'RESEND', error: error.message || error };
  }
};

// --- Helper functions for existing route signatures ---

export const sendBookingEmail = async (booking) => {
  console.log(`\n📋 [Email Trigger: Book Consultation] Processing booking for "${booking.name}"...`);
  try {
    // Flow 1: Admin notification to lawzunction@gmail.com with replyTo set to client email
    const adminResult = await sendAdminNotification('Book Consultation', {
      bookingReference: booking.id || booking._id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      practiceArea: booking.practiceArea,
      assignedAdvocate: booking.lawyer || booking.lawyerName || 'Lead Advocate',
      scheduledDate: booking.date,
      timeSlot: booking.timeSlot,
      description: booking.description || 'N/A',
      meetingLink: booking.zoomLink
    });

    // Flow 2: Welcome / confirmation email to client (if valid email provided)
    let clientResult = null;
    const clientEmail = getValidClientEmail(booking.email);
    if (clientEmail) {
      clientResult = await sendWelcomeEmail(clientEmail, 'Consultation Request', booking.name);
    } else {
      console.log('ℹ️ [Client Welcome Skipped] No valid customer email provided in booking intake.');
    }

    return {
      success: adminResult.success,
      adminNotification: adminResult,
      clientNotification: clientResult
    };
  } catch (err) {
    console.error('❌ sendBookingEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

export const sendAppointmentConfirmedEmail = async (booking) => {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, reason: 'RESEND_API_KEY missing' };

    const clientEmail = getValidClientEmail(booking.email);
    if (!clientEmail) {
      console.log('ℹ️ [Appointment Confirmed Skipped] No valid client email to send confirmation to.');
      return { success: false, reason: 'No valid client email' };
    }

    const lawyerDisplay = escapeHtml(booking.lawyer || booking.lawyerName || 'Advocate Counsel');
    const safeName = escapeHtml(booking.name || 'Client');
    const safeDate = escapeHtml(booking.date || '');
    const safeTimeSlot = escapeHtml(booking.timeSlot || '');
    const safePracticeArea = escapeHtml(booking.practiceArea || 'General Legal Consultation');
    const safeZoomLink = (booking.zoomLink && (booking.zoomLink.startsWith('https://') || booking.zoomLink.startsWith('http://')))
      ? escapeHtml(booking.zoomLink)
      : '#';

    const subject = `Confirmed: Your Consultation with Lawzunction is Approved (${safeDate})`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: #ffffff;">
        <div style="background: #059669; color: white; padding: 15px; border-radius: 6px; text-align: center;">
          <h2 style="margin: 0;">CONSULTATION CONFIRMED ✔</h2>
          <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Your appointment has been accepted by Lawzunction.</p>
        </div>
        <p style="margin-top: 20px;">Dear <strong>${safeName}</strong>,</p>
        <p>Your legal consultation request has been officially <strong>CONFIRMED</strong> with <strong>${lawyerDisplay}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f8fafc;">
            <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Date & Time</th>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #047857;">${safeDate} • ${safeTimeSlot}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Practice Area</th>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${safePracticeArea}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Meeting Link</th>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><a href="${safeZoomLink}" style="color: #2563eb; font-weight: bold;">Launch Meeting Room</a></td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0 15px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 0.8rem;">Lawzunction Legal Consultancy</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [clientEmail],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend sendAppointmentConfirmedEmail Error:', error);
      return { success: false, error };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendAppointmentConfirmedEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

export const sendEnquiryAdminEmail = async (enquiry) => {
  const formType = enquiry.type || 'Smart Intake Inquiry';
  console.log(`\n📋 [Email Trigger: ${formType}] Processing inquiry for "${enquiry.name}"...`);
  try {
    // Flow 1: Admin notification to lawzunction@gmail.com with replyTo set to client email
    const adminFields = {
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone || 'N/A',
      practiceArea: enquiry.practiceArea || 'General Advocacy',
      urgency: enquiry.urgency || (formType === 'Callback Request' ? 'Urgent' : 'Routine')
    };

    if (formType === 'Callback Request') {
      adminFields.callbackRequested = 'Yes (Within 2 Business Hours)';
      adminFields.notes = enquiry.message || 'Strategic Callback requested via Home Page';
    } else {
      adminFields.subject = enquiry.subject || 'N/A';
      adminFields.message = enquiry.message || 'N/A';
    }

    const adminResult = await sendAdminNotification(formType, adminFields);

    // Flow 2: Welcome confirmation email to client
    let clientResult = null;
    const clientEmail = getValidClientEmail(enquiry.email);
    if (clientEmail) {
      clientResult = await sendWelcomeEmail(clientEmail, formType, enquiry.name);
    } else {
      console.log(`ℹ️ [Client Welcome Skipped] No valid customer email provided for "${formType}".`);
    }

    return {
      success: adminResult.success,
      adminNotification: adminResult,
      clientNotification: clientResult
    };
  } catch (err) {
    console.error('❌ sendEnquiryAdminEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Template for Firm Newsletter welcome email
 */
export const getNewsletterWelcomeTemplate = (name) => {
  const safeName = escapeHtml(name || 'Subscriber');
  const subject = `Welcome to the Lawzunction Newsletter — Legal Insights & Firm Updates`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #040814; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1.5px;">LAWZUNCTION</h1>
        <p style="color: #c5a880; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; font-weight: 600;">Legal Consultancy & Strategic Advocacy</p>
      </div>

      <div style="background: linear-gradient(135deg, rgba(197, 168, 128, 0.15) 0%, rgba(4, 8, 20, 0.03) 100%); border: 1px solid rgba(197, 168, 128, 0.4); border-radius: 8px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
        <h2 style="color: #040814; font-size: 19px; margin: 0 0 6px 0; font-weight: 700;">Welcome to the Lawzunction Newsletter ⚖️</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">Subscription Confirmed • Firm Updates & Legal Intelligence</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${safeName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Thank you for subscribing to the official <strong>Lawzunction Newsletter</strong>. You are now part of our legal advisory readership network across India, receiving curated insights and corporate updates directly from our practicing advocates.
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid #c5a880; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 22px 0;">
        <p style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; font-weight: 700;">What you will receive every month:</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13.5px; line-height: 1.7;">
          <li><strong>🏛️ Partner Editorial:</strong> Deep-dives into emerging commercial jurisprudence and high-stakes dispute resolution trends.</li>
          <li><strong>⚖️ Regulatory & Corporate Shifts:</strong> Practical commentary on company law compliance, cross-border M&A, and transaction structures.</li>
          <li><strong>📰 Lawzunction Firm Highlights:</strong> Notable litigation highlights, upcoming CLE events, and firm publications.</li>
        </ul>
      </div>

      <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
        Have a specific matter requiring immediate advisory? Our legal team is available to assist your business across India.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="https://lawzunction.in" style="background-color: #040814; color: #d4af37; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; border: 1px solid #d4af37;">
          Explore Lawzunction Portal
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">
        Lawzunction Legal • Indore & Timarni Chambers • <a href="mailto:lawzunction@gmail.com" style="color: #c5a880; text-decoration: none;">lawzunction@gmail.com</a>
      </p>
      <p style="text-align: center; color: #cbd5e1; font-size: 11px; margin: 0;">
        You received this email because you subscribed to our firm newsletter at lawzunction.in.
      </p>
    </div>
  `;
  return { subject, html };
};

/**
 * Template for Knowledge Center Legal Briefings welcome email
 */
export const getBriefingsWelcomeTemplate = (name) => {
  const safeName = escapeHtml(name || 'Legal Professional');
  const subject = `Welcome to Lawzunction Legal Briefings — Regulatory & Case Law Dispatches`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #040814; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1.5px;">LAWZUNCTION</h1>
        <p style="color: #c5a880; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; font-weight: 600;">Research & Knowledge Desk</p>
      </div>

      <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(4, 8, 20, 0.03) 100%); border: 1px solid rgba(37, 99, 235, 0.3); border-radius: 8px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
        <h2 style="color: #040814; font-size: 19px; margin: 0 0 6px 0; font-weight: 700;">Subscribed to Lawzunction Legal Briefings 📜</h2>
        <p style="color: #2563eb; font-size: 13px; margin: 0; font-weight: 600;">Fast-Track Case Digests & Statutory Compliance Memos</p>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${safeName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Thank you for subscribing to <strong>Lawzunction Legal Briefings</strong>. Our research desk systematically tracks statutory notifications, landmark High Court and Supreme Court rulings, and regulatory actions across India to deliver timely, actionable intelligence directly to your inbox.
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 22px 0;">
        <p style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; font-weight: 700;">Your Briefings subscription includes:</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13.5px; line-height: 1.7;">
          <li><strong>⚡ Rapid Case Law Digests:</strong> Synthesized holdings, ratio decidendi, and precedent analysis of Supreme Court and High Court judgments.</li>
          <li><strong>📋 Regulatory Alerts:</strong> Immediate breakdowns of circulars, rules, and compliance mandates from RBI, SEBI, MCA, CCI, and DPDP authorities.</li>
          <li><strong>📑 In-House Counsel Whitepapers:</strong> Downloadable compliance checklists, policy briefs, and operational risk mitigation guides.</li>
        </ul>
      </div>

      <p style="font-size: 13.5px; line-height: 1.6; color: #475569;">
        All past case studies and whitepapers are freely accessible in our centralized Knowledge Center repository.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="https://lawzunction.in/#/knowledge" style="background-color: #07172e; color: #ffd700; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; border: 1px solid #ffd700;">
          Browse Knowledge Center
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">
        Lawzunction Legal • Research & Knowledge Desk • <a href="mailto:lawzunction@gmail.com" style="color: #2563eb; text-decoration: none;">lawzunction@gmail.com</a>
      </p>
      <p style="text-align: center; color: #cbd5e1; font-size: 11px; margin: 0;">
        You received this dispatch because you subscribed to Legal Briefings at lawzunction.in/#/knowledge.
      </p>
    </div>
  `;
  return { subject, html };
};

/**
 * FLOW: Newsletter Subscription (Subscriber Welcome Email + Admin Notification)
 */
export const sendNewsletterSubscriptionEmails = async ({ email, name, phone }) => {
  console.log(`\n📋 [Email Trigger: Newsletter Subscription] Processing newsletter subscription for "${name || email}"...`);
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('⚠️ [Resend Missing] RESEND_API_KEY is not defined.');
      return { success: false, error: 'RESEND_API_KEY missing' };
    }

    const clientEmail = getValidClientEmail(email);
    if (!clientEmail) {
      return { success: false, error: 'Invalid subscriber email address' };
    }

    // 1. Admin notification to lawzunction@gmail.com
    const adminResult = await sendAdminNotification('Newsletter Subscription', {
      subscriberName: name || 'Not Provided',
      subscriberEmail: clientEmail,
      subscriberPhone: phone || 'Not Provided',
      subscriptionType: 'Firm Newsletter',
      subscribedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    // 2. Client welcome email
    const { subject, html } = getNewsletterWelcomeTemplate(name);
    console.log(`📨 [Email Engine] Sending Newsletter Welcome Email to ${clientEmail}...`);
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [clientEmail],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend API Error [Newsletter Welcome Email]:', {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode || error.status
      });
      return {
        success: false,
        adminNotification: adminResult,
        clientNotification: { success: false, error },
        error
      };
    }

    console.log(`✅ [Success] Resend Newsletter Welcome delivered to ${clientEmail} (ID: ${data.id})`);
    return {
      success: true,
      adminNotification: adminResult,
      clientNotification: { success: true, id: data.id }
    };
  } catch (err) {
    console.error('❌ sendNewsletterSubscriptionEmails Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * FLOW: Knowledge Center Briefings Subscription (Subscriber Welcome Email + Admin Notification)
 */
export const sendBriefingsSubscriptionEmails = async ({ email, name, phone }) => {
  console.log(`\n📋 [Email Trigger: Briefings Subscription] Processing briefings subscription for "${email}"...`);
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('⚠️ [Resend Missing] RESEND_API_KEY is not defined.');
      return { success: false, error: 'RESEND_API_KEY missing' };
    }

    const clientEmail = getValidClientEmail(email);
    if (!clientEmail) {
      return { success: false, error: 'Invalid subscriber email address' };
    }

    // 1. Admin notification to lawzunction@gmail.com
    const adminResult = await sendAdminNotification('Briefings Subscription', {
      subscriberName: name || 'Legal Professional',
      subscriberEmail: clientEmail,
      subscriberPhone: phone || 'Not Provided',
      subscriptionType: 'Knowledge Center Briefings',
      subscribedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    // 2. Client welcome email
    const { subject, html } = getBriefingsWelcomeTemplate(name);
    console.log(`📨 [Email Engine] Sending Briefings Welcome Email to ${clientEmail}...`);
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [clientEmail],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend API Error [Briefings Welcome Email]:', {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode || error.status
      });
      return {
        success: false,
        adminNotification: adminResult,
        clientNotification: { success: false, error },
        error
      };
    }

    console.log(`✅ [Success] Resend Briefings Welcome delivered to ${clientEmail} (ID: ${data.id})`);
    return {
      success: true,
      adminNotification: adminResult,
      clientNotification: { success: true, id: data.id }
    };
  } catch (err) {
    console.error('❌ sendBriefingsSubscriptionEmails Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Backward-compatible delegator for newsletter welcome emails
 */
export const sendNewsletterWelcomeEmail = async (params) => {
  if (params?.type === 'Briefings') {
    return sendBriefingsSubscriptionEmails(params);
  }
  return sendNewsletterSubscriptionEmails(params);
};

export const sendCareerApplicationEmail = async (application, attachments = []) => {
  console.log(`\n📋 [Email Trigger: Career Application] Processing application from "${application.name}" for "${application.jobTitle}"...`);
  try {
    // Flow 1: Admin notification to lawzunction@gmail.com with candidate replyTo and resume attachment
    const adminResult = await sendAdminNotification('Career Application', {
      targetPosition: application.jobTitle || application.position || 'General Application',
      candidateName: application.name,
      candidateEmail: application.email,
      candidatePhone: application.phone,
      resumeFileName: application.fileName || application.resumeFileName || 'Resume Attached',
      coverLetter: application.coverLetter || 'No cover note provided.'
    }, attachments);

    // Flow 2: Confirmation to candidate
    let clientResult = null;
    const clientEmail = getValidClientEmail(application.email);
    if (clientEmail) {
      clientResult = await sendWelcomeEmail(clientEmail, `Career Application (${application.jobTitle || 'General Application'})`, application.name);
    }

    return {
      success: adminResult.success,
      adminNotification: adminResult,
      clientNotification: clientResult
    };
  } catch (err) {
    console.error('❌ sendCareerApplicationEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

export const sendResetPasswordEmail = async (email, name, token) => {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, reason: 'RESEND_API_KEY missing' };

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://lawzunction.in';
    const resetLink = `${frontendUrl}/#/reset-password?token=${token}`;
    const subject = `Reset Your Lawzunction Password`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #c5a880;">Password Reset Request</h2>
        <p>Hello ${name ? name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'User'},</p>
        <p>We received a request to reset the password for your Lawzunction account. Click below to complete the reset (valid for 15 minutes, single-use):</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #c5a880; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #a0a0a0; font-size: 0.8rem;">Lawzunction Legal</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [email],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend sendResetPasswordEmail Error:', error);

      // Automatic resilience fallback: If domain is not yet verified on GoDaddy DNS,
      // dispatch via onboarding@resend.dev
      if (error.statusCode === 403 && (error.message?.includes('not verified') || error.message?.includes('testing emails'))) {
        try {
          const fallbackRes = await resend.emails.send({
            from: 'Lawzunction Legal <onboarding@resend.dev>',
            to: [email],
            subject,
            html
          });
          if (fallbackRes.data) {
            console.log('✅ Resend Reset Password Email Delivered via sandbox fallback (ID:', fallbackRes.data.id, ')');
            return { success: true, id: fallbackRes.data.id };
          }
        } catch (fbErr) {
          console.warn('Reset email fallback dispatch error:', fbErr.message);
        }
      }

      return { success: false, error };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendResetPasswordEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

export const sendCaseUpdateEmail = async (clientEmail, clientName, caseTitle, status, progress, lastUpdate) => {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, reason: 'RESEND_API_KEY missing' };

    const safeClientName = escapeHtml(clientName || 'Client');
    const safeCaseTitle = escapeHtml(caseTitle || 'Legal Matter');
    const safeStatus = escapeHtml(status || 'Updated');
    const safeProgress = Math.max(0, Math.min(100, parseInt(progress, 10) || 0));
    const safeLastUpdate = escapeHtml(lastUpdate || 'No remarks provided.');

    const subject = `Update: Case Progress for "${safeCaseTitle}" - ${safeStatus}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #c5a880; border-bottom: 2px solid #c5a880; padding-bottom: 10px;">Case Status Update</h2>
        <p>Dear <strong>${safeClientName}</strong>,</p>
        <p>There is a new update on your active legal matter.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f9f9f9;">
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Case Title</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${safeCaseTitle}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Milestone Status</th>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${safeStatus}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <th style="text-align: left; padding: 10px; border: 1px solid #ddd;">Progress Completion</th>
            <td style="padding: 10px; border: 1px solid #ddd;">${safeProgress}%</td>
          </tr>
        </table>
        <p><strong>Remarks:</strong> ${safeLastUpdate}</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [clientEmail],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend sendCaseUpdateEmail Error:', error);
      return { success: false, error };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendCaseUpdateEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

export const sendLawyerCredentialsEmail = async (email, name, initialPassword, isReset = false) => {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, reason: 'RESEND_API_KEY missing' };

    const safeName = escapeHtml(name || 'Counsel');
    const safeEmail = escapeHtml(email);
    const safePassword = escapeHtml(initialPassword);

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://lawzunction.in';
    const subject = isReset 
      ? `Password Reset: Lawzunction Attorney Credentials`
      : `Welcome Counsel: Your Lawzunction Account Credentials`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #040814; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 1px;">LAWZUNCTION</h1>
          <p style="color: #c5a880; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Advocacy & Legal Advisory Panel</p>
        </div>
        <h2 style="color: #040814; border-bottom: 2px solid #c5a880; padding-bottom: 10px; font-size: 18px;">
          ${isReset ? 'Password Reset Notice' : 'Welcome to the Lawzunction Counsel Panel'}
        </h2>
        <p>Dear <strong>Counsel ${safeName}</strong>,</p>
        <p>${isReset ? 'An administrator has reset your account temporary password.' : 'An administrator has created your counsel account on the official Lawzunction management portal.'}</p>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border: 1.5px solid #cbd5e1; margin: 20px 0;">
          <p style="margin: 6px 0;"><strong>Portal Login URL:</strong> <a href="${frontendUrl}/#/portal" style="color: #0f3a69;">${frontendUrl}/#/portal</a></p>
          <p style="margin: 6px 0;"><strong>Registered Email:</strong> ${safeEmail}</p>
          <p style="margin: 6px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 14px;">${safePassword}</code></p>
        </div>

        <div style="background: rgba(197, 168, 128, 0.15); border-left: 4px solid #c5a880; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #040814;">
            <strong>⚠️ Required Next Steps:</strong><br />
            1. <strong>Change Password on First Login:</strong> For account security, you must replace your temporary password with a secure permanent password upon your initial login.<br />
            2. <strong>Complete Your Profile:</strong> Navigate to the <em>"My Profile"</em> tab to fill in your practice areas, Bar Council registration number, court details, bio, and photo.<br />
            3. <strong>Submit for Verification:</strong> Once completed, submit your profile for admin review to be published on the public Lawzunction lawyer directory.
          </p>
        </div>

        <p style="margin-top: 25px; text-align: center;">
          <a href="${frontendUrl}/#/portal" style="background: #c5a880; color: #040814; padding: 12px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Log In to Counsel Portal</a>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [email],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend sendLawyerCredentialsEmail Error:', error);
      return { success: false, error };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendLawyerCredentialsEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Send notification to Lawzunction admin when a lawyer submits profile for review
 */
export const sendLawyerProfileSubmittedAdminEmail = async (lawyerData) => {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, reason: 'RESEND_API_KEY missing' };

    const safeName = escapeHtml(lawyerData.name || 'Advocate');
    const safeEmail = escapeHtml(lawyerData.email || 'N/A');
    const safeBarNo = escapeHtml(lawyerData.barCouncilNumber || 'Not provided');
    const safeCity = escapeHtml(lawyerData.city || 'N/A');
    const safeSpecs = escapeHtml(Array.isArray(lawyerData.specializations) ? lawyerData.specializations.join(', ') : (lawyerData.specializations || 'N/A'));

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://lawzunction.in';
    const subject = `[Action Required] Advocate Profile Submitted for Review: ${safeName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
        <h2 style="color: #040814; border-bottom: 2px solid #c5a880; padding-bottom: 10px; font-size: 18px;">
          ⚖️ Advocate Profile Ready for Verification
        </h2>
        <p>A counsel member has completed their profile and submitted it for administrative review and publication on the Lawzunction directory.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold; width: 40%;">Advocate Name:</td><td style="padding: 8px;">${safeName}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Registered Email:</td><td style="padding: 8px;">${safeEmail}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Bar Council No.:</td><td style="padding: 8px;">${safeBarNo}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">City of Practice:</td><td style="padding: 8px;">${safeCity}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Specializations:</td><td style="padding: 8px;">${safeSpecs}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Submitted At:</td><td style="padding: 8px;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
        </table>

        <p style="margin-top: 25px; text-align: center;">
          <a href="${frontendUrl}/#/portal" style="background: #0f3a69; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Open Admin Portal to Review</a>
        </p>
      </div>
    `;

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'lawzunction@gmail.com';
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [adminEmail],
      replyTo: lawyerData.email,
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend sendLawyerProfileSubmittedAdminEmail Error:', error);
      return { success: false, error };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendLawyerProfileSubmittedAdminEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Send approval confirmation email to lawyer when admin approves profile
 */
export const sendLawyerProfileApprovedEmail = async (email, name, slug) => {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, reason: 'RESEND_API_KEY missing' };

    const safeName = escapeHtml(name || 'Counsel');
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://lawzunction.in';
    const profileUrl = slug ? `${frontendUrl}/#/lawyers/${slug}` : `${frontendUrl}/#/lawyers`;
    const subject = `Congratulations! Your Lawzunction Advocate Profile is Now Live`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
        <h2 style="color: #166534; border-bottom: 2px solid #22c55e; padding-bottom: 10px; font-size: 18px;">
          🎉 Profile Approved & Published
        </h2>
        <p>Dear <strong>Counsel ${safeName}</strong>,</p>
        <p>We are delighted to inform you that your advocate credentials and profile have been successfully reviewed and <strong>published</strong> to the official Lawzunction public advocate directory.</p>
        
        <div style="background: rgba(34, 197, 94, 0.1); border-left: 4px solid #22c55e; padding: 14px 18px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; font-size: 14px; color: #14532d;">
            <strong>Your Profile is Live:</strong> Potential corporate and private clients can now view your legal background, credentials, and schedule consultation sessions with you directly.
          </p>
        </div>

        <p style="text-align: center; margin: 25px 0;">
          <a href="${profileUrl}" style="background: #c5a880; color: #040814; padding: 12px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Your Public Profile</a>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [email],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend sendLawyerProfileApprovedEmail Error:', error);
      return { success: false, error };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendLawyerProfileApprovedEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Send rejection notification with mandatory reason to lawyer
 */
export const sendLawyerProfileRejectedEmail = async (email, name, reason) => {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, reason: 'RESEND_API_KEY missing' };

    const safeName = escapeHtml(name || 'Counsel');
    const safeReason = escapeHtml(reason || 'Additional information or credential verification required.');
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://lawzunction.in';
    const subject = `Action Required: Your Lawzunction Advocate Profile Requires Revisions`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
        <h2 style="color: #991b1b; border-bottom: 2px solid #ef4444; padding-bottom: 10px; font-size: 18px;">
          Action Required: Profile Review Feedback
        </h2>
        <p>Dear <strong>Counsel ${safeName}</strong>,</p>
        <p>Your advocate profile submission was reviewed by our administrative panel and requires updates before it can be made public.</p>
        
        <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #991b1b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Reason / Required Changes:</p>
          <p style="margin: 0; font-size: 14.5px; color: #7f1d1d; line-height: 1.5;">"${safeReason}"</p>
        </div>

        <p style="font-size: 14px; color: #475569;">
          Please log in to your Lawzunction Counsel Portal, navigate to <strong>My Profile</strong>, make the requested adjustments, and click <strong>Submit for Review</strong> again.
        </p>

        <p style="text-align: center; margin: 25px 0;">
          <a href="${frontendUrl}/#/portal" style="background: #0f3a69; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Update Profile in Portal</a>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [email],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend sendLawyerProfileRejectedEmail Error:', error);
      return { success: false, error };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendLawyerProfileRejectedEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Send professional case allotment notification to the assigned advocate/lawyer
 */
export const sendCaseAllotmentEmail = async ({
  lawyerEmail,
  lawyerName,
  caseNumber,
  caseTitle,
  caseType,
  clientName,
  caseDescription,
  allotmentDate,
  hearingDateOrDeadline
}) => {
  console.log(`\n⚖️ [Email Trigger: Case Allotment] Preparing allotment email for Lawyer "${lawyerName}" (${lawyerEmail})...`);
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('⚠️ [Skipping Resend] Case allotment email - RESEND_API_KEY not configured.');
      return { success: false, reason: 'RESEND_API_KEY missing' };
    }

    const safeLawyerName = escapeHtml(lawyerName || 'Counsel');
    const safeCaseNumber = escapeHtml(caseNumber || 'N/A');
    const safeCaseTitle = escapeHtml(caseTitle || 'Legal Matter');
    const safeCaseType = escapeHtml(caseType || 'Litigation & Legal Advisory');
    const safeClientName = escapeHtml(clientName || 'Confidential Client');
    const safeDescription = escapeHtml(caseDescription || 'Direct legal representation and counsel advisory.');
    const safeAllotmentDate = escapeHtml(allotmentDate || new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }));
    const safeDeadline = escapeHtml(hearingDateOrDeadline || 'To be scheduled / Refer to case docket');

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://lawzunction.in';
    const subject = `[Case Allotment Notice] Matter Assigned: ${safeCaseNumber} - ${safeCaseTitle}`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
        <div style="background-color: #07172e; color: #ffffff; padding: 24px; border-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0; letter-spacing: 1.5px; font-weight: 700;">LAWZUNCTION</h1>
          <p style="color: #c5a880; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">Legal Consultancy & Strategic Advocacy</p>
          <div style="margin-top: 14px; display: inline-block; background: rgba(197, 168, 128, 0.15); border: 1px solid #c5a880; padding: 4px 14px; border-radius: 20px;">
            <span style="color: #ffd700; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Official Case Assignment</span>
          </div>
        </div>

        <div style="padding: 20px 0 10px 0;">
          <p style="color: #1e293b; font-size: 16px; margin: 0 0 12px 0;">Dear <strong>Counsel ${safeLawyerName}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
            You have been officially allotted as representing counsel for the legal matter docketed below. Please review the case information and access your advocate dashboard for complete client records, evidence files, and case schedules.
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 22px;">
          <div style="background: #0f172a; color: #ffffff; padding: 10px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
            CASE DOCKET SPECIFICATIONS
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tbody>
              <tr>
                <th style="text-align: left; padding: 11px 16px; border-bottom: 1px solid #e2e8f0; width: 35%; color: #64748b; background: #ffffff;">Case Docket / Number</th>
                <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; background: #ffffff;">
                  <span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-family: monospace;">${safeCaseNumber}</span>
                </td>
              </tr>
              <tr>
                <th style="text-align: left; padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; background: #f8fafc;">Case Title / Caption</th>
                <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; background: #f8fafc;">${safeCaseTitle}</td>
              </tr>
              <tr>
                <th style="text-align: left; padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; background: #ffffff;">Practice / Matter Type</th>
                <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: #334155; background: #ffffff;">${safeCaseType}</td>
              </tr>
              <tr>
                <th style="text-align: left; padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; background: #f8fafc;">Client Name</th>
                <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; background: #f8fafc;">${safeClientName}</td>
              </tr>
              <tr>
                <th style="text-align: left; padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; background: #ffffff;">Allotment Date</th>
                <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: #334155; background: #ffffff;">${safeAllotmentDate}</td>
              </tr>
              <tr>
                <th style="text-align: left; padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; background: #f8fafc;">Hearing Date / Deadline</th>
                <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: #b45309; font-weight: 600; background: #f8fafc;">${safeDeadline}</td>
              </tr>
              <tr>
                <th style="text-align: left; padding: 11px 16px; color: #64748b; background: #ffffff; vertical-align: top;">Brief Description / Summary</th>
                <td style="padding: 11px 16px; color: #334155; background: #ffffff; line-height: 1.5;">${safeDescription}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
            <strong>Advocate Next Steps:</strong> Log in to your Lawzunction Advocate Portal to examine full evidentiary documents, file appearance memos, liaise with client representatives, and log progress milestones.
          </p>
        </div>

        <div style="text-align: center; margin: 26px 0;">
          <a href="${frontendUrl}/#/portal" style="background-color: #c5a880; color: #07172e; padding: 13px 30px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            Access Case Docket in Lawyer Portal &rarr;
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 11px; margin: 0 0 6px 0;">
          CONFIDENTIALITY NOTICE: This transmission is intended solely for the designated counsel and contains legally privileged information. If received in error, notify Lawzunction Administration immediately.
        </p>
        <p style="text-align: center; color: #94a3b8; font-size: 11px; margin: 0;">
          Lawzunction Automated Notification Engine • Dispatched to ${escapeHtml(lawyerEmail)}
        </p>
      </div>
    `;

    const payload = {
      from: getFromAddress(),
      to: [lawyerEmail],
      subject,
      html
    };

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error('❌ Resend sendCaseAllotmentEmail Error:', error);
      if (error.statusCode === 403 && (error.message?.includes('not verified') || error.message?.includes('testing emails'))) {
        try {
          const fallbackRes = await resend.emails.send({
            ...payload,
            from: 'Lawzunction Legal <onboarding@resend.dev>'
          });
          if (fallbackRes.data) {
            console.log(`✅ [Fallback Success] Case allotment delivered via sandbox (ID: ${fallbackRes.data.id})`);
            return { success: true, provider: 'RESEND_SANDBOX', id: fallbackRes.data.id };
          }
        } catch (fbErr) {
          console.error('Fallback dispatch error:', fbErr.message);
        }
      }
      return { success: false, error };
    }

    console.log(`✅ [Success] Resend Case Allotment email delivered to ${lawyerEmail} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendCaseAllotmentEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Notify previous lawyer if case was re-assigned to another advocate
 */
export const sendCaseUnassignedEmail = async ({
  lawyerEmail,
  lawyerName,
  caseNumber,
  caseTitle
}) => {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, reason: 'RESEND_API_KEY missing' };

    const safeLawyerName = escapeHtml(lawyerName || 'Counsel');
    const safeCaseNumber = escapeHtml(caseNumber || 'N/A');
    const safeCaseTitle = escapeHtml(caseTitle || 'Legal Matter');
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://lawzunction.in';

    const subject = `[Case Reassignment Notice] Matter ${safeCaseNumber} Updated`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 22px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <div style="background: #07172e; color: #ffffff; padding: 18px; border-radius: 6px; text-align: center;">
          <h2 style="color: #ffd700; margin: 0; font-size: 1.25rem;">LAWZUNCTION</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #cbd5e1;">Case Reassignment Notice</p>
        </div>
        <p style="margin-top: 18px; color: #1e293b;">Dear <strong>Counsel ${safeLawyerName}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">
          Please note that case <strong>${safeCaseNumber}</strong> ("${safeCaseTitle}") has been reassigned to another advocate by the administrative desk. This case has been updated in your active caseload.
        </p>
        <p style="color: #475569; line-height: 1.6;">
          You can log in to your <a href="${frontendUrl}/#/portal" style="color: #2563eb;">Advocate Portal</a> to review your remaining active matters.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0 10px 0;" />
        <p style="font-size: 0.75rem; color: #94a3b8; text-align: center; margin: 0;">Lawzunction Case Administration</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [lawyerEmail],
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend sendCaseUnassignedEmail Error:', error);
      return { success: false, error };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('❌ sendCaseUnassignedEmail Exception:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

