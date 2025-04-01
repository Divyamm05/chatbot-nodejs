//------------------------------------------------------- Dependencies ----------------------------------------------------------------//
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const session = require('express-session');
const mysql = require('mysql2/promise');
const axios = require('axios');
const Fuse = require('fuse.js');
const moment = require('moment');

const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const util = require('util');

//-------------------------------------------------- Logs in extrernal file ------------------------------------------------------------//
const logDir = '/home2/chatbot-logs';

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const accessLog = fs.createWriteStream(`${logDir}/access.log`, { flags: 'a' });
const errorLog = fs.createWriteStream(`${logDir}/error.log`, { flags: 'a' });
const generalLog = fs.createWriteStream(`${logDir}/logs.txt`, { flags: 'a' });

const originalLog = console.log;
console.log = function (...args) {
    const message = util.format(...args);
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    generalLog.write(logMessage);
    originalLog.apply(console, args);
};

console.error = function (...args) {
    const message = util.format(...args);
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    errorLog.write(logMessage);
    originalLog.apply(console, args);
};

// Middleware to log requests
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms\n`;

        accessLog.write(logMessage);
    });

    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] Error: ${err.stack}\n`;
    errorLog.write(errorMessage);
    next(err);
});
//---------------------------------------------------------- Express ------------------------------------------------------------------//
app.use(express.json());
app.use(express.static('public'));

//---------------------------------------------------------- Session -----------------------------------------------------------------//
const SESSION_TIMEOUT = 30 * 60 * 1000; 

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,  
  resave: false,              
  saveUninitialized: false,    
  cookie: { secure: false },  
}));

// Middleware to log session details
function logSession(req, res, next) {
  console.log('Session Details:', {
    email: req.session.email,
    verified: req.session.verified,
    sessionID: req.sessionID,
  });
  next();
}

// Middleware to check session validity
function checkSession(req, res, next) {
  if (!req.session.email || !req.session.verified) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
  next();
}

//------------------------------------------------------- API key and model ------------------------------------------------------------//

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.ai/v1/generate';

//-------------------------------------------------------- DB connection ---------------------------------------------------------------//

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

//--------------------------------------------------- OTP through mail setup -----------------------------------------------------------//

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//---------------------------------------------------------- Pre-Login -----------------------------------------------------------------//

const startQuestions = {
  "What features does this platform offer?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",
  "What are the features of this platform?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",
  "What are the key features of this platform?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",
  "What does this platform offer?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",
  "What features can I use on this platform?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",

  "What can this chatbot do?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",
  "What all can this chatbot do?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",
  "What is this chatbot capable of?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",
  "What can I do with this chatbot?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",
  "What can the chatbot do for me?": "This platform offers domain management, security controls, and domain status management, with customer support available for assistance.",

  "Can I use this platform for domain registration and management?": "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
  "Is domain registration possible on this platform?": "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
  "Can I register a domain on this platform?": "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
  "Can I buy and manage domains on this site?": "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
  "Can I use this platform to register and manage domains?": "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
  
  "What is the process for signing up?": "You can sign up by providing your email and setting up an account with us.",
  "How do I sign up for this platform?": "You can sign up by providing your email and setting up an account with us.",
  "How can I create an account?": "You can sign up by providing your email and setting up an account with us.",
  "What do I need to do to register for an account?": "You can sign up by providing your email and setting up an account with us.",
  "What is the sign-up process for this platform?": "You can sign up by providing your email and setting up an account with us.",

  "Do I need an account to access all features?": "Yes, an account is required for some advanced features.",
  "Is an account necessary to use all the features?": "Yes, an account is required for some advanced features.",
  "Can I use all the features without signing up?": "Yes, an account is required for some advanced features.",
  "Are all the features available without an account?": "Yes, an account is required for some advanced features.",
  "Do I have to create an account to use this platform?": "Yes, an account is required for some advanced features.",
  
  "How can I search for a domain name?": "You can start by signing into our domain registration platform or using our AI chatbot to search for a domain name. Simply enter your desired domain, and our system will check its availability. Need suggestions? Our domain name suggestion feature will provide variations and alternatives if your preferred domain is already taken.Once you find the perfect domain, you can proceed with the purchase and registration seamlessly.",
  "Where can I check for domain availability?": "You can start by signing into our domain registration platform or using our AI chatbot to search for a domain name. Simply enter your desired domain, and our system will check its availability. Need suggestions? Our domain name suggestion feature will provide variations and alternatives if your preferred domain is already taken.Once you find the perfect domain, you can proceed with the purchase and registration seamlessly.",
  "How to check if a domain is available?": "You can start by signing into our domain registration platform or using our AI chatbot to search for a domain name. Simply enter your desired domain, and our system will check its availability. Need suggestions? Our domain name suggestion feature will provide variations and alternatives if your preferred domain is already taken.Once you find the perfect domain, you can proceed with the purchase and registration seamlessly.",
  "How do I find a good domain name for my website?": "You can start by signing into our domain registration platform or using our AI chatbot to search for a domain name. Simply enter your desired domain, and our system will check its availability. Need suggestions? Our domain name suggestion feature will provide variations and alternatives if your preferred domain is already taken.Once you find the perfect domain, you can proceed with the purchase and registration seamlessly.",
  
  "What details are required to register a domain?": "To register a domain, enter your desired name in the search bar. If it's unavailable, our Domain Suggestion Tool will suggest similar alternatives. If available, select the number of years for registration, review the pricing details, and decide whether to proceed or dismiss the registration.",
  "What information is needed to buy a domain?": "To register a domain, enter your desired name in the search bar. If it's unavailable, our Domain Suggestion Tool will suggest similar alternatives. If available, select the number of years for registration, review the pricing details, and decide whether to proceed or dismiss the registration.",
  
  "Do you support premium domain registration?": "Yes, we support the registration of premium domains.",
  "Can I buy premium domains on this platform?": "Yes, we support the registration of premium domains.",
  "Does this platform offer premium domain purchases?": "Yes, we support the registration of premium domains.",
  
  "What payment methods are supported?": "We accept credit/debit cards and other popular payment methods.",
  "What are the available payment options?": "We accept credit/debit cards and other popular payment methods.",
  "How can I make a payment?": "We accept credit/debit cards and other popular payment methods.",
  
  "Are there any discounts or offers for new users?": "Yes, we offer discounts for new users. Check our website for more information.",
  "Do you have any deals for new users?": "Yes, we offer discounts for new users. Check our website for more information.",
  "Is there a sign-up bonus or discount available?": "Yes, we offer discounts for new users. Check our website for more information.",

  "Can I transfer my existing domains to this platform?": "Yes, you can transfer your domains to our platform.",
  "How do I create an account?": "To create an account, click the Sign Up button and provide your basic details. If you are already registered, simply log in.",
  "What information is needed to sign up?": "You need to provide your name and your email address.",
  "Is there a fee for signing up?": "No, Signing up is completely free!",
  "How secure is my information?": "We follow industry-standard security practices to protect your data.",
  "Does your platform provide an API for domain management?": "Absolutely! Our platform offers a comprehensive API for seamless domain management. You can explore the full API documentation here: <br><br><a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 View API Documentation</a>",
  "What integrations are supported?": "Our API supports a wide range of integrations. For detailed information on all available integrations, please refer to our API documentation: <br><br><a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 View API Documentation</a>",
  "How can I get more details about the API?": "You can find all the details, including endpoints, integration guidelines, and examples, in our API documentation: <br><a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 View API Documentation</a>",
  "contact support": 'To contact support click on the button: <br><a href="https://www.connectreseller.com/contact-us/" target="blank" style="display: inline-flex; align-items: center; justify-content: center; padding: 10px 15px; background: #007fff; color: white; font-size: 16px; text-decoration: none; border-radius: 5px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform="scale(1.05)"; this.style.boxShadow="0 6px 10px rgba(0, 0, 0, 0.15)";" onmouseout="this.style.transform="scale(1)"; this.style.boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)";">📞 Contact Support</a>',
  "How can I contact support?": 'To contact support click on the button: <br><a href="https://www.connectreseller.com/contact-us/" target="blank" style="display: inline-flex; align-items: center; justify-content: center; padding: 10px 15px; background: #007fff; color: white; font-size: 16px; text-decoration: none; border-radius: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform="scale(1.05)"; this.style.boxShadow="0 6px 10px rgba(0, 0, 0, 0.15)";" onmouseout="this.style.transform="scale(1)"; this.style.boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)";">📞 Contact Support</a>',
  "How can I login?" : "To get additional services click on the login/signup button below and manage your domains seamlessly.",
  "Can I get a demo of the platform?": 'Yes, we offer demos upon request. <a href="https://www.connectreseller.com/contact-us/" target="blank" style="color: white; text-decoration: none;">CLICK HERE</a> to reach out to our support team.',
  "Is there a guide for new users?": "Yes! Signing up with us gives you access to a helpful onboarding guide, along with the latest offers on our extensive selection of TLDs.",
  "What payment methods are supported?": "We support multiple payment gateways like Stripe, Telr, Razorpay, ICICI & many more, offering flexibility for your transactions. Additionally, we also accept offline payment methods, including cheques, for your convenience.",
  "How do I pay for services after signing up?": "After signing up, you can pay for services directly through the platform's payment portal.",
};

const regexPatterns = [
  {
    pattern: /\b(features|capabilities|services|offer|provide|assist|capable of)\b/i,
    answer: startQuestions["What features does this platform offer?"]
  },
  {
    pattern: /\b(register|buy|purchase|obtain|manage|use)\b/i,
    answer: startQuestions["Can I register a domain on this platform?"]
  },
  {
    pattern: /\b(sign up|create account|join|get started)\b/i,
    answer: startQuestions["How do I sign up for this platform?"]
  },
  {
    pattern: /\b(do I|is it|can I|necessary|required|need to)\b.*\b(account|sign up)\b.*\b(use|access|features|platform)\b/i,
    answer: startQuestions["Do I need an account to access all features?"]
  },
  {
    pattern: /\b(search|check|find|lookup)\b.*\b(domain(s)?|availability|good domain name)\b/i,
    answer: startQuestions["How can I search for a domain name?"]
  },
  {
    pattern: /\b(details|information|requirements|needed)\b.*?\b(register|buy|purchase)\b.*?\b(domain(s)?)\b/i,
    answer: startQuestions["  "]
  },
  {
    pattern: /\b(premium domain(s)?|special domains|exclusive domains|high-value domains|expensive domains)\b/i,
    answer: startQuestions["Do you support premium domain registration?"]
  },
  {
    pattern: /\b(payment(s)?|pay|methods|options|ways)\b/i,
    answer: startQuestions["What payment methods are supported?"]
  },
  {
    pattern: /\b(transfer|move|migrate)\b.*\b(domain(s)?)\b/i,
    answer: startQuestions["Can I transfer my existing domains to this platform?"]
  },
  {
    pattern: /\b(contact|get help|support|customer service|assistance)\b/i,
    answer: startQuestions["contact support"]
  },
  {
    pattern: /\b(demo|trial|walkthrough|tour|presentation|example)\b.*\b(platform|system|service|features|chatbot)\b/i,
    answer: startQuestions["Can I get a demo of the platform?"]
  },
  {
    pattern: /\b(guide|tutorial|manual|new user guide|instructions|help)\b/i,
    answer: startQuestions["Is there a guide for new users?"]
  },
  {
    pattern: /\b(api|integration|developer support|automate|programmatic access)\b/i,
    answer: startQuestions["Does your platform provide an API for domain management?"]
  },
  {
    pattern: /\b(log(ging)?\s?in|sign(ing)?\s?(up|in)|register|create account|join|get started|access account|log into|how to log in|how to sign up)\b/i,
    answer: startQuestions["How can I login?"]
  }
];

