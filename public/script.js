function requestOTP() {
    const email = document.getElementById("user-email").value.trim();

    if (!email) {
        updateChatLog('Please enter a valid email address.', 'bot');
        return;
    }

    fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById("email-section").style.display = "none";

            if (data.otpRequired) {
                // Show OTP input section if OTP is required
                document.getElementById("otp-section").style.display = "block";
                updateChatLog('OTP has been sent to your email address. Please check your inbox.', 'bot');
            } else {
                // Directly handle authenticated state (No message shown)
                handleAuthenticatedUser();
            }
        } else {
            updateChatLog(data.message, 'bot');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        updateChatLog('An error occurred while requesting OTP. Please try again.', 'bot');
    });
}

function handleAuthenticatedUser() {
    // Show the User Query Section without any message
    document.getElementById('otp-section').style.display = 'none';
    document.getElementById('login-chat-section').style.display = 'flex';
    document.getElementById('sidebar-content').style.display = 'none';
    document.getElementById('faq-post-login').style.display = 'flex';
    
    isSignedIn = true;
    localStorage.setItem('isSignedIn', 'true');
    localStorage.setItem('customerId', '223855'); // Fixed ID for bypassed test users
    updateAuthUI();
}

  
  // Resend OTP 
  async function resendOTP() {
    const email = document.getElementById('user-email').value.trim();
    if (!email) {
      updateChatLog('Please enter a valid email to resend the OTP.', 'bot');
      return;
    }
  
    updateChatLog(`Resending OTP to ${email}...`, 'bot');
  
    try {
      const response = await fetch('/api/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
  
      if (data.success) {
        updateChatLog('OTP has been resent successfully. Please check your email.', 'bot');
      } else {
        updateChatLog(`Failed to resend OTP: ${data.message || 'Unknown error'}`, 'bot');
      }
    } catch (error) {
      console.error('Error during OTP resend:', error);
      updateChatLog('An error occurred while resending OTP. Please try again later.', 'bot');
    }
  }
  

  // Verify OTP and proceed to domain section
  let isSignedIn = localStorage.getItem('isSignedIn') === 'true'; // Ensure it's stored persistently

// OTP Verification Function
async function verifyOTP() {
const email = document.getElementById('user-email').value.trim();
const otpInput = document.getElementById('otp-code');
const otp = otpInput ? otpInput.value.trim() : '';

if (!email) {
    updateChatLog('Please enter your email to proceed.', 'bot');
    return;
}

// Prepare request payload
const bodyData = { email, otp };

if (email !== 'aichatbot@iwantdemo.com' && !otp) {
    updateChatLog('Please enter the OTP to proceed.', 'bot');
    return;
}

try {
    const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
    });

    const data = await response.json();

    if (data.success) {
        isSignedIn = true;
        localStorage.setItem('isSignedIn', 'true');

        // Use customerId (resellerId) from the response
        if (data.customerId) {
            localStorage.setItem('customerId', data.customerId);
            console.log("💾 Customer ID stored:", data.customerId);
        } else {
            console.error("⚠️ No customer ID received in response");
            localStorage.removeItem('customerId');
        }

        clearchatlog();

        updateChatLog(data.message || 'OTP verified successfully!', 'bot');

        document.getElementById('otp-section').style.display = 'none';
        document.getElementById('login-chat-section').style.display = 'flex';
        document.getElementById('sidebar-content').style.display = 'none';
        document.getElementById('faq-post-login').style.display = 'flex';

        updateChatLog("Thank you for signing in! You're all set to explore our advanced features, including domain registration, renewal, transfer, and so much more.", 'bot');

        updateAuthUI();
    } else {
        console.error("❌ OTP Verification Failed:", data.message);
        updateChatLog(data.message || 'OTP verification failed. Please try again.', 'bot');
    }
} catch (error) {
    console.error("❗ Error during OTP verification:", error);
    updateChatLog('An error occurred during OTP verification. Please try again later.', 'bot');
}
}

function toggleAssistantLogo(show) {
  const assistantLogo = document.getElementById("assistant-logo");
  
  if (show) {
    assistantLogo.classList.remove("hidden");
  } else {
    assistantLogo.classList.add("hidden");
  }
}

document.getElementById('toggle-sidebar').addEventListener('click', function () {
  document.getElementById('sidebar').classList.toggle('active');
});


// Function to toggle the chatbox visibility
function toggleChatbox() {
  const chatContainer = document.getElementById('chat-container');

  if (chatContainer.style.opacity === "0" || chatContainer.style.opacity === "") {
    // Show chatbox with transition
    chatContainer.style.display = "flex"; // Ensure it's visible before transition
    requestAnimationFrame(() => {
      chatContainer.style.transition = "opacity 0.3s ease-in-out, transform 0.4s ease-in-out";
      chatContainer.style.opacity = "1";
      chatContainer.style.transform = "scale(1)";
    });
  } else {
    // Hide chatbox smoothly
    chatContainer.style.transition = "opacity 0.3s ease-in-out, transform 0.4s ease-in-out";
    chatContainer.style.opacity = "0";
    chatContainer.style.transform = "scale(0.9)";

    // Wait for transition to complete before hiding
    setTimeout(() => {
      chatContainer.style.display = "none";
    }, 400); // Match transition time
  }
}



// Function to close the chatbox
function closeChatbox() {
  const chatbox = document.getElementById('chatbox');
  const chatContainer = document.getElementById('chat-container');

  chatbox.classList.add('minimized');
  chatbox.classList.remove('visible');

  chatContainer.classList.add('minimized');
  chatContainer.classList.remove('visible');

}


    window.addEventListener('load', () => {
      const emailVerified = localStorage.getItem('emailVerified');
      if (emailVerified === 'true') {
        document.getElementById('resend-otp').style.display = 'block';
      }
    });

    function updateChatLog(message, sender) {
      console.log("updateChatLog called:", message);
      const chatLog = document.querySelector('.chat-log');

      const lastMessage = chatLog.lastElementChild?.textContent;
      if (lastMessage === message) return;

      const newMessage = document.createElement('div');
      newMessage.className = sender === 'bot' ? 'bot-message message' : 'user-message message';

      if (message === "Generating domain names...") {
          newMessage.innerHTML = `<span>${message}</span> <div class="loading-spinner"></div>`;
      } else {
          newMessage.innerHTML = message.replace(/\n/g, "<br>");
      }

      chatLog.appendChild(newMessage);

  }

  function taketosigninsection() {
    const emailSection = document.getElementById('email-section');
    const userinputSection = document.getElementById('user-input-section');
    const chatLog = document.getElementById('chat-log'); // Get the chat log element

    // Toggle the visibility of the email section
    if (emailSection.style.display === 'none' || emailSection.style.display === '') {
        // Show the email section
        emailSection.style.display = 'flex';
        userinputSection.style.display = 'none';

        // Clear the chat log
        chatLog.innerHTML = ''; // This will remove all messages in the chat log
        
        // Add a new message asking for email ID
        const emailMessage = document.createElement('div');
        emailMessage.classList.add('message', 'bot-message');
        emailMessage.textContent = 'Please enter your registered email id to continue. ';
        chatLog.appendChild(emailMessage);
    } else {
        // Hide the email section
        emailSection.style.display = 'none';
    }
}
const chatInput = document.getElementById("domain-query-text");

