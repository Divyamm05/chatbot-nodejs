require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const session = require('express-session');
const mysql = require('mysql2/promise');
const axios = require('axios');
const { OpenAI } = require('openai');
const whois = require('whois');
const whois2 = require('whois-json');
const Fuse = require('fuse.js');
const admin = require('firebase-admin');
const { info } = require('console');
const qs = require('qs');
const fs = require('fs');
const moment = require('moment');
const pdf = require('pdf-parse');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Session timeout duration
const SESSION_TIMEOUT = 30 * 60 * 1000; 

// Session setup
app.use(session({
  secret: 'your_secret_key',  
  resave: false,              
  saveUninitialized: true,    
  cookie: { secure: false },  
}));

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.ai/v1/generate';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

const startQuestions = {
  "What features does this platform offer?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",
  "What are the features of this platform?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",
  "What are the key features of this platform?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",
  "What does this platform offer?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",
  "What features can I use on this platform?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",

  "What can this chatbot do?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",
  "What all can this chatbot do?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",
  "What is this chatbot capable of?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",
  "What can I do with this chatbot?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",
  "What can the chatbot do for me?": "This platform offers a comprehensive set of domain management features, including domain registration, transfer, renewal, and availability checks. Users can manage name servers, add child name servers, enable or disable theft protection, lock or unlock domains, and suspend or unsuspend domains. The platform also supports privacy protection, premium domain registration, API access for automation, and integration with WHMCS. Additionally, users can check domain-related reports, view expiration details, retrieve auth codes, and manage payment options. A chatbot assists with queries, and customer support is available for further assistance.",

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
  
  "How can I search for a domain name?": "You can start by signing into our domain registration platform or using our AI chatbot to search for a domain name. Simply enter your desired domain, and our system will check its availability.Need suggestions? Our domain name suggestion feature will provide variations and alternatives if your preferred domain is already taken.Once you find the perfect domain, you can proceed with the purchase and registration seamlessly.",
  "Where can I check for domain availability?": "You can start by signing into our domain registration platform or using our AI chatbot to search for a domain name. Simply enter your desired domain, and our system will check its availability.Need suggestions? Our domain name suggestion feature will provide variations and alternatives if your preferred domain is already taken.Once you find the perfect domain, you can proceed with the purchase and registration seamlessly.",
  "How to check if a domain is available?": "You can start by signing into our domain registration platform or using our AI chatbot to search for a domain name. Simply enter your desired domain, and our system will check its availability.Need suggestions? Our domain name suggestion feature will provide variations and alternatives if your preferred domain is already taken.Once you find the perfect domain, you can proceed with the purchase and registration seamlessly.",
  "How do I find a good domain name for my website?": "You can start by signing into our domain registration platform or using our AI chatbot to search for a domain name. Simply enter your desired domain, and our system will check its availability.Need suggestions? Our domain name suggestion feature will provide variations and alternatives if your preferred domain is already taken.Once you find the perfect domain, you can proceed with the purchase and registration seamlessly.",
  
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
  "Does your platform provide an API for domain management?": "Absolutely! Our platform offers a comprehensive API for seamless domain management. You can explore the full API documentation here: <a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='color: white; bold'><b>API Documentation</b></a>.",
  "What integrations are supported?": "Our API supports a wide range of integrations. For detailed information on all available integrations, please refer to our API documentation: <a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='color: white; bold'><b>API Documentation</b></a>.",
  "How can I get more details about the API?": "You can find all the details, including endpoints, integration guidelines, and examples, in our API documentation: <a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='color: white; bold'><b>API Documentation</b></a>.",
  "How can I contact support?": '<a href="https://www.connectreseller.com/contact-us/" style="color: white; font-weight: bold; text-decoration: none;">CLICK HERE</a> to contact us.',
  "Can I get a demo of the platform?": 'Yes, we offer demos upon request. <a href="https://www.connectreseller.com/contact-us/" style="color: white; font-weight: bold; text-decoration: none;">CLICK HERE</a> to reach out to our support team.',
  "Is there a guide for new users?": "Yes! Signing up with us gives you access to a helpful onboarding guide, along with the latest offers on our extensive selection of TLDs.",
  "What payment methods are supported?": "We support multiple payment gateways, offering flexibility for your transactions. Additionally, we also accept offline payment methods, including cheques, for your convenience.",
  "How do I pay for services after signing up?": "After signing up, you can pay for services directly through the platform's payment portal.",
};


// Helper function to normalize user input
function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}
// Normalize predefined questions
const normalizedStartQuestions = Object.keys(startQuestions).reduce((acc, key) => {
  acc[normalizeText(key)] = startQuestions[key];
  return acc;
}, {});

// Route to handle the question
app.post('/ask-question', (req, res) => {
  const userQuestion = req.body.question;
  
  if (!userQuestion) {
    return res.status(400).json({ answer: "Invalid question. Please try again." });
  }

  const normalizedUserQuestion = normalizeText(userQuestion);

  // Prioritize exact matches first
  if (normalizedStartQuestions[normalizedUserQuestion]) {
    return res.json({ answer: normalizedStartQuestions[normalizedUserQuestion] });
  }

  const domainKeywords = ["domain", "register", "dns", "transfer", "premium"];
  if (domainKeywords.some(keyword => normalizedUserQuestion.includes(keyword))) {
    return res.json({
      answer: "To perform this action, you need to sign up. Create an account today to gain access to our platform and manage your domains effortlessly. Take control of your domain portfolio now!"
    });
  }

  const pricingKeywords = ["pricing", "cost", "fee", "price"];
  if (pricingKeywords.some(keyword => normalizedUserQuestion.includes(keyword))) {
    return res.json({
      answer: "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!"
    });
  }

  // Default response if no match
  return res.json({ answer: "To perform this action, you need to sign up. Create an account today to gain access to our platform and manage your domains effortlessly. Take control of your domain portfolio now!" });
});

// Tester login without checking Firebase
app.post('/api/tester-login', logSession, (req, res) => {
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
});

