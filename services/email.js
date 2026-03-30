const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (userEmail, otp) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing. Please define it in your environment to enable email dispatching.");
  }

  return await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: userEmail,
    subject: "Your LifeTrack Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6382ff;">LifeTrack AI</h2>
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Use the following 6-digit OTP code to verify your identity.</p>
        <h1 style="color: #8b5cf6; letter-spacing: 4px; padding: 20px; background: #f3f4f6; display: inline-block; border-radius: 8px;">${otp}</h1>
        <p style="margin-top: 20px;">This code will automatically expire in exactly 10 minutes.</p>
        <p style="color: #888; font-size: 12px; margin-top: 50px;">If you did not request this password reset, please safely ignore this email.</p>
      </div>
    `
  });
};

const sendVerificationEmail = async (userEmail, otp) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  return await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: userEmail,
    subject: "Verify your LifeTrack Account",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6382ff;">LifeTrack AI</h2>
        <h3>Welcome to LifeTrack!</h3>
        <p>Your account has been securely created. Use the following 6-digit OTP code to verify your email address and activate your LifeTrack dashboard.</p>
        <h1 style="color: #10b981; letter-spacing: 4px; padding: 20px; background: #f3f4f6; display: inline-block; border-radius: 8px;">${otp}</h1>
        <p style="margin-top: 20px;">This encrypted token will automatically expire in exactly 10 minutes.</p>
        <p style="color: #888; font-size: 12px; margin-top: 50px;">If you did not register for LifeTrack, please safely ignore this email.</p>
      </div>
    `
  });
};

module.exports = { sendOtpEmail, sendVerificationEmail };