function updateChatLog(message, sender) {
  console.log("updateChatLog called:", message);
  
  const chatLog = document.querySelector('.chat-log');
  if (!chatLog) {
      console.error("Chat log element not found.");
      return;
  }

  const newMessage = document.createElement('div');
  newMessage.className = sender === 'bot' ? 'bot-message message' : 'user-message message';

  if (message === "Generating domain names...") {
      newMessage.innerHTML = `<span>${message}</span> <div class="loading-spinner"></div>`;
  } else {
      newMessage.innerHTML = message.replace(/\n/g, "<br>");
  }

  chatLog.appendChild(newMessage);

  // Check if user is signed in
  const isUserSignedIn = localStorage.getItem('isSignedIn') === 'true';

  // Ensure CSS for buttons is added only once
  if (!document.getElementById('register-domain-css')) {
      const style = document.createElement('style');
      style.id = 'register-domain-css';
      style.innerHTML = `
          .register-button, .transfer-button, .available-button, .update-button, .renew-button {
              padding: 10px 10px;
              font-family: 'Inter', sans-serif;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              border: none;
              color: #2c3e50;
              border-radius: 20px;
              background-color: #f1c40f;
              transition: background-color 0.3s ease;
              margin-top: 12px;
              display: block;
              width: 100%;
              text-align: center;
          }
          .register-button:hover, .transfer-button:hover, .available-button:hover, .update-button:hover, .renew-button:hover {
              background-color: #d4ac0d;
          }
          .button-container {
              width: 100%;
              display: block;
              margin-top: 10px;
          }
      `;
      document.head.appendChild(style);
  }

  function addButton(buttonText, className, sectionId) {
      const button = document.createElement('button');
      button.textContent = buttonText;
      button.classList.add(className);

      button.onclick = () => {
          const section = document.getElementById(sectionId);
          const loginChatSection = document.getElementById('login-chat-section');
          if (section) {
              section.style.display = "block";
              loginChatSection.style.display = "none";
          }
      };

      const buttonContainer = document.createElement('div');
      buttonContainer.classList.add('button-container');
      buttonContainer.appendChild(button);

      newMessage.appendChild(buttonContainer);
  }

  // Register a domain
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.includes("register a domain") ||
       message.includes("To register a domain, navigate to the 'Register Domain' section") ||
       message.includes("You can register domains directly through this chatbot")) &&
      !message.includes("To register a domain, you need to provide the domain name")
  ) {
      addButton("Register a Domain", "register-button", "domain-registration-section");
  }

  // Transfer a domain
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.includes("transfer a domain") || message.includes("domain transfer") || message.includes("To transfer a domain to us")) &&
      !message.includes("Yes, you can transfer your domains") &&
      !message.includes("Thank you for signing in!")
  ) {
      addButton("Transfer a Domain", "transfer-button", "domain-transfer-section");
  }

  // Check domain availability
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.includes("Check domain availability") || message.includes("domain availability") || message.includes("I can help you with checking domain availability!")) &&
      !message.includes("This platform helps with domain registration, transferring domain name")
  ) {
      addButton("Check Domain Availability", "available-button", "domain-availability-section");
  }

  // Update name servers
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.includes("update the name servers") || message.includes("update name servers") || message.includes("I can help you update your name servers!"))
  ) {
      addButton("Update Name Servers", "update-button", "name-server-update-section");
  }

  // Renew a domain
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.toLowerCase().includes("renew a domain") || message.includes("To seamlessly renew your domain name"))
  ) {
      addButton("Renew a Domain", "renew-button", "domain-renewal-section");
  }

  // Show auth buttons if response matches predefined responses
  if (sender === 'bot' && checkBotResponse(message)) {
      if (authButtonsContainer) {
          chatLog.appendChild(authButtonsContainer);
          authButtonsContainer.style.display = 'flex';
          scrollToAuthButtons();
      } else {
          console.warn("authButtonsContainer is undefined");
      }
  } else if (authButtonsContainer) {
      authButtonsContainer.style.display = 'none';
  }

  // Show suggest buttons if response matches domain suggestions
  if (sender === 'bot' && checkDomainSuggestions(message)) {
      if (suggestButtonsContainer) {
          chatLog.appendChild(suggestButtonsContainer);
          suggestButtonsContainer.style.display = 'flex';
      } else {
          console.warn("suggestButtonsContainer is undefined");
      }
  } else if (suggestButtonsContainer) {
      suggestButtonsContainer.style.display = 'none';
  }

  // Call scrollToBottom only once
  scrollToBottom();
}


window.onload = updateAuthUI;

function getBotResponse(userInput) {
  const response = predefinedAnswers[userInput];

  if (typeof response === "object" && response !== null) {
      // Extract message and button details properly
      return `${response.message} <br><button class="chat-button" onclick="window.location.href='${response.button.link}'">${response.button.text}</button>`;
  } else if (typeof response === "string") {
      return response; // Return plain string responses
  } else {
      return "I'm sorry, I don't have an answer for that.";
  }
}


  const chatLog = document.getElementById('chat-log');
const authButtonsContainer = document.getElementById('auth-buttons-container');

const observer = new MutationObserver(() => {
  const botMessages = chatLog.querySelectorAll('.bot-message');
  const lastBotMessage = botMessages[botMessages.length - 1]?.textContent;

  // Check if the last bot message matches any of the predefined responses
  checkBotResponse(lastBotMessage);
});

observer.observe(chatLog, { childList: true });

function scrollToAuthButtons() {
  const authButtonsContainer = document.getElementById("auth-buttons-container");
  if (authButtonsContainer) {
      authButtonsContainer.scrollIntoView({ behavior: "smooth", block: "end" });
  }
}

function checkBotResponse(response) {
  const botMessages = [
      "To perform this action, you need to sign up. Create an account today to gain access to our platform and manage your domains effortlessly. Take control of your domain portfolio now!",
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!",
      "Please login/signup to access all the features.",
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!",
      "You can sign up by providing your email and setting up an account with us.",
      "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
      "Yes, an account is required for some advanced features.",
      "To create an account, click the Sign Up button and provide your basic details. If you are already registered, simply log in.",
      "Yes, we offer a comprehensive API for domain management. Signup/Login to access all features."
  ];

  scrollToBottom();

  return botMessages.includes(response);
}

function checkDomainRegistrationResponse(response) {
  const expectedResponse = "I can assist you with domain registration. Please visit the register domain name section to proceed.";

  return botMessages.includes(response);
}

const suggestButtonsContainer = document.getElementById('suggest-buttons-container');

let tooltip; // To keep track of the tooltip element