app.post('/api/check-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  const normalizedEmail = email.trim().toLowerCase(); // ✅ Always store email in lowercase
  req.session.email = normalizedEmail;

  // ✅ Tester & AI Chatbot Bypass Logic
  const bypassEmails = ["tester@abc.com", "aichatbot@iwantdemo.com"];
  if (bypassEmails.includes(normalizedEmail)) {
    req.session.otpVerified = true; // ✅ Mark as verified without OTP
    return res.json({ success: true, otpRequired: false });
  }

  try {
    const connection = await pool.getConnection(); // ✅ Get a connection from the pool
    const [users] = await connection.query("SELECT clientId FROM Client WHERE UserName = ?", [normalizedEmail]);
    connection.release(); // ✅ Release the connection

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Email not found in our records.<br>
          <a href='https://india.connectreseller.com/signup' style='color: white; font-weight: bold; text-decoration: none;'>CLICK HERE</a> to sign up for the India panel.<br>
          <a href='https://global.connectreseller.com/signup' style='color: white; font-weight: bold; text-decoration: none;'>CLICK HERE</a> to sign up for the Global panel.<br>
          Or enter your registered email ID to continue.`
      });
    }

    // ✅ Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 60000);

    // ✅ Store OTP in MySQL (Replace with your actual OTP table structure)
    const otpQuery = "INSERT INTO otp_records (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?";
    await pool.query(otpQuery, [normalizedEmail, otp, expiresAt, otp, expiresAt]);

    // ✅ Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It is valid for 1 minute.`
    };
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'OTP sent to your email address.', otpRequired: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Resend OTP if valid or generate new OTP
app.post('/api/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  try {
    const otpRef = db.collection('otp_records').doc(email);
    const otpDoc = await otpRef.get();

    if (otpDoc.exists && otpDoc.data().expires_at.toDate() > new Date()) {
      const otp = otpDoc.data().otp;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}. It is still valid for 1 minute.`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'OTP resent to your email address.' });
    } else {
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 60000);

      await otpRef.set({
        otp,
        expires_at: expiresAt,
      }, { merge: true });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}. It is valid for 1 minute.`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'New OTP sent to your email address.' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// OTP Verification Endpoint
app.post('/api/verify-otp', async (req, res) => {
  const { otp, email } = req.body;

  if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
      const lowerCaseEmail = email.toLowerCase();

      if (lowerCaseEmail === 'aichatbot@iwantdemo.com') {
          // 🔍 Fetch customerId dynamically
          const clientQuery = await db.collection('Client').where('UserName', '==', lowerCaseEmail).get();
          if (!clientQuery.empty) {
              req.session.customerId = clientQuery.docs[0].data().clientId;
          } else {
              return res.status(404).json({ success: false, message: 'Client not found in database.' });
          }

          req.session.verified = true;
          return res.json({ success: true, message: 'Test user authenticated successfully.', customerId: req.session.customerId });
      }

      // 🔍 Normal OTP Verification
      const otpRef = db.collection('otp_records').doc(email);
      const otpDoc = await otpRef.get();

      if (!otpDoc.exists || otpDoc.data().otp !== otp || otpDoc.data().expires_at.toDate() < new Date()) {
          return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      }

      req.session.verified = true;

      // 🔍 Fetch clientId from Client table using email
      const clientQuery = await db.collection('Client').where('UserName', '==', email).get();
      if (!clientQuery.empty) {
          req.session.customerId = clientQuery.docs[0].data().clientId;
      } else {
          return res.status(404).json({ success: false, message: 'Client not found in database.' });
      }

      return res.json({
          success: true,
          message: 'OTP verified successfully.',
          customerId: req.session.customerId,
      });

  } catch (error) {
      console.error('Error during OTP verification:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

const domainRegistrationService = async (params) => {
  try {
    const queryParams = new URLSearchParams({
      APIKey: process.env.CONNECT_RESELLER_API_KEY,
      ProductType: '1',
      Websitename: params.Websitename,
      Duration: params.Duration,
      IsWhoisProtection: params.IsWhoisProtection || 'false',
      ns1: params.ns1 || '11338.dns1.managedns.org',
      ns2: params.ns2 || '11338.dns2.managedns.org',
      ns3: params.ns3 || '',  // ✅ Include ns3 as empty if not provided
      ns4: params.ns4 || '',  // ✅ Include ns4 as empty if not provided
      Id: params.clientId || '15272',  // ✅ Use correct Id
      isEnablePremium: params.isEnablePremium || '0',  // ✅ Set as '0' instead of 'false'
      lang: params.lang || "en"
    });

    const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/domainorder?${queryParams.toString()}`;

    console.log('🔍 API Request URL:', url); // Debugging

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
      }
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
    const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkdomainavailable?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&websiteName=${domainName}`;

    console.log(`Checking domain availability for: ${domainName}`);
    console.log(`Request URL: ${url}`);

    const response = await axios.get(url, { headers: { "Accept": "application/json" } });

    console.log("API Response:", JSON.stringify(response.data, null, 2));

    // Extract the message from the API response
    const message = response.data?.responseMsg?.message || "Unknown response from API";

    // Correctly determine if the domain is available
    const isAvailable = message.toLowerCase() === "domain available for registration";  // ✅ Correct condition

    console.log(`Domain Availability: ${isAvailable}`);

    return {
      available: isAvailable,
      message: message, // Send the API message to frontend
    };
  } catch (error) {
    console.error("Error checking domain availability:", error.message);
    return { available: false, message: "Error checking domain availability." };
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
      const API_KEY = process.env.CONNECT_RESELLER_API_KEY;
      const maxResults = 5;
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/domainSuggestion?APIKey=${API_KEY}&keyword=${domain}&maxResult=${maxResults}`;

      console.log(`🔍 Fetching domain suggestions from API...`);
      console.log(`🌍 API Request URL: ${url}`);

      const response = await axios.get(url, { headers: { "Accept": "application/json" } });

      console.log("✅ API Response Received:");
      console.log(JSON.stringify(response.data, null, 2));

      // Ensure we properly access the registryDomainSuggestionList
      const suggestions = response.data?.registryDomainSuggestionList; 

      if (!suggestions || suggestions.length === 0) {
          console.warn(`⚠️ No suggestions found for: ${domain}`);
          return res.json({ success: false, message: "No domain suggestions found." });
      }

      console.log(`📌 Found ${suggestions.length} domain suggestions for: ${domain}`);
      suggestions.forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion.domainName} - $${suggestion.price}`);
      });

      // Correctly send the list of domain suggestions
      res.json({ success: true, data: suggestions });
  } catch (error) {
      console.error("❌ Error fetching domain suggestions:", error.message);
      res.status(500).json({ success: false, message: "Failed to fetch domain suggestions." });
  }
  console.log("====================================");
});

app.get("/api/check-domain", async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ success: false, message: "Domain name required." });

  const available = await checkDomainAvailability(domain);
  res.json({ success: available });
});

app.get("/api/register-domain", async (req, res) => {
  let { Websitename, Duration, Id } = req.query;
  
  const available = await checkDomainAvailability(Websitename);
  if (!available) {
    return res.json({ success: false, message: "Domain is not available." });
  }

  const balanceResponse = await axios.get(`https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&resellerId=${Id}`);
  const balance = parseFloat(balanceResponse.data.responseData);
  
  if (balance < 20) { // Assuming minimum required balance is $10
    return res.json({ success: false, message: "Insufficient funds for registration." });
  }

  const response = await domainRegistrationService(req.query);
  if (response.responseMsg.statusCode === 200) {
    res.json({ success: true, message: "Domain registered successfully!" });
  } else {
    res.json({ success: false, message: response.responseMsg.message });
  }
});

