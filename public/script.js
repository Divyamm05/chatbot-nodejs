//---------------------------------------------------- Defining constants section ------------------------------------------------------//
const allowedActions = ["enable theft protection", "disable theft protection", "renew domain", "transfer domain"];
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
const nameserver = document.getElementById('name-server-container');
nameserver.style.display ='none';

//------------------------------------------- Request OTP, Resend and Verification Section --------------------------------------------//

// Show email verification section
function taketosigninsection() {
    const emailSection = document.getElementById('email-section');
    const userinputSection = document.getElementById('user-input-section');
    const chatLog = document.getElementById('chat-log'); 
    const login = document.getElementById('login-text')
    const signup = document.getElementById('signup-text')

    // Toggle the visibility of the email section
    if (emailSection.style.display === 'none' || emailSection.style.display === '') {
        // Show the email section
        emailSection.style.display = 'flex';
        userinputSection.style.display = 'none';
        //document.getElementById('sidebar').style.display = 'none';
        login.style.display = 'none';
        signup.style.display = 'flex';
        toggleSidebar();
        // Clear the chat log
        chatLog.innerHTML = ''; 
        
        // Add a new message asking for email ID
        const emailMessage = document.createElement('div');
        emailMessage.classList.add('message', 'bot-message');
        emailMessage.textContent = 'Please enter your registered email id to continue.';
        chatLog.appendChild(emailMessage);
    } else {
        // Hide the email section
        emailSection.style.display = 'none';
    }
}

// Request OTP
function requestOTP() {
    const email = document.getElementById("user-email").value.trim();
    if (email == 'aichatbot@iwantdemo.com' ) {
        clearchatlog();
        updateChatLog("Thank you for signing in! You're all set to explore our advanced features, including domain registration, renewal, transfer, and so much more.", 'bot');
        const email = document.getElementById('user-email').value.trim();
        const otpInput = document.getElementById('otp-code');
        const otp = otpInput ? otpInput.value.trim() : '';
        const signup= document.getElementById('signup-text');
        const profileicon= document.getElementById('profile-icon');
        const login= document.getElementById('login-text');
        login.style.display = 'none';
        signup.style.display = 'none';
        profileicon.style.display = 'none';
        document.getElementById('sidebar').style.display = 'flex';
        document.getElementById('email-section').style.display = 'none';
        document.getElementById('otp-section').style.display = 'none';
        document.getElementById('login-chat-section').style.display = 'flex';
        document.getElementById('sidebar-content').style.display = 'none';
        document.getElementById('faq-post-login').style.display = 'flex'; 
        isSignedIn = true;
        localStorage.setItem('isSignedIn', 'true');
        updateAuthUI();
        toggleSidebar();
        return;
    }

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
                document.getElementById("otp-section").style.display = "flex";
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
const signup= document.getElementById('signup-text');
const profileicon= document.getElementById('profile-icon');
const login= document.getElementById('login-text');

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
        login.style.display = 'none';
        signup.style.display = 'none';
        profileicon.style.display = 'none';
        document.getElementById('sidebar').style.display = 'flex';

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
        document.getElementById('sidebar').style.display = 'none';
        

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

function updateAuthUI() {
    const isSignedIn = localStorage.getItem('isSignedIn') === 'true';
    const login = document.getElementById('login-text');
    const signup = document.getElementById('signup-text');
    const profileicon = document.getElementById('profile-icon');

    if (isSignedIn) {
        if (login) login.style.display = 'none';
        if (signup) signup.style.display = 'none';
        if (profileicon) profileicon.style.display = 'block'; // Show profile icon
    } else {
        if (login) login.style.display = 'block';
        if (signup) signup.style.display = 'block';
        if (profileicon) profileicon.style.display = 'none'; // Hide profile icon
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
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              border: none;
              color: white;
              border-radius: 20px;
              background-color: #3b3b3b;
              transition: background-color 0.3s ease;
              margin-top: 12px;
              display: block;
              width: 100%;
              text-align: center;
          }
          .register-button:hover, .transfer-button:hover, .available-button:hover, .update-button:hover, .renew-button:hover, .child-ns-button:hover {
              background-color: black;
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
       message.includes("You can register domains directly through this chatbot")) && message !== "To register a domain, enter your desired name in the search bar. If it's unavailable, our Domain Suggestion Tool will suggest similar alternatives. If available, select the number of years for registration, review the pricing details, and decide whether to proceed or dismiss the registration."

  ) {
    if (!document.getElementById("register-button")) { // Prevent duplicate buttons
    addButton("Register a Domain", "register-button", "domain-availability-section");
    }
  }

  // Transfer a domain
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.includes("transfer a domain") || message.includes("domain transfer") || message.includes("To transfer a domain to us")) || message.includes("How can I move a domain?") || message.includes("To pull a domain, initiate a domain transfer by obtaining the authorization code (EPP code) from the current registrar, unlocking the domain, and requesting the transfer to us by clciking on the transfer button below.") &&
      !message.includes("Yes, you can transfer your domains") &&
      !message.includes("Thank you for signing in!") && message !== "How can I move a domain?"
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
      addButton("Update Name Servers", "update-button", "name-server-container");
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
    document.getElementById("chat-log").style.height = "60%";
    document.getElementById("ns-wrapper").style.padding = "0";
    const buttons = document.querySelectorAll(".chat-input button");

    buttons.forEach(button => {
        button.style.fontSize = "12px"; // Adjust size as needed
    });
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

//------------ Prefills chat input with a domain query, highlights the domain name placeholder, and show a tooltip section ------------//

// Fill Chat Input with FAQ Question
function fillChatInput(question) {

    const userInput = document.getElementById("user-question");
    const userInput2 = document.getElementById("domain-query-text");
    userInput.value = question;
    userInput2.value = question;
    userInput.focus();
  }  
// Highlight domain name placeholder for required functionalities
let tooltipDomain = null;
let tooltipDate = null;

    // Your existing function...
function fillChatInputWithPlaceholder(template) {
    const chatInput = document.getElementById('domain-query-text');
    const submitButton = document.getElementById('submitDomainQuery');
    const toggleContainer = document.getElementById('theft-protection-toggle-container');
    const lockToggleContainer = document.getElementById('domain-lock-toggle-container');
    const suspendToggleContainer = document.getElementById('domain-suspend-toggle-container');
    const privacyContainer = document.getElementById('domain-privacy-toggle-container');

    chatInput.value = template;
    chatInput.focus();

    // Highlight "mydomain.com" and show tooltip
    tooltipDomain = highlightPlaceholder(chatInput, template, "mydomain.com", "Enter your domain name here.", tooltipDomain);

    // Extract action name and fetch API details
    const actionName = extractActionName(template);
    if (actionName) {
        getAPIDetails(template, actionName);
    }
    console.log("Extracted Action Name:", actionName);

    // Lock toggle
    const domainMatch = document.getElementById('theft-protection-input');
    if (domainMatch) {
        lockToggleContainer.style.display = 'block';
        submitButton.style.width = '60%';
        console.log("Lock toggle visible for:", domainMatch[1]);
        fetchDomainLockStatus(domainMatch[1]);
    }

    if ((/theft protection for (.+)/i.test(template))) {
        toggleContainer.style.display = 'flex';
        submitButton.style.width = '60%';
        console.log("✅ Theft protection toggle should now be visible");
    } else {
        console.error("❌ ERROR: Element #theft-protection-toggle-container not found in the DOM.");
    }

    // Privacy protection toggle
    const privacyMatch = template.match(/privacy protection (\S+)/i);
    if (privacyMatch) {
        privacyContainer.style.display = 'flex';
        submitButton.style.width = '60%';
        console.log("Privacy toggle visible for:", privacyMatch[1]);
        fetchPrivacyProtectionStatus(privacyMatch[1]);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const chatInput = document.getElementById('domain-query-text');
    const submitButton = document.getElementById('submitDomainQuery');
    const toggleContainer = document.getElementById('theft-protection-toggle-container');

    function checkForTheftProtection() {
        const inputValue = chatInput.value.trim();

        if (inputValue.startsWith("Enable/disable theft protection for ")) {
            toggleContainer.style.display = 'flex';  // Show toggle
            submitButton.style.width = '60%';
            console.log("✅ Theft protection toggle is now visible.");
        } else {
            toggleContainer.style.display = 'none'; // Hide if text doesn't match
        }
    }

    // Trigger when the user types or pastes something
    chatInput.addEventListener('input', checkForTheftProtection);
});