const basicGreetingRegex = /^(hi|hello|hey|howdy|greetings|what(?:'s| is) up|wassup|sup|yo|good\s(?:morning|afternoon|evening|day)|how\s+are\s+you|how\s+(?:is it going|have you been|do you do)|what(?:'s| is)\s+(?:new|happening)|how's\s+(?:everything|life)|long time no see|nice to meet you|pleased to meet you|good to see you)[!.,?\s]*$/i;

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

const normalizedStartQuestions = Object.keys(startQuestions).reduce((acc, key) => {
  acc[normalizeText(key)] = startQuestions[key];
  return acc;
}, {});

app.post('/ask-question', (req, res) => {
  const userQuestion = req.body.question;
  
  if (!userQuestion) {
    return res.status(400).json({ answer: "Invalid question. Please try again." });
  } 
  
  const greetingMatch = userQuestion.match(basicGreetingRegex);
  if (greetingMatch) {
    console.log("👋 Greeting detected!");

    let response = "Hello! 😊 How can I assist you today?"; 

    if (/how are you/i.test(userQuestion)) {
      response = "I'm doing great! 😊 How can I help you today?";
    } else if (/how's it going/i.test(userQuestion)) {
      response = "Everything is going smoothly! 🚀 How can I assist you?";
    } else if (/what's up|what is up|wassup|sup/i.test(userQuestion)) {
      response = "I'm here and ready to help! 🤖 Let me know what you need.";
    } else if (/what's new|what is new/i.test(userQuestion)) {
      response = "Not much, just here to assist you! 🛠️ What can I do for you?";
    } else if (/long time no see/i.test(userQuestion)) {
      response = "Yes, it's been a while! ⏳ Let me know how I can help.";
    } else if (/nice to meet you|pleased to meet you/i.test(userQuestion)) {
      response = "Nice to meet you too! 🤝 What can I assist you with?";
    }

    return res.json({ answer: response });
  }

  const normalizedUserQuestion = normalizeText(userQuestion);

  if (normalizedStartQuestions[normalizedUserQuestion]) {
    return res.json({ answer: normalizedStartQuestions[normalizedUserQuestion] });
  }

  for (const { pattern, answer } of regexPatterns) {
    if (pattern.test(userQuestion)) {
      return res.json({ answer });
    }
  }

  const domainKeywords = ["domain", "register", "dns", "transfer", "premium"];
  if (domainKeywords.some(keyword => normalizedUserQuestion.includes(keyword))) {
    return res.json({
      answer: "Create an account today to gain access to our platform and manage your domains effortlessly. Take control of your domain portfolio now!"
    });
  }

  const pricingKeywords = ["pricing", "cost", "fee", "price"];
  if (pricingKeywords.some(keyword => normalizedUserQuestion.includes(keyword))) {
    return res.json({
      answer: "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!"
    });
  }

  return res.json({ answer: "Create an account today to gain access to our platform and manage your domains effortlessly. Take control of your domain portfolio now!" });
});

//------------------------------------------------------ Login and verification --------------------------------------------------------//

app.post('/api/tester-login', logSession, (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for tester login.' });
    }

    req.session.email = email;
    req.session.verified = true;  
    req.session.userState = 'awaiting_domain_name'; 

    res.json({
      success: true,
      message: 'Logged in as tester successfully.',
      options: [
        { text: 'Get Domain Name Suggestions', action: 'getDomainSuggestions' },
        { text: 'More Options', action: 'askMoreOptions' },
      ],
    });
  } catch (error) {
    console.error('❌ Error in /api/tester-login:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.post('/api/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query("SELECT clientId FROM Client WHERE UserName = ?", [normalizedEmail]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Email not found in our records. You can signup here: \n\n<a href='https://india.connectreseller.com/signup' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; margin-right: 10px;'>🇮🇳 India Panel</a><br>\n<a href='https://global.connectreseller.com/signup' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #28a745; text-decoration: none; border-radius: 5px;'>🌍 Global Panel</a>\n\n or enter your registered email to continue.`
        });
      }

      const otpRequired = true; 

      if (otpRequired) {
        try {
          const otp = crypto.randomInt(100000, 999999).toString();
          console.log(`🔑 First-Time OTP for ${normalizedEmail}: ${otp}`); 
          const expiresAt = new Date(Date.now() + 60000); // 1-minute expiry

          req.session.otp = otp;
          req.session.otpExpiresAt = expiresAt;

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: normalizedEmail,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}. It is valid for 1 minute.`,
          };

          await transporter.sendMail(mailOptions);
        } catch (emailError) {
          console.error('❌ Error sending OTP email:', emailError);
          return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again later." });
        }
      }

      res.json({
        success: true,
        message: "Email found in database.",
        clientId: users[0].clientId,
        otpRequired
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
  }
});

app.post('/api/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase(); 
    req.session.email = normalizedEmail; 

    const sessionOtp = req.session.otp;
    const sessionOtpExpiresAt = req.session.otpExpiresAt;

    if (sessionOtp && new Date(sessionOtpExpiresAt) > new Date()) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: normalizedEmail,
          subject: 'Your OTP Code',
          text: `Your OTP code is: ${sessionOtp}. It is still valid for 1 minute.`,
        };

        await transporter.sendMail(mailOptions);
        return res.json({ success: true, message: 'OTP resent to your email address.' });
      } catch (emailError) {
        console.error('❌ Error resending OTP:', emailError);
        return res.status(500).json({ success: false, message: "Failed to resend OTP. Please try again later." });
      }
    } else {
      try {
        const otp = crypto.randomInt(100000, 999999).toString();
        console.log(`🔑 New OTP for ${normalizedEmail}: ${otp}`); 
        const expiresAt = new Date(Date.now() + 60000); // 1-minute expiration time

        req.session.otp = otp;
        req.session.otpExpiresAt = expiresAt;

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: normalizedEmail,
          subject: 'Your OTP Code',
          text: `Your OTP code is: ${otp}. It is valid for 1 minute.`,
        };

        await transporter.sendMail(mailOptions);
        return res.json({ success: true, message: 'New OTP sent to your email address.' });
      } catch (emailError) {
        console.error('❌ Error sending new OTP:', emailError);
        return res.status(500).json({ success: false, message: "Failed to send new OTP. Please try again later." });
      }
    }
  } catch (error) {
    console.error('❌ Error in /api/resend-otp:', error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { otp, email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase(); 
    req.session.email = normalizedEmail; 

    const sessionOtp = req.session.otp;
    const sessionOtpExpiresAt = req.session.otpExpiresAt;

    if (!sessionOtp || new Date(sessionOtpExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    if (sessionOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    req.session.verified = true; 

    try {
      const [clientRows] = await pool.query('SELECT clientId FROM Client WHERE UserName = ?', [normalizedEmail]);
      if (clientRows.length > 0) {
        req.session.customerId = clientRows[0].clientId; 
      } else {
        return res.status(404).json({ success: false, message: 'Client not found in database.' });
      }
    } catch (dbError) {
      console.error('❌ Error fetching clientId:', dbError);
      return res.status(500).json({ success: false, message: "Database error. Please try again later." });
    }

    try {
      await updateAPIKey(normalizedEmail); 
    } catch (apiError) {
      console.error('❌ Error updating API key:', apiError);
      return res.status(500).json({ success: false, message: "Failed to update API key." });
    }

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      customerId: req.session.customerId,
    });

  } catch (error) {
    console.error('❌ Error in /api/verify-otp:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.post('/api/mock-authenticate', async (req, res) => { 
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const testEmails = ['aichatbot@iwantdemo.com', 'itec.rw@iwantdemo.com']; 

    if (testEmails.includes(email)) { 
      req.session.email = email;
      req.session.verified = true;  

      try {
        await updateAPIKey(email); 
        return res.json({ success: true, message: "User authenticated.", apiKeyUpdated: true });
      } catch (apiError) {
        console.error('❌ Error updating API key:', apiError);
        return res.status(500).json({
          success: false,
          message: "User authenticated but failed to update API key.",
          error: apiError.message
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Unauthorized' });

  } catch (error) {
    console.error('❌ Error in /api/mock-authenticate:', error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

//------------------------------------------------------- Fetching API Key -------------------------------------------------------------//

let FETCHED_API_KEY = process.env.CONNECT_RESELLER_API_KEY; 

// Fetch API Key from DB and update FETCHED_API_KEY based on each new user
const updateAPIKey = async (email) => {
    try {
        const [clientRows] = await pool.execute(
            "SELECT resellerId FROM Reseller WHERE UserName = ? LIMIT 1",
            [email]
        );
        console.log(`⚙️ Fetched client rows:`, clientRows);

        if (clientRows.length === 0) {
            throw new Error("Client not found in database.");
        }

        const resellerId = clientRows[0].resellerId;  

        if (!resellerId) {
            throw new Error("ResellerId is missing or invalid.");
        }

        const [apiKeyRows] = await pool.execute(
            "SELECT APIKey FROM APIKey WHERE ID = ? LIMIT 1",
            [resellerId]
        );

        if (apiKeyRows.length === 0) {
            FETCHED_API_KEY = null; // No API key found, set FETCHED_API_KEY to null
            console.log(`❌ No API Key found for ResellerId: ${resellerId}. FETCHED_API_KEY set to null.`);
        } else {
            FETCHED_API_KEY = apiKeyRows[0].APIKey;  // Update FETCHED_API_KEY with the fetched value
            console.log(`✅ FETCHED_API_KEY updated for ${email}: ${FETCHED_API_KEY}`);
        }

        return true;

    } catch (error) {
        console.error("❌ Error updating FETCHED_API_KEY:", error);
        throw error;
    }
};

//---------------------------------------------------------- Register Domain -----------------------------------------------------------//

const domainRegistrationService = async (params) => {
  try {
    const queryParams = new URLSearchParams({
      APIKey: FETCHED_API_KEY,
      ProductType: '1',
      Websitename: params.Websitename,
      Duration: params.Duration,
      IsWhoisProtection: params.IsWhoisProtection || 'false',
      ns1: params.ns1 || '11338.dns1.managedns.org',
      ns2: params.ns2 || '11338.dns2.managedns.org',
      ns3: params.ns3 || '',  
      ns4: params.ns4 || '',  
      Id: params.clientId,  
      isEnablePremium: params.isEnablePremium || '0',
      lang: params.lang || "en"
    });

    const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/domainorder?${queryParams.toString()}`;

    console.log('🔍 API Request URL:', url); 

    const response = await axios.get(url, {
      headers: { 'Accept': 'application/json' }
    });

    console.log('✅ Domain Registration Successful:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Error during domain registration API call:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

const checkDomainAvailability = async (domainName) => {
  try {
    const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkdomainavailable?APIKey=${FETCHED_API_KEY}&websiteName=${domainName}`;

    console.log(`Checking domain availability for: ${domainName}`);
    console.log(`Request URL: ${url}`);

    const response = await axios.get(url, { headers: { "Accept": "application/json" } });

    console.log("API Response:", JSON.stringify(response.data, null, 2));

    const message = response.data?.responseMsg?.message || "Unknown response from API";
    const isAvailable = response.data?.responseMsg?.message === "Domain Available for Registration";

    const registrationFee = isAvailable ? response.data?.responseData?.registrationFee || null : null;

    console.log(`Domain Availability: ${isAvailable}`);
    console.log(`Registration Fee: ${registrationFee}`);

    return {
      available: isAvailable,
      message: message,
      registrationFee: registrationFee, 
    };
  } catch (error) {
    console.error("Error checking domain availability:", error.message);
    return { available: false, message: "Error checking domain availability.", registrationFee: null };
  }
};

app.get("/api/domainname-suggestions", async (req, res) => {
  const { domain } = req.query;

  console.log("====================================");
  console.log(`📥 Received request for domain suggestions: ${domain}`);
  
  if (!domain) {
      console.warn("⚠️ Domain keyword is missing in the request.");
      return res.status(400).json({ success: false, message: "Domain keyword is required." });
  }

  try {
      const API_KEY = FETCHED_API_KEY;
      const maxResults = 25;
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/domainSuggestion?APIKey=${API_KEY}&keyword=${domain}&maxResult=${maxResults}`;

      console.log(`🔍 Fetching domain suggestions from API...`);
      console.log(`🌍 API Request URL: ${url}`);

      const response = await axios.get(url, { headers: { "Accept": "application/json" } });

      console.log("✅ API Response Received:");
      console.log(JSON.stringify(response.data, null, 2));

      const suggestions = response.data?.registryDomainSuggestionList; 

      if (!suggestions || suggestions.length === 0) {
          console.warn(`⚠️ No suggestions found for: ${domain}`);
          return res.json({ success: false, message: "No domain suggestions found." });
      }

      console.log(`📌 Found ${suggestions.length} domain suggestions for: ${domain}`);
      suggestions.forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion.domainName} - $${suggestion.price}`);
      });

      res.json({ success: true, data: suggestions });
  } catch (error) {
      console.error("❌ Error fetching domain suggestions:", error.message);
      res.status(500).json({ success: false, message: "Failed to fetch domain suggestions." });
  }
  console.log("====================================");
});

app.get("/api/check-domain", async (req, res) => {
  const { domain } = req.query;
  if (!domain) {
    return res.status(400).json({ success: false, message: "Domain name required." });
  }

  const result = await checkDomainAvailability(domain);

  console.log("🟢 [CHECK DOMAIN] Backend Response:", JSON.stringify(result, null, 2));

  res.json({
    success: true,
    available: result.available,
    message: result.message,
    registrationFee: result.registrationFee, 
  });
});

app.get('/api/check-availability', async (req, res) => {
  const domain = req.query.domain;
  
  if (!domain) {
      console.warn("⚠️ Missing domain name in request!");
      return res.status(400).json({ success: false, message: "Domain name is required" });
  }

  console.log(`🔍 Received domain check request for: ${domain}`);
  console.log("🌍 Sending request to ConnectReseller API...");

  try {
      const response = await axios.get(`https://api.connectreseller.com/ConnectReseller/ESHOP/checkdomainavailable`, {
          params: {
              APIKey: FETCHED_API_KEY,
              websiteName: domain
          }
      });

      const data = response.data;
      console.log("✅ API Response:", JSON.stringify(data, null, 2));

      if (data.responseMsg?.statusCode === 200) {
          const { available, registrationFee, renewalfee, transferFee } = data.responseData;

          if (available) {
              console.log(`✔️ Domain "${domain}" is ✅ AVAILABLE for registration!`);
          } else {
              console.warn(`⚠️ Domain "${domain}" is ❌ NOT available.`);
          }

          return res.json({
              success: true,
              available,
              registrationFee,
              renewalFee: renewalfee,  
              transferFee,
              message: data.responseMsg.message  
          });
      } else {
          console.error(`❌ Error: API returned status ${data.responseMsg?.statusCode}`);
          return res.json({
              success: false,
              available: false,
              message: "Domain is not available"
          });
      }
  } catch (error) {
      console.error("🚨 Error checking domain availability:", error.message);
      return res.status(500).json({ success: false, message: "Error checking domain availability" });
  }
});