function fillChatInputWithPlaceholder(template) {
  const chatInput = document.getElementById('domain-query-text');
  const submitButton = document.getElementById('submitDomainQuery');
  const inputSection = document.getElementById('login-chat-section');
  const placeholder = 'mydomain.com';
  const toggleContainer = document.getElementById('theft-protection-toggle-container'); // Fixed reference
  const lockToggleContainer = document.getElementById('domain-lock-toggle-container'); 
  const suspendToggleContainer = document.getElementById('domain-suspend-toggle-container');

  chatInput.value = template;
  chatInput.focus();

  // Find the placeholder position and select it
  const startPos = template.indexOf(placeholder);
  if (startPos !== -1) {
      const endPos = startPos + placeholder.length;
      chatInput.setSelectionRange(startPos, endPos);
  }


  // Show toggle container if theft protection is requested
  if (template.includes('Enable/disable theft protection')) {
    toggleContainer.style.display = 'flex'; // Show toggle switch
    submitButton.style.width = '15%';
    submitButton.style.backgroundColor = '#f1c40f';
} else {
    toggleContainer.style.display = 'none'; // Correct way to hide
}
console.log("Toggle Container:", toggleContainer);
console.log("Current Display Style:", toggleContainer.style.display);

  const domainMatch = template.match(/lock\/unlock (\S+)/i);
    if (domainMatch) {
        const domain = domainMatch[1];
        lockToggleContainer.style.display = 'flex';
        fetchDomainLockStatus(domain); // Fetch and update toggle state
    } else {
        lockToggleContainer.style.display = 'none';
    }

    if (template.includes('Enable/disable theft protection')) {
        toggleContainer.style.display = 'flex';
        submitButton.style.width = '15%';
        submitButton.style.backgroundColor = '#f1c40f';
    } else {
        toggleContainer.style.display = 'none';
    }

    // Toggle visibility for Domain Suspend/Unsuspend
    const domainSuspendMatch = template.match(/suspend\/unsuspend (\S+)/i);
    if (domainSuspendMatch) {
        const domain = domainSuspendMatch[1];
        suspendToggleContainer.style.display = 'flex';
        fetchDomainSuspendStatus(domain); // Placeholder function to fetch suspend status
    } else {
        suspendToggleContainer.style.display = 'none';
    }

  // Tooltip handling
  if (startPos !== -1) {
      if (tooltip) tooltip.remove();
      tooltip = document.createElement('div');
      tooltip.textContent = 'Enter your domain name here';
      tooltip.className = 'tooltip';

      const hiddenSpan = document.createElement('span');
      hiddenSpan.style.visibility = 'hidden';
      hiddenSpan.style.whiteSpace = 'pre';
      hiddenSpan.style.font = window.getComputedStyle(chatInput).font;
      hiddenSpan.textContent = template.substring(0, startPos);
      document.body.appendChild(hiddenSpan);

      const rect = chatInput.getBoundingClientRect();
      const inputStyle = window.getComputedStyle(chatInput);
      const paddingLeft = parseInt(inputStyle.paddingLeft);

      tooltip.style.top = (window.scrollY + rect.top - 30) + 'px';
      tooltip.style.left = (window.scrollX + rect.left + hiddenSpan.offsetWidth - 40) + 'px';
      
      document.body.appendChild(tooltip);
      hiddenSpan.remove();
  }
}


    function hideTooltipOnInput() {
        if (tooltip) {
            tooltip.classList.add('hidden');
            setTimeout(() => {
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                }
            }, 200);
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        const chatInput = document.getElementById('domain-query-text');
        chatInput.addEventListener('input', hideTooltipOnInput);
    });


function toggleFAQSidebar() {
    const faqSidebar = document.getElementById('faq-sidebar');
    const chatbox = document.getElementById('chatbox');

    if (faqSidebar.classList.contains('faq-expanded')) {
        // Collapse the sidebar
        faqSidebar.classList.remove('faq-expanded');
        faqSidebar.classList.add('faq-collapsed');
        
        // Reset chatbox to full width and original position
        chatbox.style.maxWidth = '850px';

    } else {
        // Expand the sidebar
        faqSidebar.classList.add('faq-expanded');
        faqSidebar.classList.remove('faq-collapsed');
        
        // Narrow chatbox and shift it left to make room for sidebar
        chatbox.style.maxWidth = '650px';
        chatbox.style.transform = 'translateX(-200px)';
    }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("collapsed");
}

// Fill Chat Input with FAQ Question
function fillChatInput(question) {
  const userInput = document.getElementById("user-question");
  const userInput2 = document.getElementById("domain-query-text");
  userInput.value = question;
  userInput2.value = question;
  userInput.focus();
}


// Check if MutationObserver is already initialized
if (!window.observer) {
  window.observer = new MutationObserver(() => {
    const botMessages = chatLog.querySelectorAll('.bot-message');
    const lastBotMessage = botMessages[botMessages.length - 1]?.textContent;

    // Check if the last bot message matches any of the predefined responses
    checkdomainsuggestions(lastBotMessage);
  });

  window.observer.observe(chatLog, { childList: true });
}



const domainLockToggle = document.getElementById('domain-lock-toggle');
domainLockToggle.addEventListener('change', async function() {
    const domain = document.getElementById('domain-input').value.trim();
    if (!domain) {
        updateChatLog('Please enter a domain first.', 'bot');
        return;
    }
    
    const isLocked = this.checked;
    console.log(`🔄 Sending lock/unlock request: Domain=${domain}, Lock=${isLocked}`);

    try {
        const response = await fetch(`/api/manage-domain-lock?domain=${domain}&lock=${isLocked}`, { method: 'GET' });
        const result = await response.json();
        updateChatLog(result.message, 'bot');
    } catch (error) {
        console.error('❌ Error updating domain lock:', error);
        updateChatLog('Failed to update domain lock status', 'bot');
    }
});

// Fetch domain lock status when showing the toggle
async function fetchDomainLockStatus(domain) {
  try {
    const response = await fetch(`/api/manage-domain-lock?domain=${domain}`);
    const data = await response.json();
    if (data.success) {
        theftProtectionToggle.checked = data.isLocked;
        toggleContainer.style.display = "flex";
    } else {
        toggleContainer.style.display = "none";
    }
} catch (error) {
    console.error("Error fetching domain lock status:", error);
    toggleContainer.style.display = "none";
}
}
const theftProtectionToggle = document.getElementById("theft-protection-toggle");

let domainForTheftProtection = null;
let isTheftProtectionEnabled = false;
function handleTheftProtectionToggle(toggleElement) {
    let domain = document.getElementById('domain-query-text').value.trim();
    isTheftProtectionEnabled = toggleElement.checked;

    if (!domain) {
        updateChatLog('Please enter a valid domain before managing theft protection.', 'bot');
        toggleElement.checked = !isTheftProtectionEnabled;
        return;
    }

    // Sanitize input to avoid "Enable theft protection for domain.com" format issues
    const match = domain.match(/(?:enable|disable) theft protection for (\S+)/i);
    if (match) domain = match[1];

    console.log('🔒 Theft Protection Toggle:', { domain, isTheftProtectionEnabled });

    // Store domain and toggle state for later submission
    domainForTheftProtection = domain;
}

async function submitTheftProtectionRequest(domain, isEnabled) {
    try {
        console.log(`🔒 Submitting theft protection request for ${domain}. Enable: ${isEnabled}`);

        updateChatLog(`Requesting to ${isEnabled ? 'enable' : 'disable'} theft protection for ${domain}...`, 'bot');

        const response = await fetch(`/api/manage-theft-protection?domain=${encodeURIComponent(domain)}&enable=${isEnabled}`, {
            method: 'GET'
        });

        if (!response.ok) throw new Error(`Failed to update theft protection. Status: ${response.status}`);

        const result = await response.json();
        console.log('📨 Theft Protection API Response:', result);

        // Check for specific status codes
        if (result.responseMsg?.statusCode === 2306) {
            updateChatLog(`ℹ️ Theft protection is already enabled for ${domain}.`, 'bot');
            return;
        }
        if (result.responseMsg?.statusCode === 2305) {
            updateChatLog(`ℹ️ Theft protection is already disabled for ${domain}.`, 'bot');
            return;
        }

        updateChatLog(result.message || '✅ Operation completed.', 'bot');

    } catch (error) {
        console.error('❌ Error managing theft protection:', error);
        updateChatLog('⚠️ An error occurred while updating theft protection. Please try again.', 'bot');
    }
}

