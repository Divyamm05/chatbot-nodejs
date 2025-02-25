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

const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf-8'));

// Firebase Admin setup
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

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
  "What features does this platform offer?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",
  "What are the features of this platform?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",
  "What are the key features of this platform?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",
  "What does this platform offer?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",
  "What features can I use on this platform?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",

  "What can this chatbot do?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",
  "What all can this chatbot do?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",
  "What is this chatbot capable of?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",
  "What can I do with this chatbot?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",
  "What can the chatbot do for me?": "This platform helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.",

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
  
  "How can I search for a domain name?": "To search for a domain name, start by using domain registration platforms like GoDaddy, Namecheap, or Google Domains. These services offer search tools where you can enter your desired name, and they will show availability. You can also explore variations if your first choice is already taken, and they often suggest alternatives. Some tools even provide insights into the domain's potential for search engine optimization (SEO). Once you find an available domain, you can proceed to purchase and register it.",
  "Where can I check for domain availability?": "To search for a domain name, start by using domain registration platforms like GoDaddy, Namecheap, or Google Domains. These services offer search tools where you can enter your desired name, and they will show availability. You can also explore variations if your first choice is already taken, and they often suggest alternatives. Some tools even provide insights into the domain's potential for search engine optimization (SEO). Once you find an available domain, you can proceed to purchase and register it.",
  "How to check if a domain is available?": "To search for a domain name, start by using domain registration platforms like GoDaddy, Namecheap, or Google Domains. These services offer search tools where you can enter your desired name, and they will show availability. You can also explore variations if your first choice is already taken, and they often suggest alternatives. Some tools even provide insights into the domain's potential for search engine optimization (SEO). Once you find an available domain, you can proceed to purchase and register it.",
  "How do I find a good domain name for my website?": "To search for a domain name, start by using domain registration platforms like GoDaddy, Namecheap, or Google Domains. These services offer search tools where you can enter your desired name, and they will show availability. You can also explore variations if your first choice is already taken, and they often suggest alternatives. Some tools even provide insights into the domain's potential for search engine optimization (SEO). Once you find an available domain, you can proceed to purchase and register it.",
  
  "What details are required to register a domain?": "To register a domain, you need to provide the domain name, registration duration (in years), whois protection preference, primary and secondary name servers (ns1, ns2), and a customer ID. Additional optional details include third and fourth name servers (ns3, ns4) and a language code for IDN domains. If registering a .us domain, you must also provide the purpose of registration (e.g., business, personal, educational) and nexus category (e.g., US citizen, US organization). Once all required details are submitted, the domain will be successfully registered.",
  "What information is needed to buy a domain?": "To register a domain, you need to provide the domain name, registration duration (in years), whois protection preference, primary and secondary name servers (ns1, ns2), and a customer ID. Additional optional details include third and fourth name servers (ns3, ns4) and a language code for IDN domains. If registering a .us domain, you must also provide the purpose of registration (e.g., business, personal, educational) and nexus category (e.g., US citizen, US organization). Once all required details are submitted, the domain will be successfully registered.",
  
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
  "Is there a fee for signing up?": "No, signing up is free of charge.",
  "How secure is my information?": "We follow industry-standard security practices to protect your data.",
  "Does your platform provide an API for domain management?": "Absolutely! Our platform offers a comprehensive API for seamless domain management. You can explore the full API documentation here: <a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='color: white; bold'><b>API Documentation</b></a>.",
  "What integrations are supported?": "Our API supports a wide range of integrations. For detailed information on all available integrations, please refer to our API documentation: <a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='color: white; bold'><b>API Documentation</b></a>.",
  "How can I get more details about the API?": "You can find all the details, including endpoints, integration guidelines, and examples, in our API documentation: <a href='https://www.connectreseller.com/resources/downloads/CR_API_Document_V7.pdf' target='_blank' style='color: white; bold'><b>API Documentation</b></a>.",
  "How can I contact support?": '<a href="https://www.connectreseller.com/contact-us/" style="color: white; font-weight: bold; text-decoration: none;">CLICK HERE</a> to contact us.',
  "Can I get a demo of the platform?": 'Yes, we offer demos upon request. <a href="https://www.connectreseller.com/contact-us/" style="color: white; font-weight: bold; text-decoration: none;">CLICK HERE</a> to reach out to our support team.',
  "Is there a guide for new users?": "Yes! Signing up with us gives you access to a helpful onboarding guide, along with the latest offers on our extensive selection of TLDs.",
  "What payment methods are supported?": "We accept credit/debit cards, and other popular payment methods.",
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