app.get("/api/register-domain", async (req, res) => {
  let { 
    WebsiteName, Duration, ns1, ns2, ns3, ns4, 
    IsWhoisProtection, isEnablePremium, lang, 
    usAppPurpose, usNexusCategory 
  } = req.query;

  console.log(`📥 [REGISTER DOMAIN] Request received for: ${WebsiteName}`);

  if (!req.session || !req.session.email) {
    console.warn("⚠️ [REGISTER DOMAIN] User not authenticated.");
    return res.status(401).json({ success: false, message: "User not authenticated." });
  }

  let connection;
  let clientId, resellerId;

  try {
    connection = await pool.getConnection();
    const [clientRows] = await connection.execute(
      "SELECT clientId, ResellerId FROM Client WHERE UserName = ? LIMIT 1",
      [req.session.email]
    );
    connection.release();

    if (clientRows.length === 0) {
      console.error("❌ [REGISTER DOMAIN] ClientId and ResellerId not found.");
      return res.status(404).json({ success: false, message: "ClientId and ResellerId not found." });
    }

    clientId = clientRows[0].clientId;
    resellerId = clientRows[0].ResellerId;

    console.log(`✅ [REGISTER DOMAIN] Retrieved ClientId: ${clientId}, ResellerId: ${resellerId}`);
  } catch (error) {
    console.error("❌ [DATABASE ERROR] Failed to fetch ClientId and ResellerId:", error.message);
    return res.status(500).json({ success: false, message: "Database error while fetching client details." });
  }

  console.log(`🔍 Checking domain availability for: ${WebsiteName}`);

  try {
    const domainAvailability = await checkDomainAvailability(WebsiteName);
    if (!domainAvailability.available) {
      return res.json({ success: false, message: "Domain is not available." });
    }

    let registrationFee = parseFloat(domainAvailability.registrationFee);
    if (isNaN(registrationFee) || registrationFee <= 0) {
      return res.json({ success: false, message: "Failed to retrieve a valid domain price." });
    }

    Duration = parseInt(Duration, 10);
    if (isNaN(Duration) || Duration <= 0) {
      return res.json({ success: false, message: "Invalid domain registration duration." });
    }

    const totalPrice = registrationFee * Duration;

    console.log(`💰 [DOMAIN PRICE] Total Registration Fee for ${Duration} years: $${totalPrice.toFixed(2)}`);

    console.log(`📡 [BALANCE API] Fetching funds for ResellerId: ${resellerId}`);

    let balance = 0;
    try {
      const balanceResponse = await axios.get(
        `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${FETCHED_API_KEY}&resellerId=${resellerId}`
      );

      console.log(`✅ [BALANCE API] Response:`, balanceResponse.data);

      balance = parseFloat(balanceResponse.data.responseData);
      if (isNaN(balance)) {
        balance = 0;
      }
    } catch (error) {
      console.error("❌ [BALANCE API ERROR] Failed to fetch balance:", error.message);
      return res.status(500).json({ success: false, message: "Failed to fetch reseller balance." });
    }

    console.log(`💰 [BALANCE API] Current Balance: $${balance.toFixed(2)}`);

    if (balance < totalPrice) {
      return res.json({
        success: false,
        message: `Insufficient funds. Required: $${totalPrice.toFixed(2)}, Available: $${balance.toFixed(2)}`
      });
    }

    console.log(`🚀 [DOMAIN REGISTRATION] Initiating for ${WebsiteName}...`);

    let apiParams = {
      APIKey: FETCHED_API_KEY,
      ProductType: 1,
      Websitename: WebsiteName,
      Duration,
      Id: clientId,
      ns1,
      ns2,
      IsWhoisProtection: IsWhoisProtection === "true" || IsWhoisProtection === "1",
      isEnablePremium: isEnablePremium === "1" ? 1 : 0,
    };

    if (ns3) apiParams.ns3 = ns3;
    if (ns4) apiParams.ns4 = ns4;
    if (lang) apiParams.lang = lang;

    // Special handling for `.us` domains
    if (WebsiteName.endsWith(".us") && usAppPurpose && usNexusCategory) {
      apiParams.isUs = 1;
      apiParams.appPurpose = usAppPurpose;
      apiParams.nexusCategory = usNexusCategory;
    }

    const fullRequestUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/domainorder?${new URLSearchParams(apiParams).toString()}`;
    console.log("🔗 [DOMAIN REGISTRATION] Full API Request URL:", fullRequestUrl);

    const registrationResponse = await axios.get(
      `https://api.connectreseller.com/ConnectReseller/ESHOP/domainorder`,
      { params: apiParams }
    );

    console.log("✅ [DOMAIN REGISTRATION] API Response:", JSON.stringify(registrationResponse.data, null, 2));

    if (registrationResponse.data.responseMsg.statusCode === 200) {
      res.json({ success: true, message: "Domain registered successfully!" });
    } else {
      res.json({ success: false, message: registrationResponse.data.responseMsg.message });
    }

  } catch (error) {
    console.error("❌ [ERROR] Failed to process domain registration:", error.message);
    res.status(500).json({ success: false, message: "Domain registration failed." });
  }
});

//---------------------------------------------------------- Transfer Domain -----------------------------------------------------------//

const API_KEY_TRANSFER = FETCHED_API_KEY; 
const API_URL_TRANSFER = 'https://api.connectreseller.com/ConnectReseller/ESHOP/TransferOrder';

