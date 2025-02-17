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

  // ✅ Tester Bypass Logic
  if (req.session.email === "tester@abc.com") {
    req.session.otpVerified = true; // ✅ Skip OTP for tester
    return res.json({ success: true, message: "Tester login - OTP bypassed." });
  }

  try {
    const usersRef = db.collection('users');
    const query = await usersRef.where('email', '==', req.session.email).get();

    if (query.empty) {
      return res.status(404).json({ 
        success: false, 
        message: `Email not found in our records.  
<a href="https://india.connectreseller.com/signup" style="color: white; font-weight: bold; text-decoration: none;">CLICK HERE</a> to sign up for the India panel.  
<a href="https://global.connectreseller.com/signup" style="color: white; font-weight: bold; text-decoration: none;">CLICK HERE</a> to sign up for the Global panel.
Or enter your registered email id to continue. ` 
      });
    }

    const userDoc = query.docs[0];

    // ✅ Generate OTP (skipped for tester)
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 60000);

    const otpRef = db.collection('otp_records').doc(req.session.email);
    await otpRef.set({ otp, expires_at: expiresAt }, { merge: true });

    // ✅ Send OTP Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.session.email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It is valid for 1 minute.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent to your email address.' });
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

// Verify OTP and proceed to domain section
app.post('/api/verify-otp', logSession, async (req, res) => {
  const { otp } = req.body;
  const email = req.session.email;

  if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  if (email === 'tester@abc.com') {
      req.session.verified = true;
      req.session.userState = 'awaiting_domain_name';
      return res.json({
          success: true,
          message: 'Logged in as tester, skipping OTP verification.',
          options: [
              { text: 'Get Domain Name Suggestions', action: 'getDomainSuggestions' },
              { text: 'More Options', action: 'askMoreOptions' },
          ],
      });
  }

  try {
      // Firestore query to check OTP validity
      const otpRef = db.collection('otp_records').doc(email);
      const otpDoc = await otpRef.get();

      if (!otpDoc.exists || otpDoc.data().otp !== otp || otpDoc.data().expires_at.toDate() < new Date()) {
          return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      }

      req.session.verified = true; 
      req.session.userState = 'awaiting_domain_name';

      res.json({
          success: true,
          message: 'OTP verified successfully. Please choose one of the following options:',
          options: [
              { text: 'Get Domain Name Suggestions', action: 'getDomainSuggestions' },
              { text: 'More Options', action: 'askMoreOptions' },
          ],
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
const predefinedAnswers = {
  "how to enable/disable privacy protection": "Privacy protection hides your contact details from WHOIS. Log in to your registrar, go to Domain Management, and enable/disable the WHOIS Privacy setting.",
  "how to disable privacy protection": "Privacy protection hides your contact details from WHOIS. Log in to your registrar, go to Domain Management, and enable/disable the WHOIS Privacy setting.",
  "how to enable privacy protection": "Privacy protection hides your contact details from WHOIS. Log in to your registrar, go to Domain Management, and enable/disable the WHOIS Privacy setting.",
  "steps to enable/disable privacy protection": "Privacy protection hides your contact details from WHOIS. Log in to your registrar, go to Domain Management, and enable/disable the WHOIS Privacy setting.",
  "steps to enable privacy protection": "Privacy protection hides your contact details from WHOIS. Log in to your registrar, go to Domain Management, and enable/disable the WHOIS Privacy setting.",
  "steps to disable privacy protection": "Privacy protection hides your contact details from WHOIS. Log in to your registrar, go to Domain Management, and enable/disable the WHOIS Privacy setting.",
  "how to enable/disable theft protection": "Theft protection prevents unauthorized transfers. Log in to your registrar, go to Domain Management, find the Theft Protection setting, and enable/disable it.",
  "how to disable theft protection": "Theft protection prevents unauthorized transfers. Log in to your registrar, go to Domain Management, find the Theft Protection setting, and enable/disable it.",
  "how to enable theft protection": "Theft protection prevents unauthorized transfers. Log in to your registrar, go to Domain Management, find the Theft Protection setting, and enable/disable it.",
  "steps to enable/disable theft protection": "Theft protection prevents unauthorized transfers. Log in to your registrar, go to Domain Management, find the Theft Protection setting, and enable/disable it.",
  "steps to disable theft protection": "Theft protection prevents unauthorized transfers. Log in to your registrar, go to Domain Management, find the Theft Protection setting, and enable/disable it.",
  "steps to enable theft protection": "Theft protection prevents unauthorized transfers. Log in to your registrar, go to Domain Management, find the Theft Protection setting, and enable/disable it.",
  "what actions can i do here on chatbot" :"This chatbot helps with domain name suggestions, domain availability checks, and domain-related queries.",
  "what can this chatbot do":"This chatbot helps with domain name suggestions, domain availability checks, and domain-related queries."
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

  
  // Step 1: Check Predefined Answers
  if (predefinedAnswers[lowerQuery]) {
    return res.json({ success: true, answer: predefinedAnswers[lowerQuery] });
  }

  // Step 2: Check for WHOIS-related Queries
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

  // Step 3: Use Cohere API for Allowed Topics
  const queryParts = lowerQuery.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const validParts = queryParts.filter(part => fuse2.search(part).length > 0);

  if (validParts.length > 0) {
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
  }

  return res.status(400).json({ success: false, message: 'Please ask only domain-related questions.' });
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