function highlightPlaceholder(inputElement, template, placeholder, tooltipText, tooltipRef) {
    let startPos = template.indexOf(placeholder);
    let endPos = startPos !== -1 ? startPos + placeholder.length : -1;

    if (startPos !== -1) {
        console.log(`Selecting ${placeholder} from`, startPos, "to", endPos);

        setTimeout(() => {
            inputElement.setSelectionRange(startPos, endPos);
        }, 10);

        inputElement.classList.add("highlight-input");
    } else {
        console.warn(`${placeholder} not found in template:`, template);
        inputElement.classList.remove("highlight-input");
    }

    // Remove existing tooltip before creating a new one
    if (tooltipRef) {
        tooltipRef.remove();
    }

    if (startPos !== -1) {
        tooltipRef = document.createElement("div");
        tooltipRef.textContent = tooltipText;
        tooltipRef.className = "tooltip";
        document.body.appendChild(tooltipRef);

        // Position tooltip
        let rect = inputElement.getBoundingClientRect();
        let fontSize = parseInt(window.getComputedStyle(inputElement).fontSize, 10);
        let charWidth = fontSize * 0.6; // Approximate character width
        let placeholderX = rect.left + window.scrollX + startPos * charWidth;
        let placeholderY = rect.top + window.scrollY - 40;

        tooltipRef.style.left = `${placeholderX}px`;
        tooltipRef.style.top = `${placeholderY}px`;
    }

    return tooltipRef; // Return reference to new tooltip
}

function fillChatInputWithPlaceholderDate(template) {
    const chatInput = document.getElementById('domain-query-text');
    chatInput.value = template;
    chatInput.focus();

    // Highlight "dd-mm-yyyy" and show tooltip
    tooltipDate = highlightPlaceholder(chatInput, template, "dd-mm-yyyy", "Enter a valid date (dd-mm-yyyy).", tooltipDate);
}

function hideTooltips() {
    if (tooltipDomain) {
        tooltipDomain.classList.add("hidden");
        setTimeout(() => {
            tooltipDomain.remove();
            tooltipDomain = null;
        }, 200);
    }
    if (tooltipDate) {
        tooltipDate.classList.add("hidden");
        setTimeout(() => {
            tooltipDate.remove();
            tooltipDate = null;
        }, 200);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const chatInput = document.getElementById('domain-query-text');
    chatInput.addEventListener('input', hideTooltips);
});

function fillChatInputWithPlaceholderCategory(template) {
    const chatInput = document.getElementById('domain-query-text');
    chatInput.value = template;
    chatInput.focus();

    // Highlight "Category" or "DomainName" for user input
    tooltipDomain = highlightPlaceholder(chatInput, template, "Category", "Enter a category.", tooltipDomain);
}
//--------------------------------------------------------- Hide all toggles ---------------------------------------------------------//
 function hidealltoggles() {
    document.getElementById("theft-protection-toggle-container").style.display = 'none';
    document.getElementById("domain-lock-toggle-container").style.display = 'none';
    document.getElementById("domain-suspend-toggle-container").style.display = 'none';
    document.getElementById("domain-privacy-toggle-container").style.display = 'none';
    hideTooltips();
 }

function hideexceptthefttoggle(){
    document.getElementById("domain-lock-toggle-container").style.display = 'none';
    document.getElementById("domain-suspend-toggle-container").style.display = 'none';
    document.getElementById("domain-privacy-toggle-container").style.display = 'none';
    hideTooltips();
 }

 function hideexceptlocktoggle(){
    document.getElementById("domain-suspend-toggle-container").style.display = 'none';
    document.getElementById("domain-privacy-toggle-container").style.display = 'none';
    document.getElementById("theft-protection-toggle-container").style.display = 'none';
    hideTooltips();
 }

 function hideexceptprivacytoggle(){
    document.getElementById("domain-lock-toggle-container").style.display = 'none';
    document.getElementById("domain-suspend-toggle-container").style.display = 'none';
    document.getElementById("theft-protection-toggle-container").style.display = 'none';
    hideTooltips();
 }

 function hideexceptsuspendtoggle(){
    document.getElementById("domain-lock-toggle-container").style.display = 'none';
    document.getElementById("domain-privacy-toggle-container").style.display = 'none';
    document.getElementById("theft-protection-toggle-container").style.display = 'none';
    hideTooltips();
 }

//------------------------------------------------------ Domain Theft Section --------------------------------------------------------//

function showTheftProtectionToggle() {
    const toggleContainer = document.getElementById('theft-protection-toggle-container');
    const submitButton = document.getElementById('submitDomainQuery');

    if (!toggleContainer || !submitButton) {
        console.error("❌ Toggle container or submit button not found!");
        return;
    }

    console.log("✅ Showing Theft Protection Toggle...");

    // Create a parent wrapper if not already existing
    let actionContainer = document.getElementById('action-container');
    if (!actionContainer) {
        actionContainer = document.createElement('div');
        actionContainer.id = 'action-container';
        
        // Insert before the submit button
        submitButton.parentNode.insertBefore(actionContainer, submitButton);
        
        // Move both elements inside
        actionContainer.appendChild(toggleContainer);
        actionContainer.appendChild(submitButton);
    }

    // Apply flex styles directly
    actionContainer.style.display = 'flex';
    actionContainer.style.alignItems = 'center';
    actionContainer.style.gap = '10px'; // Space between elements
    actionContainer.style.width = '100%'; // Make it full width

    // Ensure toggle container is visible
    toggleContainer.style.display = 'flex';
    toggleContainer.style.visibility = 'visible';
    toggleContainer.style.opacity = '1';

    // Adjust button width to prevent layout breaking
    submitButton.style.width = '100%';

    console.log("Final computed style:", window.getComputedStyle(toggleContainer).display);
};

let domainForTheftProtection = null;
let isTheftProtectionEnabled = true;

function handleTheftProtectionToggle(toggleElement) {
    let domain = document.getElementById('domain-query-text').value.trim();

    console.log(`🔄 [TOGGLE] Initial state: ${toggleElement.checked}`);
    isTheftProtectionEnabled = toggleElement.checked;
    console.log(`🔄 [TOGGLE] Updated isTheftProtectionEnabled: ${isTheftProtectionEnabled}`);

    if (!domain) {
        updateChatLog('Please enter a valid domain before managing theft protection.', 'bot');
        toggleElement.checked = !isTheftProtectionEnabled;
        console.warn(`⚠️ [TOGGLE] No domain entered, reverting toggle to: ${toggleElement.checked}`);
        return;
    }

    const match = domain.match(/(?:enable|disable) theft protection for (\S+)/i);
    if (match) {
        domain = match[1];
        console.log(`🔍 [TOGGLE] Extracted domain: ${domain}`);
    }

    console.log('🔒 [TOGGLE] Theft Protection Toggle State:', { domain, isTheftProtectionEnabled });

    domainForTheftProtection = domain;
}