app.get('/api/get-transfer-fee', async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
      return res.status(400).json({ success: false, message: "Domain is required." });
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
      return res.status(400).json({ success: false, message: "Invalid domain format." });
  }

  const tld = `.${domainParts[domainParts.length - 1]}`;

  try {
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/tldsync/?APIKey=${FETCHED_API_KEY}`;
      console.log(`🔍 [GET TRANSFER FEE] Checking TLD Sync API: ${apiUrl}`);

      const response = await axios.get(apiUrl);
      const tldData = response.data.find(entry => entry.tld === tld);

      if (tldData) {
          let transferFee = parseFloat(tldData.transferPrice);
          if (isNaN(transferFee)) {
              return res.status(500).json({ success: false, message: "Invalid transfer fee value." });
          }
          console.log(`✅ [TRANSFER FEE] TLD: ${tld}, Fee: $${transferFee}`);
          return res.json({ success: true, transferFee });
      }

      return res.json({ success: false, message: "Could not fetch transfer fee for this TLD." });
  } catch (error) {
      console.error("❌ [ERROR] Failed to fetch transfer fee:", error.message);
      return res.status(500).json({ success: false, message: "Error fetching transfer fee." });
  }
});

app.post('/api/transfer-domain', async (req, res) => {
  const { domainName, authCode, isWhoisProtection } = req.body;

  if (!req.session || !req.session.email) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
  }

  if (!domainName || !authCode) {
      return res.status(400).json({ success: false, message: "Missing required parameters." });
  }

  let connection;
  let customerId, resellerId;

  try {
      connection = await pool.getConnection();
      const [clientRows] = await connection.execute(
          "SELECT clientId, ResellerId FROM Client WHERE UserName = ? LIMIT 1",
          [req.session.email]
      );
      connection.release();

      if (clientRows.length === 0) {
          return res.status(404).json({ success: false, message: "Customer ID not found." });
      }

      customerId = clientRows[0].clientId;
      resellerId = clientRows[0].ResellerId;

  } catch (error) {
      return res.status(500).json({ success: false, message: "Database error while fetching customer ID." });
  }

  const domainParts = domainName.split('.');
  const tld = `.${domainParts[domainParts.length - 1]}`;
  
  try {
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/tldsync/?APIKey=${FETCHED_API_KEY}`;
      console.log(`🔍 [GET TRANSFER FEE] Checking TLD Sync API: ${apiUrl}`);

      const response = await axios.get(apiUrl);
      const tldData = response.data.find(entry => entry.tld === tld);

      if (tldData) {
          let transferFee = parseFloat(tldData.transferPrice);
          if (isNaN(transferFee)) {
              return res.status(500).json({ success: false, message: "Invalid transfer fee value." });
          }
          console.log(`✅ [TRANSFER FEE] TLD: ${tld}, Fee: $${transferFee}`);

          const balanceResponse = await axios.get(
              `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${FETCHED_API_KEY}&resellerId=${resellerId}`
          );

          let balance = parseFloat(balanceResponse.data.responseData);
          if (isNaN(balance)) {
              balance = 0;  
              console.log("💰 [BALANCE API] Invalid balance, defaulting to $0.00");
          }
          console.log(`💰 [BALANCE API] Current Balance: $${balance.toFixed(2)}`);

          if (balance < transferFee) {
              return res.json({
                  success: false,
                  message: `Insufficient funds. Required: $${transferFee.toFixed(2)}, Available: $${balance.toFixed(2)}`
              });
          }

          const params = {
              APIKey: FETCHED_API_KEY,
              OrderType: 4,
              Websitename: domainName,
              IsWhoisProtection: Boolean(isWhoisProtection).toString(),
              AuthCode: authCode,
              Id: customerId
          };

          console.log("🔍 Transfer API Request:", `${API_URL_TRANSFER}?${new URLSearchParams(params)}`);

          const transferResponse = await axios.get(API_URL_TRANSFER, { params });
          const data = transferResponse.data;

          console.log("✅ Transfer API Response:", data);

          return res.json({
              success: data?.responseMsg?.statusCode === 200 && data?.responseData?.statusCode !== 404,
              message: data?.responseData?.message || data?.responseMsg?.message || "Domain transfer failed.",
              data
          });

      } else {
          return res.status(400).json({ success: false, message: "Could not fetch transfer fee for this TLD." });
      }

  } catch (error) {
      console.error("❌ [ERROR] Failed to fetch transfer fee or balance:", error.message);
      return res.status(500).json({ success: false, message: "Error processing transfer fee or balance." });
  }
});

//---------------------------------------------------------- Renew Domain -----------------------------------------------------------//

const ORDER_TYPE_RENEWAL = 2;

app.get('/api/get-renewal-fee', async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
      return res.status(400).json({ success: false, message: "Domain is required." });
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
      return res.status(400).json({ success: false, message: "Invalid domain format." });
  }

  const tld = `.${domainParts[domainParts.length - 1]}`;

  try {
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/tldsync/?APIKey=${FETCHED_API_KEY}`;
      console.log(`🔍 [GET RENEWAL FEE] Checking TLD Sync API: ${apiUrl}`);

      const response = await axios.get(apiUrl);
      const tldData = response.data.find(entry => entry.tld === tld);

      if (tldData && tldData.renewalPrice) {
          const renewalFeePerYear = parseFloat(tldData.renewalPrice);
          console.log(`✅ [RENEWAL FEE] TLD: ${tld}, Fee per Year: $${renewalFeePerYear}`);
          return res.json({ success: true, renewalFeePerYear });
      }

      res.json({ success: false, message: "Could not fetch renewal fee for this TLD." });
  } catch (error) {
      console.error("❌ [ERROR] Failed to fetch renewal fee:", error.message);
      res.status(500).json({ success: false, message: "Error fetching renewal fee." });
  }
});

app.get('/api/renew-domain', async (req, res) => {
  let { Websitename, Duration } = req.query;
  console.log(`🔍 [RENEW DOMAIN] Received request for domain: ${Websitename}, Duration: ${Duration}`);

  if (!req.session || !req.session.email) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
  }

  if (!Websitename || !Duration) {
      return res.status(400).json({ success: false, message: "Missing required parameters." });
  }

  let connection;
  let clientId, resellerId, renewalFeePerYear, totalRenewalFee;

  try {
      connection = await pool.getConnection();
      const [clientRows] = await connection.execute(
          "SELECT clientId, ResellerId FROM Client WHERE UserName = ? LIMIT 1",
          [req.session.email]
      );
      connection.release();

      if (clientRows.length === 0) {
          return res.status(404).json({ success: false, message: "ClientId and ResellerId not found." });
      }

      clientId = clientRows[0].clientId;
      resellerId = clientRows[0].ResellerId;
      console.log(`✅ [DB] Found clientId: ${clientId}, ResellerId: ${resellerId}`);

  } catch (error) {
      console.error("❌ [ERROR] Database error while fetching client details:", error);
      return res.status(500).json({ success: false, message: "Database error while fetching client details." });
  }

  try {
      console.log(`🔍 [FETCHING RENEWAL FEE] API Call: https://api.connectreseller.com/ConnectReseller/ESHOP/tldsync/?APIKey=${FETCHED_API_KEY}`);

      const renewalFeeResponse = await axios.get(
          `https://api.connectreseller.com/ConnectReseller/ESHOP/tldsync/?APIKey=${FETCHED_API_KEY}`
      );

      console.log(`📄 [RENEWAL FEE RESPONSE]`, renewalFeeResponse.data);

      const tldData = renewalFeeResponse.data.find(entry => entry.tld === `.${Websitename.split('.').pop()}`);
      if (tldData) {
          renewalFeePerYear = parseFloat(tldData.renewalPrice);
          totalRenewalFee = renewalFeePerYear * parseInt(Duration);
          console.log(`✅ [RENEWAL FEE] Total Fee for ${Duration} year(s): $${totalRenewalFee}`);
      } else {
          return res.json({ success: false, message: "Could not fetch renewal fee for this domain." });
      }
  } catch (error) {
      console.error("❌ [ERROR] Fetching renewal fee failed:", error.response?.data || error.message);
      return res.status(500).json({ success: false, message: "Error fetching renewal fee." });
  }

  try {
      const balanceApiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${FETCHED_API_KEY}&resellerId=${resellerId}`;
      console.log(`🔍 [CHECK BALANCE] API Call: ${balanceApiUrl}`);

      const balanceResponse = await axios.get(balanceApiUrl);
      console.log(`📄 [BALANCE RESPONSE]`, balanceResponse.data);

      const balance = parseFloat(balanceResponse.data.responseData);
      console.log(`💰 [BALANCE API] Current Balance: $${balance.toFixed(2)}`);

      if (balance < totalRenewalFee) {
          return res.json({
              success: false,
              message: `Insufficient funds. Required: $${totalRenewalFee.toFixed(2)}, Available: $${balance.toFixed(2)}`
          });
      }

      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/RenewalOrder`;
      const params = {
          APIKey: FETCHED_API_KEY,
          OrderType: ORDER_TYPE_RENEWAL,
          Websitename,
          Duration,
          Id: clientId,
          IsWhoisProtection: "false"
      };

      console.log(`🚀 [RENEW REQUEST] Sending renewal request to: ${apiUrl}`);
      console.log(`📦 [RENEW REQUEST PAYLOAD]`, params);

      const renewalResponse = await axios.get(apiUrl, { params });
      console.log(`📄 [RENEW RESPONSE]`, renewalResponse.data);

      if (renewalResponse.data.responseMsg.statusCode === 200) {
          return res.json({
              success: true,
              message: "Domain renewed successfully!",
              expiryDate: renewalResponse.data.responseData.exdate
          });
      } else {
          console.error("❌ [RENEW ERROR] API Response:", renewalResponse.data);
          return res.json({ success: false, message: renewalResponse.data.responseMsg.message || "Renewal failed." });
      }
  } catch (error) {
      console.error("❌ [ERROR] Renewal request failed:", error.response?.data || error.message);
      return res.status(500).json({ success: false, message: "Failed to check funds or renew domain." });
  }
});

//-------------------------------------------------------- Domain Availability ---------------------------------------------------------//

const checkDomainsAvailability = async (suggestions) => {
  const availabilityChecks = suggestions.map((domain) =>
    isAvailable(domain).then(
      (available) => ({ domain, available }),
      (error) => ({ domain, available: false, error: error.message })
    )
  );

  const results = await Promise.allSettled(availabilityChecks);

  const availableDomains = results
    .filter(result => result.status === 'fulfilled' && result.value.available)
    .map(result => result.value.domain);

  return availableDomains;
};

const cleanDomainName = (domain) => {
  return domain.replace(/^\d+\.\s*/, '').trim(); 
};

app.post('/api/check-domain-availability', async (req, res) => {
  const { domain } = req.body;

  if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain name is required.' });
  }

  try {
      await dns.resolve(domain);
      return res.json({ success: false, message: `The domain ${domain} is already taken.` });
  } catch (error) {
      if (error.code === 'ENOTFOUND') {
          return res.json({ success: true, message: `The domain ${domain} is available!` });
      }
      console.error('DNS lookup error:', error);
      return res.status(500).json({ success: false, message: 'Error checking domain availability.' });
  }
});

//-------------------------------------------------------- Domain Suggestions ----------------------------------------------------------//

