//---------------------------------------------------- Defining constants section ------------------------------------------------------//

const chatLog = document.getElementById('chat-log');
const authButtonsContainer = document.getElementById('auth-buttons-container');

const observer = new MutationObserver(() => {
const botMessages = chatLog.querySelectorAll('.bot-message');
const lastBotMessage = botMessages[botMessages.length - 1]?.textContent;

  // Check if the last bot message matches any of the predefined responses
checkBotResponse(lastBotMessage);
});

window.onload = updateAuthUI;
observer.observe(chatLog, { childList: true });
const chatInput = document.getElementById("domain-query-text");
const suggestButtonsContainer = document.getElementById('suggest-buttons-container');
const domainAvailabilitySection = document.getElementById('domain-availability-section');
let userEmail = '';
const loadingContainer = document.getElementById('loading-container');

//------------------------------------------- Request OTP, Resend and Verification Section --------------------------------------------//

// Show email verification section
function taketosigninsection() {
    const emailSection = document.getElementById('email-section');
    const userinputSection = document.getElementById('user-input-section');
    const chatLog = document.getElementById('chat-log'); 

    // Toggle the visibility of the email section
    if (emailSection.style.display === 'none' || emailSection.style.display === '') {
        // Show the email section
        emailSection.style.display = 'flex';
        userinputSection.style.display = 'none';

        // Clear the chat log
        chatLog.innerHTML = ''; 
        
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

// Request OTP
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
  
let isSignedIn = localStorage.getItem('isSignedIn') === 'true'; 

// Verify OTP
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

//Show sections after successful verification
function handleAuthenticatedUser() {
    document.getElementById('otp-section').style.display = 'none';
    document.getElementById('login-chat-section').style.display = 'flex';
    document.getElementById('sidebar-content').style.display = 'none';
    document.getElementById('faq-post-login').style.display = 'flex';
    
    isSignedIn = true;
    localStorage.setItem('isSignedIn', 'true');
    localStorage.setItem('customerId', '223855'); // Fixed ID for bypassed test users
    updateAuthUI();
}

//---------------------------------------------- Show and hide Chatbot, Sidebar Section -----------------------------------------------//

// Show chatbot
function toggleAssistantLogo(show) {
  const assistantLogo = document.getElementById("assistant-logo");
  
  if (show) {
    assistantLogo.classList.remove("hidden");
  } else {
    assistantLogo.classList.add("hidden");
  }
}

// Show/hide sidebar
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

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
}

//------------------------------------------ Update Chatlog for each functionality section --------------------------------------------//

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
          .register-button, .transfer-button, .available-button, .update-button, .renew-button, .child-ns-button {
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
          .register-button:hover, .transfer-button:hover, .available-button:hover, .update-button:hover, .renew-button:hover, .child-ns-button:hover {
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
      (message.includes("update the name servers") || message.includes("update name servers") || message.includes("Go to your domain management panel, find DNS settings, and update the name servers accordingly."))
  ) {
      addButton("Add Name Servers", "update-button", "name-server-update-section");
  }

  // Renew a domain
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.toLowerCase().includes("renew a domain") || message.includes("To seamlessly renew your domain name"))
  ) {
      addButton("Renew a Domain", "renew-button", "domain-renewal-section");
  }

  // Add child name servers
  if (
    sender === 'bot' && isUserSignedIn &&
    (message.includes("add a child name server") || message.includes("register child name server") || message.includes("To add a child nameserver, click the add child nameserver button below, fill in the registered domain for which you want to add child nameserver, Child Nameserver which you want to add and IP address which you want to associate with the Child Nameservers.")) &&
    !message.includes("Thank you for signing in!")
) {
    addButton("Add Child Nameservers", "child-ns-button", "add-child-name-server-section");
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

//------------------------------- Retrieve predefined response and format/show button if applicable section----------------------------//

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

//--------------------------------------------- Show auth buttons(Signup and login buttons) ------------------------------------------//
function scrollToAuthButtons() {
  const authButtonsContainer = document.getElementById("auth-buttons-container");
  if (authButtonsContainer) {
      authButtonsContainer.scrollIntoView({ behavior: "smooth", block: "end" });
  }
}

// Checks if the given bot response requires the need to show auth buttons(sign up or log in).
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

function showAuthButtons() {
    const container = document.getElementById("auth-buttons-container");

    if (container) {
        container.style.display = "block"; // Show the container
        setTimeout(scrollToBottom, 100); // Ensure chat scrolls after rendering
    }
}

// Function to update UI after authentication
function updateAuthUI() {
        const authContainer = document.getElementById('auth-buttons-container');
        if (isSignedIn && authContainer) {
            authContainer.style.display = 'none';
        }
}

//--------------------------------------------------- Domain registration Section -----------------------------------------------------//
function checkDomainRegistrationResponse(response) {
  const expectedResponse = "I can assist you with domain registration. Please visit the register domain name section to proceed.";

  return botMessages.includes(response);
}

//------------ Prefills chat input with a domain query, highlights the domain name placeholder, and show a tooltip section ------------//

// Fill Chat Input with FAQ Question
function fillChatInput(question) {
    const userInput = document.getElementById("user-question");
    const userInput2 = document.getElementById("domain-query-text");
    userInput.value = question;
    userInput2.value = question;
    userInput.focus();
  }  

//Highlight domain name placeholder for required functionalities
let tooltip;
function fillChatInputWithPlaceholder(template) {
  const chatInput = document.getElementById('domain-query-text');
  const submitButton = document.getElementById('submitDomainQuery');
  const inputSection = document.getElementById('login-chat-section');
  const placeholder = 'mydomain.com';
  const toggleContainer = document.getElementById('theft-protection-toggle-container'); // Fixed reference
  const lockToggleContainer = document.getElementById('domain-lock-toggle-container'); 
  const suspendToggleContainer = document.getElementById('domain-suspend-toggle-container');
  const privacyContainer = document.getElementById('domain-privacy-toggle-container')

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

    // Toggle visibility for Privacy Protection
    const privacyMatch = template.match(/privacy protection (\S+)/i);
    if (privacyMatch) {
    const domain = privacyMatch[1];
    privacyContainer.style.display = 'flex';
    fetchPrivacyProtectionStatus(domain); // Fetch privacy protection status
    } else {
    privacyContainer.style.display = 'none'; // Hide privacy protection toggle
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

//------------------------------------------------------ Domain Theft Section --------------------------------------------------------//

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

        // Check for specific status codes (Use responseData instead of responseMsg)
        if (result.responseData?.statusCode === 2306) {
            updateChatLog(`ℹ️ Theft protection is already enabled for ${domain}.`, 'bot');
            return;
        }
        if (result.responseData?.statusCode === 2305) {
            updateChatLog(`ℹ️ Theft protection is already disabled for ${domain}.`, 'bot');
            return;
        }

        // Handle "Domain Theif Manage Failed" error with a clearer message
        if (result.responseMsg?.message === 'Domain Theif Manage Failed') {
            updateChatLog(`⚠️ Failed to update theft protection for ${domain}. Please check the domain status or try again later.`, 'bot');
            return;
        }

        updateChatLog(result.message || '✅ Operation completed.', 'bot');

    } catch (error) {
        console.error('❌ Error managing theft protection:', error);
        updateChatLog('⚠️ An error occurred while updating theft protection. Please try again.', 'bot');
    }
}

//------------------------------------------------- Get Domain Suggestions Section ---------------------------------------------------//

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

// Get suggestions for a different domain
function getNewDomainSuggestions() {
    logButtonPress('Get New Domain Suggestions');
    document.getElementById('domain-name-suggestions').value = ''; 
    document.getElementById('domain-section').style.display = 'flex'; 
    document.getElementById('domain-options-next').style.display = 'none';
    document.getElementById('login-chat-section').style.display = 'none'; 
    updateChatLog('Please enter a new domain name for suggestions.', 'bot');
}

function getMoreSuggestions() {
    logButtonPress('More Suggestions');
    updateChatLog('Fetching more suggestions for the same domain...', 'bot');
    getDomainSuggestions(); 
}

//-------------------------------------------------- Domain Availability Section ----------------------------------------------------//

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

//------------------------- Processes user input for questions without verification and update chatlog Section -----------------------//
function processUserQuestion() {
  const userQuestion = document.getElementById("user-question").value.trim();

  if (userQuestion) {
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

//-------------------------------------------------- Domain Registration Section -----------------------------------------------------//

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

  disableChat(); 
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

//------------------------------------------------- Enable/Disable Chatbox Section ---------------------------------------------------//

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

//------------------------------------------ Confirmation box, popup and display Section --------------------------------------------//

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

function closeConfirmationBox() {
    const box = document.querySelector('.chat-confirmation-box');
    if (box) box.remove();
    enableChat(); 
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

//---------------------------------------------------- Transfer Domain Section ------------------------------------------------------//

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

//----------------------------------------------------- Renew Domain Section --------------------------------------------------------//

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

//---------------------------------------- Question to answers before verification Section --------------------------------------------//

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

//---------------------------------------------------- Add Name Server Section --------------------------------------------------------//

let nameServerCount = 1;
const maxNameServers = 13;

function addNameServerInput() {
    if (nameServerCount >= maxNameServers) {
        alert("You can add up to 13 name servers only.");
        return;
    }

    nameServerCount++;

    const container = document.getElementById("nameserver-container");

    const inputDiv = document.createElement("div");
    inputDiv.className = "ns-input";
    inputDiv.innerHTML = `
        <input type="text" id="nameserver${nameServerCount}" placeholder="Enter Name Server ${nameServerCount}" required>
    `;

    container.appendChild(inputDiv);

    // Ensure new inputs fit inside the fixed height
    adjustNameServerInputSizes();
}

function adjustNameServerInputSizes() {
    const totalInputs = document.querySelectorAll(".ns-input").length;
    const maxHeight = 150; // Total space allocated to inputs
    const newHeight = maxHeight / totalInputs;

    document.querySelectorAll(".ns-input input").forEach(input => {
        input.style.height = `${newHeight}px`;
        input.style.fontSize = "12px"; // Adjust font size slightly if needed
    });
}

// Function to show a popup message
function showNameServerPopup(message, isSuccess) {
    disableChat(); // Disable chat interactions

    // Create the popup box
    const popup = document.createElement('div');
    popup.className = 'chat-popup-box';

    const content = document.createElement('div');
    content.className = 'popup-content';
    content.innerHTML = `<p>${message}</p>`;

    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close-btn';
    closeButton.innerText = 'OK';
    closeButton.addEventListener('click', () => {
        popup.remove();
        enableChat(); // Re-enable chat when popup is closed
    });

    content.appendChild(closeButton);
    popup.appendChild(content);
    document.body.appendChild(popup);

    // Auto-hide popup after 5 seconds and re-enable chat
    setTimeout(() => {
        popup.remove();
        enableChat();
    }, 5000);
}

// Function to fetch domain ID from Firebase
async function getDomainId(domainName) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("User not authenticated.");
            return null;
        }

        const db = firebase.firestore();
        const domainRef = db.collection("domains").where("domainName", "==", domainName).limit(1);
        const snapshot = await domainRef.get();

        if (snapshot.empty) {
            console.log(`❌ Domain ID not found for ${domainName}`);
            return null;
        }

        const domainData = snapshot.docs[0].data();
        console.log(`✅ Domain ID found: ${domainData.domainId}`);
        return domainData.domainId;
    } catch (error) {
        console.error("❌ Error fetching domain ID:", error);
        return null;
    }
}

// Function to update Name Servers
async function updateNameServers() {
    let domain = document.getElementById("domain-name-input").value.trim();
    let nameServers = [];

    for (let i = 1; i <= nameServerCount; i++) {
        let ns = document.getElementById(`nameserver${i}`).value.trim();
        if (ns) {
            nameServers.push(ns);
        }
    }

    if (!domain || nameServers.length === 0) {
        showNameServerPopup("Please enter the domain and at least one name server.", false);
        return;
    }

    console.log(`🔍 Fetching domain ID for ${domain}...`);
    const domainId = await getDomainId(domain);

    if (!domainId) {
        showNameServerPopup("Domain ID not found in Firebase.", false);
        return;
    }

    let apiUrl = `/update-name-servers?domainName=${encodeURIComponent(domain)}&domainId=${domainId}&nameServers=${encodeURIComponent(JSON.stringify(nameServers))}`;

    console.log("[FRONTEND] 📡 Sending request:", apiUrl);

    try {
        const response = await fetch(apiUrl);
        const result = await response.json();
        console.log("[FRONTEND] 🌐 Server Response:", result);

        if (result.success) {
            showNameServerPopup("Name Servers updated successfully!", true);
        } else {
            showNameServerPopup("Failed to update Name Servers: " + (result.message || "Unknown error."), false);
        }
    } catch (error) {
        console.error("[FRONTEND] ❌ Error:", error);
        showNameServerPopup("Error connecting to server.", false);
    }
}

//------------------------------------------------- Add Child Nameservers Section -----------------------------------------------------//

let childNameServerCount = 1;
const maxChildNameServers = 4;

function addChildNameServerInput() {
    if (childNameServerCount >= maxChildNameServers) {
        alert("You can add up to 4 child nameservers only.");
        return;
    }

    childNameServerCount++;

    const container = document.getElementById("childnameserver-container");

    const inputDiv = document.createElement("div");
    inputDiv.className = "childns-input";
    inputDiv.innerHTML = `
        <input type="text" id="childnameserver${childNameServerCount}" placeholder="Enter Hostname (e.g., ns${childNameServerCount}.example.com)" required>
        <input type="text" id="child-ip-address${childNameServerCount}" placeholder="Enter IP Address" required>
    `;

    container.appendChild(inputDiv);

    // Ensure new inputs fit inside the fixed height
    adjustInputSizes();
}

function adjustInputSizes() {
    const totalInputs = document.querySelectorAll(".childns-input").length;
    const maxHeight = 150; // Total space allocated to inputs
    const newHeight = maxHeight / totalInputs;

    document.querySelectorAll(".childns-input input").forEach(input => {
        input.style.height = `${newHeight}px`;
        input.style.fontSize = "12px"; // Adjust font size slightly if needed
    });
}

// Function to show a popup message and disable chat
function showChildNSPopup(message, isSuccess) {
    disableChat(); // Disable chat interactions

    // Create the popup box
    const popup = document.createElement('div');
    popup.className = 'chat-popup-box';

    const content = document.createElement('div');
    content.className = 'popup-content';
    content.innerHTML = `<p>${message}</p>`;

    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close-btn';
    closeButton.innerText = 'OK';
    closeButton.addEventListener('click', () => {
        popup.remove();
        enableChat(); // Re-enable chat when popup is closed
    });

    content.appendChild(closeButton);
    popup.appendChild(content);
    document.body.appendChild(popup);

    // Auto-hide popup after 5 seconds and re-enable chat
    setTimeout(() => {
        popup.remove();
        enableChat();
    }, 5000);
}

// Function to handle child name server registration
async function registerChildNameServer() {
    let domain = document.getElementById("child-domain-name").value.trim();
    let nameServers = [];
    
    for (let i = 1; i <= childNameServerCount; i++) {
        let ns = document.getElementById(`childnameserver${i}`).value.trim();
        let ip = document.getElementById(`child-ip-address${i}`).value.trim();
        
        if (ns && ip) {
            nameServers.push({ hostname: ns, ip: ip });
        }
    }

    if (!domain || nameServers.length === 0) {
        showChildNSPopup("Please enter the domain and at least one child name server.", false);
        return;
    }

    for (const ns of nameServers) {
        const apiUrl = `/add-child-ns?domainName=${encodeURIComponent(domain)}&ipAddress=${encodeURIComponent(ns.ip)}&hostname=${encodeURIComponent(ns.hostname)}`;

        console.log("[FRONTEND] 📡 Sending request:", apiUrl);

        try {
            const response = await fetch(apiUrl);
            const result = await response.json();
            console.log("[FRONTEND] 🌐 Server Response:", result);

            showChildNSPopup(
                result.success ? "Child Name Server added successfully!" : "Failed to add Child Name Server.",
                result.success
            );
        } catch (error) {
            console.error("[FRONTEND] ❌ Error:", error);
            showChildNSPopup("Error connecting to server.", false);
        }
    }
}

//----------------------------------------------------- Suspend Domain Section --------------------------------------------------------//

// Store the suspension state and domain globally
let domainToSuspend = null;
let isDomainSuspend = null;

// Function to handle the toggle switch for domain suspension
function handleDomainSuspendToggle(toggleElement) {
    let domain = document.getElementById('domain-query-text').value.trim();
    
    // Ensure the latest toggle state is properly read
    const newState = toggleElement.checked;
    if (isDomainSuspend === newState) {
        return; // Prevent unnecessary API calls if the state hasn't changed
    }

    isDomainSuspend = newState; // Update global state
    console.log('🛠️ Toggle state updated:', { domain, isDomainSuspend });

    if (!domain) {
        updateChatLog('Please enter a valid domain before managing suspension.', 'bot');
        toggleElement.checked = !isDomainSuspend; // Revert toggle
        return;
    }

    domainToSuspend = domain; // Store domain for API call
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

//--------------------------------------------------- Privacy Protection Section ------------------------------------------------------//

// Store the privacy protection state and domain globally
let domainForPrivacyProtection = null;
let isPrivacyProtectionEnabled = null;

// Function to handle the toggle switch for privacy protection
function handlePrivacyProtectionToggle(toggleElement) {
    let domain = document.getElementById('domain-query-text').value.trim();
    
    if (!domain) {
        updateChatLog('Please enter a valid domain before managing privacy protection.', 'bot');
        toggleElement.checked = !toggleElement.checked; // Revert toggle
        return;
    }

    isPrivacyProtectionEnabled = toggleElement.checked;
    domainForPrivacyProtection = domain;

    console.log('🔒 Privacy Protection toggle updated:', { domainForPrivacyProtection, isPrivacyProtectionEnabled });
}


// Function to make the API request for enabling/disabling privacy protection
async function submitPrivacyProtectionRequest(domain, isPrivacyEnabled) {
    try {
        console.log(`Submitting privacy protection request for ${domain}. Enable: ${isPrivacyEnabled}`);

        const response = await fetch(`/api/privacy-protection?domainName=${encodeURIComponent(domain)}&enable=${isPrivacyEnabled}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to update privacy protection status. Status: ${response.status}`);
        }

        const result = await response.json();
        updateChatLog(result.message || 'Operation completed.', 'bot');

        const togglePrivacyContainer = document.getElementById('privacy-protection-toggle-container');
        if (togglePrivacyContainer) {
            togglePrivacyContainer.style.display = 'none';
        }

    } catch (error) {
        console.error('Error with privacy protection request:', error);
        updateChatLog('An error occurred while processing your request.', 'bot');
    }
}

//----------------------------------------------------- Lock Domain Section --------------------------------------------------------//

let domainToLock = null;
let isDomainLocked = false;

// Function to handle the toggle switch for domain lock/unlock
function handleDomainLockToggle(toggleElement) {
    let domain = document.getElementById('domain-query-text').value.trim();
    isDomainLocked = toggleElement.checked;

    if (!domain) {
        updateChatLog('Please enter a valid domain before managing lock status.', 'bot');
        toggleElement.checked = !isDomainLocked;
        return;
    }

    // Sanitize input to extract domain name only
    const match = domain.match(/(?:lock|unlock)\s+(\S+)/i);
    if (match) {
        domain = match[1]; // Extract only the domain name
    }

    console.log('🔒 Toggle state updated:', { domain, isDomainLocked });

    // Store the domain and toggle state for submission
    domainToLock = domain;
}

// Function to submit the lock/unlock request
async function submitDomainLockRequest(domain, isDomainLocked) {
    try {
        console.log(`Submitting lock request for ${domain}. Lock: ${isDomainLocked}`);

        const response = await fetch(`/api/lock-domain?domainName=${encodeURIComponent(domain)}&lock=${isDomainLocked}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to update domain lock status. Status: ${response.status}`);
        }

        const result = await response.json();
        updateChatLog(result.message || 'Operation completed.', 'bot');

        const toggleLockContainer = document.getElementById('domain-lock-toggle-container');
        if (toggleLockContainer) {
            toggleLockContainer.style.display = 'none';
        }

    } catch (error) {
        console.error('Error with domain lock request:', error);
        updateChatLog('An error occurred while processing your request.', 'bot');
    }
}