chatInput.addEventListener("input", () => {
  const domain = chatInput.value.trim();
  if (domain) fetchDomainLockStatus(domain);
});


chatInput.addEventListener("input", () => {
  const domain = chatInput.value.trim();
  if (domain) fetchDomainLockStatus(domain);
});


function checkDomainSuggestions(response) {
  console.log("📩 checkDomainSuggestions() called with:", response); // Debug log

  const botMessages = [
      "I can help you with domain suggestions! Please click domain name suggestions button."
  ];

  if (!suggestButtonsContainer) {
      console.error("❌ Element with ID 'suggest-buttons-container' not found.");
      return false;
  }

  // Normalize response
  const responseText = response ? response.toString().toLowerCase().trim().replace(/\s+/g, " ") : "";

  // Check if bot response includes the trigger message
  return botMessages.some(msg => responseText.includes(msg.toLowerCase()));
}

const domainAvailabilitySection = document.getElementById('domain-availability-section');

function checkDomainAvailability(response) {

  const botMessages = [
      "I can help you with checking domain availability! Please click check domain availability button."
  ];

  // Normalize response
  const responseText = response ? response.toString().toLowerCase().trim().replace(/\s+/g, " ") : "";

  // Check if bot response includes the trigger message
  return botMessages.some(msg => responseText.includes(msg.toLowerCase()));
}

function processUserQuestion() {
  const userQuestion = document.getElementById("user-question").value.trim();

  if (userQuestion) {
      // ✅ REMOVED: No more `faq-sidebar` in HTML, so this line is gone

      const chatLog = document.getElementById("chat-log");

      const userMessage = document.createElement('div');
      userMessage.className = 'message user-message';
      userMessage.innerHTML = `<span>${userQuestion}</span>`;
      chatLog.appendChild(userMessage);

      // Clear input field
      document.getElementById("user-question").value = "";

      // Call bot response function (make sure it exists)
      if (typeof handleBotResponse === "function") {
          handleBotResponse(userQuestion);
      } else {
          console.warn("handleBotResponse is not defined.");
      }
  }
}

document.getElementById("user-question").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent form submission (if inside a form)
        processUserQuestion();  // Trigger the button click function
    }
});

document.getElementById("domain-name").addEventListener("input", function () {
  const domain = this.value.toLowerCase();
  const usFields = document.querySelector(".us-domain-fields");
  const chatLog = document.querySelector(".chat-log");

  if (domain.endsWith(".us")) {
      usFields.style.display = "block"; // Show .us-specific fields
      chatLog.style.height = "50%"; // Reduce chat log height
  } else {
      usFields.style.display = "none"; // Hide .us-specific fields for other TLDs
      chatLog.style.height = "65%"; // Reset chat log height
  }
});

async function registerDomain() {
  const domainName = document.getElementById("domain-name").value.trim();
  const duration = document.getElementById("duration").value;

  if (!domainName || !duration) {
      alert("Please fill in all required fields.");
      return;
  }

  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
      alert("Please enter a valid domain name.");
      return;
  }

  const confirmationBox = document.createElement('div');
  confirmationBox.className = 'chat-confirmation-box';

  const content = document.createElement('div');
  content.className = 'confirmation-content';
  content.innerHTML = `<p>Do you want to register the domain <strong>${domainName}</strong>?</p>`;

  const yesButton = document.createElement('button');
  yesButton.innerText = 'Yes';
  yesButton.addEventListener('click', () => confirmRegistration(domainName, duration));

  const noButton = document.createElement('button');
  noButton.innerText = 'No';
  noButton.addEventListener('click', closeConfirmationBox);

  content.appendChild(yesButton);
  content.appendChild(noButton);
  confirmationBox.appendChild(content);
  document.body.appendChild(confirmationBox);

  disableChat(); // 🛑 Disable chat when the confirmation box is open
}

function confirmRegistration(domainName, duration) {
  closeConfirmationBox();

  // Keep chat disabled while processing
  disableChat(); 

  // Show "Processing..." message to indicate the request is in progress
  showChatPopup("Registering your domain, please wait...", false, true);

  fetch(`/api/register-domain?Websitename=${domainName}&Duration=${duration}&Id=15272`, { method: "GET" })
      .then(response => response.json())
      .then(result => {
          if (result.success) {
              showChatPopup("Domain registered successfully!", true); // Show success message
          } else {
              showChatPopup("Error: " + result.message, false); // Show error message
          }

          // 🆕 Close the domain renewal section
          document.getElementById('domain-registration-section').style.display = 'none';
          document.getElementById('login-chat-section').style.display = 'flex';
      })
      .catch(error => {
          console.error("❗ Unexpected error:", error);
          showChatPopup("Internal Server Error", false); // Show error message
      })
      .finally(() => {
          enableChat(); // 🟢 Re-enable chat regardless of success or failure
      });
}

function closeConfirmationBox() {
  const box = document.querySelector('.chat-confirmation-box');
  if (box) box.remove();
  enableChat(); // 🟢 Re-enable chat when the confirmation box is closed
}

function disableChat() {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
      chatContainer.style.pointerEvents = "none";
      chatContainer.style.opacity = "0.5";
  }
}

function enableChat() {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
      chatContainer.style.pointerEvents = "auto";
      chatContainer.style.opacity = "1";
  }
}

/* Add CSS for the confirmation box to match chatbot theme */
const style = document.createElement('style');
style.textContent = `
.chat-confirmation-box {
  position: fixed;
  bottom: 45%;
  right: 6%;
  background-color: #2d2d2d;
  color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
.confirmation-content p {
  margin-bottom: 10px;
}
.confirmation-content button {
margin: 5px;
    padding: 5px 10px;
    background-color: #f1c40f;
    color: #000000;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}
.confirmation-content button:hover {
  background-color: #45a049;
}
`;
document.head.appendChild(style);


// Function to verify OTP and auto-populate customerId
async function verifyOtpAndSetCustomerId(otp) {
  try {
      const response = await fetch('/api/verify-otp', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp })
      });

      const data = await response.json();
      console.log(data); // Debug: check if the response has resellerId

      if (data.success) {
          const customerIdInput = document.getElementById('customerId');
          if (customerIdInput) {
              customerIdInput.value = data.resellerId; // Set the value to resellerId
              customerIdInput.readOnly = true; // Make the input read-only
          }
      } else {
          console.error('OTP verification failed:', data.message);
      }
  } catch (error) {
      console.error('Error fetching customer ID:', error);
  }
}

// Function to handle domain transfer
// Function to handle domain transfer
async function transferDomain() {
  const domainName = document.getElementById('transfer-domain-name').value.trim();
  const authCode = document.getElementById('auth-code').value.trim();
  const isWhoisProtection = document.getElementById('transfer-whois-protection').value === 'yes';
  const customerId = localStorage.getItem('customerId') || '15272'; // Fallback to default customer ID

  // Validate input fields
  if (!domainName || !authCode) {
      alert('Please fill in all required fields.');
      return;
  }

  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
      alert('Please enter a valid domain name.');
      return;
  }

  if (!customerId) {
      alert('Customer ID is missing. Please sign in again.');
      return;
  }

  // Confirmation popup
  const confirmationBox = document.createElement('div');
  confirmationBox.className = 'chat-confirmation-box';

  const content = document.createElement('div');
  content.className = 'confirmation-content';
  content.innerHTML = `<p>Do you want to transfer the domain <strong>${domainName}</strong>?</p>`;

  const yesButton = document.createElement('button');
  yesButton.innerText = 'Yes';
  yesButton.addEventListener('click', () => confirmDomainTransfer(domainName, authCode, isWhoisProtection, customerId));

  const noButton = document.createElement('button');
  noButton.innerText = 'No';
  noButton.addEventListener('click', closeConfirmationBox);

  content.appendChild(yesButton);
  content.appendChild(noButton);
  confirmationBox.appendChild(content);
  document.body.appendChild(confirmationBox);

  disableChat(); // Disable chat while the confirmation box is open
}

