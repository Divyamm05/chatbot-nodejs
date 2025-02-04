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

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Session timeout duration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Session setup
app.use(session({
  secret: 'your_secret_key',  // Use a secret key to sign the session ID cookie
  resave: false,              // Don't resave the session if it hasn't changed
  saveUninitialized: true,    // Save uninitialized sessions (required for new sessions)
  cookie: { secure: false },  // Set to `true` in production with HTTPS
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
  req.session.verified = true;  // Skips OTP
  req.session.userState = 'awaiting_domain_name'; // Set user state as needed

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

  req.session.email = email;

  try {
    const usersRef = db.collection('users');
    const query = await usersRef.where('email', '==', email).get(); // Query to match email field

    if (query.empty) {
      return res.status(404).json({ success: false, message: "Email not found in our records." });
    }

    const userDoc = query.docs[0]; // Access the first matching document

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 60000); // OTP expiration time (1 minute)

    const otpRef = db.collection('otp_records').doc(email);
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

  // If the user is a tester, skip OTP verification
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

      req.session.verified = true; // Set verification flag
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

// Get domain name suggestions
// Get domain name suggestions
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
    const prompt = `Suggest 10 unique and professional domain names related to "${domain}". The names should be brandable, suitable for a legitimate business, and easy to remember. Use common domain extensions such as .com, .net, and .co. Avoid using numbers, hyphens, or generic words. The suggestions should reflect the type of business represented by the term "${domain}". Please give only the domain names, no extra information. The domain names should be unique so that they are available to register`;

    // 1. Generate domain name suggestions using Cohere API
    const getDomainSuggestions = async () => {
      const response = await axios.post(
        COHERE_API_URL,
        {
          model: 'command',
          prompt: prompt,
          max_tokens: 500,
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
        .split('\n') // Split by new line
        .map((s) => cleanDomainName(s)) // Clean the text (remove numbers or extra characters)
        .filter((s) => s.match(/\.\w{2,}$/)); // Keep only valid domain names with extensions

      return suggestions;
    };

    let availableDomains = [];
    let attempts = 0;

    // Loop until we find 5 available domains or stop after 20 attempts
    while (availableDomains.length < 5 && attempts < 20) {
      console.log(`Attempt #${attempts + 1} to find available domains...`);

      // Generate domain suggestions
      const suggestions = await getDomainSuggestions();
      console.log('Generated suggestions:', suggestions);

      // Check availability for each domain suggestion using WHOIS
      const availableSuggestions = await checkDomainsAvailability(suggestions);

      // Add unique available domains
      availableDomains = [...new Set([...availableDomains, ...availableSuggestions])];

      if (availableDomains.length < 5) {
        attempts++;
        console.log(`Not enough available domains found. Attempting to generate new suggestions...`);
      }
    }

    // If we couldn't find 5 available domains after 20 attempts
    if (availableDomains.length < 5) {
      return res.status(500).json({
        success: false,
        message: 'Unable to find 5 available domain names. Please try again later.',
      });
    }

    // Format the output with <br /> for proper line breaks
    const formattedDomains = availableDomains
      .map((domain) => `${domain} - ✅ Available`)
      .join('<br />');

    // Return the formatted domains
    res.json({
      success: true,
      domains: formattedDomains,
    });

  } catch (error) {
    console.error('Error generating domain suggestions:', error.response?.data || error.message || error);
    res.status(500).json({ success: false, message: 'Error generating domain suggestions.' });
  }
});



// Domain Name Related Queries
// Handle domain name related queries

app.post('/api/domain-queries', async (req, res) => {
  const { query } = req.body;
  console.log('Received query:', query);

  if (!query) {
    return res.status(400).json({ success: false, message: 'Query is required.' });
  }

  // 🔹 Allowed domain-related topics
  const allowedTopics = [
    'domain', 'website', 'hosting', 'DNS', 'SSL', 'WHOIS', 'web development', 
    'domain registration', 'SEO', 'online presence', 'how to register a domain name', 
    'domain name registration', 'buy a domain', 'domain name process', 'domain transfer',
    'how do domains work', 'domain pricing', 'best domain registrars',
    'how to buy a domain', 'difference between domain and hosting', 'domain expiration',
    'renew a domain', 'free domain services', 'custom domain for website'
  ];

  const fuse = new Fuse(allowedTopics, { includeScore: true, threshold: 0.5 });

  // 🔹 Break the query into meaningful parts (handling same-sentence loophole)
  const queryParts = query.toLowerCase()
    .split(/[\.\?\!\,\;]+|\band\b|\bor\b|\balso\b|\bthen\b|\bafter that\b|\bwhile\b/)
    .map(part => part.trim())
    .filter(Boolean);

  console.log("🧐 Query Parts:", queryParts);

  // 🔹 Strict Check: *All* parts must be domain-related
  let validParts = 0;
  let invalidParts = 0;

  queryParts.forEach(part => {
    const results = fuse.search(part);
    if (results.length > 0) {
      validParts++;
    } else {
      invalidParts++;
    }
  });

  if (validParts === 0 || invalidParts > 0) {
    console.log("❌ Query contains non-domain topics. Rejecting.");
    return res.status(400).json({
      success: false,
      message: 'Please ask only domain-related questions. Separate non-domain queries.'
    });
  }

  try {
    console.log('✅ Querying Cohere API with:', query);

    const cohereResponse = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command',
        prompt: `Provide a detailed and comprehensive answer to this domain-related query: "${query}". Include step-by-step instructions, examples, and explanations if applicable.`,
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    console.log('✅ Cohere API Response:', JSON.stringify(cohereResponse.data, null, 2));

    const generatedAnswer = cohereResponse.data.generations?.[0]?.text || 'Sorry, I could not generate an answer at this time.';

    res.json({
      success: true,
      answer: generatedAnswer
    });

  } catch (error) {
    console.error('❌ Error generating response from Cohere:', error);
    res.status(500).json({ success: false, message: 'Error generating response. Please try again later.' });
  }
});
// Domain Availability Check
// Domain Availability Check using only WHOIS

app.post('/api/check-domain-availability', logSession, checkSession, async (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).json({ success: false, message: 'Domain name is required.' });
    }

    try {
        const response = await axios.get(`https://www.whoisxmlapi.com/whoisserver/WhoisService`, {
            params: {
                apiKey: 'process.env.WHOIS_XML_API_KEY',  // Replace with your WhoisXML API key
                domainName: domain,
                outputFormat: 'json',
            },
        });

        const whoisData = response.data.WhoisRecord;

        // Check if domain is available
        if (whoisData.domainAvailability === "AVAILABLE") {
            return res.json({
                success: true,
                message: `The domain ${domain} is available!`,
            });
        }

        return res.json({
            success: false,
            message: `The domain ${domain} is already taken.`,
        });

    } catch (error) {
        console.error('WHOIS API Error:', error);
        return res.status(500).json({ success: false, message: 'Error checking domain availability.' });
    }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});