//------------------------------------------- Submit Domain query after login Section ----------------------------------------------//

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

// Handle domain lock/unlock request if the toggle was changed
if (domainToLock !== null) {
    await submitDomainLockRequest(domainToLock, isDomainLocked);
    domainToLock = null; // Reset after submission
    return;
}

// Handle domain suspension request if the toggle was changed
if (domainToSuspend !== null) {
  await submitDomainSuspendRequest(domainToSuspend, isDomainSuspend);
  domainToSuspend = null; // Reset after submission
  return;
}

if (domainForPrivacyProtection !== null) {
    await submitPrivacyProtectionRequest(domainForPrivacyProtection, isPrivacyProtectionEnabled);
    domainForPrivacyProtection = null; // Reset after submission
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

//----------------------------------------------- Back button after verification --------------------------------------------------//

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

//--------------------------------------------------- Event Listeners Section ------------------------------------------------------//

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

//-------------------------------------------------- Extra  functions Section ------------------------------------------------------//

function switchSection(newSectionId) {
    document.getElementById(newSectionId).scrollIntoView({ behavior: 'smooth' });
    updateChatLog(`Switched to ${newSectionId}`, 'bot'); 
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

// Function to clear the chat log
function clearchatlog() {
    const chatContainer = document.getElementById('chat-log');
    if (chatContainer) {
        chatContainer.innerHTML = ''; // Clear all chat messages
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

if (loadingContainer) {
    loadingContainer.style.display = 'none';  
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

async function getDomainId(domainName) {
    return 1; // Replace with actual API call if needed
}