// Function to confirm the domain transfer
async function confirmDomainTransfer(domainName, authCode, isWhoisProtection, customerId) {
  closeConfirmationBox(); // Close the confirmation box
  disableChat(); // Keep chat disabled while processing

  // Show "Processing..." popup
  showChatPopup("Initiating domain transfer, please wait...", false, true);

  try {
      const response = await fetch('/api/transfer-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domainName, authCode, isWhoisProtection, customerId }),
      });

      const result = await response.json();

      if (result.success) {
          showChatPopup("Domain transfer initiated successfully. Waiting for approval from losing registrar.", true);
      } else {
          showChatPopup(`Error: ${result.message}`, false);
      }

      // Close the domain transfer section and return to main chat
      document.getElementById('domain-transfer-section').style.display = 'none';
      document.getElementById('login-chat-section').style.display = 'flex';

  } catch (error) {
      console.error('❗ Unexpected error during domain transfer:', error);
      showChatPopup('An error occurred during domain transfer. Please try again later.', false);
  } finally {
      enableChat(); // Re-enable chat regardless of success or failure
  }
}

async function renewDomain() {
  const domainName = document.getElementById("renew-domain-name").value.trim();
  const duration = document.getElementById("renew-duration").value;

  if (!domainName || !duration) {
      alert("Please fill in all required fields.");
      return;
  }

  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
      alert("Please enter a valid domain name.");
      return;
  }

  disableChat();

  const confirmationBox = document.createElement('div');
  confirmationBox.className = 'chat-confirmation-box';

  const content = document.createElement('div');
  content.className = 'confirmation-content';
  content.innerHTML = `<p>Do you want to renew the domain <strong>${domainName}</strong> for ${duration} year(s)?</p>`;

  const yesButton = document.createElement('button');
  yesButton.innerText = 'Yes';
  yesButton.addEventListener('click', () => confirmRenewal(domainName, duration));

  const noButton = document.createElement('button');
  noButton.innerText = 'No';
  noButton.addEventListener('click', closeConfirmationBox);

  content.appendChild(yesButton);
  content.appendChild(noButton);
  confirmationBox.appendChild(content);
  document.body.appendChild(confirmationBox);
}

// Function to show a popup message in the chatbox
function showChatPopup(message, isSuccess = true, isProcessing = false) {
  const existingPopup = document.querySelector('.chat-popup-box');
  if (existingPopup) existingPopup.remove();

  const popupBox = document.createElement('div');
  popupBox.className = 'chat-popup-box';
  popupBox.classList.add(isSuccess ? 'success-popup' : 'error-popup');

  const popupContent = document.createElement('div');
  popupContent.className = 'popup-content';
  popupContent.innerHTML = `<p>${message}</p>`;

  if (!isProcessing) {
      const closeButton = document.createElement('button');
      closeButton.innerText = 'OK';
      closeButton.className = 'popup-close-btn';
      closeButton.addEventListener('click', () => popupBox.remove());
      popupContent.appendChild(closeButton);
  }

  popupBox.appendChild(popupContent);
  document.body.appendChild(popupBox);
}

function confirmRenewal(domainName, duration) {
  closeConfirmationBox();

  disableChat();
  showChatPopup("Renewing your domain, please wait...", false, true);

  setTimeout(() => {
      fetch(`/api/renew-domain?Websitename=${domainName}&Duration=${duration}&OrderType=2&IsWhoisProtection=false`, { method: "GET" })
          .then(response => response.json())
          .then(result => {
              enableChat(); 
              console.log("✅ Domain Renewal Response:", result);

              // 🟢 Using the 'success' field from the backend response directly
              if (result?.success) {
                  showChatPopup(`Domain <strong>${domainName}</strong> renewed successfully!`, true);
              } else {
                  showChatPopup(`Error: ${result?.message || 'Could not renew domain successfully.'}`, false);
              }

              // 🆕 Close the domain renewal section
              document.getElementById('domain-renewal-section').style.display = 'none';
              document.getElementById('login-chat-section').style.display = 'flex';
          })
          .catch(error => {
              enableChat(); 
              console.error("❗ Unexpected error:", error);
              showChatPopup("Internal Server Error", false);

              // 🆕 Same behavior on error
              document.getElementById('domain-renewal-section').style.display = 'none';
              document.getElementById('login-chat-section').style.display = 'flex';
          });
  }, 100); 
}


  async function handleBotResponse(userQuestion) {
    try {
      const response = await fetch('/ask-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userQuestion })
      });

      const data = await response.json();

      if (data.answer) {
        updateChatLog(data.answer, 'bot');
      } else {
        updateChatLog("Sorry, I don't have an answer for that question.", 'bot');
      }
    } catch (error) {
      console.error("Error sending question to backend:", error);
      updateChatLog("There was an error processing your question. Please try again.", 'bot');
    }
  }
  const loadingContainer = document.getElementById('loading-container');
  if (loadingContainer) {
      loadingContainer.style.display = 'none';  
  }

  function scrollToBottom() {
    const chatLog = document.querySelector('.chat-log');
    const container = document.getElementById("auth-buttons-container");

    if (!chatLog) {
        console.error("Chat log element not found.");
        return;
    }

    if (container && window.getComputedStyle(container).display !== "none") {
        // Small delay to ensure rendering updates
        setTimeout(() => {
            chatLog.scrollTop = chatLog.scrollHeight;
        }, 100);
    }
}

function showAuthButtons() {
    const container = document.getElementById("auth-buttons-container");

    if (container) {
        container.style.display = "block"; // Show the container
        setTimeout(scrollToBottom, 100); // Ensure chat scrolls after rendering
    }
}

    let userEmail = '';

// Function to clear the chat log
function clearchatlog() {
  const chatContainer = document.getElementById('chat-log');
  if (chatContainer) {
      chatContainer.innerHTML = ''; // Clear all chat messages
  }
}
  
    // Function to update UI after login
    function updateAuthUI() {
        const authContainer = document.getElementById('auth-buttons-container');
        if (isSignedIn && authContainer) {
            authContainer.style.display = 'none';
        }
    }
  

    function showInfo() {
      // Check if info box already exists
      let existingInfoBox = document.getElementById("info-box");
      if (existingInfoBox) {
        existingInfoBox.remove(); // Remove existing info box if clicked again
        return;
      }
    
    // Create info box
    let infoBox = document.createElement("div");
    infoBox.id = "info-box";
    infoBox.innerHTML = `
      <p>This chatbot helps with domain registration, transferring domain name, domain name suggestions, domain availability checks, and domain-related queries.</p>
      <button onclick="closeInfo()">OK</button>
    `;

    // Position the box near the info button
    let header = document.querySelector(".header");
    header.appendChild(infoBox);
  }
    
    // Function to close info box
    function closeInfo() {
      let infoBox = document.getElementById("info-box");
      if (infoBox) {
        infoBox.remove();
      }
    }