async function submitTheftProtectionRequest(domain, isEnabled = true) {
    try {
        console.log(`🚀 [API REQUEST] Sending request for ${domain}. isEnabled: ${isEnabled}`);

        updateChatLog(`Requesting to ${isEnabled ? 'enable' : 'disable'} theft protection for ${domain}...`, 'bot');

        const response = await fetch(`/api/manage-theft-protection?domain=${encodeURIComponent(domain)}&enable=${isEnabled}`, {
            method: 'GET'
        });

        if (!response.ok) throw new Error(`Failed to update theft protection. Status: ${response.status}`);

        const result = await response.json();
        console.log('📨 [API RESPONSE] Received:', result);

        const toggleElement = document.getElementById('theft-protection-toggle');
        const domainInput = document.getElementById('domain-query-text');
        const toggleContainer = document.getElementById('theft-protection-toggle-container');
        const submitButton = document.getElementById('submitDomainQuery');

        if (!toggleElement || !domainInput || !toggleContainer || !submitButton) {
            console.error("❌ [UI ERROR] Missing required elements!");
            return;
        }

        // ✅ Simplified response message handling
        const responseMessage = result.message || result.responseMsg?.message || result.responseData?.message || "⚠️ No response message received.";
        updateChatLog(responseMessage, 'bot');

        // 🌟 Reset UI after showing response
        setTimeout(() => {
            domainInput.value = '';
            toggleElement.checked = true;
            toggleContainer.style.display = '';
            toggleContainer.removeAttribute('style');

            submitButton.style.backgroundColor = '';
            submitButton.style.width = '100%';

            console.log("🔄 [UI RESET] Input cleared, toggle hidden, styles reset.");
        }, 2000);

    } catch (error) {
        console.error(`❌ [ERROR] While managing theft protection:`, error);
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
const checkDomainAvailability = async (domainName) => {
    try {
      const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkdomainavailable?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&websiteName=${domainName}`;
  
      console.log(`Checking domain availability for: ${domainName}`);
      console.log(`Request URL: ${url}`);
  
      const response = await axios.get(url, { headers: { "Accept": "application/json" } });
  
      console.log("API Response:", JSON.stringify(response.data, null, 2));
  
      const message = response.data?.responseMsg?.message || "Unknown response from API";
      const isAvailable = response.data?.responseMsg?.message === "Domain Available for Registration";
  
      console.log(`Domain Availability: ${isAvailable}`);
  
      return {
        available: isAvailable,
        message: message,
        responseData: response.data?.responseData || {}, // Include registrationFee
      };
    } catch (error) {
      console.error("Error checking domain availability:", error.message);
      return { available: false, message: "Error checking domain availability." };
    }
  };
  

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

async function handleCheckDomain() {
    const domainInput = document.getElementById("check-domain-input").value.trim();
    
    if (!domainInput) {
        alert("Please enter a domain name.");
        return;
    }

    try {
        console.log("🔵 Sending request to API...");
        const response = await fetch(`/api/check-domain?domain=${domainInput}`);

        console.log("🟡 Response received:", response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("🟢 Parsed JSON response:", data);

        if (!data.hasOwnProperty("available")) {
            throw new Error("Missing 'available' property in API response.");
        }

        console.log("🔍 Checking domain availability:", data.available);

        const chatLog = document.getElementById("chat-log");

        // Create button container
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "10px";
        buttonContainer.style.marginLeft = "20px";
        buttonContainer.style.marginTop = "5px";
        buttonContainer.style.marginBottom = "10px";

        // Create Yes button
        const yesButton = document.createElement("button");
        yesButton.innerText = "Yes";
        yesButton.style.padding = "8px 12px";
        yesButton.style.border = "none";
        yesButton.style.cursor = "pointer";
        yesButton.style.backgroundColor = "#008CBA";
        yesButton.style.color = "white";
        yesButton.style.borderRadius = "5px";
        yesButton.style.transition = "background-color 0.3s ease";

        yesButton.onclick = () => {
            console.log("✅ Yes button clicked!");
            const checkAvailabilitySection = document.getElementById("domain-availability-section");
            const domainRegistrationSection = document.getElementById("domain-registration-section");
            const loginChatSection = document.getElementById("login-chat-section");
            const domainNameInput = document.getElementById("domain-name");

            if (checkAvailabilitySection) checkAvailabilitySection.style.display = "none";
            if (loginChatSection) loginChatSection.style.display = "none";

            if (!domainRegistrationSection) {
                console.error("❌ 'domain-registration-section' NOT found in the DOM!");
            } else {
                domainRegistrationSection.style.display = "flex";
                domainNameInput.value = domainInput;
            }
        };

        // Create No button
        const noButton = document.createElement("button");
        noButton.innerText = "No";
        noButton.style.padding = "8px 12px";
        noButton.style.border = "none";
        noButton.style.cursor = "pointer";
        noButton.style.backgroundColor = "#ccc";
        noButton.style.color = "#000";
        noButton.style.borderRadius = "5px";
        noButton.style.transition = "background-color 0.3s ease";

        noButton.onclick = () => {
            addChatMessage("bot", "Okay! Let me know if you need anything else. 😊");
        };

        if (data.available) {
            console.log("✅ Domain is available. Showing message...");
            updateChatLog(`✅ ${domainInput} is available for registration! Do you want to register this domain?`, 'bot');

            buttonContainer.appendChild(yesButton);
            buttonContainer.appendChild(noButton);
            chatLog.appendChild(buttonContainer);
        } else {
            console.log("❌ Domain is taken. Showing message...");
            updateChatLog(`❌ ${domainInput} is already taken. Try another name?`, 'bot');

            const tryAnotherButton = document.createElement("button");
            tryAnotherButton.innerText = "Try Another Name";
            tryAnotherButton.style.padding = "8px 12px";
            tryAnotherButton.style.border = "none";
            tryAnotherButton.style.cursor = "pointer";
            tryAnotherButton.style.backgroundColor = "#008CBA";
            tryAnotherButton.style.color = "white";
            tryAnotherButton.style.borderRadius = "5px";
            tryAnotherButton.style.transition = "background-color 0.3s ease";

            tryAnotherButton.onclick = () => {
                const domainInputField = document.getElementById("check-domain-input");
                if (domainInputField) {
                    domainInputField.value = ""; // Clear the input field
                    domainInputField.focus(); // Refocus for a new search
                } else {
                    console.error("❌ 'check-domain-input' NOT found in the DOM!");
                }
            };
            
            const suggestButton = document.createElement("button");
            suggestButton.innerText = "Suggest Alternatives";
            suggestButton.style.padding = "8px 12px";
            suggestButton.style.border = "none";
            suggestButton.style.cursor = "pointer";
            suggestButton.style.backgroundColor = "#ccc";
            suggestButton.style.color = "#000";
            suggestButton.style.borderRadius = "5px";
            suggestButton.style.transition = "background-color 0.3s ease";

            suggestButton.onclick = () => {
                if (typeof fetchDomainSuggestions === "function") {
                    fetchDomainSuggestions(domainInput);
                } else {
                    console.error("❌ 'fetchDomainSuggestions' function is missing!");
                }
            };

            buttonContainer.appendChild(tryAnotherButton);
            buttonContainer.appendChild(suggestButton);
            chatLog.appendChild(buttonContainer);
        }

    } catch (error) {
        console.error("❌ Caught an error inside try block:", error);
        updateChatLog("bot", "⚠️ Error checking domain availability. Please try again later.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM fully loaded!");

    const domainRegistrationSection = document.getElementById("domain-registration-section");

    if (!domainRegistrationSection) {
        console.error("❌ 'domain-registration-section' NOT found in the DOM!");
    }
});

function addChatMessage(sender, message, showButtons = false, domainInput = "") {
    const chatContainer = document.getElementById("chat-log"); 
    const loginChatSection = document.getElementById("login-chat-section");

    if (!chatContainer) {
        console.error("❌ 'chat-log' NOT found in the DOM!");
        return; // Stop execution if chat container is missing
    }
    if (message.includes("available for registration")) {
        if (checkAvailabilitySection) checkAvailabilitySection.style.display = "none";
        if (loginChatSection) loginChatSection.style.display = "none";
        if (domainRegistrationSection) domainRegistrationSection.style.display = "flex";

        if (typeof showDomainRegistration === "function") {
            showDomainRegistration(domainInput);
        } else {
            console.error("❌ 'showDomainRegistration' function is missing!");
        }
    } else if (typeof fetchDomainSuggestions === "function" && domainInput.trim() !== "") {
        console.log("Fetching domain suggestions for:", domainInput);
        fetchDomainSuggestions(domainInput);
    } else {
        console.error("❌ 'fetchDomainSuggestions' function is missing OR domainInput is empty!");
    }

    const messageElement = document.createElement("div");
    messageElement.style.marginBottom = "10px";
    messageElement.style.padding = "12px 15px";
    messageElement.style.maxWidth = "80%";
    messageElement.style.wordWrap = "break-word";
    messageElement.style.borderRadius = "20px";
    messageElement.style.whiteSpace = "pre-line";

    if (sender === "bot") {
        messageElement.style.backgroundColor = "#066";
        messageElement.style.color = "#ffffff";
        messageElement.style.alignSelf = "flex-start";
        messageElement.style.marginLeft = "20px";
    } else {
        messageElement.style.backgroundColor = "#ddd";
        messageElement.style.color = "#000";
        messageElement.style.alignSelf = "flex-end";
        messageElement.style.marginRight = "20px";
    }

    messageElement.innerHTML = message;
    chatContainer.appendChild(messageElement);

    if (showButtons) {
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "10px";
        buttonContainer.style.marginLeft = "20px";
        buttonContainer.style.marginTop = "5px";
        buttonContainer.style.marginBottom = "10px";

        const yesButton = document.createElement("button");
        yesButton.innerText = "Yes";
        yesButton.style.padding = "8px 12px";
        yesButton.style.border = "none";
        yesButton.style.cursor = "pointer";
        yesButton.style.backgroundColor = "#008CBA";
        yesButton.style.color = "white";
        yesButton.style.borderRadius = "5px";
        yesButton.style.transition = "background-color 0.3s ease";

        yesButton.onclick = () => {
            console.log("✅ Yes button clicked!");

            const checkAvailabilitySection = document.getElementById("domain-availability-section");
            const domainRegistrationSection = document.getElementById("domain-registration-section");

            if (!checkAvailabilitySection) {
                console.error("❌ 'check-availability-section' NOT found in the DOM!");
            }
            if (!domainRegistrationSection) {
                console.error("❌ 'domain-registration-section' NOT found in the DOM!");
            }

            if (!checkAvailabilitySection || !domainRegistrationSection) {
                return; // Stop execution if elements are missing
            }

            if (message.includes("available for registration")) {
                checkAvailabilitySection.style.display = "none";
                domainRegistrationSection.style.display = "flex";  // Change to "block" if needed

                if (typeof showDomainRegistration === "function") {
                    showDomainRegistration(domainInput);
                } else {
                    console.error("❌ 'showDomainRegistration' function is missing!");
                }
            } else {
                if (typeof fetchDomainSuggestions === "function") {
                    fetchDomainSuggestions(domainInput);
                } else {
                    console.error("❌ 'fetchDomainSuggestions' function is missing!");
                }
            }
        };        

        const noButton = document.createElement("button");
        noButton.innerText = "No";
        noButton.style.padding = "8px 12px";
        noButton.style.border = "none";
        noButton.style.cursor = "pointer";
        noButton.style.backgroundColor = "#ccc";
        noButton.style.color = "#000";
        noButton.style.borderRadius = "5px";
        noButton.style.transition = "background-color 0.3s ease";

        noButton.onclick = () => addChatMessage("bot", "Okay! Let me know if you need anything else. 😊");

        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);
        chatContainer.appendChild(buttonContainer);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Event Listener for "Check Availability" button
document.getElementById("check-domain-button").addEventListener("click", function () {
    const domainName = document.getElementById("check-domain-input").value.trim();
    if (!domainName) {
        addChatMessage("bot", "Please enter a domain name.");
        return;
    }
    checkDomainAvailability(domainName);
});

let suggestionData = []; // Store fetched suggestions
let suggestionIndex = 0; // Track current batch index
const SUGGESTION_BATCH_SIZE = 5; // Number of suggestions per batch

async function fetchDomainSuggestions(domainInput) {
    try {
        // Fetch suggestions only once and store them
        if (suggestionData.length === 0) {
            const response = await fetch(`/api/domainname-suggestions?domain=${domainInput}`);
            const data = await response.json();

            if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
                addChatMessage("bot", "⚠️ No suggestions found. Please try another keyword.");
                return;
            }

            suggestionData = data.data; // Store all 25 suggestions
            suggestionIndex = 0; // Reset index
        }

        // Get the next batch (5 at a time)
        const slice = suggestionData.slice(suggestionIndex, suggestionIndex + SUGGESTION_BATCH_SIZE);
        const startNumber = suggestionIndex + 1; // Correct numbering
        suggestionIndex += SUGGESTION_BATCH_SIZE;

        if (slice.length === 0) {
            addChatMessage("bot", "✅ You've reached the maximum number of suggestions. Let me know if you need anything else! 😊");
            return;
        }

        let suggestionMessage = "💡 More similar domains:<br>(Click on a domain to register it)<br>";
        slice.forEach((suggestion, index) => {
            const suggestionNumber = startNumber + index;
            suggestionMessage += `<br>${suggestionNumber}. 🔹 <a href="#" onclick="event.preventDefault(); selectDomain('${suggestion.domainName}')" style="color: white; text-decoration: underline;">${suggestion.domainName}</a> - 💰 $${suggestion.price}`;
        });

        // ✅ Append "More Suggestions?" prompt with buttons side by side
        if (suggestionIndex < suggestionData.length) {
            suggestionMessage += `<br><br><span>Would you like more suggestions?</span>  
            <span style="display: inline-flex; gap: 10px; margin-left: 10px;">
                <button onclick="fetchDomainSuggestions('${domainInput}')" style="background-color: #008CBA; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">Yes</button>  
                <button onclick="addChatMessage('bot', 'Okay! Let me know if you need anything else. 😊')" style="background-color: #ccc; color: black; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">No</button>
            </span>`;
        }

        addChatMessage("bot", suggestionMessage);
    } catch (error) {
        console.error("Error fetching domain suggestions:", error);
        addChatMessage("bot", "⚠️ Error fetching domain suggestions. Please try again later.");
    }
}

// ✅ Reset when checking a new domain
function handleNewDomainCheck() {
    suggestionData = [];
    suggestionIndex = 0;
}

// Display domain suggestions as buttons in the chat
function displayDomainSuggestions(domains) {
    const suggestionContainer = document.createElement("div");
    suggestionContainer.className = "domain-suggestions";

    // Clear previous suggestions
    document.querySelectorAll(".domain-suggestions").forEach(el => el.remove());

    domains.forEach((domain) => {
        const button = document.createElement("button");
        button.innerText = domain;
        button.className = "suggested-domain";
        button.onclick = function () {
            addChatMessage("user", domain);
            showDomainRegistration(domain);
        };
        suggestionContainer.appendChild(button);
    });

    addChatMessageElement("bot", suggestionContainer);
}

function selectDomain(domainName) {
    const chatbox = document.getElementById("chatbox");
    const domainRegistrationSection = document.getElementById("domain-registration-section");

    // Ensure chatbox and registration section are visible
    chatbox.style.display = "flex";
    domainRegistrationSection.style.display = "block";
    domainAvailabilitySection.style.display = "none";
    document.getElementById('login-chat-section').style.display = "none";

    // Set domain name in input field
    document.getElementById("domain-name").value = domainName;
    document.getElementById("domain-name").focus();

    // Inform user
    addChatMessage("bot", `✅ Selected domain: ${domainName}`);
}


// Show the domain registration section
function showDomainRegistration(domainName) {
    console.log("🛠 Showing registration form for:", domainName);

    document.getElementById("domain-name").value = domainName;
    document.getElementById("domain-registration-section").style.display = "block";
}

// Handle "Go Back" button from registration section
function goBackToCheckSection() {
    document.getElementById("domain-registration-section").style.display = "none";
    document.getElementById("check-availability-section").style.display = "block";
}

function addadditionaldomaindetails() {
    const additionalsection = document.getElementById("additional-settings-section");
    if (additionalsection) {
        additionalsection.style.display = "flex"; // ✅ Corrected string format
        document.getElementById('chat-log').style.height = '40%';
        document.getElementById('domain-button-group').style.display = 'none';
        document.getElementById('close-additional-settings-buttons').style.display = 'flex';
        document.getElementById('close-additional-settings-buttons').style.height = '5vh';
        document.getElementById('additional-settings-section').style.marginTop = '-6px';
        document.getElementById('closeadditionaldomaindetails').style.fontSize = '10px';
        document.getElementById('registerDomain').style.fontSize = '10px';
    } else {
        console.error("Element with ID 'additional-settings-section' not found.");
    }
}

function closeadditionaldomaindetails() {
    const additionalsection = document.getElementById("additional-settings-section");
    if (additionalsection) {
        additionalsection.style.display = "none";
        document.getElementById('close-additional-settings-buttons').style.height = 'auto'
        document.getElementById('domain-button-group').style.display = 'flex';
    } else {
        console.error("Element with ID 'additional-settings-section' not found.");
    }
}

async function registerDomain() {
    const domainName = document.getElementById("domain-name").value.trim();
    const duration = document.getElementById("duration").value;
    const additionalsection = document.getElementById("additional-settings-section");

    if (!domainName || !duration) {
        alert("Please fill in all required fields.");
        return;
    }

    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
        alert("Please enter a valid domain name.");
        return;
    }

    try {
        // 🔍 Fetch domain availability + price from backend
        const response = await fetch(`/api/check-domain?domain=${domainName}`);
        const data = await response.json();

        if (!data.success) {
            alert("Error fetching domain availability.");
            return;
        }

        if (!data.available) {
            alert("Domain is not available for registration.");
            return;
        }

        const price = data.registrationFee;

        // 📝 Create confirmation box
        const confirmationBox = document.createElement('div');
        confirmationBox.className = 'chat-confirmation-box';

        const content = document.createElement('div');
        content.className = 'confirmation-content';
        content.innerHTML = `
            <p>Do you want to register the domain <strong>${domainName}</strong>?</p>
            <p>💰 Registration Price: <strong>$${price.toFixed(2)}</strong></p>
        `;

        const yesButton = document.createElement('button');
        yesButton.innerText = 'Yes';
        yesButton.addEventListener('click', () => confirmRegistration(domainName, duration, additionalsection.style.display === "flex"));

        const noButton = document.createElement('button');
        noButton.innerText = 'No';
        noButton.addEventListener('click', closeConfirmationBox);

        content.appendChild(yesButton);
        content.appendChild(noButton);
        confirmationBox.appendChild(content);
        document.body.appendChild(confirmationBox);

        disableChat();
    } catch (error) {
        alert("Failed to fetch domain price. Please try again.");
    }
}
  
function confirmRegistration(domainName, duration, isAdditionalVisible) {
    closeConfirmationBox();
    disableChat();
    showChatPopup("Registering your domain, please wait...", false, true);

    // Required parameters
    let apiUrl = `/api/register-domain?WebsiteName=${domainName}&Duration=${duration}&ProductType=1`;

    console.log("📤 Sending domain registration request...");
    console.log("🌐 Domain Name:", domainName);
    console.log("📅 Duration:", duration);
    console.log("🛒 ProductType: 1");

    if (isAdditionalVisible) {
        // Fetch additional values only if additional settings are visible
        const ns1 = document.getElementById("ns1").value.trim();
        const ns2 = document.getElementById("ns2").value.trim();
        const ns3 = document.getElementById("ns3").value.trim();
        const ns4 = document.getElementById("ns4").value.trim();
        const language = document.getElementById("language").value.trim();
        const isEnablePremium = document.getElementById("enable-premium").checked ? 1 : 0;
        const isWhoisProtection = document.getElementById("whois-protection").checked ? true : false;

        console.log("🛡️ Whois Protection:", isWhoisProtection);
        console.log("💎 Premium Domain:", isEnablePremium);
        console.log("🖥️ Nameservers:", ns1, ns2, ns3 || "N/A", ns4 || "N/A");
        console.log("🈳 Language:", language || "N/A");

        apiUrl += `&ns1=${ns1}&ns2=${ns2}&isEnablePremium=${isEnablePremium}&IsWhoisProtection=${isWhoisProtection}`;

        if (ns3) apiUrl += `&ns3=${ns3}`;
        if (ns4) apiUrl += `&ns4=${ns4}`;
        if (language) apiUrl += `&lang=${language}`;

        // Handle .us domain-specific parameters
        const usPurpose = document.getElementById("us-app-purpose").value.trim();
        const usNexusCategory = document.getElementById("us-nexus-category").value.trim();

        if (usPurpose && usNexusCategory) {
            console.log("🇺🇸 .US Specific Params:", { usPurpose, usNexusCategory });
            apiUrl += `&isUs=1&appPurpose=${usPurpose}&nexusCategory=${usNexusCategory}`;
        }
    }

    console.log("🚀 Final API URL:", apiUrl);

    fetch(apiUrl, { method: "GET" })
        .then(response => response.json())
        .then(result => {
            console.log("✅ Server Response:", result);
            if (result.success) {
                showChatPopup("Domain registered successfully!", true);
            } else {
                showChatPopup("Error: " + result.message, false);
            }

            document.getElementById('domain-registration-section').style.display = 'none';
            document.getElementById('login-chat-section').style.display = 'flex';
        })
        .catch(error => {
            console.error("❗ Unexpected error:", error);
            showChatPopup("Internal Server Error", false);
        })
        .finally(() => {
            enableChat();
        });
}

//------------------------------------------------- Enable/Disable Chatbox Section ---------------------------------------------------//

function disableChat() {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
      chatContainer.style.pointerEvents = "none";
      chatContainer.style.opacity = "0.9";
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
    position: absolute;
    left: 72%;
    width: 22%;
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
    background-color: #066;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.confirmation-content button:hover {
  background-color: #000000;
}
`;
document.head.appendChild(style);

function styleButton(button, bgColor, textColor) {
    button.style.padding = "10px 15px";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.style.backgroundColor = bgColor;
    button.style.color = textColor;
    button.style.fontSize = "14px";
}

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
// Function to handle domain transfer
async function transferDomain() {
    const domainName = document.getElementById('transfer-domain-name').value.trim();
    const authCode = document.getElementById('auth-code').value.trim();
    const isWhoisProtection = document.getElementById('transfer-whois-protection').value === 'yes';

    if (!domainName || !authCode) {
        alert('Please fill in all required fields.');
        return;
    }

    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
        alert('Please enter a valid domain name.');
        return;
    }

    try {
        // Fetch transfer fee from backend
        const feeResponse = await fetch(`/api/get-transfer-fee?domain=${domainName}`);
        const feeData = await feeResponse.json();

        let transferFeeMessage = "Transfer fee could not be determined.";
        if (feeData.success) {
            transferFeeMessage = `Transfer Fee: $${feeData.transferFee.toFixed(2)}`;
        }

        // Confirmation popup
        const confirmationBox = document.createElement('div');
        confirmationBox.className = 'chat-confirmation-box';

        const content = document.createElement('div');
        content.className = 'confirmation-content';
        content.innerHTML = `
            <p>Do you want to transfer the domain <strong>${domainName}</strong>?</p>
            <p>💰<strong>${transferFeeMessage}</strong></p>
        `;

        const yesButton = document.createElement('button');
        yesButton.innerText = 'Yes';
        yesButton.addEventListener('click', () => confirmDomainTransfer(domainName, authCode, isWhoisProtection));

        const noButton = document.createElement('button');
        noButton.innerText = 'No';
        noButton.addEventListener('click', closeConfirmationBox);

        content.appendChild(yesButton);
        content.appendChild(noButton);
        confirmationBox.appendChild(content);
        document.body.appendChild(confirmationBox);

        disableChat(); // Disable chat while the confirmation box is open

    } catch (error) {
        console.error("❌ Error fetching transfer fee:", error);
        alert("Could not fetch transfer fee. Please try again.");
    }
}


async function confirmDomainTransfer(domainName, authCode, isWhoisProtection) {
    closeConfirmationBox(); 
    disableChat(); 

    showChatPopup("Initiating domain transfer, please wait...", false, true);

    try {
        const response = await fetch('/api/transfer-domain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domainName, authCode, isWhoisProtection }),
        });

        const result = await response.json();

        showChatPopup(result.success ? result.message : `Error: ${result.message}`, result.success);

        document.getElementById('domain-transfer-section').style.display = 'none';
        document.getElementById('login-chat-section').style.display = 'flex';

    } catch (error) {
        console.error('❗ Unexpected error during domain transfer:', error);
        showChatPopup('An error occurred during domain transfer. Please try again later.', false);
    } finally {
        enableChat(); 
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

    if (duration < 1 || duration > 10) {
        alert("Please enter a valid renewal duration (1-10 years).");
        return;
    }

    try {
        // 🔍 Fetch renewal fee from backend
        const response = await fetch(`/api/get-renewal-fee?domain=${encodeURIComponent(domainName)}`);
        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Error fetching domain renewal fee.");
            return;
        }

        const renewalFee = data.renewalFee;

        // 📝 Create confirmation box for renewal
        const confirmationBox = document.createElement('div');
        confirmationBox.className = 'chat-confirmation-box';

        const content = document.createElement('div');
        content.className = 'confirmation-content';
        content.innerHTML = `
            <p>Do you want to renew the domain <strong>${domainName}</strong> for <strong>${duration}</strong> year(s)?</p>
            <p>💰 Renewal Price: <strong>$${renewalFee.toFixed(2)}</strong></p>
        `;

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

        disableChat();
    } catch (error) {
        console.error("❌ [ERROR] Could not fetch renewal fee:", error);
        alert("Failed to fetch renewal fee.");
    }
}

function confirmRenewal(domainName, duration) {
    closeConfirmationBox();

    // Keep chat disabled while processing
    disableChat();

    // Show "Processing..." message
    showChatPopup("Renewing your domain, please wait...", false, true);

    fetch(`/api/renew-domain?Websitename=${encodeURIComponent(domainName)}&Duration=${encodeURIComponent(duration)}`, {
        method: "GET",
        credentials: "include",
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showChatPopup("Domain renewed successfully!", true);
        } else {
            showChatPopup("Error: " + result.message, false);
        }

        document.getElementById('domain-renewal-section').style.display = 'none';
        document.getElementById('login-chat-section').style.display = 'flex';
    })
    .catch(error => {
        console.error("❗ Unexpected error:", error);
        showChatPopup("Internal Server Error", false);
    })
    .finally(() => {
        enableChat();
    });
}

function closeConfirmationBox() {
    const existingBox = document.querySelector('.chat-confirmation-box');
    if (existingBox) {
        existingBox.remove();
    }
    enableChat();
}


//----------------------------------------- Extract action from api documentation section ---------------------------------------------//

async function getAPIDetails(userQuery, actionName) {
    const response = await fetch('/api/get-api-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery, action: actionName }) // Send both query & action
    });

    const data = await response.json();
    updateChatLog(data.answer, 'bot'); // Display response in chatbot
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
const maxNameServers = 4;

function addNameServerInput() {
    if (nameServerCount >= maxNameServers) {
        alert("Maximum name servers reached!");
        return;
    }

    const container = document.getElementById("nameserver-container");

    const input = document.createElement("input");
    input.type = "text";
    input.id = `nameserver${nameServerCount + 1}`; // Unique ID for each input
    input.placeholder = `Enter Name Server ${nameServerCount + 1}`;
    input.required = true;

    const nsInputWrapper = document.createElement("div");
    nsInputWrapper.classList.add("ns-input");
    nsInputWrapper.appendChild(input);

    container.appendChild(nsInputWrapper);

    nameServerCount++;

    if (nameServerCount >= 3) {
        document.getElementById("chat-log").style.height = "59%";
        document.getElementsByClassName("chat-input").style.borderRadius= "0";
        document.getElementsByClassName("chat-input").style.gap = "10px"
    }
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
        alert("Maximum child name servers reached!");
        return;
    }

    childNameServerCount++; // Increment first

    const container = document.getElementById("childnameserver-container");

    const childInputWrapper = document.createElement("div");
    childInputWrapper.classList.add("childns-input");

    const hostnameInput = document.createElement("input");
    hostnameInput.type = "text";
    hostnameInput.id = `childnameserver${childNameServerCount}`;
    hostnameInput.placeholder = `Enter Hostname ${childNameServerCount}`;
    hostnameInput.required = true;

    const ipInput = document.createElement("input");
    ipInput.type = "text";
    ipInput.id = `child-ip-address${childNameServerCount}`;
    ipInput.placeholder = `Enter IP Address ${childNameServerCount}`;
    ipInput.required = true;

    childInputWrapper.appendChild(hostnameInput);
    childInputWrapper.appendChild(ipInput);
    container.appendChild(childInputWrapper);

    if (childNameServerCount >= 3) {
        document.getElementById("chat-log").style.height = "47%";
        document.getElementsByClassName("chat-input").style.borderRadius= "0";
    }
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

function showDomainSuspendToggle() {
    const toggleContainer = document.getElementById('domain-suspend-toggle-container');
    const submitButton = document.getElementById('submitDomainQuery');

    if (!toggleContainer || !submitButton) {
        console.error("❌ Toggle container or submit button not found!");
        return;
    }

    console.log("✅ Showing Domain Suspend Toggle...");

    // Create a parent wrapper if not already existing
    let actionContainer = document.getElementById('action-container');
    if (!actionContainer) {
        actionContainer = document.createElement('div');
        actionContainer.id = 'action-container';

        // Insert before the submit button
        submitButton.parentNode.insertBefore(actionContainer, submitButton);

        // Move both elements inside
        actionContainer.appendChild(toggleContainer);
        actionContainer.appendChild(submitButton);
    }

    // Apply flex styles for one line input + toggle, and next line for submit button
    actionContainer.style.display = 'flex';
    actionContainer.style.flexDirection = 'row'; // Stack elements vertically
    actionContainer.style.gap = '10px'; // Space between elements
    actionContainer.style.width = '100%'; // Full width

    // Create a flex container for the toggle and the submit button
    const toggleWrapper = document.createElement('div');
    toggleWrapper.style.display = 'flex';
    toggleWrapper.style.alignItems = 'center'; // Align toggle and input

    // Style the toggle to take 40% width
    toggleContainer.style.width = '40%';

    // Add the toggle to the wrapper
    toggleWrapper.appendChild(toggleContainer);
    
    // Append the wrapper to the actionContainer
    actionContainer.appendChild(toggleWrapper);

    // Ensure submit button is on the next line, below the toggle
    actionContainer.appendChild(submitButton);

    // Ensure toggle container is visible
    toggleContainer.style.display = 'flex';
    toggleContainer.style.visibility = 'visible';
    toggleContainer.style.opacity = '1';

    console.log("Final computed style:", window.getComputedStyle(toggleContainer).display);
};

// Store the suspension state and domain globally
let domainToSuspend = null;
let isDomainSuspend = true; // Default to true, update with the current state

// Function to handle the toggle switch for domain suspension
function handleDomainSuspendToggle(toggleElement) {
    let domain = document.getElementById('domain-query-text').value.trim();
    
    // Ensure the latest toggle state is properly read
    const newState = toggleElement.checked;

    // Only proceed if the state has changed
    if (isDomainSuspend === newState) {
        return; // Prevent unnecessary API calls if the state hasn't changed
    }

    isDomainSuspend = newState; // Update global state
    console.log('🛠️ Toggle state updated:', { domain, isDomainSuspend });

    if (!domain) {
        updateChatLog('Please enter a valid domain before managing suspension.', 'bot');
        toggleElement.checked = !isDomainSuspend; // Revert toggle to previous state
        return;
    }

    domainToSuspend = domain; // Store domain for API call

    // Call the function to submit the suspension request when toggle changes
    submitDomainSuspendRequest(domain, isDomainSuspend);
}

// Function to make the API request for domain suspension/unsuspension
// Function to make the API request for domain suspension/unsuspension
async function submitDomainSuspendRequest(domain, isDomainSuspend) {
    try {
        console.log(`Submitting suspension request for ${domain}. Suspend: ${isDomainSuspend}`);

        // Make the API call to suspend/unsuspend the domain
        const response = await fetch(`/api/suspend-domain?domainName=${encodeURIComponent(domain)}&suspend=${isDomainSuspend}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to update domain suspend status. Status: ${response.status}`);
        }

        const result = await response.json();
        updateChatLog(result.message || 'Operation completed successfully.', 'bot');

        // Hide the toggle container after the request is successful
        const toggleSuspendContainer = document.getElementsByClassName('slider-round');
        if (toggleSuspendContainer) {
            toggleSuspendContainer.style.display = 'none'; // Hide toggle after submission
        }

        // Clear the input field after the API response
        document.getElementById('domain-query-text').value = ''; // Reset the input field
        actionContainer.style.display = 'none'; 

    } catch (error) {
        console.error('Error with domain suspension request:', error);
        updateChatLog('An error occurred while processing your request.', 'bot');
    }
}


