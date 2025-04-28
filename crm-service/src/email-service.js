//import needed modules
const nodemailer = require('nodemailer');
require('dotenv').config();

//get Andrew ID and email credentials from environment
const ANDREW_ID = process.env.ANDREW_ID || 'your-andrew-id';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

//create mail transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    },
    secure: false,
    requireTLS: true
});

/**
 * Send welcome email to newly registered customer
 * @param {Object} customer - Customer data
 * @param {string} customer.name - Customer name
 * @param {string} customer.userId - Customer email
 */
async function sendWelcomeEmail(customer) {
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
        console.error('Email credentials not configured');
        return;
    }

    try {
        //prepare email content
        const mailOptions = {
            from: EMAIL_USER,
            to: customer.userId,
            subject: 'Activate your book store account',
            text: `Dear ${customer.name},\n\nWelcome to the Book store created by ${ANDREW_ID}.\n\nExceptionally this time we won't ask you to click a link to activate your account.`,
            html: `
        <p>Dear ${customer.name},</p>
        <p>Welcome to the Book store created by ${ANDREW_ID}.</p>
        <p>Exceptionally this time we won't ask you to click a link to activate your account.</p>
      `
        };

        //send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

module.exports = { sendWelcomeEmail };