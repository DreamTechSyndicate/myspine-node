import nodemailer from 'nodemailer';

interface Mailer {
  email: string;
  name?: string;
  id?: number;
}

interface MailOptions {
  mailType: string;
  from: Mailer;
  to: Mailer;
  subject: string;
  html: string;
}

type MailTemplates = {
  [key: string]: Partial<MailOptions>;
};

export enum MailTypes {
  RESET_PASS_REQUESTED = 'reset_pass_requested',
  RESET_PASS_COMPLETED = 'reset_pass_completed',
  APPT_REQUESTED = 'appointment_requested',
}

type MailType = MailTypes.RESET_PASS_REQUESTED | MailTypes.RESET_PASS_COMPLETED | MailTypes.APPT_REQUESTED;

const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_PORT = parseInt(process.env.SMTP_PORT!);
const SMTP_SERVICE = process.env.SMTP_SERVICE;

const transporter = nodemailer.createTransport({
  host: SMTP_SERVICE,
  port: SMTP_PORT,
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASS,
  },
});

const mailTemplates: MailTemplates = {
  reset_pass_requested: {
    // from: `"Peace of Mind Spine.com" <${SMTP_EMAIL}>`,
    from: { email: SMTP_EMAIL! },
    subject: "Password reset",
  },
  reset_pass_completed: {
    // from: `"Peace of Mind Spine.com" <${SMTP_EMAIL}>`,
    from: { email: SMTP_EMAIL! },
    subject: "Successfully reset password",
    html: `<p>Done! You have successfully reset your password for <a href="https://peaceofmindspine.com">peaceofmindspine.com</a></p>`
  },
  appointment_requested: {
    to: { email: SMTP_EMAIL! },
    subject: "Request for Appointment"
  },
};

export const getMailConfigs = (
  mailType: MailType,
  from?: Mailer,
  to?: Mailer,
  html?: string
) => {
  const template = mailTemplates[mailType];

  if (!template) {
    throw new Error(`Unknown mail type: ${mailType}`);
  }

  return {
    from: template?.from?.email || from?.email,
    to: template?.to?.email || to?.email,
    subject: template.subject,
    html: html || template.html
  }
};

export const requestMail = async ({
  mailType,
  from,
  to,
  html,
}: {
  mailType: MailType;
  from?: Mailer;
  to?: Mailer;
  url?: string;
  html?: string;
}) => {
  try {
    const mailConfigs = getMailConfigs(mailType, from, to, html);
    const info = await transporter.sendMail(mailConfigs);
    console.log('Email sent:', info.response);
    return info;
  } catch (err) {
    console.error('Email error:', err);
    throw new Error('Unable to mail an appointment request at this time. Please try again later');
  } 
};