//--------------------------------------------------- Privacy Protection Section ------------------------------------------------------//

function showPrivacyProtectionToggle() {
    const toggleContainer = document.getElementById('domain-privacy-toggle-container');
    const submitButton = document.getElementById('submitDomainQuery');

    if (!toggleContainer || !submitButton) {
        console.error("❌ Toggle container or submit button not found!");
        return;
    }

    console.log("✅ Showing Domain Privacy Protection Toggle...");

    let actionContainer = document.getElementById('action-container');
    if (!actionContainer) {
        actionContainer = document.createElement('div');
        actionContainer.id = 'action-container';

        // Insert before the submit button
        submitButton.parentNode.insertBefore(actionContainer, submitButton);

        // Move both elements inside
        actionContainer.appendChild(toggleContainer);
        actionContainer.appendChild(submitButton);
    }

    // Apply flex styles for one line input + toggle, and next line for submit button
    actionContainer.style.display = 'flex';
    actionContainer.style.flexDirection = 'row'; // Stack elements 
    actionContainer.style.gap = '10px'; // Space between elements
    actionContainer.style.width = '100%'; // Full width

    // Create a flex container for the toggle and the submit button
    const toggleWrapper = document.createElement('div');
    toggleWrapper.style.display = 'flex';
    toggleWrapper.style.alignItems = 'center'; // Align toggle and input

    // Style the toggle to take 40% width
    toggleContainer.style.width = '40%';

    // Add the toggle to the wrapper
    toggleWrapper.appendChild(toggleContainer);
    
    // Append the wrapper to the actionContainer
    actionContainer.appendChild(toggleWrapper);

    // Ensure submit button is on the next line, below the toggle
    actionContainer.appendChild(submitButton);

    // Ensure toggle container is visible
    toggleContainer.style.display = 'flex';
    toggleContainer.style.visibility = 'visible';
    toggleContainer.style.opacity = '1';

    console.log("Final computed style:", window.getComputedStyle(toggleContainer).display);
};