// Global variables
let nameServerCount = 1;
const maxNameServers = 13;

// Function to dynamically add name servers (up to 13)
function addNameServer() {
    if (nameServerCount >= maxNameServers) {
        alert("You can add up to 13 name servers only.");
        return;
    }

    nameServerCount++;
    const container = document.getElementById("nameserver-container");

    const inputDiv = document.createElement("div");
    inputDiv.className = "ns-input"; 
    inputDiv.innerHTML = `<input type="text" id="nameserver${nameServerCount}" placeholder="Enter Name Server ${nameServerCount}" required>`;

    container.appendChild(inputDiv);
}

// Function to update name servers
async function updateNameServers() {
    const domainName = document.getElementById("domain-name-input").value;
    if (!domainName) {
        document.getElementById("update-status").innerHTML = "❌ Please enter a domain name.";
        return;
    }

    let nameServers = [];
    for (let i = 1; i <= nameServerCount; i++) {
        const ns = document.getElementById(`nameserver${i}`).value;
        if (ns) nameServers.push(ns);
    }

    if (nameServers.length === 0) {
        document.getElementById("update-status").innerHTML = "❌ Please enter at least one name server.";
        return;
    }

    const domainNameId = await getDomainId(domainName);
    if (!domainNameId) {
        document.getElementById("update-status").innerHTML = "❌ Domain not found.";
        return;
    }

    const apiKey = "<Your_API_Key>"; 
    let apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/UpdateNameServer?APIKey=${apiKey}&domainNameId=${domainNameId}&websiteName=${domainName}`;

    nameServers.forEach((ns, index) => {
        apiUrl += `&nameServer${index + 1}=${ns}`;
    });

    try {
        const response = await fetch(apiUrl, { method: "GET" });
        const data = await response.json();

        document.getElementById("update-status").innerHTML = data.statusCode === 200 
            ? "✅ Name servers updated successfully!" 
            : "❌ Failed: " + data.message;

    } catch (error) {
        document.getElementById("update-status").innerHTML = "❌ Error updating name servers.";
        console.error(error);
    }
}

// Dummy function to simulate fetching domain ID
async function getDomainId(domainName) {
    return 1; // Replace with actual API call if needed
}

// Function to handle "Back" button
function goBackToQuerySection() {
    document.getElementById("name-server-update-section").style.display = "none";
    alert("Going back to the previous section...");
}

  
    // Show domain section for domain input
    function showDomainSection() {
      document.getElementById('domain-options').style.display = 'none'; 
      document.getElementById('login-chat-section').style.display = 'none';
      document.getElementById('domain-section').style.display = 'flex';
      document.getElementById('domain-options-next').style.display = 'none'; 
      document.getElementById('more-options').style.display = 'none'; 
      updateChatLog('Please enter a domain name for suggestions.', 'bot');
    }

    // Get domain suggestions from the API
    async function getDomainSuggestions() {
    const email = document.getElementById('user-email').value.trim();
    const domain = document.getElementById('domain-name-suggestions').value.trim();

    if (!domain) {
        updateChatLog('Please enter a domain name.', 'bot');
        return;
    }

    updateChatLog(`Domain entered: ${domain}`, 'user');
    updateChatLog('Generating domain names...', 'bot'); 

    try {
        const response = await fetch('/api/domain-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, domain }),
        });
        const data = await response.json();

        const chatLog = document.querySelector('.chat-log');
        const lastMessage = chatLog.lastElementChild;
        if (lastMessage && lastMessage.textContent.includes("Generating domain names...")) {
            chatLog.removeChild(lastMessage);
        }

        if (!data.success) {
            updateChatLog(data.message || 'An error occurred while fetching domain suggestions. Please try again.', 'bot');
            return;
        }

        updateChatLog(data.domains, 'bot');

        // Hide domain input section
        document.getElementById('domain-section').style.display = 'none';

        // Append domain options next section to chat log
        const domainOptions = document.getElementById('domain-options-next');
        domainOptions.style.display = 'flex'; // Make it visible
        document.getElementById('login-chat-section').style.display = 'flex'; 
        chatLog.appendChild(domainOptions); // Add to chat log

        scrollToBottom();
    } catch (error) {
        updateChatLog('An error occurred while fetching domain suggestions. Please try again.', 'bot');
    }
}

function goBackToQuerySection() {
  console.log("Navigating back to query section...");

  // Show the query section
  document.getElementById('login-chat-section').style.display = 'flex';
  console.log("login-chat-section is now visible");

  // Hide the other sections
  const sectionsToHide = ['domain-section', 'domain-options', 'domain-options-next', 'domain-registration-section' , 'domain-transfer-section' , 'domain-renewal-section' , 'domain-availability-section' , ];

  sectionsToHide.forEach(sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.style.display = 'none';
      console.log(`Hid section: ${sectionId}`);
    } else {
      console.log(`Element not found: ${sectionId}`);
    }
  });
}


  // Function to check if the page is scrolled to the bottom and scroll to the bottom if necessary
  function scrollToBottom() {
      const lastMessage = document.querySelector('.message:last-child');  
      if (lastMessage) {
          lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });  
      }
  }

  function goBackToPreviousSection() {
      document.getElementById('domain-section').style.display = 'none';

      document.getElementById('domain-options').style.display = 'flex'; 
  }

  function goBackTouserinputsection() {
    document.getElementById('email-section').style.display = 'none';
    

    document.getElementById('user-input-section').style.display = 'flex';
    document.getElementById('initial-message').style.display = 'flex';  
  }

    function getMoreSuggestions() {
      logButtonPress('More Suggestions');
      updateChatLog('Fetching more suggestions for the same domain...', 'bot');
      getDomainSuggestions(); 
    }

    // Get suggestions for a different domain
    function getNewDomainSuggestions() {
      logButtonPress('Get New Domain Suggestions');
      document.getElementById('domain-name-suggestions').value = ''; 
      document.getElementById('domain-section').style.display = 'flex'; 
      document.getElementById('domain-options-next').style.display = 'none';
      document.getElementById('login-chat-section').style.display = 'none'; 
      updateChatLog('Please enter a new domain name for suggestions.', 'bot');
    }

    // Check Domain Availability
    function submitDomainCheck() {
      logButtonPress('Check Domain Availability');
      document.getElementById("more-options").style.display = "none";
      document.getElementById("domain-options").style.display = "none";
      const domainSection = document.getElementById('domain-availability-section');
      const domainInput = document.getElementById('domain-name-availability');
      const submitDomainButton = document.getElementById('check-domain-availability');

  if (domainSection.style.display === 'none') {
    domainSection.style.display = 'flex';
    domainInput.focus(); 
    updateChatLog('Please enter a domain name to check its availability.', 'bot');
    return;
  }

      const domain = domainInput.value.trim();

      if (!domain) {
        updateChatLog('Please enter a valid domain name.', 'bot');
        return;
      }

      updateChatLog(`Domain entered: ${domain}`, 'user');

      fetch('/api/check-domain-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            updateChatLog(`✅ Domain is available: ${data.message}`, 'bot');
          } else {
            updateChatLog(`❌ Domain is not available: ${data.message}`, 'bot');
          }
        })
        .catch(() => {
          updateChatLog('An error occurred while checking domain availability. Please try again.', 'bot');
        });

      domainInput.value = '';
    }

    function checkDomainAvailability() {
      const domainAvailabilitySection = document.getElementById('domain-availability-section');
      const domainAvailabilityInput = document.getElementById('domain-query-input'); // Corrected ID
      const checkDomainButton = document.getElementById('check-domain-availability'); // Corrected ID
      const backToDomainButton = document.getElementById('back-to-domain-section');

      domainAvailabilitySection.style.display = 'block';

      const domainToCheck = domainAvailabilityInput.value.trim();

      if (!domainToCheck) {
          updateChatLog('Please enter a domain name to check its availability.', 'bot');
          return;
      }

      updateChatLog(`Domain to check: ${domainToCheck}`, 'user');

      fetch('/api/check-domain-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: domainToCheck }),
      })
      .then((response) => response.json())
      .then((data) => {
          if (data.success) {
              updateChatLog(`✅ Domain is available: ${data.message}`, 'bot');
          } else {
              updateChatLog(`❌ Domain is not available: ${data.message}`, 'bot');
          }
      })
      .catch(() => {
          updateChatLog('An error occurred while checking domain availability. Please try again.', 'bot');
      });

      backToDomainButton.style.display = 'inline-block';

      domainAvailabilityInput.value = '';
  }

    
    function goBackToMoreOptions() {
      document.getElementById('domain-availability-section').style.display = 'none';
      document.getElementById('more-options').style.display = 'flex'; 
    }

    // Ask for more options
    function askMoreOptions() {
      logButtonPress('Ask More Options');
      document.getElementById("domain-options").style.display = "none";
      document.getElementById("domain-options-next").style.display = "none";
      document.getElementById("get-domain-suggestions-btn").style.display = "none";
      document.getElementById("more-options-btn").style.display = "none";
      document.getElementById("more-options").style.display = "flex"; // Show more options
      updateChatLog('Please choose one of the following options:', 'bot');
    }

    // Close "More Options" and reset buttons
  function closeMoreOptions() {
      document.getElementById("more-options").style.display = "none";
      document.getElementById("domain-section").style.display = "none";
      document.getElementById("domain-options").style.display = "flex"; 
      
      document.getElementById("get-domain-suggestions-btn").style.display = "block";
      document.getElementById("more-options-btn").style.display = "block";

      const domainAvailabilitySection = document.getElementById('domain-availability-section');
      const domainNameAvailability = document.getElementById('domain-name-availability');

      if (domainAvailabilitySection) {
          domainAvailabilitySection.style.display = 'none'; 
      }
      
      if (domainNameAvailability) {
          domainNameAvailability.value = ''; 
      }

      updateChatLog('What would you like to do next?', 'bot');
  }


  function showDomainQueries() {
    const elementsToHide = ["domain-options", "domain-options-next", "more-options", "more-options-btn"];
    elementsToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    const chatLog = document.querySelector('.chat-log');
    if (!chatLog) {
      console.log("Chat log not found");
      return;
    }

    const queryMessage = document.createElement('div');
    queryMessage.className = 'bot-message message';
    queryMessage.innerHTML = 'Please enter your domain-related question:';
    chatLog.appendChild(queryMessage);
    chatLog.scrollTop = chatLog.scrollHeight;

    const domainQuerySection = document.getElementById('domain-query-section');
    if (domainQuerySection.style.display === 'none' || domainQuerySection.style.display === '') {
      domainQuerySection.style.display = 'flex';
    }

    const domainQueryInput = document.getElementById('domain-query-text');
    if (domainQueryInput) {
      domainQueryInput.focus();
    }
  }

// Store the suspension state and domain globally
let domainToSuspend = null;
let isDomainSuspend = false;

// Function to handle the toggle switch for domain suspension
function handleDomainSuspendToggle(toggleElement) {
    let domain = document.getElementById('domain-query-text').value.trim();
    isDomainSuspend = toggleElement.checked;

    if (!domain) {
        updateChatLog('Please enter a valid domain before managing suspension.', 'bot');
        toggleElement.checked = !isDomainSuspend;
        return;
    }

    // Sanitize input to avoid "suspend domain.com" format issues
    const match = domain.match(/(?:suspend|unsuspend)\s+(\S+)/i);
    if (match) {
        domain = match[1]; // Extract only the domain name
    }

    console.log('🛠️ Toggle state updated:', { domain, isDomainSuspend });

    // Store the domain and toggle state for later submission
    domainToSuspend = domain;
}

// Function to make the API request for domain suspension/unsuspension
async function submitDomainSuspendRequest(domain, isDomainSuspend) {
    try {
        console.log(`Submitting suspension request for ${domain}. Suspend: ${isDomainSuspend}`);

        const response = await fetch(`/api/suspend-domain?domainName=${encodeURIComponent(domain)}&suspend=${isDomainSuspend}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to update domain suspend status. Status: ${response.status}`);
        }

        const result = await response.json();
        updateChatLog(result.message || 'Operation completed.', 'bot');

        const togglesuspendContainer = document.getElementById('domain-suspend-toggle-container');
        if (togglesuspendContainer) {
            togglesuspendContainer.style.display = 'none';
        }

    } catch (error) {
        console.error('Error with domain suspension request:', error);
        updateChatLog('An error occurred while processing your request.', 'bot');
    }
}

async function submitDomainQuery() {
    console.log("submitDomainQuery called"); 

    const queryInput = document.getElementById('domain-query-text');
    const queryText = queryInput.value.trim();

    if (!queryText) {
        updateChatLog("Please enter a valid query to proceed.", 'bot');
        return;
    }

    updateChatLog(`${queryText}`, 'user');

        // List of predefined domain-related queries
        const predefinedQueries = [
          "How do I register a domain?",
          "Where can I register domains?",
          "How can I renew a domain?",
          "How do I transfer IN/OUT domains?",
          "What is my current balance in my account?",
          "Give me the list of domain registrars.",
          "Give me a list of high-value domain TLDs?",
          "Can you suggest TLDs for a selected category?",
          "What actions can I do here on the chatbot?",
          "How do I enable/disable privacy protection?",
          "How can I view the auth code for a domain?",
          "What are the name servers for this domain?",
          "When was this domain registered?",
          "How can I check available funds?",
          "How can I update the name servers for a domain?",
          "Where can I find the API documentation?",
          "Where can I find API for action name?",
          "How can I get a transaction report for a selected month?",
          "Which domains are getting expired?",
          "Which domains are getting deleted on a selected date/month?",
          "Which domains were registered on this domain?",
          "Which domain was registered on a selected date/month?",
          "How can I contact support?",
          "What types of SSL are available?",
          "Where can I sign up?",
          "How can I download the WHMCS module?",
          "How do I export List Name?",
          "How do I suspend/unsuspend a domain?",
          "How can I move a domain?",
          "How can I add a child nameserver?",
          "How do I pull a domain?",
          "What types of reports can I get?"
      ];
  
      // If user query matches predefined questions, send it directly to /api/domain-queries
      if (predefinedQueries.includes(queryText)) {
          try {
              console.log('Sending predefined query to backend:', queryText);
              const response = await fetch('/api/domain-queries', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: queryText }),
              });
  
              if (!response.ok) {
                  throw new Error(`Failed to fetch data. Status: ${response.status}`);
              }
  
              const data = await response.json();
              console.log('Backend response:', data);
  
              if (data.success) {
                  updateChatLog(`${data.answer}`, 'bot');
                  queryInput.value = "";
              } else {
                  updateChatLog(`Error: ${data.message}`, 'bot');
              }
          } catch (error) {
              console.error("Error with fetch request:", error);
              updateChatLog("This chatbot can answer domain-related questions only", 'bot');
          }
          return;
      }

    // Handle domain information request
    const domainInfoMatch = queryText.match(/give me domain information for (.+)/i);
    if (domainInfoMatch) {
        const domainName = domainInfoMatch[1].trim();

        try {
            console.log('Fetching domain details for:', domainName);
            const response = await fetch(`/api/domain-info?domain=${encodeURIComponent(domainName)}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Domain details response:', data);

            if (data.success) {
                console.log('Domain data:', data.domainData); 
                updateChatLog(
                    `Domain Information for ${domainName}: ${JSON.stringify(data.domainData, null, 2)}`, 
                    'bot'
                );
            } else {
                updateChatLog(`${data.message}`, 'bot');
            }          

        } catch (error) {
            console.error("Error fetching domain details:", error);
            updateChatLog("Unable to fetch domain details at this time.", 'bot');
        }

        document.getElementById("domain-query-text").value = "";

        return;
    }

    const balanceMatch = queryText.match(/what is my current balance in my account/i);
