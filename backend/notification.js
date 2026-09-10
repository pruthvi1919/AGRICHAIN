const nodemailer = require("nodemailer");
const twilio = require("twilio");

require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const smsClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendEmail(to, subject, message) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
    });
    console.log("📧 Email sent to " + to);
  } catch (err) {
    console.error("Email error:", err);
  }
}

async function sendSMS(to, message) {
  try {
    await smsClient.messages.create({
      from: process.env.TWILIO_PHONE,
      to,
      body: message,
    });
    console.log("📱 SMS sent to " + to);
  } catch (err) {
    console.error("SMS error:", err);
  }
}

module.exports = { sendEmail, sendSMS };
