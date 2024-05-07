const nodemailer = require("nodemailer");

const createMailTransporter = () => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  return transporter;
};

const generateMail = async ({ from, to, subject, text, attachments }) => {
  try {
    const transporter = createMailTransporter();
    const mailOptions = {
      from: from || process.env.MAIL_USER,
      to,
      subject,
      text,
      attachments,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Error sending mail");
  }
};

module.exports = {
  generateMail,
};