const checkDomainAvailability = async (domainName) => {
  try {
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkdomainavailable?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&websiteName=${domainName}`;
      
      console.log('🔍 Checking Domain Availability:', url);
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });

      console.log('✅ Domain Availability Response:', response.data);
      return response.data;
  } catch (error) {
      console.error('❌ Error during domain availability check:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || error.message };
  }
};


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

app.get('/api/register-domain', async (req, res) => {
  let params = { ...req.query };

  console.log("🔍 Received Params:", params);

  try {
      // Check domain availability first
      const availabilityResponse = await checkDomainAvailability(params.Websitename);

      if (availabilityResponse?.responseMsg?.statusCode === 400 || !availabilityResponse?.responseData?.available) {
          return res.json({
              success: false,
              message: "Domain is not available for registration."
          });
      }

      if (params.Id === '15272' || (req.session && req.session.email === 'aichatbot@iwantdemo.com')) {
          console.log("🔄 Using Client ID directly as Id for API request.");
          params.Id = 223855;
      }

      params.clientId = params.Id;

      const response = await domainRegistrationService(params);

      console.log('✅ Domain Registration Response:', response);

      if (response?.responseMsg?.statusCode === 200) {
          res.json({ success: true, message: "Domain registered successfully!" });
      } else {
          res.json({
              success: false,
              message: response?.responseMsg?.message || "Domain registration failed."
          });
      }
  } catch (error) {
      console.error('❗ Error during domain registration API call:', error.message);
      res.status(500).json({ success: false, message: "Internal Server Error" });
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

      // 🔴 Log the full error response to capture the actual reason for failure
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

    try {
        if (params.Id === '15272' || (req.session && req.session.email === 'aichatbot@iwantdemo.com')) {
            console.log("🔄 Using Client ID directly as Id for API request.");
            params.Id = 223855;
        }

        params.clientId = params.Id;
        const response = await renewDomainService(params);

        console.log('✅ Domain Renewal Response:', response);

        if (response?.responseMsg?.statusCode === 200) {
            res.json({
                success: true,
                message: "Domain renewed successfully!",
                expiryDate: response?.responseData?.expiryDate
            });
        } else {
            res.json({
                success: false,
                message: response?.responseMsg?.message || "Domain renewal failed."
            });
        }
    } catch (error) {
        console.error('❗ Error during domain renewal API call:', error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
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

  req.session.email = email.trim().toLowerCase(); // ✅ Always store email in lowercase

  // ✅ Tester & AI Chatbot Bypass Logic
  if (req.session.email === "tester@abc.com" || req.session.email === "aichatbot@iwantdemo.com") {
    req.session.otpVerified = true; // ✅ Mark as verified without OTP
    return res.json({ 
        success: true, 
        otpRequired: false 
    });
  }

  try {
    const usersRef = db.collection('Client');
    const query = await usersRef.where('UserName', '==', req.session.email).get();

    if (query.empty) {
      return res.status(404).json({ 
        success: false, 
        message: `Email not found in our records.  
<a href="https://india.connectreseller.com/signup" style="color: white; font-weight: bold; text-decoration: none;">CLICK HERE</a> to sign up for the India panel.  
<a href="https://global.connectreseller.com/signup" style="color: white; font-weight: bold; text-decoration: none;">CLICK HERE</a> to sign up for the Global panel.
Or enter your registered email id to continue. ` 
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 60000);

    const otpRef = db.collection('otp_records').doc(req.session.email);
    await otpRef.set({ otp, expires_at: expiresAt }, { merge: true });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.session.email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It is valid for 1 minute.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ 
      success: true, 
      message: 'OTP sent to your email address.', 
      otpRequired: true 
    });
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
app.post('/api/verify-otp', logSession, async (req, res) => {
  const { otp, email } = req.body;

  if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
      const lowerCaseEmail = email.toLowerCase();

      if (lowerCaseEmail === 'aichatbot@iwantdemo.com') {
          // 🔍 Check if OTP is required for chatbot email
          const otpRef = db.collection('otp_records').doc(email);
          const otpDoc = await otpRef.get();

          if (!otpDoc.exists || otpDoc.data().otp !== otp || otpDoc.data().expires_at.toDate() < new Date()) {
              return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
          }

          req.session.verified = true;
          req.session.customerId = '223855';

          return res.json({
              success: true,
              message: 'Test user authenticated successfully.',
              customerId: '223855',
          });
      }

      // Normal OTP verification for other users
      const otpRef = db.collection('otp_records').doc(email);
      const otpDoc = await otpRef.get();

      if (!otpDoc.exists || otpDoc.data().otp !== otp || otpDoc.data().expires_at.toDate() < new Date()) {
          return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      }

      req.session.verified = true;

      // 🔍 Fetch clientId from Client table using email as UserName
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
    const prompt = `Suggest 10 unique and professional domain names related to "${domain}". The names should be brandable, suitable for a legitimate business, and easy to remember. Use common domain extensions such as .com, .net, and .co. Avoid using numbers, hyphens, or generic words. The suggestions should reflect the type of business represented by the term "${domain}". Please give only the domain names, no extra information. The domain names should be unique so that they are available to register. Do not use hyphens in suggesting domain names`;

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

// Predefined answers
const predefinedAnswers  = {
  "How do I register a domain?": "You can register a domain by searching for an available name on our platform, selecting the desired TLD, and completing the registration process by providing your details and making a payment.",
  
  "How can I renew a domain?": "To seamlessly renew your domain name, just click the button below! I'll take you straight to the domain renewal section.",
  
  "How to transfer IN/OUT domains?": "To transfer a domain in, you need to unlock it at the current registrar and obtain the EPP code. For outgoing transfers, ensure your domain is unlocked and retrieve the authorization code.",
  
  "Where can I register domains?": "You can register domains directly on our platform or use domain registrars like GoDaddy, Namecheap, or Google Domains.",
  
  "List of domain registrars?": "Popular domain registrars include GoDaddy, Namecheap, Google Domains, Dynadot, and NameSilo.",
  
  "Where can I view the domain information?": "You can view domain information in your account's domain management section or use a WHOIS lookup tool.",
  
  "List of high-value domain TLDs?": "High-value TLDs include .com, .net, .org, .ai, .io, .xyz, and .co.",
  
  "Suggest TLDs for 'selected category'?": "Popular TLDs vary by category. For tech, use .tech or .ai. For businesses, use .biz or .company. For personal use, try .me or .name.",
  
  "What actions can I do here on the chatbot?": "You can check domain availability, get domain suggestions and ask domain related queries.",
  
  "How to lock/unlock a domain?": "Go to your domain management panel, find the lock settings, and toggle between lock and unlock.",
  
  "How to enable/disable privacy protection?": "Navigate to your domain settings and toggle the privacy protection option as needed.",
  
  "How to enable/disable theft protection?": "You can enable or disable theft protection from your domain management panel under security settings.",
  
  "I want to view the auth code for 'Domain Name'?": "You can find the auth code in your domain management panel under transfer settings.",
  
  "What are the name servers for this 'Domain Name'?": "The name servers for your domain can be viewed in your domain management dashboard under DNS settings.",
  
  "When was this 'Domain Name' registered?": "Domain registration details, including the registration date, can be found in the domain management section or a WHOIS lookup tool.",
  
  "What is my current balance in my account?": "You can check your balance in the billing section of your account.",
  
  "Check available funds": "Log in to your account and navigate to the billing section to check your available funds.",
  
  "I want to update the name servers for 'Domain Name'?": "Go to your domain management panel, find DNS settings, and update the name servers accordingly.",
  
  "I want API documentation?": "You can find API documentation in the developer section of our website.",
  
  "I need API for 'Action Name'": "Our API supports various domain management actions. Refer to the API documentation for specific endpoints.",
  
  "Need transaction report of 'Selected Month'": "You can generate and download transaction reports from the billing or reports section of your account.",
  
  "Which domains are getting expired?": "You can check expiring domains in the domain management section under the expiration tab.",
  
  "Which domains are getting deleted on this 'Selected Date/Month'?": "You can view scheduled deletions in the domain management section under the deletion schedule.",
  
  "Which domains were registered on this platform?": "You can find a list of registered domains in your account under domain management.",
  
  "Which domain was registered on 'Selected Date/Month'?": "Check your domain registration history in the account panel or request a report for a specific date range.",
  
  "How can I contact support?": "You can contact support through our support page or email us at support@domainplatform.com.",
  
  "What ongoing offers are available?": "Check the promotions or offers section on our website for the latest discounts and deals.",
  
  "Types of SSL?": "We offer various SSL certificates, including Domain Validation (DV), Organization Validation (OV), and Extended Validation (EV) SSL.",
  
  "From where can I sign up?": "You can sign up at our registration page: <a href='https://example.com/signup'>CLICK HERE</a>.",
  
  "I want to download the WHMCS module": "You can download the WHMCS module from our developer tools section.",
  
  "Export 'List Name'": "You can export domain-related lists from your account dashboard under the reports or export section.",
  
  "How to suspend/unsuspend any domain?": "You can suspend or unsuspend a domain from the domain management section by selecting the suspension settings.",
  
  "Suspend/Unsuspend the 'Domain Name'": "Go to your domain settings and toggle the suspension status as needed.",
  
  "How can I move a domain?": "You can move a domain by initiating a transfer request and following the domain transfer process.",
  
  "How to add a child nameserver?": "Navigate to your DNS settings and add a child nameserver by specifying the IP address and hostname.",
  
  "How to pull a domain?": "A domain pull can be initiated from your registrar account under the transfer or migration section.",
  
  "What type of reports can I get?": "You can generate transaction reports, domain registration reports, expiration reports, and more from your account dashboard."
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

  // Step 2: Check WHOIS-related Queries if No Predefined Answer
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