// Store the privacy protection state and domain globally
let domainForPrivacyProtection = null;
let isPrivacyProtectionEnabled = true;

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

function showDomainLockToggle() {
    const toggleContainer = document.getElementById('domain-lock-toggle-container');
    const submitButton = document.getElementById('submitDomainQuery');

    if (!toggleContainer || !submitButton) {
        console.error("❌ Lock toggle container or submit button not found!");
        return;
    }

    console.log("✅ Showing Domain Lock Toggle...");

    // Check if action container exists; if not, create it
    let actionContainer = document.getElementById('action-container');
    if (!actionContainer) {
        actionContainer = document.createElement('div');
        actionContainer.id = 'action-container';
        
        // Apply styles for proper alignment
        actionContainer.style.display = 'flex';
        actionContainer.style.alignItems = 'center';
        actionContainer.style.gap = '10px'; // Space between elements
        actionContainer.style.width = '100%';
        
        // Insert before the submit button
        submitButton.parentNode.insertBefore(actionContainer, submitButton);
    }

    // Append elements inside actionContainer
    actionContainer.appendChild(toggleContainer);
    actionContainer.appendChild(submitButton);

    // Ensure toggle container is visible
    toggleContainer.style.display = 'flex';
    toggleContainer.style.visibility = 'visible';
    toggleContainer.style.opacity = '1';

    // Set flex properties to align items properly
    toggleContainer.style.flexShrink = '0'; // Prevent shrinking
    submitButton.style.flexGrow = '1'; // Allow button to take remaining space

    console.log("Final computed style:", window.getComputedStyle(toggleContainer).display);
}