app.post('/api/domain-suggestions', async (req, res) => {
  const { domain } = req.body; 

  if (!domain) {
    return res.status(400).json({ success: false, message: 'Domain name is required.' });
  }

  try {
    const prompt = `Suggest 5 unique and professional domain names related to "${domain}". The names should be brandable, suitable for a legitimate business, and easy to remember. Use common domain extensions such as .com, .net, and .co. Avoid using numbers, hyphens, or generic words. The suggestions should reflect the type of business represented by the term "${domain}". Please give only the domain names, no extra information. The domain names should be unique so that they are available to register. Do not use hyphens in suggesting domain names`;

    const getDomainSuggestions = async () => {
      const response = await axios.post(
        COHERE_API_URL,
        {
          model: 'command',
          prompt: prompt,
          max_tokens: 1000,
          temperature: 0.5,
        },
        {
          headers: {
            Authorization: `Bearer ${COHERE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      const rawText = response.data.generations?.[0]?.text || '';

      let suggestions = rawText
        .split('\n')  
        .map((s) => cleanDomainName(s))
        .filter((s) => s.match(/\.\w{2,}$/)); 

      return suggestions;
    };

    let availableDomains = [];
    let attempts = 0;

    while (availableDomains.length < 5 && attempts < 20) {
      console.log(`Attempt #${attempts + 1} to find available domains...`);

      const suggestions = await getDomainSuggestions();
      console.log('Generated suggestions:', suggestions);

      const availableSuggestions = await checkDomainsAvailability(suggestions);

      availableDomains = [...new Set([...availableDomains, ...availableSuggestions])];

      if (availableDomains.length < 5) {
        attempts++;
        console.log(`Not enough available domains found. Attempting to generate new suggestions...`);
      }
    }

    if (availableDomains.length < 5) {
      return res.status(500).json({
        success: false,
        message: 'Unable to find available domain names. Please try again later.',
      });
    }

    const formattedDomains = availableDomains
      .map((domain) => `${domain} - ✅ Available`)
      .join('<br />');

    res.json({
      success: true,
      domains: formattedDomains,
    });

  } catch (error) {
    console.error('Error generating domain suggestions:', error.response?.data || error.message || error);
    res.status(500).json({ success: false, message: 'Error generating domain suggestions.' });
  }
});

//---------------------------------------------------------- Domain Info --------------------------------------------------------------//

app.get('/api/domain-info', async (req, res) => {
  const domainName = req.query.domain;

  if (!domainName) {
      console.warn('[DOMAIN-INFO] ❌ Domain name is missing in the request.');
      return res.status(400).json({ success: false, message: 'Domain name is required in the query parameter.' });
  }

  console.log('[DOMAIN-INFO] 🔍 Fetching information for domain:', domainName);

  const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain?APIKey=${FETCHED_API_KEY}&websiteName=${domainName}`;
  console.log('[DOMAIN-INFO] 🌐 API Request URL:', apiUrl);

  try {
      const response = await axios.get(`https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain`, {
          params: {
              APIKey: FETCHED_API_KEY,
              websiteName: domainName,
          }
      });

      console.log('[DOMAIN-INFO] 🌐 API Response:', response.data);

      if (response.data.responseMsg.statusCode === 200) {
          console.log('[DOMAIN-INFO] ✅ Domain information retrieved successfully for:', domainName);
          return res.json({
              success: true,
              answer: `Domain information for ${domainName}:`,
              domainData: response.data.responseData
          });
      } else {
          console.warn('[DOMAIN-INFO] ⚠️ Domain not found in records:', domainName);
          return res.json({
              success: false,
              message: `Domain ${domainName} is not registered with us.`,
          });
      }
  } catch (error) {
      console.error('[DOMAIN-INFO] ❗ Error fetching domain info:', error.message);
      return res.status(500).json({
          success: false,
          message: 'Failed to fetch domain information from ConnectReseller API.'
      });
  }
});

const BASE_URL = "https://api.connectreseller.com/ConnectReseller";
const API_KEY = FETCHED_API_KEY;
async function getDomainDetails(domainName) {
  if (domainCache.has(domainName)) {
      console.log(`✅ Using cached details for ${domainName}`);
      return domainCache.get(domainName);
  }

  let connection;
  try {
      connection = await pool.getConnection();

      const [rows] = await connection.execute(
          "SELECT domainNameId FROM DomainName WHERE websiteName = ? LIMIT 1",
          [domainName]
      );

      if (rows.length === 0 || !rows[0]?.domainNameId) {
          console.error(`❌ Domain ${domainName} not found or missing ID.`);
          return null;
      }

      const domainDetails = { domainNameId: rows[0].domainNameId };

      domainCache.set(domainName, domainDetails);
      setTimeout(() => domainCache.delete(domainName), 600000); 

      return domainDetails;
  } catch (error) {
      console.error('❌ Error fetching domain details from database:', error);
      return null;
  } finally {
      if (connection) connection.release();
  }
}

async function getDomainDetails(domainName) {
  const connection = await pool.getConnection();
  try {
      const [rows] = await connection.execute(
          "SELECT domainNameId FROM DomainName WHERE websiteName = ? LIMIT 1",
          [domainName]
      );
      return rows.length > 0 ? rows[0] : null;
  } catch (error) {
      console.error('❌ Error fetching domain details:', error);
      return null;
  } finally {
      connection.release();
  }
}

//--------------------------------------------------------- Theft Protection ----------------------------------------------------------//

async function manageTheftProtection(domainName, enable) {
  console.log(`🔐 [${new Date().toISOString()}] Managing theft protection for ${domainName} - ${enable ? 'Enabled' : 'Disabled'}`);

  const domainDetails = await getDomainDetails(domainName);
  if (!domainDetails || !domainDetails.domainNameId) {
      const response = { success: false, message: `Domain ${domainName} not found.` };
      console.log('🚫 Sending response to frontend:', response);
      return response;
  }

  const { domainNameId } = domainDetails;
  const apiUrl = `${BASE_URL}/ESHOP/ManageTheftProtection?APIKey=${FETCHED_API_KEY}&domainNameId=${domainNameId}&websiteName=${domainName}&isTheftProtection=${enable}`;

  console.log(`🌍 Sending API Request: ${apiUrl}`);

  try {
      const response = await axios.get(apiUrl);
      console.log('📨 Full API Response:', JSON.stringify(response.data, null, 2));

      const isSuccess = response.data?.responseMsg?.statusCode === 200;
      const result = {
          success: isSuccess,
          message: response.data?.responseMsg?.message || 'Failed to update theft protection.',
          ...(isSuccess ? {} : { fullResponse: response.data }) 
      };

      console.log('✅ Sending response to frontend:', result);
      return result;
  } catch (error) {
      console.error('❌ Error managing theft protection:', error);
      const errorResponse = { 
          success: false, 
          message: 'Internal server error while managing theft protection.', 
          errorDetails: error 
      };

      console.log('🚫 Sending error response to frontend:', errorResponse);
      return errorResponse;
  }
}

app.get('/api/manage-theft-protection', async (req, res) => {
  console.log(`📥 [${new Date().toISOString()}] API request received. Query Params:`, req.query);

  const { domainName, enable } = req.query;
  if (!domainName || enable === undefined) {
      const errorResponse = { success: false, message: "Missing required parameters: domainName and enable." };
      console.log('🚫 Sending response to frontend:', errorResponse);
      return res.status(400).json(errorResponse);
  }

  const isTheftProtection = enable === 'true'; 
  console.log(`🔄 Parsed isTheftProtection: ${isTheftProtection} (Type: ${typeof isTheftProtection}, Raw: ${enable})`);

  try {
      const result = await manageTheftProtection(domainName, isTheftProtection);
      console.log('📤 Final Response to Frontend:', result);
      res.json(result);
  } catch (error) {
      console.error('❌ API error:', error);
      const errorResponse = { 
          success: false, 
          message: 'Internal server error while updating theft protection.', 
          errorDetails: error 
      };

      console.log('🚫 Sending error response to frontend:', errorResponse);
      res.status(500).json(errorResponse);
  }
});

//------------------------------------------------------------ Domain Lock ------------------------------------------------------------//

async function manageDomainLockStatus(domainName, lock) {
  console.log(`🔒 Managing domain lock for ${domainName}: ${lock ? 'Locked' : 'Unlocked'}`);

  const domainDetails = await getDomainDetails(domainName);
  if (!domainDetails || !domainDetails.domainNameId) {
      console.log(`❌ Domain details not found for: ${domainName}`);
      return { success: false, message: `❌ Domain ${domainName} not found.` };
  }

  const { domainNameId } = domainDetails;
  const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ManageDomainLock?APIKey=${FETCHED_API_KEY}&domainNameId=${domainNameId}&websiteName=${domainName}&isDomainLocked=${lock}`;

  console.log(`🌍 Sending API Request: ${apiUrl}`);

  try {
      const response = await axios.get(apiUrl);
      console.log('📨 API Response:', JSON.stringify(response.data, null, 2)); 

      if (response.data.responseMsg?.statusCode === 200) {
          const successMessage = `✅ Domain ${domainName} has been successfully ${lock ? "locked" : "unlocked"}.`;
          console.log(`📤 Sending success response to frontend: ${successMessage}`);
          return { success: true, message: successMessage };
      }

      const errorMessage = `⚠️ API Error: ${response.data.responseMsg?.message || "Failed to update domain lock status."}`;
      console.log(`📤 Sending error response to frontend: ${errorMessage}`);
      return { 
          success: false, 
          message: errorMessage, 
          fullResponse: response.data 
      };
  } catch (error) {
      console.error('❌ Error managing domain lock:', error);
      return { success: false, message: '⚠️ Internal server error while managing domain lock.' };
  }
}

app.get('/api/lock-domain', async (req, res) => {
  console.log(`📥 Received API request:`, req.query);

  const { domainName, lock } = req.query;
  if (!domainName || (lock !== "true" && lock !== "false")) {
      console.log(`⚠️ Invalid request parameters: domainName=${domainName}, lock=${lock}`);
      return res.status(400).json({ success: false, message: "⚠️ Missing or invalid parameters: domainName and lock." });
  }

  const isDomainLocked = lock === 'true';
  console.log(`🔄 Parsed isDomainLocked: ${isDomainLocked}`);

  const result = await manageDomainLockStatus(domainName, isDomainLocked);
  console.log(`📤 Final response to frontend:`, JSON.stringify(result, null, 2)); 
  return res.json(result);
});

//----------------------------------------------------------- Account Balance ----------------------------------------------------------//

app.get('/api/balance', async (req, res) => {
  if (!req.session || !req.session.email) {
      console.warn('⚠️ [BALANCE API] User not authenticated.');
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }

  let connection;
  try {
      connection = await pool.getConnection(); // ✅ Get a connection from the pool

      // 🔍 Fetch `resellerId` from `Client` table using `UserName`
      const [clientRows] = await connection.execute(
          "SELECT ResellerId FROM Client WHERE UserName = ? LIMIT 1",
          [req.session.email]
      );

      if (clientRows.length === 0 || !clientRows[0].ResellerId) {
          console.warn('⚠️ [BALANCE API] ResellerId not found for email:', req.session.email);
          return res.status(404).json({ success: false, message: 'ResellerId not found.' });
      }

      const resellerId = clientRows[0].ResellerId;
      console.log('🔍 [BALANCE API] ResellerId fetched from MySQL:', resellerId);

      // 🌍 Prepare and log the API request URL
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${FETCHED_API_KEY}&resellerId=${resellerId}`;
      console.log('📡 [BALANCE API] Requesting URL:', url);

      // 💬 Make the API request
      const response = await axios.get(url);

      // ✅ Log API response status and data
      console.log('✅ [BALANCE API] Response Status:', response.status);
      console.log('📦 [BALANCE API] Full Response Data:', JSON.stringify(response.data, null, 2));

      // Check if response status is 0 (success)
      if (response.data.responseMsg.statusCode === 0) {
          console.log('💰 [BALANCE API] Current Balance:', response.data.responseData);

          // Prepare the response to be sent to frontend
          const finalResponse = {
              success: true,
              answer: `💰 Your current balance is: $${response.data.responseData}`,
              showInChat: true
          };

          // Log the final response being sent to the frontend
          console.log('📤 [BALANCE API] Final response sent to frontend:', JSON.stringify(finalResponse, null, 2));

          return res.json(finalResponse);
      } else {
          console.warn('⚠️ [BALANCE API] Failed to fetch balance. Status Code:', response.data.responseMsg.statusCode);

          const errorResponse = { success: false, message: 'Failed to fetch balance.' };

          // Log the error response being sent to the frontend
          console.log('📤 [BALANCE API] Final error response sent to frontend:', JSON.stringify(errorResponse, null, 2));

          return res.json(errorResponse);
      }
  } catch (error) {
      console.error('❌ [BALANCE API] Error fetching balance:', error.message);

      const errorResponse = { success: false, message: 'Error fetching balance.' };

      // Log the error response being sent to the frontend
      console.log('📤 [BALANCE API] Final error response sent to frontend:', JSON.stringify(errorResponse, null, 2));

      return res.status(500).json(errorResponse);
  } finally {
      if (connection) connection.release(); // ✅ Ensure the connection is released
  }
});

//-------------------------------------------------------- Suspend Domain -------------------------------------------------------------//

async function manageDomainSuspension(domainName, suspend) {
  let connection;
  try {
      console.log('[SUSPEND-DOMAIN] 🔍 Checking for domain:', domainName);

      // Normalize domain name
      const domain = domainName.trim().toLowerCase();
      console.log('[SUSPEND-DOMAIN] ✅ Extracted and Normalized Domain:', domain);

      // Get database connection
      connection = await pool.getConnection();

      // Fetch domainNameId from database
      const [rows] = await connection.execute(
          "SELECT domainNameId FROM DomainName WHERE websiteName = ? LIMIT 1",
          [domain]
      );

      if (rows.length === 0) {
          console.error(`❌ Domain ${domain} not found.`);
          return { success: false, message: `domainNameId not found for ${domain}.` };
      }

      const domainNameId = rows[0].domainNameId;
      console.log('[SUSPEND-DOMAIN] ✅ Fetched domainNameId:', domainNameId);

      // API URL
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ManageDomainSuspend?APIKey=${FETCHED_API_KEY}&domainNameId=${domainNameId}&websiteName=${domain}&isDomainSuspend=${suspend}`;

      console.log('[SUSPEND-DOMAIN] 🌐 Sending API Request:', apiUrl);

      // Send API request
      const response = await axios.get(apiUrl);
      console.log('[SUSPEND-DOMAIN] 🌐 API Response:', response.data);

      // Check API response
      if (response.data?.responseMsg?.statusCode === 200) {
          return {
              success: true,
              answer: `✅ Domain ${domain} has been successfully ${suspend ? 'suspended' : 'unsuspended'}.`,
          };
      } else {
          // ❌ If failure, send full API response to the frontend
          return {
              success: false,
              message: response.data?.responseMsg?.message || `Failed to ${suspend ? 'suspend' : 'unsuspend'} ${domain}.`,
              fullResponse: response.data
          };
      }

  } catch (error) {
      console.error('[SUSPEND-DOMAIN] ❌ Error:', error.message || error);
      return { success: false, message: '⚠️ Failed to update domain suspension status. Please try again later.' };
  } finally {
      if (connection) connection.release();
  }
}

app.get('/api/suspend-domain', async (req, res) => {
  const { domainName, suspend } = req.query;
  console.log('[BACKEND] 📥 Received Request:', { domainName, suspend });

  // Validate domainName
  if (!domainName) {
      const errorResponse = { success: false, message: "❌ Missing domainName parameter." };
      console.log('[BACKEND] 📤 Response to Frontend:', errorResponse);
      return res.status(400).json(errorResponse);
  }

  // Convert suspend to a proper boolean
  const isSuspend = String(suspend).toLowerCase() === 'true';
  console.log('[BACKEND] 🔄 Computed isSuspend:', isSuspend);

  // Process suspension
  const result = await manageDomainSuspension(domainName, isSuspend);

  // ✅ Log the final response before sending it to the frontend
  console.log('[BACKEND] 📤 Final Response to Frontend:', result);

  return res.json(result);
});

//------------------------------------------------- Privacy Protection Management ------------------------------------------------------//

async function managePrivacyProtection(domainName, enableProtection) {
  let connection;
  try {
      console.log(`[PRIVACY-PROTECTION] 🛠 Function managePrivacyProtection() called for ${domainName}`);
      console.log(`[PRIVACY-PROTECTION] 🔄 Received enableProtection: ${enableProtection} (Type: ${typeof enableProtection})`);

      // Extract domain name
      const domain = domainName.trim();
      console.log('[PRIVACY-PROTECTION] ✅ Domain extracted:', domain);

      // Fetch database connection
      connection = await pool.getConnection();

      // Fetch domainNameId
      console.log('[PRIVACY-PROTECTION] 🔍 Fetching domainNameId from database...');
      const [rows] = await connection.execute(
          "SELECT domainNameId FROM DomainName WHERE websiteName = ? LIMIT 1",
          [domain]
      );

      if (rows.length === 0) {
          console.error(`❌ Domain ${domain} not found in the database.`);
          return { success: false, message: `domainNameId not found for ${domain}.` };
      }

      const domainNameId = rows[0].domainNameId;
      console.log('[PRIVACY-PROTECTION] ✅ Fetched domainNameId:', domainNameId);

      // ✅ Correct API Endpoint
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ManageDomainPrivacyProtection?APIKey=${FETCHED_API_KEY}&domainNameId=${domainNameId}&iswhoisprotected=${enableProtection}`;
      console.log('[PRIVACY-PROTECTION] 🌐 FINAL API Call:', apiUrl);

      // API Request
      const response = await axios.get(apiUrl);
      console.log('[PRIVACY-PROTECTION] 🌐 API Response:', response.data);

      // Handle API response
      if (response.data.responseMsg?.statusCode === 200) {
          const actionText = enableProtection ? 'enabled' : 'disabled';
          return {
              success: true,
              answer: `Privacy protection for ${domain} has been successfully ${actionText}.`,
          };
      } else {
          return {
              success: false,
              message: response.data.responseMsg?.message || `Failed to update privacy protection for ${domain}.`,
          };
      }
  } catch (error) {
      console.error('[PRIVACY-PROTECTION] ❌ Error:', error.message);
      return { success: false, message: 'Failed to update privacy protection status.' };
  } finally {
      if (connection) connection.release();
  }
}

app.get('/api/manage-privacy-protection', async (req, res) => {
  const { domainName, enable } = req.query;

  console.log('[BACKEND] 🛠 Received API Request with Parameters:', req.query);

  if (!domainName) {
      console.error("[BACKEND] ❌ No domain name received.");
      return res.json({ success: false, message: "Missing domainName parameter." });
  }

  // Convert "enabled"/"disabled" to boolean
  const isEnableProtection = enable === 'true';

  console.log(`[BACKEND] 🚀 Calling managePrivacyProtection() for ${domainName}`);
  const result = await managePrivacyProtection(domainName, isEnableProtection);

  return res.json(result);
});

//------------------------------------------------------- Update Name Servers ---------------------------------------------------------//

// Function to Update Name Servers
async function updateNameServer(domainName, nameServers) {
  try {
      console.log(`[UPDATE-NS] 🔍 Checking domain: ${domainName}`);

      // Establish connection to MySQL database
      const connection = await pool.getConnection();

      // Fetch domainNameId from the DomainName table using websiteName (domainName)
      const [rows] = await connection.execute(
          "SELECT domainNameId FROM DomainName WHERE websiteName = ? LIMIT 1",
          [domainName]
      );

      // Check if domainNameId was found
      if (rows.length === 0) {
          console.warn(`[UPDATE-NS] ⚠️ No domain found for: ${domainName}`);
          return { success: false, message: `Domain ${domainName} not found.` };
      }

      const domainId = rows[0].domainNameId;
      console.log(`[UPDATE-NS] ✅ Found domainId: ${domainId}`);

      // Proceed with name server update if valid
      if (!Array.isArray(nameServers) || nameServers.length === 0 || nameServers.length > 13) {
          return { success: false, message: "Invalid number of name servers. You must provide 1 to 13 name servers." };
      }

      // Construct API URL with all name servers dynamically
      let apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/UpdateNameServer?APIKey=${FETCHED_API_KEY}&domainNameId=${domainId}&websiteName=${domainName}`;
      
      nameServers.forEach((ns, index) => {
          apiUrl += `&nameServer${index + 1}=${ns}`;
      });

      console.log(`[UPDATE-NS] 🌐 API Request: ${apiUrl}`);

      // Send API Request
      const response = await axios.get(apiUrl);

      console.log(`[UPDATE-NS] 🌐 API Response:`, response.data);

      // Log what is being sent to the frontend
      const result = {
          success: response.data.responseMsg?.statusCode === 200,
          message: response.data.responseMsg?.message || "Failed to update name servers."
      };

      // Log the final response being sent to frontend
      console.log(`[UPDATE-NS] 📤 Response Sent to Frontend:`, result);

      return result;
  } catch (error) {
      console.error(`[UPDATE-NS] ❌ Error:`, error);
      const errorMessage = { success: false, message: "Error processing name servers update." };
      
      // Log the error response sent to the frontend
      console.log(`[UPDATE-NS] 📤 Error Response Sent to Frontend:`, errorMessage);
      
      return errorMessage;
  }
}

// API Endpoint for Updating Name Servers
app.get('/update-name-servers', async (req, res) => {
  const { domainName, nameServers } = req.query;

  if (!domainName || !nameServers) {
      return res.status(400).json({ success: false, message: "Missing required parameters." });
  }

  try {
      const parsedNameServers = JSON.parse(nameServers);

      if (!Array.isArray(parsedNameServers) || parsedNameServers.length === 0 || parsedNameServers.length > 13) {
          return res.status(400).json({ success: false, message: "Invalid number of name servers. You must provide 1 to 13 name servers." });
      }

      const result = await updateNameServer(domainName, parsedNameServers);
      
      // Log what is being sent back to frontend
      console.log(`[UPDATE-NS] 📤 Response Sent to Frontend:`, result);
      
      res.json(result);
  } catch (error) {
      console.error(`[UPDATE-NS] ❌ Error processing request:`, error);
      return res.status(400).json({ success: false, message: "Invalid nameServers JSON format." });
  }
});

//------------------------------------------------------ Add Child Name Servers --------------------------------------------------------//

async function addChildNameServer(domainName, ipAddress, hostname) {
  let connection;
  try {
      console.log(`[ADD-CHILD-NS] 🔍 Checking domain: ${domainName}`);

      // Establish connection to MySQL database
      connection = await pool.getConnection();  // No need to use promise().getConnection() since pool is already promise-based

      // Fetch domainNameId from the DomainName table using domainName
      const [rows] = await connection.execute(
          "SELECT domainNameId FROM DomainName WHERE websiteName = ? LIMIT 1",
          [domainName]
      );

      // Check if domainNameId was found
      if (rows.length === 0) {
          console.warn(`[ADD-CHILD-NS] ⚠️ No domain found for: ${domainName}`);
          return { success: false, message: `Domain ${domainName} not found.` };
      }

      const domainNameId = rows[0].domainNameId;

      if (!domainNameId) {
          console.warn(`[ADD-CHILD-NS] ⚠️ domainNameId missing for ${domainName}`);
          return { success: false, message: `Invalid domain ID for ${domainName}.` };
      }

      console.log(`[ADD-CHILD-NS] ✅ Found domainNameId: ${domainNameId}`);

      // Prepare API Request (Correct Order: ipAddress FIRST, then hostName)
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/AddChildNameServer?APIKey=${FETCHED_API_KEY}&domainNameId=${domainNameId}&websiteName=${domainName}&ipAddress=${ipAddress}&hostName=${hostname}`;

      console.log(`[ADD-CHILD-NS] 🌐 API Request: ${apiUrl}`);

      // Send API Request
      const response = await axios.get(apiUrl);

      console.log(`[ADD-CHILD-NS] 🌐 API Response for ${hostname}:`, response.data);

      if (response.data.responseMsg?.statusCode === 200) {
          return { success: true, message: `Child Name Server ${hostname} added successfully!` };
      } else {
          return { success: false, message: response.data.responseMsg?.message || "Failed to add child name server." };
      }
  } catch (error) {
      console.error(`[ADD-CHILD-NS] ❌ Error:`, error);
      return { success: false, message: "Error processing child name server." };
  } finally {
      if (connection) connection.release();  // Ensure connection is released back to the pool
  }
}

app.get('/add-child-ns', async (req, res) => {
  const { domainName, ipAddress, hostname } = req.query;

  if (!domainName || !hostname || !ipAddress) {
      return res.status(400).json({ success: false, message: "Missing required parameters." });
  }

  const result = await addChildNameServer(domainName, ipAddress, hostname);
  res.json(result);
});

//--------------------------------------------- TLD Sugestions for a particular Category -----------------------------------------------//

const getCategorySuggestions = async (category) => {
  try {
    const prompt = `Suggest 5 top-level domains (TLDs) suitable for the category "${category}". Example response: .tech, .ai, .shop, .biz, .online`;

    const response = await axios.post(
      COHERE_API_URL,
      {
        model: 'command',
        prompt: prompt,
        max_tokens: 50,
        temperature: 0.7,
      },
      {
        headers: { Authorization: `Bearer ${COHERE_API_KEY}` },
      }
    );

    if (!response.data.generations || response.data.generations.length === 0) {
      return [];
    }

    return response.data.generations[0].text
      .split(',')
      .map((tld) => tld.trim())
      .slice(0, 5);

  } catch (error) {
    console.error('Error fetching category suggestions:', error);
    return [];
  }
};

app.post('/api/category-suggestion', async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ success: false, message: 'Category is required.' });

  const suggestions = await getCategorySuggestions(category);

  if (suggestions.length > 0) {
    return res.json({
      success: true,
      suggestions,
    });
  } else {
    return res.json({ success: false, answer: 'Failed to fetch TLD suggestions.' });
  }
});

//----------------------------------------------------------- Get Auth Code ------------------------------------------------------------//

app.get('/api/domain-auth-code', async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain Name is required' });
  }

  if (!req.session || !req.session.email) {
      return res.status(400).json({ success: false, message: "User is not authenticated." });
  }

  const email = req.session.email;
  console.log(`📧 Fetching clientId and resellerId for email: ${email}`);

  let connection;
  try {
      connection = await pool.getConnection();

      // 1️⃣ Fetch clientId and resellerId from Client table
      const [clientRows] = await connection.execute(
          "SELECT clientId, ResellerId FROM Client WHERE UserName = ? LIMIT 1",
          [email]
      );

      if (clientRows.length === 0) {
          return res.status(404).json({ success: false, message: "Client not found." });
      }

      const { clientId, ResellerId } = clientRows[0];
      console.log(`✅ Retrieved clientId: ${clientId}, ResellerId: ${ResellerId}`);

      // 2️⃣ Fetch domainNameId from DomainName table using ResellerId and websiteName
      const [domainRows] = await connection.execute(
          "SELECT domainNameId FROM DomainName WHERE websiteName = ? AND resellerId = ? LIMIT 1",
          [domain, ResellerId]
      );

      if (domainRows.length === 0) {
          console.warn(`⚠️ No domain found for: ${domain} under resellerId: ${ResellerId}`);
          return res.status(404).json({ success: false, message: `Domain ${domain} not found in database.` });
      }

      const domainNameId = domainRows[0].domainNameId;
      console.log(`✅ Found domainNameId: ${domainNameId}`);

      // 3️⃣ Fetch Auth Code using domainNameId
      const authCodeUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewEPPCode?APIKey=${FETCHED_API_KEY}&domainNameId=${domainNameId}`;
      console.log(`🌐 Fetching Auth Code: ${authCodeUrl}`);

      const authCodeResponse = await axios.get(authCodeUrl);
      const authCodeData = authCodeResponse.data;

      console.log('🔑 Auth Code Response:', authCodeData);

      if (authCodeData.responseData) {
          return res.json({ success: true, authCode: authCodeData.responseData });
      } else {
          return res.status(404).json({ success: false, message: 'Auth code not found.' });
      }
  } catch (error) {
      console.error('❌ Error fetching auth code:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
      if (connection) connection.release();
  }
});

//---------------------------------------------------- Get Domain Expiry Date ----------------------------------------------------------//

app.get('/api/expiring-domains', async (req, res) => {
  try {
      const apiKey = FETCHED_API_KEY;
      const { date } = req.query;

      console.log(`📥 Received Request for Expiring Domains on: ${date}`);

      if (!apiKey) {
          console.error("❌ API Key is missing.");
          return res.status(500).json({ success: false, message: "API key is missing" });
      }

      if (!date || !moment(date, "DD-MM-YYYY", true).isValid()) {
          console.error(`⚠️ Invalid date received: ${date}`);
          return res.status(400).json({ success: false, message: "Invalid or missing date. Use DD-MM-YYYY format." });
      }

      console.log(`🌐 Fetching domains expiring on ${date}`);

      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/SearchDomainList?APIKey=${apiKey}&page=1&maxIndex=100&orderby=ExpirationDate&orderType=asc`;
      const response = await axios.get(url);

      console.log("📩 Raw API Response from ConnectReseller:", JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.records) {
          console.log("⚠️ No records found in API response.");
          return res.json({ success: false, message: "No domains found.", domains: [] });
      }

      const domains = response.data.records
          .filter(domain => {
              if (!domain.expirationDate) return false;

              const expirationTimestamp = domain.expirationDate.toString().length === 10
                  ? domain.expirationDate * 1000
                  : domain.expirationDate;

              const startOfDay = moment(date, "DD-MM-YYYY").startOf('day').valueOf();
              const endOfDay = moment(date, "DD-MM-YYYY").endOf('day').valueOf();

              return expirationTimestamp >= startOfDay && expirationTimestamp <= endOfDay;
          })
          .map(domain => ({
              domainName: domain.domainName,
              expirationDate: moment(Number(domain.expirationDate)).format("DD-MM-YYYY") // Convert timestamp to formatted date
          }));

      console.log(`✅ Filtered Domains Expiring on ${date}:`, JSON.stringify(domains, null, 2));

      const responseData = {
          success: true,
          domains,
          message: domains.length ? "" : `No domains expiring on ${date}.`
      };

      console.log("🚀 Final Response Sent to Frontend:", JSON.stringify(responseData, null, 2));

      return res.json(responseData);

  } catch (error) {
      console.error("❌ API Fetch Error:", error.response ? error.response.data : error.message);
      return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//-------------------------------------------------- Get Domain Registration Date ------------------------------------------------------//

app.get('/api/registrationdate-domains', async (req, res) => {
  try {
      const apiKey = FETCHED_API_KEY;
      const { date } = req.query; // Expecting "dd-mm-yyyy"

      if (!apiKey) {
          return res.status(500).json({ success: false, message: "API key is missing" });
      }

      if (!date || !moment(date, "DD-MM-YYYY", true).isValid()) {
          return res.status(400).json({ success: false, message: "Invalid or missing date. Use dd-mm-yyyy format." });
      }

      // Convert input date to UNIX timestamp (milliseconds)
      const startOfDay = moment(date, "DD-MM-YYYY").startOf('day').valueOf();
      const endOfDay = moment(date, "DD-MM-YYYY").endOf('day').valueOf();

      // API Call to fetch recently registered domains
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/SearchDomainList?APIKey=${apiKey}&page=1&maxIndex=100&orderby=CreationDate&orderType=asc`;

      console.log(`🌐 Fetching registered domains for ${date}: ${url}`);

      const response = await axios.get(url);
      const domains = response.data.records || []; // Fix: Use correct API key

      // Filter domains registered on the exact date
      const filteredDomains = domains.filter(domain => {
          const creationTimestamp = domain.creationDate;
          const domainTimestamp = creationTimestamp.toString().length === 10 ? creationTimestamp * 1000 : creationTimestamp;
          return domainTimestamp >= startOfDay && domainTimestamp <= endOfDay;
      });

      return res.json({ success: true, domains: filteredDomains.length ? filteredDomains : [] });
  } catch (error) {
      console.error("❌ Error fetching registration date domains:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//-------------------------------------------------- TLD suggestions for a domain name -------------------------------------------------//

app.get("/api/tld-suggestions", async (req, res) => {
  try {
      const { websiteName } = req.query;

      console.log(`[INFO] Received request for TLD suggestions - websiteName: ${websiteName}`);

      if (!websiteName) {
          console.warn(`[WARN] Missing websiteName parameter`);
          return res.status(400).json({ success: false, message: "websiteName is required" });
      }

      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/getTldSuggestion?APIKey=${FETCHED_API_KEY}&websiteName=${websiteName}`;

      console.log(`[INFO] Fetching TLD suggestions from API: ${apiUrl}`);

      // Make request to ConnectReseller API
      const response = await axios.get(apiUrl);

      console.log(`[INFO] API Response Status: ${response.status}`);
      console.log(`[DEBUG] API Response Data:`, response.data);

      // Fix: Extract the correct field from the response
      if (response.data && response.data.responseData) {
          console.log(`[SUCCESS] TLD suggestions retrieved for ${websiteName}:`, response.data.responseData);
          return res.status(200).json({ success: true, tldList: response.data.responseData });
      } else {
          console.warn(`[WARN] No TLD suggestions found for ${websiteName}`);
          return res.status(404).json({ success: false, message: "No TLD suggestions found." });
      }
  } catch (error) {
      console.error(`[ERROR] Error fetching TLD suggestions: ${error.message}`);
      console.error(`[DEBUG] Stack Trace: ${error.stack}`);
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

//----------------------------------------------------- Submit query section -----------------------------------------------------------//

// Define allowedTopics before initializing Fuse
const allowedTopics = [
  'domain', 'website', 'hosting', 'DNS', 'SSL', 'WHOIS', 'web development',
  'domain registration', 'SEO', 'online presence', 'how to register a domain name',
  'domain name registration', 'buy a domain', 'domain name process', 'domain transfer',
  'domain pricing', 'best domain registrars', 'domain expiration', 'renew a domain',
  'custom domain for website', 'how to enable/disable privacy protection',
  'how to enable/disable theft protection', 'what are the name servers for',
  'when was this domain registered'
];

// Refined predefined answers with improved grammar, chatbot tone, and categorized responses
const predefinedAnswers = {
  // Register Domain
  "Where can I register domains?": "To register a domain, enter your desired name in the search bar. If it's unavailable, our Domain Suggestion Tool will suggest similar alternatives. If available, select the number of years for registration, review the pricing details, and decide whether to proceed or dismiss the registration.",
  // General Domain Management
 
  "Give me a list of high-value domain TLDs?": " 🌍 <strong>High-value TLDs include:</strong><br>🔹 .com<br>🔹 .net<br>🔹 .org<br>🔹 .ai<br>🔹 .io<br>🔹 .xyz<br>🔹 .co<br>These TLDs are considered premium due to their popularity and value in the digital market.",
//
  "What actions can I do here on the chatbot?": "This platform offers ✅ domain management, 🛡️ security controls, and 🚀 domain status management, with 🤝 24/7 customer support available for assistance.",
//
  "Where can I find the API documentation?": "You can find API documentation by clicking the button below:<br><a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 View API Documentation</a>",
//
"How can I contact support?": 'To contact support click on the button: <br><a href="https://www.connectreseller.com/contact-us/" style="display: inline-flex; align-items: center; justify-content: center; padding: 10px 15px; background: #007fff; color: white; font-size: 16px; text-decoration: none; border-radius: 5px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform="scale(1.05)"; this.style.boxShadow="0 6px 10px rgba(0, 0, 0, 0.15)";" onmouseout="this.style.transform="scale(1)"; this.style.boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)";">📞 Contact Support</a>',
//
  "What types of SSL are available?": "We offer various SSL certificates, including:\n- Commercial SSL (Domain verification)\n- Trusted SSL (Domain + Organization verification)\n- Positive SSL (Basic domain verification)\n- Sectigo SSL (Domain verification)\n- Instant SSL (Domain + Organization verification)",
//
  "Where can I sign up?": "You can sign up here: \n<a href='https://india.connectreseller.com/signup' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; margin-right: 10px;'>🇮🇳 India Panel</a><br>\n<a href='https://global.connectreseller.com/signup' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #28a745; text-decoration: none; border-radius: 5px;'>🌍 Global Panel</a>",
//
  "How can I download the WHMCS module?": "Click here for more details on how to download the WHMCS module: <br><a href='https://marketplace.whmcs.com/product/5581-connectreseller' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 WHMCS module for Domains</a> <br><br><a href='https://marketplace.whmcs.com/product/6960-connectreseller-ssl' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 WHMCS module for SSL Certificate</a>",
//
  "How can I add a child nameserver?": "To add a child nameserver, click the add child nameserver button below, fill in the registered domain for which you want to add child nameserver, Child Nameserver which you want to add and IP address which you want to associate with the Child Nameservers. You can add upto 4 child nameservers using the '➕Add Child Name Server' button.",
};

// Convert predefined questions into an array
const predefinedQuestions = Object.keys(predefinedAnswers);

const normalizeQuery = (query) => {
  return query
    .toLowerCase()
    .replace(/\b(all|can|this|do)\b/g, '')  // Remove common words or phrases that could vary
    .trim();
};

// Initialize Fuse.js once (outside of the API function) for predefined questions
const fuse1 = new Fuse(predefinedQuestions, {
  includeScore: true,
  threshold: 0.4 // Adjust threshold for flexibility
});

// Initialize second Fuse instance for allowed topics
const fuse2 = new Fuse(allowedTopics, {
  includeScore: true,
  threshold: 0.4
});

// Function to extract domain name from the query
const extractDomain = (text) => {
  const domainRegex = /\b((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})\b/;
  const match = text.match(domainRegex);
  return match ? match[1] : null;
};

// Search function for predefined answers
const searchPredefinedAnswer = (query) => {
  const result = fuse1.search(query);
  return result.length > 0 ? predefinedAnswers[result[0].item] : null;
};

// Search function for allowed topics
const searchAllowedTopics = (query) => {
  const result = fuse2.search(query);
  return result.length > 0 ? result[0].item : null;
};

app.post('/api/domain-queries', async (req, res) => {
    const { query, chatHistory } = req.body; // Ensure chatHistory is passed in the request
    if (!query) return res.status(400).json({ success: false, message: 'Query is required.' });

    console.log('Received query:', query);
    const lowerQuery = normalizeQuery(query);
    const domainName = extractDomain(query);

    // Step 1: Check Predefined Answers with Fuse.js
    const predefinedResult = searchPredefinedAnswer(query);

    // ✅ Prevent redundant "How do I register a domain?" response
    if (
        query.toLowerCase().includes("register") && 
        chatHistory && chatHistory.includes("Before registering the domain, check its availability by clicking the 'Check Availability' button.")
    ) {
        return res.json({ success: true, answer: null }); // Respond with null to prevent duplicate message
    }

    if (predefinedResult) {
        return res.json({ success: true, answer: predefinedResult });
    }

  // Check for Domain Name Suggestions
  const isDomainSuggestionQuery = lowerQuery.includes('suggest') && (lowerQuery.includes('domain') || lowerQuery.includes('suggestions'));

  if (isDomainSuggestionQuery) {
    return res.json({
      success: true,
      triggerDomainSection: true,
      answer: 'I can help you with domain suggestions! Please click domain name suggestions button.',
    });
  }

  if (predefinedResult) {
    return res.json({
      success: true,
      answer: predefinedResult.message,
      button: predefinedResult.button || null  // Send button if available
    });
  }

  // Check for Domain Availability
  const isAvailable = lowerQuery.includes('availability') || lowerQuery.includes('available');

  if (isAvailable) {
    return res.json({
      success: true,
      triggerDomainSection: true,
      answer: 'I can help you with checking domain availability! Please click check domain availability button.',
    });
  }

  if (lowerQuery.includes('current balance') || lowerQuery.includes('available funds')) {
    if (!req.session || !req.session.email) {
        return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 1️⃣ Fetch clientId and resellerId from Client table
        const [clientRows] = await connection.execute(
            "SELECT clientId, ResellerId FROM Client WHERE UserName = ? LIMIT 1",
            [req.session.email]
        );

        if (clientRows.length === 0) {
            return res.status(404).json({ success: false, message: 'ResellerId not found.' });
        }

        const { clientId, ResellerId } = clientRows[0];
        console.log(`✅ Retrieved clientId: ${clientId}, ResellerId: ${ResellerId}`);

        // 2️⃣ Fetch available funds using resellerId
        const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${FETCHED_API_KEY}&resellerId=${ResellerId}`;
        console.log(`🌐 Fetching balance from: ${url}`);

        const response = await axios.get(url);

        if (response.data.responseMsg.statusCode === 0) {
            return res.json({
                success: true,
                answer: `Your current balance is: ${response.data.responseData}`,
                showInChat: true
            });
        } else {
            return res.json({
                success: false,
                message: 'Failed to fetch balance.',
            });
        }
    } catch (error) {
        console.error('❌ Error fetching balance:', error);
        return res.status(500).json({ success: false, message: 'Error fetching balance.' });
    } finally {
        if (connection) connection.release();
    }
}

  // ✅ Detect TLD Suggestion Request
  const categoryMatch = lowerQuery.match(/suggest tlds for (.+)/i);
  if (categoryMatch) {
    const category = categoryMatch[1].trim();
    const suggestions = await getCategorySuggestions(category);

    if (suggestions.length > 0) {
      const formattedSuggestions = suggestions.map((tld, index) => `${index + 1}. ${tld}`).join('\n');

      return res.json({
        success: true,
        answer: `Here are 5 suggested TLDs for "${category}":\n${formattedSuggestions}`,
        suggestions,
      });
    } else {
      return res.json({ success: false, answer: 'Failed to fetch TLD suggestions.' });
    }
  }

// Check for Domain Information or Specific Registration Date Request
if (domainName && (lowerQuery.includes('domain information') || lowerQuery.includes('details of the domain') || lowerQuery.includes('when was this domain registered'))) {
  console.log('[DOMAIN-QUERIES] 📝 Domain information requested for:', domainName);
  try {
      const response = await axios.get(
          `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain`,
          {
              params: {
                  APIKey: FETCHED_API_KEY,
                  websiteName: domainName,
              }
          }
      );

      console.log('[DOMAIN-QUERIES] 🌐 API Response:', response.data);

      if (response.data.responseMsg.statusCode === 200) {
          console.log('[DOMAIN-QUERIES] ✅ Successfully fetched domain info for:', domainName);

          // Extract domain details
          const domainData = response.data.responseData;
          const registrationTimestamp = domainData.creationDate || null;

          let registrationDateFormatted = 'Not available';
          if (registrationTimestamp) {
              // Convert timestamp to readable date format
              const registrationDate = new Date(registrationTimestamp * 1000); // Assuming timestamp is in seconds
              registrationDateFormatted = registrationDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          }

          // If user specifically asked for registration date
          if (lowerQuery.includes('domain registered') || lowerQuery.includes('when was this domain registered')){
              return res.json({
                  success: true,
                  answer: `The domain **${domainName}** was registered on **${registrationDateFormatted}**.`,
              });
          }

          // Return full domain details
          return res.json({
              success: true,
              answer: `Domain information for ${domainName}:`,
              domainData: domainData
          });
      } else {
          console.warn('[DOMAIN-QUERIES] ⚠️ Domain not found in records:', domainName);
          return res.json({
              success: false,
              message: `Domain ${domainName} not found in our records.`,
          });
      }
  } catch (error) {
      console.error('[DOMAIN-QUERIES] ❗ Error fetching domain info:', error.message);
      return res.status(500).json({
          success: false,
          message: 'Failed to fetch domain information.'
      });
  }
}

// ✅ Detect Balance Inquiry
if (lowerQuery.includes("current balance") || lowerQuery.includes("available funds")) {
  if (!req.session || !req.session.email) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
  }

  let connection;
  try {
      connection = await pool.getConnection(); // ✅ Get a connection from the pool

      // 🔍 Fetch `resellerId` from `Client` table using `UserName`
      const [clientRows] = await connection.execute(
          "SELECT ResellerId FROM Client WHERE UserName = ? LIMIT 1",
          [req.session.email]
      );

      if (clientRows.length === 0 || !clientRows[0].ResellerId) {
          return res.status(404).json({ success: false, message: "ResellerId not found." });
      }

      const resellerId = clientRows[0].ResellerId;
      console.log("🔍 [BALANCE QUERY] ResellerId fetched from MySQL:", resellerId);

      // 🌍 Fetch balance from ConnectReseller API
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${FETCHED_API_KEY}&resellerId=${resellerId}`;
      const response = await axios.get(url);

      if (response.data.responseMsg.statusCode === 0) {
          return res.json({
              success: true,
              answer: `Your current balance is: ${response.data.responseData}`,
          });
      } else {
          return res.json({
              success: false,
              message: "Failed to fetch balance.",
          });
      }
  } catch (error) {
      console.error("❌ [BALANCE QUERY] Error fetching balance:", error.message);
      return res.status(500).json({ success: false, message: "Error fetching balance." });
  } finally {
      if (connection) connection.release(); // ✅ Ensure the connection is released
  }
}

const domainKeywords = [
  'domain', 'register', 'dns', 'hosting', 'availability', 'tld', 'subdomain', 'WHOIS'
];

  // Step 3: Check if the query is domain-related using Fuse.js
  const isDomainRelated = domainKeywords.some(keyword =>
    query.toLowerCase().includes(keyword)
  );
  
  if (!isDomainRelated) {
    setTimeout(() => {
        return res.status(400).json({ 
            success: false, 
            message: "Sorry, I can't answer that right now. Let me know if you need any other help. 😊" 
        });
    }, 3000);
    return; // Prevents further execution
}
  // Step 4: Use Cohere API for AI-Generated Responses (if no predefined match)

  try {
    const cohereResponse = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command',
        prompt: `Provide a detailed answer for this domain-related query: "${query}"`,
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.COHERE_API_KEY}` },
      }
    );

    return res.json({
      success: true,
      answer: cohereResponse.data.generations?.[0]?.text || 'No response',
    });

  } catch (error) {
    console.error('Cohere API error:', error.response?.data || error.message);
    return res.status(500).json({ success: false, message: 'Cohere API request failed.' });
  }
});

const dns = require('dns').promises;

//------------------------------------------------------------ Start the Server -------------------------------------------------------//
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