if (balanceMatch) {
    try {
        updateChatLog(`Fetching your current balance...`, 'bot');
        
        const response = await fetch(`/api/balance`, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Failed to fetch balance. Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            updateChatLog(`${result.answer}`, 'bot');
        } else {
            updateChatLog(`Error: ${result.message}`, 'bot');
        }

    } catch (error) {
        console.error('Error fetching balance:', error);
        updateChatLog('Failed to retrieve balance information', 'bot');
    }

    return;
}

    // Handle theft protection request only if stored domain exists
if (domainForTheftProtection !== null) {
    await submitTheftProtectionRequest(domainForTheftProtection, isTheftProtectionEnabled);
    domainForTheftProtection = null; // Reset after submission
    return;
}


// Handle domain suspension request if the toggle was changed
if (domainToSuspend !== null) {
  await submitDomainSuspendRequest(domainToSuspend, isDomainSuspend);
  domainToSuspend = null; // Reset after submission
  return;
}

const domainLockMatch = queryText.match(/(lock|unlock) (.+)/i);
if (domainLockMatch) {
    const action = domainLockMatch[1].toLowerCase(); // "lock" or "unlock"
    const domain = domainLockMatch[2].trim();
    const isDomainLocked = action === 'lock';

    console.log(`🔍 Detected action: ${action}, Domain: ${domain}, Lock State: ${isDomainLocked}`); // Debugging line

    try {
        const actionText = isDomainLocked ? 'Locking' : 'Unlocking';
        updateChatLog(`${actionText} the domain ${domain}...`, 'bot');
      
        const response = await fetch(`/api/manage-domain-lock?domain=${domain}&lock=${isDomainLocked}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Failed to update domain lock status. Status: ${response.status}`);
        }

        const result = await response.json();
        updateChatLog(result.message, 'bot');

    } catch (error) {
        console.error('Error managing domain lock:', error);
        updateChatLog('Failed to update domain lock status', 'bot');
    }

    return;
}

    // Fallback to existing backend query handling
    try {
        console.log('Sending query to backend:', queryText);

        const response = await fetch('/api/domain-queries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryText }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Backend response:', data);

        if (data.success) {
            if (data.answer) {
                updateChatLog(`${data.answer}`, 'bot');
                queryInput.value = "";
            }
        } else {
            updateChatLog(`Error: ${data.message}`, 'bot');
        }

    } catch (error) {
        console.error("Error with fetch request:", error);
        updateChatLog("This chatbot can answer domain-related questions only", 'bot');
    }
}

  function switchSection(newSectionId) {
    document.getElementById(newSectionId).scrollIntoView({ behavior: 'smooth' });
    updateChatLog(`Switched to ${newSectionId}`, 'bot'); 
  }



  document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      const activeElement = document.activeElement;

      if (activeElement && activeElement.tagName === 'INPUT') {
        const button = activeElement.closest('.chat-input').querySelector('button');
        if (button) {
          button.click();
        }
      }
    }
  });