const API_KEY_TRANSFER = process.env.CONNECT_RESELLER_API_KEY; 
const API_URL_TRANSFER = 'https://api.connectreseller.com/ConnectReseller/ESHOP/TransferOrder';

app.post('/api/transfer-domain', async (req, res) => {
    const { domainName, authCode, isWhoisProtection, customerId } = req.body;

    // Validate required parameters
    if (!domainName || !authCode || !customerId) {
        return res.status(400).json({ success: false, message: "Missing required parameters." });
    }

    try {
        const params = {
            APIKey: API_KEY_TRANSFER,
            OrderType: 4, // Required value for transfers
            Websitename: domainName, // ✅ Correct casing as per documentation
            IsWhoisProtection: Boolean(isWhoisProtection).toString(), // Ensures correct string format
            AuthCode: authCode,
            Id: customerId
        };

        console.log("🔍 Transfer API Request URL:", `${API_URL_TRANSFER}?${new URLSearchParams(params)}`); // Debugging

        // Make GET request with params
        const response = await axios.get(API_URL_TRANSFER, { params });

        const data = response.data;
        console.log("✅ Transfer API Response:", data); // Debugging

        if (data?.responseMsg?.statusCode === 200) {
            return res.json({ 
                success: true, 
                message: "Domain transfer initiated successfully. Waiting for approval from losing registrar.", 
                data 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: data?.responseMsg?.message || "Domain transfer failed.",
                data
            });
        }
    } catch (error) {
        console.error("❌ API Error:", {
            message: error.message,
            responseData: error.response?.data,
            requestConfig: error.config
        });
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


const ORDER_TYPE_RENEWAL = 2;

const renewDomainService = async (params) => {
    try {
        if (!params.Websitename || !params.Duration || !params.clientId) {
            throw new Error("Missing required parameters for renewal.");
        }

        const queryParams = new URLSearchParams({
            APIKey: process.env.CONNECT_RESELLER_API_KEY,
            OrderType: ORDER_TYPE_RENEWAL,
            Websitename: params.Websitename,
            Duration: params.Duration,
            Id: params.clientId,
            IsWhoisProtection: params.IsWhoisProtection || false
        });

        const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/RenewalOrder?${queryParams.toString()}`;

        console.log("🔍 API Request URL:", url);
        const response = await axios.get(url, {
            headers: { 'Accept': 'application/json' }
        });

        console.log('✅ Domain Renewal Successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error during domain renewal API call:', error.message);
        if (error.response) {
            console.error('🔍 API Response Status:', error.response.status);
            console.error('📄 API Response Data:', error.response.data);
        } else {
            console.error('🚫 No Response Received');
        }
        return { success: false, message: error.message };
    }
};

app.get('/api/renew-domain', async (req, res) => {
    let params = { ...req.query };
    console.log("🔍 Received Params:", params);

    if (!req.session || !req.session.email) {
        return res.status(400).json({ success: false, message: "User is not authenticated." });
    }

    const email = req.session.email;
    console.log("📧 Fetching clientId for email:", email);

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            "SELECT clientId FROM Client WHERE UserName = ? LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Client not found." });
        }

        params.clientId = rows[0].clientId;
        console.log("✅ Retrieved clientId:", params.clientId);

        const response = await renewDomainService(params);
        console.log('✅ Domain Renewal Response:', response);

        return res.json({
            success: response?.responseMsg?.statusCode === 200,
            message: response?.responseMsg?.message || "Domain renewal failed.",
            expiryDate: response?.responseData?.expiryDate || null
        });
    } catch (error) {
        console.error('❗ Error during domain renewal API call:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    } finally {
        if (connection) connection.release();
    }
});


// Function to check availability of multiple domains
const checkDomainsAvailability = async (suggestions) => {
  const availabilityChecks = suggestions.map((domain) =>
    isAvailable(domain).then(
      (available) => ({ domain, available }),
      (error) => ({ domain, available: false, error: error.message })
    )
  );

  // Use Promise.allSettled to handle multiple domain availability checks concurrently
  const results = await Promise.allSettled(availabilityChecks);

  // Map through results to filter out failures and gather successful ones
  const availableDomains = results
    .filter(result => result.status === 'fulfilled' && result.value.available)
    .map(result => result.value.domain);

  return availableDomains;
};

const isAvailable = (domain) => {
  return new Promise((resolve, reject) => {
    // Ensure the domain has a valid extension
    if (!domain.match(/\.\w{2,}$/)) {
      return reject(new Error(`Invalid domain format: ${domain}`));
    }

    whois.lookup(domain, (err, data) => {
      if (err) {
        return reject(new Error(`WHOIS lookup failed for ${domain}: ${err.message}`));
      }

      // Check if the domain is available
      if (data && (data.includes("No match for domain") || data.includes("Domain not found"))) {
        resolve(true);  // Domain is available
      } else {
        resolve(false); // Domain is not available
      }
    });
  });
};

// Helper function to clean the domain names (remove numbers and extra characters)
const cleanDomainName = (domain) => {
  return domain.replace(/^\d+\.\s*/, '').trim(); // Remove numbers and extra characters
};

app.post('/api/domain-suggestions', async (req, res) => {
  const { domain } = req.body; // Extract the base domain or topic from the request body

  if (!domain) {
    return res.status(400).json({ success: false, message: 'Domain name is required.' });
  }

  try {
    // Modify the prompt to focus on professional, short, and industry-specific domains
    const prompt = `Suggest 5 unique and professional domain names related to "${domain}". The names should be brandable, suitable for a legitimate business, and easy to remember. Use common domain extensions such as .com, .net, and .co. Avoid using numbers, hyphens, or generic words. The suggestions should reflect the type of business represented by the term "${domain}". Please give only the domain names, no extra information. The domain names should be unique so that they are available to register. Do not use hyphens in suggesting domain names`;

    //Generate domain name suggestions using Cohere API
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

      // Clean up and filter the domain names
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

app.get('/api/domain-info', async (req, res) => {
  const domainName = req.query.domain;

  if (!domainName) {
      console.warn('[DOMAIN-INFO] ❌ Domain name is missing in the request.');
      return res.status(400).json({ success: false, message: 'Domain name is required in the query parameter.' });
  }

  console.log('[DOMAIN-INFO] 🔍 Fetching information for domain:', domainName);

  const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&websiteName=${domainName}`;
  console.log('[DOMAIN-INFO] 🌐 API Request URL:', apiUrl);

  try {
      const response = await axios.get(`https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain`, {
          params: {
              APIKey: process.env.CONNECT_RESELLER_API_KEY,
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
const API_KEY = process.env.CONNECT_RESELLER_API_KEY;
async function getDomainDetails(websiteName) {
  console.log(`🔍 Fetching domain details for: ${websiteName}`);

  try {
      const domainsRef = admin.firestore().collection('DomainName'); // Ensure correct Firestore collection
      const querySnapshot = await domainsRef.where('websiteName', '==', websiteName).get();

      if (querySnapshot.empty) {
          console.warn(`⚠️ No domain found for websiteName: ${websiteName}`);
          return null;
      }

      const domainData = querySnapshot.docs[0].data(); // Get first matching result
      console.log(`✅ Found domain details:`, domainData);
      return domainData;
  } catch (error) {
      console.error(`❌ Error fetching domain details:`, error);
      return null;
  }
}

async function manageTheftProtection(domainName, enable) {
  console.log(`🔐 [${new Date().toISOString()}] Managing theft protection for ${domainName} - ${enable ? 'Enabled' : 'Disabled'}`);

  const domainDetails = await getDomainDetails(domainName);
  if (!domainDetails || !domainDetails.domainNameId) {
      return { success: false, message: `Domain ${domainName} not found.` };
  }

  const { domainNameId } = domainDetails;
  const apiUrl = `${BASE_URL}/ESHOP/ManageTheftProtection?APIKey=${API_KEY}&domainNameId=${domainNameId}&websiteName=${domainName}&isTheftProtection=${enable}`;
  
  console.log(`🌍 Sending API Request: ${apiUrl}`);

  try {
      const response = await axios.get(apiUrl);
      console.log('📨 API Response:', response.data);

      if (response.data?.responseMsg?.statusCode === 200) {
          return { success: true, message: `Theft protection ${enable ? 'enabled' : 'disabled'} for ${domainName}.` };
      }
      if (response.data?.responseMsg?.statusCode === 2306) {
        return { success: false, message: `Theft protection is already enabled for ${domainName}.` };
    }
    if (response.data?.responseMsg?.statusCode === 2305) {
        return { success: false, message: `Theft protection is already disabled for ${domainName}.` };
    }    

      return { success: false, message: response.data?.responseMsg?.message || 'Failed to update theft protection.' };
  } catch (error) {
      console.error('❌ Error managing theft protection:', error);
      return { success: false, message: 'Internal server error while managing theft protection.' };
  }
}

// 🚀 API Endpoint to Manage Theft Protection
app.get('/api/manage-theft-protection', async (req, res) => {
  console.log(`📥 [${new Date().toISOString()}] API request received. Query Params:`, req.query);

  let { domain, enable } = req.query;
  
  if (!domain || enable === undefined) {
      return res.status(400).json({ success: false, message: "Missing required parameters: domain and enable." });
  }

  const isTheftProtection = enable === 'true'; // Converts to boolean
  console.log(`🔄 Parsed isTheftProtection: ${isTheftProtection} (Type: ${typeof isTheftProtection})`);

  try {
      const result = await manageTheftProtection(domain, isTheftProtection);
      return res.json(result);
  } catch (error) {
      console.error('❌ API error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error while updating theft protection.' });
  }
});

// Backend: Manage Domain Lock/Unlock
async function manageDomainLock(domainName, lock) {
  try {
      console.log('[LOCK-DOMAIN] 🔍 Checking for domain:', domainName);

      const domainRef = admin.firestore().collection('DomainName');
      const domainSnapshot = await domainRef
          .where('websiteName', '==', domainName)
          .get();

      if (domainSnapshot.empty) {
          console.warn('[LOCK-DOMAIN] ⚠️ No documents found for domain:', domainName);
          return {
              success: false,
              message: `domainNameId not found for the domain ${domainName}.`,
          };
      }

      console.log('[LOCK-DOMAIN] 📝 Found documents:');
      domainSnapshot.forEach(doc => {
          console.log('Document ID:', doc.id, 'Data:', doc.data());
      });

      const domainData = domainSnapshot.docs[0].data();
      const domainNameId = domainData?.domainNameId;

      if (!domainNameId) {
          console.warn('[LOCK-DOMAIN] ⚠️ domainNameId is missing or invalid for domain:', domainName);
          return {
              success: false,
              message: `domainNameId not found or invalid for the domain ${domainName}.`,
          };
      }

      console.log('[LOCK-DOMAIN] ✅ Fetched domainNameId:', domainNameId);

      // API Call to lock/unlock domain
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ManageDomainLock?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&domainNameId=${domainNameId}&websiteName=${domainName}&isDomainLocked=${lock}`;
      
      // 📢 Log the API URL request
      console.log('[LOCK-DOMAIN] 🌐 API Request URL:', apiUrl);

      const response = await axios.get(apiUrl);
      console.log('[LOCK-DOMAIN] 🌐 API Response:', response.data);

      if (response.data.responseMsg?.statusCode === 200) {
          const actionText = lock ? 'locked' : 'unlocked';
          return {
              success: true,
              answer: `The domain ${domainName} has been successfully ${actionText}.`,
          };
      } else {
          return {
              success: false,
              message: response.data.responseMsg?.message || `Failed to ${lock ? 'lock' : 'unlock'} the domain ${domainName}.`,
          };
      }
  } catch (error) {
      console.error('[LOCK-DOMAIN] ❌ Error managing domain lock:', error.message);
      return {
          success: false,
          message: 'Failed to update domain lock status.',
      };
  }
}

app.get('/api/lock-domain', async (req, res) => {
  const { domainName, lock } = req.query;
  console.log('[BACKEND] Received parameters:', { domainName, lock });

  const isLock = lock === 'true';
  console.log('[BACKEND] Computed isLock:', isLock);

  const result = await manageDomainLock(domainName, isLock);
  return res.json(result);
});

app.get('/api/balance', async (req, res) => {
  if (!req.session || !req.session.email) {
      console.warn('⚠️ [BALANCE API] User not authenticated.');
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }

  try {
      let resellerId;

      if (req.session.email === 'aichatbot@iwantdemo.com') {
          resellerId = 15272;
          console.log('🔍 [BALANCE API] Using test resellerId:', resellerId);
      } else {
          const usersRef = admin.firestore().collection('Client');
          const querySnapshot = await usersRef.where('UserName', '==', req.session.email).get();

          if (querySnapshot.empty) {
              console.warn('⚠️ [BALANCE API] ResellerId not found for email:', req.session.email);
              return res.status(404).json({ success: false, message: 'ResellerId not found.' });
          }

          resellerId = querySnapshot.docs[0].data().clientId;
          console.log('🔍 [BALANCE API] ResellerId fetched from Firebase:', resellerId);
      }

      // 🌍 Prepare and log the API request URL
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&resellerId=${resellerId}`;
      console.log('📡 [BALANCE API] Requesting URL:', url);

      // 💬 Make the API request
      const response = await axios.get(url);

      // ✅ Log API response status and data
      console.log('✅ [BALANCE API] Response Status:', response.status);
      console.log('📦 [BALANCE API] Full Response Data:', JSON.stringify(response.data, null, 2));

      if (response.data.responseMsg.statusCode === 0) {
          console.log('💰 [BALANCE API] Current Balance:', response.data.responseData);
          return res.json({
              success: true,
              answer: `Your current balance is: $${response.data.responseData}`,
              showInChat: true
          });
      } else {
          console.warn('⚠️ [BALANCE API] Failed to fetch balance. Status Code:', response.data.responseMsg.statusCode);
          return res.json({ success: false, message: 'Failed to fetch balance.' });
      }
  } catch (error) {
      console.error('❌ [BALANCE API] Error fetching balance:', error.message);
      return res.status(500).json({ success: false, message: 'Error fetching balance.' });
  }
});

async function manageDomainSuspension(domainName, suspend) {
  try {
      console.log('[SUSPEND-DOMAIN] 🔍 Checking for domain:', domainName);

      const domainRef = admin.firestore().collection('DomainName');
      const domainSnapshot = await domainRef
          .where('websiteName', '==', domainName)
          .get();

      if (domainSnapshot.empty) {
          console.warn('[SUSPEND-DOMAIN] ⚠️ No documents found for domain:', domainName);
          return {
              success: false,
              message: `domainNameId not found for the domain ${domainName}.`,
          };
      }

      console.log('[SUSPEND-DOMAIN] 📝 Found documents:');
      domainSnapshot.forEach(doc => {
          console.log('Document ID:', doc.id, 'Data:', doc.data());
      });

      const domainData = domainSnapshot.docs[0].data();
      const domainNameId = domainData?.domainNameId;

      if (!domainNameId) {
          console.warn('[SUSPEND-DOMAIN] ⚠️ domainNameId is missing or invalid for domain:', domainName);
          return {
              success: false,
              message: `domainNameId not found or invalid for the domain ${domainName}.`,
          };
      }

      console.log('[SUSPEND-DOMAIN] ✅ Fetched domainNameId:', domainNameId);

      // API Call to suspend/unsuspend domain
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ManageDomainSuspend?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&domainNameId=${domainNameId}&websiteName=${domainName}&isDomainSuspend=${suspend}`;
      
      // 📢 Log the API URL request
      console.log('[SUSPEND-DOMAIN] 🌐 API Request URL:', apiUrl);

      const response = await axios.get(apiUrl);
      console.log('[SUSPEND-DOMAIN] 🌐 API Response:', response.data);

      if (response.data.responseMsg?.statusCode === 200) {
          const actionText = suspend ? 'suspended' : 'unsuspended';
          return {
              success: true,
              answer: `The domain ${domainName} has been successfully ${actionText}.`,
          };
      } else {
          return {
              success: false,
              message: response.data.responseMsg?.message || `Failed to ${suspend ? 'suspend' : 'unsuspend'} the domain ${domainName}.`,
          };
      }
  } catch (error) {
      console.error('[SUSPEND-DOMAIN] ❌ Error managing domain suspension:', error.message);
      return {
          success: false,
          message: 'Failed to update domain suspension status.',
      };
  }
}

app.get('/api/suspend-domain', async (req, res) => {
  const { domainName, suspend } = req.query;
  console.log('[BACKEND] Received parameters:', { domainName, suspend, type: typeof suspend });

  const isSuspend = suspend === 'true';
  console.log('[BACKEND] Computed isSuspend:', isSuspend);

  const result = await manageDomainSuspension(domainName, isSuspend);
  return res.json(result);
});

//----------------------------------------------------- Privacy Protection Management --------------------------------------------------------//

async function managePrivacyProtection(domainName, enable) {
  try {
      console.log('[PRIVACY-PROTECTION] 🔍 Checking for domain:', domainName);

      const domainRef = admin.firestore().collection('DomainName');
      const domainSnapshot = await domainRef
          .where('websiteName', '==', domainName)
          .get();

      if (domainSnapshot.empty) {
          console.warn('[PRIVACY-PROTECTION] ⚠️ No documents found for domain:', domainName);
          return {
              success: false,
              message: `domainNameId not found for the domain ${domainName}.`,
          };
      }

      console.log('[PRIVACY-PROTECTION] 📝 Found documents:');
      domainSnapshot.forEach(doc => {
          console.log('Document ID:', doc.id, 'Data:', doc.data());
      });

      const domainData = domainSnapshot.docs[0].data();
      const domainNameId = domainData?.domainNameId;

      if (!domainNameId) {
          console.warn('[PRIVACY-PROTECTION] ⚠️ domainNameId is missing or invalid for domain:', domainName);
          return {
              success: false,
              message: `domainNameId not found or invalid for the domain ${domainName}.`,
          };
      }

      console.log('[PRIVACY-PROTECTION] ✅ Fetched domainNameId:', domainNameId);

      // API Call to enable/disable privacy protection
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ManageDomainPrivacyProtection?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&domainNameId=${domainNameId}&iswhoisprotected=${enable}`;
      
      // 📢 Log the API URL request
      console.log('[PRIVACY-PROTECTION] 🌐 API Request URL:', apiUrl);

      const response = await axios.get(apiUrl);
      console.log('[PRIVACY-PROTECTION] 🌐 API Response:', response.data);

      if (response.data.responseMsg?.statusCode === 200) {
          const actionText = enable ? 'enabled' : 'disabled';
          return {
              success: true,
              answer: `Privacy protection has been successfully ${actionText} for ${domainName}.`,
          };
      } else {
          return {
              success: false,
              message: response.data.responseMsg?.message || `Failed to ${enable ? 'enable' : 'disable'} privacy protection for ${domainName}.`,
          };
      }
  } catch (error) {
      console.error('[PRIVACY-PROTECTION] ❌ Error managing privacy protection:', error.message);
      return {
          success: false,
          message: 'Failed to update privacy protection status.',
      };
  }
}

// API Route to handle privacy protection requests
app.get('/api/privacy-protection', async (req, res) => {
  const { domainName, enable } = req.query;
  console.log('[BACKEND] Received parameters:', { domainName, enable, type: typeof enable });

  const isEnable = enable === 'true';
  console.log('[BACKEND] Computed isEnable:', isEnable);

  const result = await managePrivacyProtection(domainName, isEnable);
  return res.json(result);
});

// Function to Update Name Servers
async function updateNameServer(domainName, nameServers) {
  try {
      console.log(`[UPDATE-NS] 🔍 Checking domain: ${domainName}`);

      // Fetch domainNameId from Firestore
      const domainRef = db.collection('DomainName');
      const domainSnapshot = await domainRef.where('websiteName', '==', domainName).get();

      if (domainSnapshot.empty) {
          console.warn(`[UPDATE-NS] ⚠️ No domain found for: ${domainName}`);
          return { success: false, message: `Domain ${domainName} not found.` };
      }

      const domainData = domainSnapshot.docs[0].data();
      const domainId = domainData?.domainNameId;
      
      if (!domainId) {
          console.warn(`[UPDATE-NS] ⚠️ domainNameId missing for ${domainName}`);
          return { success: false, message: `Invalid domain ID for ${domainName}.` };
      }

      console.log(`[UPDATE-NS] ✅ Found domainId: ${domainId}`);

      if (!Array.isArray(nameServers) || nameServers.length === 0 || nameServers.length > 13) {
          return { success: false, message: "Invalid number of name servers. You must provide 1 to 13 name servers." };
      }

      // Construct API URL with all name servers dynamically
      let apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/UpdateNameServer?APIKey=${API_KEY}&domainNameId=${domainId}&websiteName=${domainName}`;
      
      nameServers.forEach((ns, index) => {
          apiUrl += `&nameServer${index + 1}=${ns}`;
      });

      console.log(`[UPDATE-NS] 🌐 API Request: ${apiUrl}`);

      // Send API Request
      const response = await axios.get(apiUrl);

      console.log(`[UPDATE-NS] 🌐 API Response:`, response.data);

      if (response.data.responseMsg?.statusCode === 200) {
          return { success: true, message: `Name Servers updated successfully!` };
      } else {
          return { success: false, message: response.data.responseMsg?.message || "Failed to update name servers." };
      }
  } catch (error) {
      console.error(`[UPDATE-NS] ❌ Error:`, error);
      return { success: false, message: "Error processing name servers update." };
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
      res.json(result);
  } catch (error) {
      return res.status(400).json({ success: false, message: "Invalid nameServers JSON format." });
  }
});



// 📌 Function to Add Child Name Server (Correct Order)
async function addChildNameServer(domainName, ipAddress, hostname) {
  try {
      console.log(`[ADD-CHILD-NS] 🔍 Checking domain: ${domainName}`);

      // Fetch domainNameId from Firestore
      const domainRef = db.collection('DomainName');
      const domainSnapshot = await domainRef.where('websiteName', '==', domainName).get();

      if (domainSnapshot.empty) {
          console.warn(`[ADD-CHILD-NS] ⚠️ No domain found for: ${domainName}`);
          return { success: false, message: `Domain ${domainName} not found.` };
      }

      const domainData = domainSnapshot.docs[0].data();
      const domainNameId = domainData?.domainNameId;
      
      if (!domainNameId) {
          console.warn(`[ADD-CHILD-NS] ⚠️ domainNameId missing for ${domainName}`);
          return { success: false, message: `Invalid domain ID for ${domainName}.` };
      }

      console.log(`[ADD-CHILD-NS] ✅ Found domainNameId: ${domainNameId}`);

      // Prepare API Request (Correct Order: ipAddress FIRST, then hostName)
      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/AddChildNameServer?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&domainNameId=${domainNameId}&websiteName=${domainName}&ipAddress=${ipAddress}&hostName=${hostname}`;

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
  }
}

// 📌 API Endpoint (Now Uses GET, Correct Parameter Order)
app.get('/add-child-ns', async (req, res) => {
  const { domainName, ipAddress, hostname } = req.query;

  if (!domainName || !hostname || !ipAddress) {
      return res.status(400).json({ success: false, message: "Missing required parameters." });
  }

  const result = await addChildNameServer(domainName, ipAddress, hostname);
  res.json(result);
});

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

// ✅ Use getCategorySuggestions inside /api/category-suggestion to remove duplicate code
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

const allowedActions = [
  "Check Availability of Specified Domain",
  "Bulk Domain Check for Multiple domains",
  "Check Domain Suggestions List",
  "Check TLD Suggestions List",
  "Check Domain Price for Multiple Years",
  "Register",
  "Transfer",
  "Cancel Transfer",
  "Validate a Transfer",
  "Renew",
  "Getting Details of the Domain using ID",
  "Getting Details of the Domain using Domain Name",
  "Search",
  "Modify Nameserver of Domain",
  "Modify Authcode of Domain",
  "Manage Lock on Domain",
  "Manage Privacy on Domain",
  "Manage Domain Suspend",
  "Manage Theft Protection on Domain",
  "View Domain Secret Key",
  "Manage DNS Management",
  "Add DNS Record",
  "Modify DNS Record",
  "Delete DNS Record",
  "View DNS Record",
  "Modifying Domain Contact",
  "To move domain from one client to another",
  "Add SRV Record",
  "Modify DNS Record for Domain",
  "Add Contact",
  "Modify Contact",
  "View Contact",
  "To get Registrant list of specific client",
  "To Send RAA Verification mail",
  "Add Client",
  "Modify Client",
  "View Client",
  "Change the Client Password",
  "To Delete The Client",
  "To Get A Client List",
  "To Add Child Name Server",
  "Modify Name Server IP",
  "To Modify Host Child Name Server",
  "To Delete Child Name Server",
  "To Get Child Name Servers of a Domain",
  "To Set Domain Forwarding Details",
  "To Get Domain Forwarding Details",
  "To Update Domain Forwarding Details",
  "To Delete Domain Forwarding Details",
  "Check Reseller Available Funds"
];

// Find the closest matching action
function findClosestAction(userQuery) {
  const normalizedQuery = userQuery.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;

  allowedActions.forEach(action => {
      let words = action.toLowerCase().split(" ");
      let matchCount = words.filter(word => normalizedQuery.includes(word)).length;

      if (matchCount > bestScore) {
          bestScore = matchCount;
          bestMatch = action;
      }
  });

  return bestMatch;
}

// Extract relevant API details from PDF
async function extractRelevantText(userQuery) {
  const matchedAction = findClosestAction(userQuery);
  if (!matchedAction) {
      return `❌ The requested action **"${userQuery}"** was not found in our API documentation.`;
  }

  const pdfBuffer = fs.readFileSync('CR_API_Document_V7.pdf');
  const data = await pdf(pdfBuffer);
  const content = data.text;

  const regex = new RegExp(`${matchedAction}[\\s\\S]*?(?=\\n\\n|$)`, "i");
  const match = content.match(regex);

  return match ? `✅ **API Details for ${matchedAction}:**\n\n${match[0]}` : 
      `⚠️ No specific details found for **"${matchedAction}"**.`;
}

// API Route
app.post('/api/get-api-details', async (req, res) => {
  try {
      const responseText = await extractRelevantText(req.body.query);
      res.json({ success: true, answer: responseText });
  } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ success: false, message: "Server error while fetching API details." });
  }
});

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
      const authCodeUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewEPPCode?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&domainNameId=${domainNameId}`;
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

app.get('/api/expiring-domains', async (req, res) => {
  try {
      const apiKey = process.env.CONNECT_RESELLER_API_KEY;
      const { date } = req.query; // Expecting "DD-MM-YYYY"

      if (!apiKey) {
          return res.status(500).json({ success: false, message: "API key is missing" });
      }

      if (!date || !moment(date, "DD-MM-YYYY", true).isValid()) {
          return res.status(400).json({ success: false, message: "Invalid or missing date. Use DD-MM-YYYY format." });
      }

      // Convert input date to UNIX timestamp (start and end of the selected day)
      const startOfDay = moment(date, "DD-MM-YYYY").startOf('day').valueOf();
      const endOfDay = moment(date, "DD-MM-YYYY").endOf('day').valueOf();

      // API Call to fetch all domains sorted by expiration date
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/SearchDomainList?APIKey=${apiKey}&page=1&maxIndex=100&orderby=ExpirationDate&orderType=asc`;

      console.log(`🌐 Fetching domains expiring on ${date}: ${url}`);

      const response = await axios.get(url);
      if (!response.data || !response.data.records) {
          return res.json({ success: false, message: "No domains found.", domains: [] });
      }

      const domains = response.data.records;

      // Filter domains that expire exactly on the given date
      const expiringDomains = domains.filter(domain => {
          const expirationTimestamp = domain.expirationDate;
          if (!expirationTimestamp) return false;

          // Convert expiration timestamp (milliseconds handling)
          const domainExpiration = expirationTimestamp.toString().length === 10 ? expirationTimestamp * 1000 : expirationTimestamp;
          return domainExpiration >= startOfDay && domainExpiration <= endOfDay;
      });

      return res.json({
          success: true,
          domains: expiringDomains.length ? expiringDomains : [],
          message: expiringDomains.length ? "" : `No domains expiring on ${date}.`
      });

  } catch (error) {
      console.error("❌ Error fetching expiring domains:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get('/api/deleted-domains', async (req, res) => {
  try {
      const apiKey = process.env.CONNECT_RESELLER_API_KEY;
      const { date } = req.query; // Expecting "dd-mm-yyyy"

      if (!apiKey) {
          return res.status(500).json({ success: false, message: "API key is missing" });
      }

      if (!date || !moment(date, "DD-MM-YYYY", true).isValid()) {
          return res.status(400).json({ success: false, message: "Invalid or missing date. Use dd-mm-yyyy format." });
      }

      // Convert input date to UNIX timestamp (milliseconds)
      const startOfDay = moment(date, "DD-MM-YYYY").startOf('day').valueOf();

      // API Call to fetch domains sorted by expiration date
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/SearchDomainList?APIKey=${apiKey}&page=1&maxIndex=100&orderby=ExpirationDate&orderType=asc`;

      console.log(`🌐 Fetching domains expiring on ${date}: ${url}`);

      const response = await axios.get(url);
      const domains = response.data.success ? response.data.records || [] : [];

      // Filter domains that are set to expire exactly on the given date
      const expiringDomains = domains.filter(domain => {
          const expirationTimestamp = domain.expirationDate;
          if (!expirationTimestamp) return false;
          return moment(expirationTimestamp).startOf('day').valueOf() === startOfDay;
      });

      return res.json({ success: true, domains: expiringDomains, message: expiringDomains.length ? "" : `No domains expiring on ${date}.` });
  } catch (error) {
      console.error("❌ Error fetching expiring domains:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get('/api/registrationdate-domains', async (req, res) => {
  try {
      const apiKey = process.env.CONNECT_RESELLER_API_KEY;
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

app.get("/api/tld-suggestions", async (req, res) => {
  try {
      const { websiteName } = req.query;

      console.log(`[INFO] Received request for TLD suggestions - websiteName: ${websiteName}`);

      if (!websiteName) {
          console.warn(`[WARN] Missing websiteName parameter`);
          return res.status(400).json({ success: false, message: "websiteName is required" });
      }

      const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/getTldSuggestion?APIKey=${API_KEY}&websiteName=${websiteName}`;

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
  "How do I register a domain?": "To register a domain, enter your desired name in the search bar. If it's unavailable, our Domain Suggestion Tool will suggest similar alternatives. If available, select the number of years for registration, review the pricing details, and decide whether to proceed or dismiss the registration. Popular domain TLD prices: .com - $11.99, .net - $13.59, .co.in - $5.49, .in - $7.29, .org - $8.99, .ai - $84.09, .io - $36.29, .co - $12.29.",
//
  "Where can I register domains?": "To register a domain, enter your desired name in the search bar. If it's unavailable, our Domain Suggestion Tool will suggest similar alternatives. If available, select the number of years for registration, review the pricing details, and decide whether to proceed or dismiss the registration.",

  // Renew Domain
  "How can I renew a domain?": "To renew a domain. Enter the domain name and select the number of years for renewal.",

  // Transfer Domain
  "How do I transfer IN/OUT domains?": "To transfer a domain to us, unlock it at your current registrar and obtain the AuthCode/EPP code. Then, navigate to the 'Transfer Domain Name' section, enter the domain name you wish to transfer, and provide the AuthCode/EPP code to complete the transfer process with us.",

  // General Domain Management

  "Where can I view the domain information?": "You can view domain information in your account's domain management section or use a WHOIS lookup tool.",
//    
  "Give me the list of domain registrars.": "You can view domain information in your account's domain management section or use a WHOIS lookup tool.",
//
  "Give me a list of high-value domain TLDs?": "High-value TLDs include .com, .net, .org, .ai, .io, .xyz, and .co.",
//
  "What actions can I do here on the chatbot?": "You can check domain availability, get domain suggestions, and ask domain-related queries.",
//
  "How can I view the auth code for a domain?": "You can find the auth code in your domain management panel under transfer settings.",
//
  "What are the name servers for this domain?": "The name servers for your domain can be viewed in your domain management dashboard under DNS settings.",
//
  "How can I update the name servers for a domain?": "Go to your domain management panel, find DNS settings, and update the name servers accordingly.",
//
  "Where can I find the API documentation?": "You can find API documentation by clicking the button below:<br><a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 View API Documentation</a>",
//
"How can I contact support?": 'To contact support click on the button: <br><a href="https://www.connectreseller.com/contact-us/" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px 8px; background: #007fff; color: white; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform="scale(1.05)"; this.style.boxShadow="0 6px 10px rgba(0, 0, 0, 0.15)";" onmouseout="this.style.transform="scale(1)"; this.style.boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)";">📞 Contact Support</a>',
//
  "What types of SSL are available?": "We offer various SSL certificates, including:\n- Commercial SSL (Domain verification)\n- Trusted SSL (Domain + Organization verification)\n- Positive SSL (Basic domain verification)\n- Sectigo SSL (Domain verification)\n- Instant SSL (Domain + Organization verification)",
//
  "Where can I sign up?": "You can sign up here: <a href='https://india.connectreseller.com/signup' target='_blank' style='display: inline-block; padding: 8px 11px; font-size: 14px; font-weight: bold; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; margin-right: 10px;'>🇮🇳 India Panel</a> <a href='https://global.connectreseller.com/signup' target='_blank' style='display: inline-block; padding: 8px 11px; font-size: 14px; font-weight: bold; color: #fff; background-color: #28a745; text-decoration: none; border-radius: 5px;'>🌍 Global Panel</a>",
//
  "How can I download the WHMCS module?": "Click here for more details on how to download the WHMCS module: <br><a href='https://marketplace.whmcs.com/product/5581-connectreseller' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 WHMCS module for Domains</a> <br><br><a href='https://marketplace.whmcs.com/product/6960-connectreseller-ssl' target='_blank' style='display: inline-block; padding: 10px 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;'>📄 WHMCS module for SSL Certificate</a>",
//
  "How do I export 'List Name'?": "You can export domain-related lists from your account dashboard under the reports or export section.",
//
  "How can I move a domain?": "You can move a domain by initiating a transfer request and following the domain transfer process by clicking on the transfer button below.",
//
  "How can I add a child nameserver?": "To add a child nameserver, click the add child nameserver button below, fill in the registered domain for which you want to add child nameserver, Child Nameserver which you want to add and IP address which you want to associate with the Child Nameservers.",
//
  "How do I pull a domain?": "To pull a domain, initiate a domain transfer by obtaining the authorization code (EPP code) from the current registrar, unlocking the domain, and requesting the transfer to us by clciking on the transfer button below.",
//
  "What types of reports can I get?": "You can generate transaction reports, domain registration reports, expiration reports, and more from your account dashboard."
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

// Example of how to use fuse1 (predefinedAnswers) and fuse2 (allowedTopics)

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
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query is required.' });

  console.log('Received query:', query);
  const lowerQuery = normalizeQuery(query);
  const domainName = extractDomain(query);

  // Step 1: Check Predefined Answers with Fuse.js
  const predefinedResult = searchPredefinedAnswer(query);
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
        const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${process.env.API_KEY}&resellerId=${ResellerId}`;
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

  // ✅ New Condition: Check for Domain Registration
  const isRegisterQuery = lowerQuery.includes('register') || lowerQuery.includes('domain registration');

  if (isRegisterQuery) {
    return res.json({
      success: true,
      triggerDomainSection: true,
      answer: 'I can assist you with domain registration. Please visit the register domain name section to proceed.',
    });
  }

  const isTransferQuery = lowerQuery.includes('transfer') || lowerQuery.includes('domain transfer');

  if (isTransferQuery) {
    return res.json({
      success: true,
      triggerDomainSection: true,
      answer: 'I can assist you with domain transfer. Please visit the transfer domain name section to proceed.',
    });
  }

// Check for Domain Information or Specific Registration Date Request
if (domainName && (lowerQuery.includes('domain information') || lowerQuery.includes('details of the domain') || lowerQuery.includes('when was this domain registered'))) {
  console.log('[DOMAIN-QUERIES] 📝 Domain information requested for:', domainName);
  try {
      const response = await axios.get(
          `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain`,
          {
              params: {
                  APIKey: process.env.CONNECT_RESELLER_API_KEY,
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


if (domainName && (lowerQuery.includes('enable theft protection') || lowerQuery.includes('disable theft protection'))) {
  console.log(`🔐 [${new Date().toISOString()}] Theft protection request detected for: ${domainName}`);

  const enable = lowerQuery.includes('enable');
  const result = await manageTheftProtection(domainName, enable);
  return res.json(result);
}

if (domainName && (lowerQuery.includes('enable privacy protection') || lowerQuery.includes('disable privacy protection'))) {
  console.log(`🛡️ [${new Date().toISOString()}] Privacy protection request detected for: ${domainName}`);

  const enable = lowerQuery.includes('enable');
  const result = await managePrivacyProtection(domainName, enable);
  return res.json(result);
}

// Check for Domain Lock/Unlock in Chatbot Queries
if (domainName && (query.toLowerCase().includes('lock ') || query.toLowerCase().includes('unlock '))) {
  console.log('[DOMAIN-QUERIES] 🔒 Domain lock/unlock requested for:', domainName);

  const lock = query.toLowerCase().includes('lock');
  const unlock = query.toLowerCase().includes('unlock');

  if (!lock && !unlock) {
      return res.json({
          success: false,
          answer: 'Please specify whether you want to lock or unlock the domain.',
      });
  }

  try {
      const result = await manageDomainLock(domainName, lock);
      return res.json(result);
  } catch (error) {
      console.error('[DOMAIN-QUERIES] ❌ Error managing domain lock:', error.message);
      return res.status(500).json({
          success: false,
          message: 'Failed to update domain lock status.',
      });
  }
}

// ✅ Detect Balance Inquiry
if (lowerQuery.includes("current balance") || lowerQuery.includes("available funds")) {
  if (!req.session || !req.session.email) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
  }

  try {
      let resellerId;

      // 🔍 Hardcoded ResellerId for testing
      if (req.session.email === "aichatbot@iwantdemo.com") {
          resellerId = 15272;
      } else {
          // 🔍 Fetch ResellerId from Firebase using UserName (email)
          const usersRef = admin.firestore().collection("Client");
          const querySnapshot = await usersRef.where("UserName", "==", req.session.email).get();

          if (querySnapshot.empty) {
              return res.status(404).json({ success: false, message: "ResellerId not found." });
          }

          resellerId = querySnapshot.docs[0].data().clientId; // Assuming `clientId` is the ResellerId
      }

      // 🌍 Fetch balance from ConnectReseller API
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/availablefund?APIKey=${process.env.API_KEY}&resellerId=${resellerId}`;
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
      console.error("Error fetching balance:", error);
      return res.status(500).json({ success: false, message: "Error fetching balance." });
  }
}

if (domainName && (lowerQuery.includes('suspend ') || lowerQuery.includes('unsuspend '))) {
  console.log('[DOMAIN-QUERIES] 🚦 Domain suspend/unsuspend requested for:', domainName);
  const isSuspend = lowerQuery.includes('suspend');
  const result = await manageDomainSuspension(domainName, isSuspend);
  return res.json(result);
}

if (domainName) {
  try {
    const whoisData = await whois(domainName);
    if (lowerQuery.includes('name servers')) {
      return res.json({ success: true, answer: `Name servers for ${domainName}: ${whoisData.nameServers || 'Not available'}` });
    }
    if (lowerQuery.includes('registration date')) {
      return res.json({ success: true, answer: `Domain ${domainName} was registered on: ${whoisData.creationDate || 'Not available'}` });
    }
  } catch (error) {
    console.error('WHOIS lookup failed:', error);
  }
}

  // Step 3: Check if the query is domain-related using Fuse.js
  const isDomainRelated = fuse2.search(query).length > 0;

  if (!isDomainRelated) {
    return res.status(400).json({ success: false, message: 'Please ask only domain-related questions.' });
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
        headers: { Authorization: `Bearer ${process.env.COHERE_API_KEY}` }
      }
    );
    return res.json({ success: true, answer: cohereResponse.data.generations[0]?.text || 'No response' });
  } catch (error) {
    console.error('Cohere API error:', error);
  }

  return res.status(400).json({ success: false, message: 'Unable to process your request.' });
});

const dns = require('dns').promises;

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


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
