const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

const sendOtpEmail = async (userEmail, otp) => {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    throw new Error("Brevo credentials missing. Please define BREVO_API_KEY and BREVO_SENDER_EMAIL.");
  }

  apiKey.apiKey = process.env.BREVO_API_KEY;
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Your LifeTrack Password Reset Code";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6382ff;">LifeTrack AI</h2>
      <h3>Password Reset Request</h3>
      <p>You requested a password reset. Use the following 6-digit OTP code to verify your identity.</p>
      <h1 style="color: #8b5cf6; letter-spacing: 4px; padding: 20px; background: #f3f4f6; display: inline-block; border-radius: 8px;">${otp}</h1>
      <p style="margin-top: 20px;">This code will automatically expire in exactly 10 minutes.</p>
      <p style="color: #888; font-size: 12px; margin-top: 50px;">If you did not request this password reset, please safely ignore this email.</p>
    </div>
  `;
  sendSmtpEmail.sender = { "name": "LifeTrack AI", "email": process.env.BREVO_SENDER_EMAIL };
  sendSmtpEmail.to = [{ "email": userEmail }];

  return await apiInstance.sendTransacEmail(sendSmtpEmail);
};

const sendVerificationEmail = async (userEmail, otp) => {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    throw new Error("Brevo credentials missing.");
  }

  apiKey.apiKey = process.env.BREVO_API_KEY;
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Verify your LifeTrack Account";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6382ff;">LifeTrack AI</h2>
      <h3>Welcome to LifeTrack!</h3>
      <p>Your account has been securely created. Use the following 6-digit OTP code to verify your email address and activate your LifeTrack dashboard.</p>
      <h1 style="color: #10b981; letter-spacing: 4px; padding: 20px; background: #f3f4f6; display: inline-block; border-radius: 8px;">${otp}</h1>
      <p style="margin-top: 20px;">This encrypted token will automatically expire in exactly 10 minutes.</p>
      <p style="color: #888; font-size: 12px; margin-top: 50px;">If you did not register for LifeTrack, please safely ignore this email.</p>
    </div>
  `;
  sendSmtpEmail.sender = { "name": "LifeTrack AI", "email": process.env.BREVO_SENDER_EMAIL };
  sendSmtpEmail.to = [{ "email": userEmail }];

  return await apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = { sendOtpEmail, sendVerificationEmail };