document.addEventListener("keydown", function (event) {
    const authButtonsContainer = document.getElementById("auth-buttons-container");

    // Check if auth-buttons-container is visible
    if (authButtonsContainer.style.display !== "none") {
        const buttons = authButtonsContainer.querySelectorAll("button");

        // Find the currently focused button
        let currentIndex = Array.from(buttons).findIndex(btn => document.activeElement === btn);

        if (event.key === "ArrowDown") {
            event.preventDefault(); // Prevent scrolling
            let nextIndex = (currentIndex + 1) % buttons.length;
            buttons[nextIndex].focus();
        } else if (event.key === "ArrowUp") {
            event.preventDefault(); // Prevent scrolling
            let prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
            buttons[prevIndex].focus();
        } else if (event.key === "Enter" && currentIndex !== -1) {
            event.preventDefault(); // Prevent default form behavior
            buttons[currentIndex].click(); // Trigger button click
        }
    }
});


    function goBackToDomainSection() {
      const inputFieldContainer = document.querySelector('.query-input-container');
      if (inputFieldContainer) {
          inputFieldContainer.remove();
      }

      const domainAvailabilitySection = document.getElementById('domain-availability-section');
      if (domainAvailabilitySection) {
          domainAvailabilitySection.style.display = 'none';
      }

      const domainquerySection = document.getElementById('domain-query-section');
      if (domainquerySection) {
          domainquerySection.style.display = 'none';
      }

      const moreOptions = document.getElementById('more-options');
      if (moreOptions) {
          moreOptions.style.display = 'block';
          moreOptions.scrollIntoView({ behavior: 'smooth' }); 
      }
  }

  function goToOTPSection() {
    switchSection('otp-section'); 
    updateChatLog("Now in OTP section", 'bot');
  }

  function showDomainQuerySection() {
    document.getElementById('domain-query-section').style.display = 'flex';
  }

  function hideDomainQuerySection() {
    document.getElementById('domain-query-section').style.display = 'none';
  }

  document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        document.getElementById("submit-question").click();
    }
  });

  document.getElementById('back-to-previous-section').addEventListener('click', goBackToPreviousSection);

  document.getElementById('back-to-previous-section').addEventListener('click', goBackToPreviousSection);

document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); 
            
            console.log("Active Element ID: ", document.activeElement.id);

            // 🆕 Submit Chat Question
            if (document.activeElement.classList.contains('chat-input')) {
                console.log("Chat Input - Enter key pressed");
                document.getElementById("submit-question").click();
                return;
            }

            // 🆕 Submit Email for OTP
            if (document.activeElement.classList.contains('email-input')) {
                console.log("Email Input - Enter key pressed");
                document.getElementById("submit-email").click();
                return;
            }

            if (document.activeElement.id === "get-domain-suggestions-btn") {
                console.log("Get Domain Suggestions clicked...");
                document.getElementById("get-domain-suggestions-btn").click();
            } else if (document.activeElement.id === "more-options-btn") {
                console.log("More Options clicked...");
                document.getElementById("more-options-btn").click();
            }
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const buttons = Array.from(document.querySelectorAll("#domain-options button"));
            let currentIndex = buttons.findIndex((el) => el === document.activeElement);

            if (event.key === "ArrowDown") {
                currentIndex = (currentIndex + 1) % buttons.length;
            } else if (event.key === "ArrowUp") {
                currentIndex = (currentIndex - 1 + buttons.length) % buttons.length; 
            }

            console.log("Focusing element: ", buttons[currentIndex].id); 
            buttons[currentIndex].focus();  
        }
    });
});