let domainToLock = null;
let isDomainLocked = true;

// Function to handle the toggle switch for domain lock/unlock
function handleDomainLockToggle(toggleElement) {
    let domain = document.getElementById('domain-query-text').value.trim();

    // Extract the actual domain name from the input
    const match = domain.match(/(?:lock|unlock) (\S+)/i);
    if (match) {
        domain = match[1]; // Extract the correct domain name
        console.log(`🔍 Extracted domain: ${domain}`);
    }

    if (!domain) {
        updateChatLog('❌ Please enter a valid domain before managing domain lock.', 'bot');
        toggleElement.checked = false; // Reset toggle to avoid confusion
        console.warn(`⚠️ No valid domain extracted, reverting toggle to: ${toggleElement.checked}`);
        return;
    }

    isDomainLocked = toggleElement.checked; 
    console.log(`🔒 [TOGGLE] Updated isDomainLocked: ${isDomainLocked}`);

    domainToLock = domain;
}

async function submitDomainLockRequest(domain, isDomainLocked) {
    const submitButton = document.getElementById('submitDomainQuery');
    const inputField = document.getElementById('domain-query-text');

    try {
        console.log(`🚀 [API REQUEST] Lock request for ${domain}. Lock: ${isDomainLocked}`);

        // Disable submit button while fetching
        submitButton.disabled = true;
        submitButton.textContent = "Processing...";

        const response = await fetch(`/api/lock-domain?domainName=${encodeURIComponent(domain)}&lock=${isDomainLocked}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to update domain lock status. Status: ${response.status}`);
        }

        const result = await response.json();

        // ✅ Ensure the response message is shown in the chat log **before** clearing input
        updateChatLog(result.message || '✅ Operation completed successfully.', 'bot');

        // ✅ Delay clearing the input slightly to allow chat log to update visually
        setTimeout(() => {
            inputField.value = "";
        }, 500);

        // ✅ Hide toggle container after successful request
        const toggleLockContainer = document.getElementById('domain-lock-toggle-container');
        if (toggleLockContainer) {
            toggleLockContainer.style.display = 'none';
        }

    } catch (error) {
        console.error('❌ [ERROR] While updating domain lock:', error);

        // ✅ Ensure error message is shown before re-enabling button
        updateChatLog('⚠️ An error occurred while processing your request.', 'bot');

    } finally {
        // ✅ Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = "Submit";
    }
}


//--------------------------------------------------- Suggest Category Section ------------------------------------------------------//

function sendCategoryToBackend(template) {
    // Extract the category from the template using regex or string manipulation
    const categoryMatch = template.match(/Category:\s*([\w\s-]+)/i);
    const category = categoryMatch ? categoryMatch[1].trim() : null;

    if (!category) {
        console.warn("No category found in the template.");
        return;
    }

    fetch('/api/category-suggestion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category: category }) // Send category as a JSON object
    })
    .then(response => response.json())
    .then(data => {
        console.log('Category submitted successfully:', data);
    })
    .catch(error => {
        console.error('Error submitting category:', error);
    });
}

// Extract closest matching action from the allowed actions
function extractActionName(userQuery) {
    const normalizedQuery = userQuery.toLowerCase().trim();
    return allowedActions.find(action => normalizedQuery.includes(action.toLowerCase())) || null;
}

//------------------------------------------- Submit Domain query after login Section ----------------------------------------------//

async function submitDomainQuery() {
    console.log("submitDomainQuery called"); 
    const submitButton = document.getElementById('submitDomainQuery'); // Replace with the actual button ID
    submitButton.disabled = true; // Disable button
    setTimeout(() => { submitButton.disabled = false; }, 3000);
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
          "Give me the list of domain registrars.",
          "Give me a list of high-value domain TLDs?",
          "Can you suggest TLDs for a selected category?",
          "What actions can I do here on the chatbot?",
          "How do I enable/disable privacy protection?",
          "How can I view the auth code for a domain?",
          "What are the name servers for this domain?",
          "How can I check available funds?",
          "How can I update the name servers for a domain?",
          "Where can I find the API documentation?",
          "Where can I find API for action name?",
          "How can I get a transaction report for a selected month?",
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
          }
          return;
      }
    
      const match = queryText.match(/\b(?:register|i want to register)\s+([\w-]+\.[a-z]{2,})/i);
      if (match) {
        const domainName = match[1]; // Extracted domain name
        console.log("Matched domain for registration:", domainName);
        updateChatLog("Before registering the domain check its availability by clicking check availability button.",'bot');
        // Show the renewal section & hide login section
        document.getElementById("domain-availability-section").style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";

        // Prefill the domain input field
        document.getElementById("check-domain-input").value = domainName;
    }
      
      const renewMatch = queryText.match(/\b(?:renew|renewal|can you renew|how (?:do|can) i renew|renew my|want to renew)\s+([\w-]+\.[a-z]{2,})\b/i);

     
    if (renewMatch) {
        const domainName = renewMatch[1]; // Extracted domain name
        console.log("Matched domain for renewal:", domainName);
        updateChatLog("Enter duration and click renew button to renew your domain seamlessly.",'bot');
        // Show the renewal section & hide login section
        document.getElementById("domain-renewal-section").style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";

        // Prefill the domain input field
        document.getElementById("renew-domain-name").value = domainName;
    }

    const transferMatch = queryText.match(/\btransfer\s+([a-zA-Z0-9-]+\.[a-z]{2,})/i);
    if (transferMatch) {
        const domainName = transferMatch[1]; // Extracted domain name
        console.log("Matched domain for transfer:", domainName);
        updateChatLog("Enter authcode(EPP code) and enable or disable Whois protection to transfer your domain to us seamlessly.",'bot');
        // Show the renewal section & hide login section
        document.getElementById("domain-transfer-section").style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";

        // Prefill the domain input field
        document.getElementById("transfer-domain-name").value = domainName;
    }

    if (queryText.match(/\bregistered\s+on\s+(\d{2}-\d{2}-\d{4})\b/i)) {
        try {
            // Extract the date from the query
            const dateMatch = queryText.match(/(\d{2}-\d{2}-\d{4})/);
            if (!dateMatch) {
                updateChatLog("⚠️ Please specify a valid date in the format dd-mm-yyyy.", 'bot');
                return;
            }
    
            const inputDate = dateMatch[1];  // "05-03-2025"
            console.log(`Fetching registered domains for date: ${inputDate}`);
    
            // Fetch domain registration data
            const response = await fetch(`/api/registrationdate-domains?date=${encodeURIComponent(inputDate)}`);
    
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('Registered domains response:', data);
    
            if (data.success && data.domains.length > 0) {
                let message = `📅 Domains Registered on ${inputDate}:\n`;
    
                // Convert timestamps to human-readable date
                const formattedDate = new Date(inputDate.split('-').reverse().join('-'));
                formattedDate.setHours(0, 0, 0, 0);
    
                // Filter domains based on exact date match
                const matchedDomains = data.domains.filter(domain => {
                    const creationTimestamp = domain.creationDate;
                    const domainTimestamp = creationTimestamp.toString().length === 10 ? creationTimestamp * 1000 : creationTimestamp;
                    const domainCreationDate = new Date(domainTimestamp);
                    domainCreationDate.setHours(0, 0, 0, 0);
                    return domainCreationDate.getTime() === formattedDate.getTime();
                });
    
                if (matchedDomains.length > 0) {
                    matchedDomains.forEach(domain => {
                        message += `🔹 ${domain.domainName} \n`;
                    });
                } else {
                    message = `⚠️ No domains were registered on ${inputDate}.`;
                }
    
                updateChatLog(message, 'bot');
            } else {
                updateChatLog(`⚠️ No domains were registered on ${inputDate}.`, 'bot');
            }
    
        } catch (error) {
            console.error("Error fetching registered domains:", error);
            updateChatLog("❌ Unable to fetch registered domains at this time.", 'bot');
        }
    
        queryInput.value = ""; // Clear input after processing
        return;
    }
    

    const expiringDomainMatch = queryText.match(/\b(getting\s+expired|expire|expiring|expiry)\s+(on|by|before)?\s*(\d{2}-\d{2}-\d{4})\b/i);

    if (expiringDomainMatch) {
        const selectedDate = expiringDomainMatch[3].trim();
    
        try {
            console.log(`📡 Fetching expiring domains for: ${selectedDate}`);
            const response = await fetch(`/api/expiring-domains?date=${encodeURIComponent(selectedDate)}`);
            
            console.log(`🔄 API Request URL: /api/expiring-domains?date=${encodeURIComponent(selectedDate)}`);
            
            if (!response.ok) {
                throw new Error(`❌ Failed to fetch data. Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('📥 API Response Data:', data); // Debugging log
    
            if (data.success && data.domains.length > 0) {
                let message = `⏳ Domains Expiring on ${selectedDate}:\n`;
    
                data.domains.forEach(domain => {
                    message += `🔹 ${domain.domainName} \n`;
                });
    
                updateChatLog(message, 'bot');
            } else {
                console.log(`⚠️ No domains found for ${selectedDate}`);
                updateChatLog(`⚠️ No domains are expiring on ${selectedDate}.`, 'bot');
            }
        } catch (error) {
            console.error("❌ Error fetching expiring domains:", error);
            updateChatLog("❌ Unable to fetch expiring domains at this time.", 'bot');
        }
    
        queryInput.value = "";
        return;
    }
        
    const deletedDomainMatch = queryText.match(/\b(?:which\s+domains\s+(?:are\s+)?)?(getting\s+)?(deleted|deleting|removing|removed)\s+(on|by|before)?\s*(\d{2}-\d{2}-\d{4})\b/i);

console.log("🔎 Checking for deleted domain match in query:", queryText);
console.log("🔍 Regex Match Result:", deletedDomainMatch);

if (deletedDomainMatch) {
    const selectedDate = deletedDomainMatch[4]?.trim(); // Ensure correct capture group

    console.log("📅 Extracted Deletion Date:", selectedDate);

    if (!selectedDate) {
        console.error("❌ No valid date extracted from query.");
        return;
    }

    // Convert "DD-MM-YYYY" to a Date object
    const [day, month, year] = selectedDate.split("-").map(Number);
    const selectedDateObj = new Date(year, month - 1, day);

    // Subtract 41 days
    selectedDateObj.setDate(selectedDateObj.getDate() - 41);

    // Format back to "DD-MM-YYYY"
    const expirationDate = selectedDateObj
        .toLocaleDateString("en-GB") // Ensures "DD-MM-YYYY" format
        .split("/")
        .join("-");

    console.log("📅 Expiration Date:", expirationDate);


    console.log(`📡 Fetching domains expired on: ${expirationDate} (to check for deletion on ${selectedDate})`);

    try {
        const response = await fetch(`/api/expiring-domains?date=${encodeURIComponent(expirationDate)}`);

        console.log(`🔄 API Request URL: /api/expiring-domains?date=${encodeURIComponent(expirationDate)}`);

        if (!response.ok) {
            throw new Error(`❌ Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 API Response Data:', data);

        if (data.success && data.domains.length > 0) {
            let message = `⏳ Domains deleting on ${selectedDate}:\n`;

            data.domains.forEach(domain => {
                message += `🔹 ${domain.domainName} \n`;
            });

            updateChatLog(message, 'bot');
        } else {
            console.log(`⚠️ No domains found for ${selectedDate}`);
            updateChatLog(`⚠️ No domains are expiring on ${selectedDate}.`, 'bot');
        }

            updateChatLog(message.trim() === `⏳ Domains Getting Deleted on ${selectedDate}:\n` 
                ? `⚠️ No domains are getting deleted on ${selectedDate}.` 
                : message, 'bot');
    } catch (error) {
        console.error("❌ Error fetching deleted domains:", error);
    }

    queryInput.value = "";
}

const tldMatch = queryText.match(/\b(?:give|suggest|available|recommend|show|list|fetch|get)\s+(?:TLDs|domains|extensions|suggestions|tlds)\s*(?:for|to)?\s*([\w-]+)(?:\.([a-z]{2,}))?\??\b/i);

if (tldMatch) {
    const baseName = tldMatch[1].trim();  // Extract base name (e.g., "domain")
    const originalTLD = tldMatch[2] ? tldMatch[2].trim() : null; // Extract original TLD if provided

    try {
        console.log('Fetching TLD suggestions for:', baseName);

        const response = await fetch(`/api/tld-suggestions?websiteName=${encodeURIComponent(baseName)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch TLDs. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('TLD Suggestions Response:', data);

        if (data.success && data.tldList.length > 0) {
            let message = `🌍 Suggested TLDs for ${baseName}:\n`;

            // Extract top 10 results, excluding the original TLD if present
            const filteredTLDs = data.tldList
                .map(tld => tld.websiteName.split('.').pop()) // Extract only TLD part
                .filter(tld => !originalTLD || tld !== originalTLD) // Remove original TLD if given
                .slice(0, 10); // Limit to 10 suggestions

            if (filteredTLDs.length > 0) {
                filteredTLDs.forEach(tld => {
                    message += `🔹 ${baseName}.${tld}\n`;
                });

                updateChatLog(message, 'bot');
            } else {
                updateChatLog(`⚠️ No alternative TLDs found for ${baseName}.`, 'bot');
            }
        } else {
            updateChatLog(`⚠️ No TLD suggestions found for ${baseName}.`, 'bot');
        }
    } catch (error) {
        console.error("Error fetching TLD suggestions:", error);
        updateChatLog("❌ Unable to fetch TLD suggestions at this time.", 'bot');
    }

    queryInput.value = "";  // Reset query input field
    return;
}


      const apiQueryMatch = queryText.match(/where can I find API for (.+)/i);

      if (apiQueryMatch) {
          const actionName = apiQueryMatch[1].trim();
          console.log('Detected API request for action:', actionName);
  
          try {
              const response = await fetch('/api/get-api-details', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: actionName })
              });
  
              const data = await response.json();
              if (data.success) {
                  console.log("API Details:", data.answer);
              } else {
                  console.warn("No API details found.");
              }
          } catch (error) {
              console.error("Error fetching API details:", error);
          }
      }

    // Handle domain information request
    const domainInfoMatch = queryText.match(/\b(?:give me|can you give me|i need|get me|fetch|show)?\s*(?:domain (?:info(?:rmation)?|details))\s*for\s+([\w.-]+\.[a-z]{2,})/i);
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

    const authCodeMatch = queryText.match(/what is the auth code for (.+)/i);
    if (authCodeMatch) {
        const domainName = authCodeMatch[1].trim();

        try {
            console.log('Fetching auth code for:', domainName);
            const response = await fetch(`/api/domain-auth-code?domain=${encodeURIComponent(domainName)}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Auth code response:', data);

            if (data.success) {
                console.log('Auth Code:', data.authCode);
                updateChatLog(`Auth Code for ${domainName}: ${data.authCode}`, 'bot');
            } else {
                updateChatLog(`${data.message}`, 'bot');
            }          

        } catch (error) {
            console.error("Error fetching auth code:", error);
            updateChatLog("Unable to fetch auth code at this time.", 'bot');
        }

        document.getElementById("domain-query-text").value = "";
    }

    const domainregisterMatch = queryText.match(/when was (.+) domain registered/i);
    if (domainregisterMatch) {
        const domainName = domainregisterMatch[1].trim();

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
                
                const timestamp = data.domainData.creationDate;
                let registrationDate = "Not available";
            
                if (timestamp) {
                    registrationDate = new Date(timestamp).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    });
                }
            
                updateChatLog(
                    `The domain ${domainName} was registered on ${registrationDate}.`,
                    'bot'
                );
            }
            

        } catch (error) {
            console.error("Error fetching domain details:", error);
            updateChatLog("Unable to fetch domain details at this time.", 'bot');
        }

        document.getElementById("domain-query-text").value = "";

        return;
    }

    const balanceMatch = queryText.match(/\b(?:what(?:'s| is)?|show|check|get|tell me|fetch)?\s*(?:my|the)?\s*(?:current|available)?\s*(?:balance|funds|amount|money|credit|account balance)\b/i);
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
        // Apply a temporary loading style
        const button = document.getElementById("submitDomainQuery");
        button.style.backgroundColor = "#ccc"; // Disable look
        button.style.cursor = "not-allowed";
    
        await submitTheftProtectionRequest(domainForTheftProtection, isTheftProtectionEnabled);
    
        // Reset styles after submission
        button.style.backgroundColor = "#007bff";
        button.style.cursor = "pointer";
    
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
    }
    hideTooltipOnInput();
}

//----------------------------------------------- Back button after verification --------------------------------------------------//

function goBackToQuerySection() {
    console.log("Navigating back to query section...");
  
    // Show the query section
    document.getElementById('login-chat-section').style.display = 'flex';
    document.getElementById('domain-query-text').value = '';
    console.log("login-chat-section is now visible");
  
    // Hide the other sections
    const sectionsToHide = ['domain-section', 'domain-options', 'domain-options-next', 'domain-registration-section' , 'domain-transfer-section' , 'domain-renewal-section' , 'domain-availability-section' , 'name-server-update-section', 'add-child-name-server-section'];
  
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
        document.removeEventListener("click", outsideClickListener);
        return;
    }

    // Create info box
    let infoBox = document.createElement("div");
    infoBox.id = "info-box";
    infoBox.innerHTML = `
        <p>This platform offers domain management features and customer support, including a chatbot for assistance.</p>
        <button id="info-close-btn">OK</button>
    `;

    // Position the box near the info button
    let header = document.querySelector(".header");
    header.appendChild(infoBox);

    // Close when clicking outside the info box
    setTimeout(() => {
        document.addEventListener("click", outsideClickListener);
    }, 0);

    // Close when clicking the "OK" button
    document.getElementById("info-close-btn").addEventListener("click", closeInfo);
}

// Function to close info box
function closeInfo() {
    let infoBox = document.getElementById("info-box");
    if (infoBox) {
        infoBox.remove();
        document.removeEventListener("click", outsideClickListener);
    }
}

// Function to close info box when clicking outside of it
function outsideClickListener(event) {
    let infoBox = document.getElementById("info-box");
    let infoButton = document.getElementById("info-button"); // Ensure your button has this ID

    if (infoBox && !infoBox.contains(event.target) && event.target !== infoButton) {
        closeInfo();
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
  document.getElementById('signup-text').style.display = 'none';
  document.getElementById('login-text').style.display = 'flex' ; 
  document.getElementById('user-input-section').style.display = 'flex';
  document.getElementById('initial-message').style.display = 'flex';  
}

async function getDomainId(domainName) {
    return 1; // Replace with actual API call if needed
}
