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
document.getElementById("submitDomainQuery").style.borderRadius="20px"
document.getElementById("submit-question").style.borderRadius="20px"
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
        emailMessage.textContent = 'Please enter your registered email ID 📩 to continue.';
        chatLog.appendChild(emailMessage);
    } else {
        // Hide the email section
        emailSection.style.display = 'none';
    }
}

function requestOTP() {
    const email = document.getElementById("user-email").value.trim();
    const testEmails = ['aichatbot@iwantdemo.com', 'itec.rw@iwantdemo.com']; // ✅ List of test emails

    if (testEmails.includes(email)) { // ✅ Proper condition
        // 🌟 Tell backend that the special user is signed in
        fetch('/api/mock-authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                clearchatlog();
                document.getElementById('domain-query-text').value = ''; // Reset the input field
                updateChatLog("Thank you for signing in 😊. You're all set to explore our 🚀 advanced features, including domain registration, renewal, transfer, and so much more.", 'bot');
                
                // Hide login elements
                document.getElementById('login-text').style.display = 'none';
                document.getElementById('signup-text').style.display = 'none';
                document.getElementById('profile-icon').style.display = 'none';
                document.getElementById('email-section').style.display = 'none';
                document.getElementById('otp-section').style.display = 'none';
                document.getElementById('login-chat-section').style.display = 'flex';
                document.getElementById('sidebar').style.display = 'flex';
                document.getElementById('sidebar-content').style.display = 'none';
                document.getElementById('faq-post-login').style.display = 'flex';

                isSignedIn = true;
                localStorage.setItem('isSignedIn', 'true');
                updateAuthUI();
                toggleSidebar();
            } else {
                updateChatLog("Authentication failed. Please try again.", 'bot');
                document.getElementById("user-email").value = "";
            }
        })
        .catch(error => {
            console.error("Error during authentication:", error);
            updateChatLog("An error occurred while signing in. Please try again.", 'bot');
        });

        return;
    }

    // Normal authentication flow
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
const sidebar=document.getElementById('sidebar');

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
        sidebar.style.display = 'block';
        if (sidebar) sidebar.classList.remove("collapsed");

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
        

        updateChatLog("Thank you for signing in 😊. You're all set to explore our 🚀 advanced features, including domain registration, renewal, transfer, and so much more. ", 'bot');
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

  const faqPostLoginVisible = document.getElementById('faq-post-login')?.style.display === 'flex';
  
  // List of predefined messages to skip
  const skipMessages = [
      "Create an account today to gain access to our platform and manage your domains effortlessly. Take control of your domain portfolio now!",
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!",
      "Please login/signup to access all the features.",
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!",
      "You can sign up by providing your email and setting up an account with us.",
      "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
      "Yes, an account is required for some advanced features.",
      "To create an account, click the Sign Up button and provide your basic details. If you are already registered, simply log in.",
      "Yes, we offer a comprehensive API for domain management. Signup/Login to access all features."
  ];

  // Skip showing predefined messages if faq-post-login is visible
  if (faqPostLoginVisible && skipMessages.includes(message)) {
    return; // Exit the function if message should be skipped
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

  function addButton(buttonText, className, ...sectionIds) {
    const button = document.createElement('button');
    button.textContent = buttonText;
    button.classList.add(className);

    button.onclick = () => {
        const loginChatSection = document.getElementById('login-chat-section');

        // Show all specified sections
        sectionIds.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.style.display = "flex";
            }
        });

        // Hide the login chat section
        if (loginChatSection) {
            loginChatSection.style.display = "none";
        }
    };

    document.body.appendChild(button); // Append button to the body (or any other container)


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
       &&  !message.includes("Before registering the domain, check its availability by clicking the 'Check Availability' button.") &&
       !document.querySelector('.chat-log').innerText.includes("Before registering the domain") // ✅ Directly checks chat history
  ) {
    if (!document.getElementById("register-button")) { // Prevent duplicate buttons
    addButton("Register a Domain", "register-button", "domain-availability-section");
    document.getElementById("check-domain-button").style.borderRadius = "20px";
    document.getElementById("domain-availability-section").style.gap = "0px";
    }
  }
  window.preventRegisterButton = false;

  // Transfer a domain
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.toLowerCase().includes("transfer a domain") || message.includes("domain transfer") || message.includes("To transfer a domain to us")) || message.includes("How can I move a domain?") || message.includes("To pull a domain, initiate a domain transfer by obtaining the authorization code (EPP code) from the current registrar, unlocking the domain, and requesting the transfer to us by clciking on the transfer button below.") &&
      !message.includes("Yes, you can transfer your domains") &&
      !message.includes("Thank you for signing in!") && message !== "How can I move a domain?"
      && !message.includes("Please enter the domain name and select 'Lock' or 'Unlock' from the dropdown, then click 'Update Lock Status'.")
  ) {
      addButton("Transfer a Domain", "transfer-button", "domain-transfer-section");
      document.getElementById("transfer-whois-protection-input").style.width="calc(50% - 7px)";
  }

  // Check domain availability
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.toLowerCase().includes("Check domain availability") || message.toLowerCase().includes("domain availability") || message.toLowerCase().includes("I can help you with checking domain availability!")) &&
      !message.includes("This platform helps with domain registration, transferring domain name") && message!='🔍 Checking domain availability...' && message!="⚠️ Error checking domain availability. Please try again later."
  ) {
      addButton("Check Domain Availability", "available-button", "domain-availability-section");
  }

  // Update name servers
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.includes("update the name servers") || message.includes("update name servers") || message.includes("Go to your domain management panel, find DNS settings, and update the name servers accordingly."))
      && !message.includes("🔄 Please enter the domain name and the name servers that need to be updated. You can add more name servers by clicking '➕ Add Name Server' button. Maximum 4 name servers can be added. Then click '🖊 Update Name Server' button to save the changes.")
    ) {
        addButton("Update Name Servers", "update-button", "name-server-container", "name-server-update-section");
      document.getElementById("nameserver-container").style.width = "100%";
      document.getElementById("name-server-update-section").style.display = "flex"; 
      document.getElementById("update-nameserver-button-group").style.width = "100%";
      document.getElementById("addNameServer").style.borderRadius = "5px";
      document.getElementById("addNameServer").style.fontSize = "10px";
      document.getElementById("addNameServer").style.height = "90%";
      document.getElementById("updateNameServer").style.fontSize = "10px";
      document.getElementById("updateNameServer").style.height = "90%";
      document.getElementById("updateNameServer").style.borderRadius = "5px";
      document.getElementById("chat-log").style.height = "60%";
      document.getElementById("updatenamebackbutton").style.fontSize = "12px";
      document.getElementById("updatenamebackbutton").style.height = "90%";
      document.getElementById("domain-name-input").style.height = "85%";
      document.getElementById("nameserver-container").style.marginTop = "-10px";
  }

  // Renew a domain
  if (
      sender === 'bot' && isUserSignedIn &&
      (message.toLowerCase().includes("renew a domain") || message.includes("To seamlessly renew your domain name"))
  ) {
      addButton("Renew a Domain", "renew-button", "domain-renewal-section");
      document.getElementById("domain-renewal-wrapper").style.columnGap= "8px";
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
    document.getElementById("registerchildnameserver").style.fontSize = "5px";
    document.getElementById("registerchildnameserver").style.borderRadius = "5px";
    document.getElementById("addchildnameserver").style.fontSize = "5px";
    document.getElementById("addchildnameserver").style.borderRadius = "5px";
    let buttons = document.getElementsByClassName("chat-input-button");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.borderRadius = "5px";
    }
    let buttonGroups = document.getElementsByClassName("button-group-child");

    // Loop through each element and apply the styles
    for (let i = 0; i < buttonGroups.length; i++) {
        buttonGroups[i].style.height = "50px"; // Adjust the height as needed
        buttonGroups[i].style.fontSize = "16px"; // Adjust the font size as needed
    }
    document.getElementById("child-ns-button").addEventListener("click", () => {
        updateChatLog("🛠️ Enter Domain Name, Hostname, and IP Address for the child nameserver. You can add upto 4 child nameservers using the '➕Add Child Name Server' button.", "bot");
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
      "Create an account today to gain access to our platform and manage your domains effortlessly. Take control of your domain portfolio now!",
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!",
      "Please login/signup to access all the features.",
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!",
      "You can sign up by providing your email and setting up an account with us.",
      "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
      "Yes, an account is required for some advanced features.",
      "To create an account, click the Sign Up button and provide your basic details. If you are already registered, simply log in.",
      "Yes, we offer a comprehensive API for domain management. Signup/Login to access all features.",
      "To get additional services click on the login/signup button below and manage your domains seamlessly."
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

// ✅ Function to fill chat input with user question
function fillChatInput(question) {
    console.trace("🔍 fillChatInput() CALLED! Stack trace:");

    const userInput = document.getElementById("user-question");
    const userInput2 = document.getElementById("domain-query-text");

    if (!userInput || !userInput2) {
        console.error("❌ Chat input fields not found!");
        return;
    }

    const normalizedQuestion = question.trim().toLowerCase();
    const normalizedUserInput = userInput.value.trim().toLowerCase();
    const normalizedUserInput2 = userInput2.value.trim().toLowerCase();

    console.log("🔍 Checking for duplicates...");
    console.log("🔹 Normalized Input 1:", normalizedUserInput);
    console.log("🔹 Normalized Input 2:", normalizedUserInput2);
    console.log("🔹 Normalized Question:", normalizedQuestion);

    if (normalizedUserInput === normalizedQuestion && normalizedUserInput2 === normalizedQuestion) {
        console.warn("❌ Duplicate question detected, ignoring...");
        return;
    }

    console.log("✅ Updating chat input...");
    userInput.value = "";
    userInput2.value = "";
    console.log("🗑 Cleared input fields before setting new value.");

    setTimeout(() => {
        userInput.value = question;
        userInput2.value = question;
        userInput.focus();
        console.log("✍️ Input fields updated with:", question);
    }, 10);
}

let tooltipDomain = null;
let tooltipDate = null;
let tooltipCategory = null;

function fillChatInputWithPlaceholder(template) {
    console.log("🟢 Function call: fillChatInputWithPlaceholder()");
    console.log("🔹 Received template:", template);

    const chatInput = document.getElementById('domain-query-text');
    const submitButton = document.getElementById('submitDomainQuery');
    const lockToggle = document.getElementById('domain-lock-dropdown-container');
    const suspendToggle = document.getElementById('domain-suspend-toggle-container');
    const privacyToggle = document.getElementById('domain-privacy-dropdown');

    if (!chatInput) {
        console.error("❌ Chat input field not found!");
        return;
    }

    console.log("📌 Current Chat Input Value:", chatInput.value.trim());

    // Avoid triggering multiple times
    if (chatInput.value.trim() === template.trim()) {
        console.warn("⚠️ Duplicate template detected, ignoring...");
        return;
    }

    chatInput.value = template;
    chatInput.focus();
    console.log("✅ Chat input updated with:", template);

    // Highlight "mydomain.com" and show tooltip
    tooltipDomain = highlightPlaceholder(chatInput, template, "mydomain.com", "Enter your domain name here.", tooltipDomain);
    autoHideTooltip(tooltipDomain);
    console.log("📢 Tooltip updated for 'mydomain.com'.");

    // Extract action name and fetch API details
    const actionName = extractActionName(template);
    console.log("📌 Extracted Action Name:", actionName);

    if (actionName) {
        console.log("🔄 Fetching API details for action:", actionName);
        getAPIDetails(template, actionName);
    } else {
        console.log("❌ No action name detected.");
    }

    // Always show submit button
    submitButton.style.display = 'block';
    console.log("🚀 Submit button made visible");

    // Lock Toggle
    if (!lockToggle) {
        console.error("❌ Lock toggle container not found! Check the HTML ID.");
    } else {
        console.log("✅ Lock toggle container found.");
        if (/how do I (lock|unlock)\/?(lock|unlock)? (.+)/i.test(template)) {
            lockToggle.style.display = 'block';
            console.log("🔒 Lock toggle displayed.");
        } else {
            lockToggle.style.display = 'none';
            console.log("🔒 Lock toggle hidden.");
        }
    }

    // Privacy Toggle
    if (!privacyToggle) {
        console.error("❌ Privacy toggle container not found! Check the HTML ID.");
    } else {
        if (/privacy protection (.+)/i.test(template)) {
            privacyToggle.style.display = 'block';
            console.log("🛡 Privacy toggle displayed.");
        } else {
            privacyToggle.style.display = 'none';
            console.log("🛡 Privacy toggle hidden.");
        }
    }

    // Suspend Toggle
    if (!suspendToggle) {
        console.error("❌ Suspend toggle container not found! Check the HTML ID.");
    } else {
        if (/suspend domain (.+)/i.test(template)) {
            suspendToggle.style.display = 'block';
            console.log("⏸ Suspend toggle displayed.");
        } else {
            suspendToggle.style.display = 'none';
            console.log("⏸ Suspend toggle hidden.");
        }
    }

    console.log("✅ fillChatInputWithPlaceholder execution completed.");
}


function highlightPlaceholder(inputElement, template, placeholder, tooltipText, tooltipRef) {
    let startPos = template.indexOf(placeholder);
    let endPos = startPos !== -1 ? startPos + placeholder.length : -1;

    if (startPos !== -1) {
        setTimeout(() => {
            inputElement.setSelectionRange(startPos, endPos);
        }, 10);

        inputElement.classList.add("highlight-input");
    } else {
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
        let charWidth = fontSize * 0.6;
        let placeholderX = rect.left + window.scrollX + startPos * charWidth;
        let placeholderY = rect.top + window.scrollY - 40;

        tooltipRef.style.left = `${placeholderX}px`;
        tooltipRef.style.top = `${placeholderY}px`;
    }

    return tooltipRef;
}

function autoHideTooltip(tooltipRef) {
    // Auto hide tooltip after 5 seconds
    setTimeout(() => {
        if (tooltipRef) {
            tooltipRef.remove();
            tooltipRef = null;
        }
    }, 5000);
}

function fillChatInputWithPlaceholderDate(template) {
    const chatInput = document.getElementById('domain-query-text');
    chatInput.value = template;
    chatInput.focus();

    // Highlight "dd-mm-yyyy" and show tooltip
    tooltipDate = highlightPlaceholder(chatInput, template, "dd-mm-yyyy", "Enter a valid date (dd-mm-yyyy).", tooltipDate);
    autoHideTooltip(tooltipDate);
}

function fillChatInputWithPlaceholderCategory(template) {
    const chatInput = document.getElementById('domain-query-text');
    chatInput.value = template;
    chatInput.focus();

    // Highlight "Category" or "DomainName" for user input
    tooltipCategory = highlightPlaceholder(chatInput, template, "Category", "Enter a category.", tooltipCategory);
    autoHideTooltip(tooltipCategory);
}

//------------------------------------------------------ Domain Theft Section --------------------------------------------------------//

function manageTheftProtection() {
    const domainName = document.getElementById("theft-protection-domain-name").value;
    const action = document.getElementById("theft-protection-dropdown").value;

    if (!domainName || !action) {
        updateChatLog("⚠️ Please enter a domain name and select an action.", "bot");
        return;
    }

    updateChatLog(`🔄 Processing Theft Protection for ${domainName}...`, "bot");

    // Convert action to boolean for backend
    const isEnabled = action === "enabled";

    console.log(`🔒 Managing Theft Protection for ${domainName}: ${isEnabled ? "Enabled" : "Disabled"}`);
    disableChat();
    // Send API request
    fetch(`/api/manage-theft-protection?domainName=${domainName}&enable=${isEnabled}`)
    .then(response => response.json())
    .then(data => {
        console.log("📩 Full API Response:", data); // ✅ Logs full response

        // Check if Theft Protection is already in the requested state
        if (data.fullResponse?.responseMsg?.message === "Domain Theif Manage Failed" &&
            data.fullResponse?.responseData?.message === "Theif protection failed") {

            const statusText = isEnabled ? "already enabled" : "already disabled";
            updateChatLog(`⚠️ Theft Protection is ${statusText} for ${domainName}.`, "bot");
        } 
        // If request was successful
        else if (data.success) {
            const statusText = isEnabled ? "enabled" : "disabled";
            updateChatLog(`🔐 Theft Protection for ${domainName} ${statusText} successfully.`, "bot");
        } 
        // For any other failure, show responseData.message
        else {
            updateChatLog(`⚠️ ${data.fullResponse?.responseData?.message || "An unexpected error occurred."}`, "bot");
        }

    })
    .catch(error => {
        console.error("❌ Error managing theft protection:", error);
        updateChatLog("⚠️ Unable to update theft protection at this time.", "bot");
    })
    .finally(() => {
        // Re-enable chat after request is complete
        enableChat();

        // Hide section & reset input
        document.getElementById('theft-protection-section').style.display = "none";
        document.getElementById('login-chat-section').style.display = "flex";
        document.getElementById('domain-query-text').value = "";
    });
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
        // Ensure the domain starts with "www." if not already present
        if (!domainName.startsWith("www.")) {
            domainName = `www.${domainName}`;
        }

        console.log(`Checking domain availability for: ${domainName}`);

        const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/checkdomainavailable?APIKey=${process.env.CONNECT_RESELLER_API_KEY}&websiteName=${domainName}`;

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
    suggestionData = []; // Reset stored suggestions
    suggestionIndex = 0; // Reset index

    let domainInput = document.getElementById("check-domain-input").value.trim();
    
    if (!domainInput) {
        alert("Please enter a domain name.");
        return;
    }

    // Ensure the domain starts with "www."
    if (!domainInput.startsWith("www.")) {
        domainInput = `www.${domainInput}`;
    }

    updateChatLog("🔍 Checking domain availability...", "bot");

    try {
        console.log("🔵 Sending request to API...");
        const response = await fetch(`/api/check-domain?domain=${domainInput}`);

        console.log("🟡 Response received:", response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("🟢 Parsed JSON response:", data);

        if (data.message.includes("Error checking domain availability")) {
            throw new Error(data.message);
        }

        if (!data.hasOwnProperty("available")) {
            throw new Error("Missing 'available' property in API response.");
        }

        console.log("🔍 Checking domain availability:", data.available);

        if (data.available) {
            console.log("✅ Domain is available. Showing message...");
            updateChatLog(`✅ ${domainInput} is available for registration!<br>Do you want to register this domain?<div style="display: flex; gap: 10px; margin-top: 5px;"><button onclick="handleYesClick('${domainInput}')" style="padding:8px 12px; border:none; cursor:pointer; background-color:#008CBA; color:white; border-radius:5px;">Yes</button><button onclick="handleNoClick()" style="padding:8px 12px; border:none; cursor:pointer; background-color:#ccc; color:#000; border-radius:5px;">No</button></div>`, 'bot');
        } else {
            console.log("❌ Domain is taken. Showing message...");
            updateChatLog(`❌ ${domainInput} is already taken. Try another name?<br><div style="display: flex; gap: 10px; margin-top: 5px;"><button onclick="handleTryAnother()" style="padding:8px 12px; border:none; cursor:pointer; background-color:#008CBA; color:white; border-radius:5px;">Try Another Name</button><button onclick="handleSuggestAlternatives('${domainInput}')" style="padding:8px 12px; border:none; cursor:pointer; background-color:#ccc; color:#000; border-radius:5px;">Suggest Alternatives</button></div>`, 'bot');
        }

        scrollToBottom();
    } catch (error) {
        console.error("❌ Caught an error inside try block:", error);
        updateChatLog("⚠️ Error checking domain availability. Please try again later.", "bot");
    }
}

function handleYesClick(domainInput) {
    console.log("✅ Yes button clicked!");
    document.getElementById("domain-availability-section").style.display = "none";
    document.getElementById("login-chat-section").style.display = "none";

    const domainRegistrationSection = document.getElementById("domain-registration-section");
    if (domainRegistrationSection) {
        domainRegistrationSection.style.display = "flex";
        document.getElementById("domain-name").value = domainInput;
    } else {
        console.error("❌ 'domain-registration-section' NOT found in the DOM!");
    }
}

function handleNoClick() {
    updateChatLog("Okay! Let me know if you need anything else. 😊", "bot");
}

function handleTryAnother() {
    const domainInputField = document.getElementById("check-domain-input");
    if (domainInputField) {
        domainInputField.value = ""; // Clear input
        domainInputField.focus(); // Refocus
    } else {
        console.error("❌ 'check-domain-input' NOT found in the DOM!");
    }
}

function handleSuggestAlternatives(domainInput) {
    if (typeof fetchDomainSuggestions === "function") {
        fetchDomainSuggestions(domainInput);
    } else {
        console.error("❌ 'fetchDomainSuggestions' function is missing!");
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

        noButton.onclick = () => { addChatMessage("bot", "Okay! Let me know if you need anything else. 😊");
            document.getElementById("domain-availability-section").style.display= "none";
            document.getElementById("domain-registration-section").style.display = 'none';
            document.getElementById("login-chat-section").style.display = 'flex';
            document.getElementById("login-chat-section").value = '';
        }

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
        // Ensure "www." is removed before sending
        if (domainInput.startsWith("www.")) {
            domainInput = domainInput.replace(/^www\./, "");
        }

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
            suggestionMessage += `<br>${suggestionNumber}.<a href="#" onclick="event.preventDefault(); selectDomain('${suggestion.domainName}')" style="color: white; text-decoration: underline;">${suggestion.domainName}</a> -💰 $${suggestion.price}`;
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
    document.getElementById("domain-registration-wrapper").style.columnGap= "8px";
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
        document.getElementById('closeadditionaldomaindetails').style.fontSize = '12px';
        document.getElementById('registerDomain').style.fontSize = '12px';
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
        const chatContainer = document.getElementById('chat-container');
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
            document.getElementById('domain-query-text').value = '';
            document.getElementById('additional-settings-section').style.display = 'none';
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
      chatContainer.style.opacity = "0.75";
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
    position: relative;
    left: 28%;
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
        document.getElementById('domain-query-text').value = '';

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
    document.getElementById('login-chat-section').value = '';
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
        if (window.matchMedia("(max-width: 768px)").matches) {
            document.getElementById("chat-log").style.height = "45%";
        }
        if (window.matchMedia("(max-width: 400px)").matches) {
            document.getElementById("chat-log").style.height = "40%";
        }
        document.getElementById("chat-log").style.height = "55%";
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
    updateChatLog("⏳ Updating name servers... Please wait ", "bot");
    disableChat();
   
    let apiUrl = `/update-name-servers?domainName=${encodeURIComponent(domain)}&nameServers=${encodeURIComponent(JSON.stringify(nameServers))}`;

    console.log("[FRONTEND] 📡 Sending request:", apiUrl);

    try {
        const response = await fetch(apiUrl);
        const result = await response.json();
        console.log("[FRONTEND] 🌐 Server Response:", result);
        enableChat();
        if (result.success) {
            showNameServerPopup("Name Servers updated successfully!", true);
            updateChatLog("✅ Name Servers updated successfully!");
            document.getElementById("name-server-container").style.display = "none";
            document.getElementById("login-chat-section").style.display = "flex";
        } else {
            showNameServerPopup("Failed to update Name Servers: " + (result.message || "Unknown error."), false);
            updateChatLog("❌ Failed to update Name Servers");
            resetNameServers();
            document.getElementById("name-server-container").style.display = "none";
            document.getElementById("login-chat-section").style.display = "flex";
        }
    } catch (error) {
        console.error("[FRONTEND] ❌ Error:", error);
        showNameServerPopup("Error connecting to server.", false);
        updateChatLog("❌ Error connecting to server.");
        resetNameServers();
    }
}

function resetNameServers() {
    const container = document.getElementById("nameserver-container");

    // Keep only the first input, remove others
    while (container.children.length > 1) {
        container.removeChild(container.lastChild);
    }

    // Reset the name server count
    nameServerCount = 1;

    console.log("🔄 Name servers reset to default (only 1 field).");
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
    updateChatLog(message, 'bot'); // Update chat log with the message

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
        enableChat(); // Re-enable chat interaction

        // Ensure the login chat section is displayed again
        document.getElementById("login-chat-section").style.display = "flex"; 
        document.getElementById("login-chat-section").value = ""

        // If the request was successful, hide the "add-child-name-server-section"
        if (isSuccess) {
            document.getElementById("add-child-name-server-section").style.display = "none";
        }
    });

    content.appendChild(closeButton);
    popup.appendChild(content);
    document.body.appendChild(popup);

    // Auto-hide popup after 5 seconds and re-enable chat
    setTimeout(() => {
        popup.remove();
        enableChat();
        document.getElementById("login-chat-section").style.display = "flex"; 
        document.getElementById("domain-text-query").value = "";// Ensure visibility
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

    // Disable chat while processing the request
    disableChat();

    // Update chat log to inform the user that we're registering child name servers
    updateChatLog(`🚀 Registering child name servers for domain: ${domain}`, 'bot');

    for (const ns of nameServers) {
        const apiUrl = `/add-child-ns?domainName=${encodeURIComponent(domain)}&ipAddress=${encodeURIComponent(ns.ip)}&hostname=${encodeURIComponent(ns.hostname)}`;

        console.log("[FRONTEND] 📡 Sending request:", apiUrl);

        try {
            const response = await fetch(apiUrl);
            const result = await response.json();
            console.log("[FRONTEND] 🌐 Server Response:", result);

            // Show the result in the chat log
            showChildNSPopup(
                result.success ? "Child Name Server added successfully!" : "Failed to add Child Name Server.",
                result.success
            );
        } catch (error) {
            console.error("[FRONTEND] ❌ Error:", error);
            showChildNSPopup("Error connecting to server.", false);
        }
    }
    
    // Re-enable chat and adjust section visibility after the operation is done
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("login-chat-section").style.height = "flex"; // Ensure chat height is reset

    enableChat();
     // Re-enable the chat
}

function resetChildNameServers() {
    childNameServerCount = 0; // Reset the count

    const container = document.getElementById("childnameserver-container");
    container.innerHTML = ""; // Remove all input fields

    // Re-add the first input field
    addChildNameServerInput();

    document.getElementById("child-domain-name").value = ""; // Clear domain input
}

//----------------------------------------------------- Suspend Domain Section --------------------------------------------------------//

function manageDomainSuspension() {
    const domainInput = document.getElementById("domain-suspension-name");
    const actionSelect = document.getElementById("domain-suspension-dropdown");
    const domainName = domainInput.value.trim().toLowerCase();
    const action = actionSelect.value;
    const updateButton = document.querySelector("button[onclick='manageDomainSuspension()']");

    if (!domainName || !action) {
        updateChatLog("⚠️ Please enter a valid domain name and select an action.", "bot");
        return;
    }

    const isSuspended = action === "suspended";
    console.log(`🚫 Managing Domain Suspension for ${domainName}: ${isSuspended ? "Suspended" : "Unsuspended"}`);

    updateChatLog(`⏳ Updating domain suspension status for ${domainName}...`, "bot");

    // Disable button to prevent duplicate requests
    disableChat();

    fetch(`/api/suspend-domain?domainName=${encodeURIComponent(domainName)}&suspend=${isSuspended}`)
        .then(response => {
            console.log("🛜 Response Status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("📩 Full API Response:", data);
            if (data.success) {
                updateChatLog(`✅ Domain ${domainName} has been successfully ${isSuspended ? "suspended" : "unsuspended"}.`, "bot");
            } else {
                // Extract error messages
                const responseMsg = data.fullResponse?.responseMsg?.message || "";
                const responseDataMsg = data.fullResponse?.responseData?.message || "";
                const responseStatusCode = data.fullResponse?.responseData?.statusCode;

                // Check if domain is already suspended or unsuspended
                if (
                    responseMsg === "Domain Suspend Manage Failed" &&
                    responseDataMsg === "Domain suspension failed" &&
                    (responseStatusCode === 2305 || responseStatusCode === 2306)
                ) {
                    updateChatLog(`⚠️ Domain ${domainName} is already ${isSuspended ? "suspended" : "unsuspended"}.`, "bot");
                } else {
                    updateChatLog(`⚠️ ${responseDataMsg || "Unable to process request."}`, "bot");
                }
            }
        })
        .catch(error => {
            console.error("❌ Fetch Error:", error);
            updateChatLog("⚠️ Unable to update domain suspension at this time. Please check your connection.", "bot");
        })
        .finally(() => {
            enableChat();
            document.getElementById('domain-suspension-section').style.display = "none";
            document.getElementById('login-chat-section').style.display = "flex";
            document.getElementById('domain-query-text').value = "";
        });
}

//--------------------------------------------------- Privacy Protection Section ------------------------------------------------------//

function managePrivacyProtection() {
    const domainName = document.getElementById("privacy-protection-domain-name").value;
    const action = document.getElementById("privacy-protection-dropdown").value;

    if (!domainName || !action) {
        updateChatLog("⚠️ Please enter a domain name and select an action.", "bot");
        return;
    }

    // Convert action to boolean for backend
    const isEnabled = action === "enabled";

    console.log(`🛡️ Managing Privacy Protection for ${domainName}: ${isEnabled ? "Enabled" : "Disabled"}`);

    // Show loading message in chatlog
    updateChatLog(`⏳ Updating privacy protection status for ${domainName}...`, "bot");
    disableChat();
    // Send API request
    fetch(`/api/manage-privacy-protection?domainName=${domainName}&enable=${isEnabled ? "true" : "false"}`)
        .then(response => response.json())
        .then(data => {
            console.log("📩 Full API Response:", data); // ✅ Logs full response

            if (data.success) {
                const statusText = isEnabled ? "enabled" : "disabled";
                updateChatLog(`✅ Privacy Protection for ${domainName} has been successfully ${statusText}.`, "bot");
            } else {
                updateChatLog(`⚠️ ${data.message || "Unable to process request."}`, "bot"); // ❌ Show error message
            }
            enableChat();
        })
        .catch(error => {
            console.error("❌ Error managing privacy protection:", error);
            updateChatLog("⚠️ Unable to update privacy protection at this time.", "bot");
            enableChat();
        });
}

//----------------------------------------------------- Lock Domain Section --------------------------------------------------------//

function manageDomainLock() {
    const domainName = document.getElementById("domain-lock-name").value;
    const action = document.getElementById("domain-lock-dropdown").value;

    if (!domainName || !action) {
        updateChatLog("⚠️ Please enter a domain name and select an action.", "bot");
        return;
    }

    const isLocked = action === "locked";
    console.log(`🔒 Managing Domain Lock for ${domainName}: ${isLocked ? "Locked" : "Unlocked"}`);

    updateChatLog(`⏳ Updating domain lock status for ${domainName}...`, "bot");

    disableChat();
    fetch(`/api/lock-domain?domainName=${domainName}&lock=${isLocked ? "true" : "false"}`)
        .then(response => {
            console.log("🛜 Response Status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("📩 Full API Response:", data);
            if (data.success) {
                updateChatLog(`✅ Domain lock for ${domainName} has been successfully ${isLocked ? "locked" : "unlocked"}.`, "bot");
            } else {
                // If responseData.message exists, use it; otherwise, fallback to data.message
                const errorMessage = data.fullResponse?.responseData?.message || data.message || "Unable to process request.";
                updateChatLog(`⚠️ ${errorMessage}`, "bot");
            }
        })
        .catch(error => {
            console.error("❌ Fetch Error:", error);
            updateChatLog("⚠️ Unable to update domain lock at this time.", "bot");
        })
        .finally(() => {
            // Re-enable chat after request is complete
            enableChat();
    
            // Hide section & reset input
            document.getElementById('domain-lock-section').style.display = "none";
            document.getElementById('login-chat-section').style.display = "flex";
            document.getElementById('domain-query-text').value = "";
        });
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
    const inputElement = document.getElementById("domain-query-text");
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

      if (!inputElement) {
        console.error("❌ Input field not found!");
    } else {
        const userInput = inputElement.value.trim().toLowerCase();
        console.log(`📝 User Input: "${userInput}"`);
    
        // Enhanced regex to capture various greetings and specific phrases
        const basicGreetingRegex = /^(hi|hello|hey|howdy|greetings|what(?:'s| is) up|wassup|sup|yo|good\s(?:morning|afternoon|evening|day)|how\s+are\s+you|how\s+(?:is it going|have you been|do you do)|what(?:'s| is)\s+(?:new|happening)|how's\s+(?:everything|life)|long time no see|nice to meet you|pleased to meet you|good to see you)[!.,?\s]*$/i;    
        const greetingMatch = userInput.match(basicGreetingRegex);
    
        if (greetingMatch) {
            console.log("👋 Greeting detected!");
    
            let response = "Hello! 😊 How can I assist you today?"; // Default response
    
            // Custom responses based on detected phrase
            if (/how are you/i.test(userInput)) {
                response = "I'm doing great! 😊 How can I help you today?";
            } else if (/how's it going/i.test(userInput)) {
                response = "Everything is going smoothly! 🚀 How can I assist you?";
            } else if (/what's up|what is up|wassup|sup/i.test(userInput)) {
                response = "I'm here and ready to help! 🤖 Let me know what you need.";
            } else if (/what's new|what is new/i.test(userInput)) {
                response = "Not much, just here to assist you! 🛠️ What can I do for you?";
            } else if (/long time no see/i.test(userInput)) {
                response = "Yes, it's been a while! ⏳ Let me know how I can help.";
            } else if (/nice to meet you|pleased to meet you/i.test(userInput)) {
                response = "Nice to meet you too! 🤝 What can I assist you with?";
    
            }
    
            updateChatLog(response, "bot");
            document.getElementById("domain-query-text").value = "";
            return;
        } else {
            console.log("❌ No greeting detected.");
        }
    }
    

      const match = queryText.match(/\b(?:register|i want to register|how can i register|can you register(?: my domain)?)\b.*?\b([\w-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)\b(?:\s+for\s+(\d+)\s*(?:year|years)?)?/i);

if (match) {
    const domainName = match[1] ? match[1].trim() : "";
    const duration = match[2] ? parseInt(match[2], 10) : null;

    console.log("🔍 Extracted domain:", domainName);
    console.log("⏳ Extracted duration:", duration);
    console.log("📌 Domain input element:", document.getElementById("check-domain-input"));

    updateChatLog("Before registering the domain, check its availability by clicking the 'Check Availability' button.", 'bot');
// Prefill domain input field with a delay
setTimeout(() => {
    const domainInput = document.getElementById("check-domain-input");
    document.getElementById("check-domain-button").style.borderRadius = "20px";
    if (!domainInput) {
        console.error("❌ Error: Domain input field not found!");
        return;
    }

    console.log("📌 Setting domain name to input field:", domainName); // Debugging
    domainInput.value = domainName;
    domainInput.dispatchEvent(new Event("input", { bubbles: true }));
    console.log("✅ Prefilled domain input:", domainInput.value);
}, 100);
    document.getElementById("domain-availability-section").style.display = "block";
    document.getElementById("login-chat-section").style.display = "none";

    document.getElementById("domain-renewal-wrapper").style.columnGap = "8px";
    

    

    // Auto-select duration in dropdown
    const validDurations = [1, 2, 3, 5, 10];
    if (duration && validDurations.includes(duration)) {
        document.getElementById("duration").value = duration;
    }
    return;
}

    const renewMatch = queryText.match(
        /\b(?:renew|renewal|can you renew|how (?:do|can) i renew|renew my|want to renew)\b\s*([\w-]+\.[a-z]{2,})?\b(?:\s+for\s+(\d+)\s*(?:year|years)?)?|\b([\w-]+\.[a-z]{2,})?\b.*?\b(?:renew|renewal|can you renew|how (?:do|can) i renew|renew my|want to renew)\b(?:\s+for\s+(\d+)\s*(?:year|years)?)?/i
    );

    if (renewMatch) {
        const domainName = renewMatch[1] || renewMatch[3] || ""; // Allow empty domain
        const duration = renewMatch[2] ? parseInt(renewMatch[2], 10) : (renewMatch[4] ? parseInt(renewMatch[4], 10) : null);
    
        console.log("Matched domain for renewal:", domainName || "(none)");
        console.log("Matched duration:", duration || "(default)");
    
        updateChatLog(
            domainName
                ? "Enter duration and click renew button to renew your domain seamlessly."
                : "Please enter the domain name you would like to renew.",
            "bot"
        );
    
        // Show the renewal section & hide login section
        document.getElementById('login-chat-section').value = '';
        document.getElementById("domain-renewal-section").style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";
    
        // Prefill the domain input field (empty if no domain found)
        document.getElementById("renew-domain-name").value = domainName;
    
        // Auto-select duration in dropdown if it's valid (1,2,3,5,10)
        const validDurations = [1, 2, 3, 5, 10];
        if (duration && validDurations.includes(duration)) {
            document.getElementById("renew-duration").value = duration;
        }
        return;
    }
    

    const transferMatch = queryText.match(/\b(transfer|move)(?:\s+([a-zA-Z0-9-.]+\.[a-z]{2,}))?/i);

if (transferMatch) {
    console.log("Matched keyword:", transferMatch[1]); // "transfer" or "move"
    
    if (transferMatch[2]) {
        console.log("Extracted domain:", transferMatch[2]); // Extracted domain if present
        updateChatLog(`Enter authcode(EPP code) and enable or disable Whois protection to transfer your domain to us seamlessly.`, 'bot');

        // Show the transfer section
        document.getElementById("domain-transfer-section").style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";

        // Prefill domain input field
        document.getElementById("transfer-domain-name").value = transferMatch[2];
        return;
    } else {
        console.log("No domain found, but transfer/move keyword detected.");
    }
}


if (queryText.match(/\b(?:registered\s+on|registration\s+date\s*[:]?|when\s*was\s*it\s*registered\??)\s*(\d{1,2}-\d{1,2}-\d{4})\b/)) {
    const dateMatch = queryText.match(/\d{1,2}-\d{1,2}-\d{4}/);
    
        if (!dateMatch) {
            updateChatLog("⚠️ Please specify a valid date in the format dd-mm-yyyy.", 'bot');
            return;
        }
    
        const inputDate = dateMatch[0];  // Extract date as string "07-03-2025"
        console.log(`Fetching registered domains for date: ${inputDate}`);
    
        updateChatLog(`📡 Fetching domains registered on: ${inputDate}`, "bot");
    
        disableChat(); // Disable chat while fetching data
    
        try {
            // Fetch domain registration data
            const response = await fetch(`/api/registrationdate-domains?date=${encodeURIComponent(inputDate)}`);
    
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('📥 Registered domains response:', data);
    
            let message = `📅 Domains Registered on ${inputDate}:\n`;
    
            if (data.success && data.domains.length > 0) {
                // Convert input date to a Date object for comparison
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
            } else {
                message = `⚠️ No domains were registered on ${inputDate}.`;
            }
    
            updateChatLog(message, 'bot');
    
        } catch (error) {
            console.error("❌ Error fetching registered domains:", error);
            updateChatLog("❌ Unable to fetch registered domains at this time.", 'bot');
        }
    
        queryInput.value = ""; // Clear input after processing
        enableChat(); // Re-enable chat after fetching data
        return;
    }
    

    const expiringDomainMatch = queryText.match(/\b(getting\s+expired|expire|expiring|expiry)\s+(on|by|before)?\s*(\d{1,2}-\d{1,2}-\d{4})\b/i);
if (expiringDomainMatch) {
    const selectedDate = expiringDomainMatch[3].trim();
    updateChatLog(`📡 Fetching domains expiring on: ${selectedDate}`, "bot");

    disableChat(); // Disable chat while fetching data

    try {
        console.log(`📡 Fetching expiring domains for: ${selectedDate}`);
        const response = await fetch(`/api/expiring-domains?date=${encodeURIComponent(selectedDate)}`);

        console.log(`🔄 API Request URL: /api/expiring-domains?date=${encodeURIComponent(selectedDate)}`);

        if (!response.ok) {
            throw new Error(`❌ Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 API Response Data:', data); // Debugging log

        let message = `⏳ Domains Expiring on ${selectedDate}:\n`;

        if (data.success && data.domains.length > 0) {
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

    queryInput.value = ""; // Clear input after processing
    enableChat(); // Re-enable chat after fetching data
    return;
}
        
const deletedDomainMatch = queryText.match(/\b(?:which\s+domains\s+(?:are\s+)?)?(getting\s+)?(deleted|deleting|removing|removed)\s+(on|by|before)?\s*(\d{1,2}-\d{1,2}-\d{4})\b/i);

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

    updateChatLog(`📡 Fetching domains deleting on: ${selectedDate}`, "bot");
    console.log(`📡 Fetching domains deleting on: ${expirationDate} (to check for deletion on ${selectedDate})`);
    disableChat();
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
            enableChat();
            updateChatLog(message, 'bot');
        } else {
            console.log(`⚠️ No domains found for ${selectedDate}`);
            updateChatLog(`⚠️ No domains are deleting on ${selectedDate}.`, 'bot');
            enableChat();
        }

            updateChatLog(message.trim() === `⏳ Domains Getting Deleted on ${selectedDate}:\n` 
                ? `⚠️ No domains are getting deleted on ${selectedDate}.` 
                : message, 'bot');
                enableChat();
    } catch (error) {
        console.error("❌ Error fetching deleted domains:", error);
        enableChat();
    }

    queryInput.value = "";
    return;
}

const tldMatch = queryText.match(/\b(?:can\s+you\s+)?(?:give|suggest|available|recommend|show|list|fetch|get)\s*(?:me\s*)?(?:some\s*)?(?:TLDs?|tlds?|TLds?|top\s*level\s*domains)\s*(?:for|to|in)?\s*([\w-]+)(?:\.([a-z]{2,}))?\??\b/i);

if (tldMatch) {
    const baseName = tldMatch[1].trim();  // Extract base name (e.g., "domain")
    const originalTLD = tldMatch[2] ? tldMatch[2].trim() : null; // Extract original TLD if provided

    // Show message that TLD suggestions are being fetched
    updateChatLog(`🔄 Fetching TLD suggestions for ${baseName}...`, 'bot');
    
    disableChat();  // Disable chat while fetching the TLDs

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
    
    enableChat();  // Re-enable chat after fetching
    return;
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
    
                // Beautify and format the domain data for display
                const domainData = data.domainData;
                const formattedData = `<div><strong>📄 Domain Information for ${domainName}</strong></div><div><strong>Status:</strong> ${domainData.status} ${domainData.isDomainLocked ? '🔒' : '🔓'}</div><div><strong>Creation Date:</strong> ${new Date(domainData.creationDate).toLocaleDateString()} 🗓️</div><div><strong>Expiration Date:</strong> ${new Date(domainData.expirationDate).toLocaleDateString()} ⏳</div><div><strong>Nameservers:</strong></div><ul style="margin: 0; padding: 0; list-style-type: none;">${domainData.nameserver1 ? `<li>🌐 ${domainData.nameserver1}</li>` : ''}${domainData.nameserver2 ? `<li>🌐 ${domainData.nameserver2}</li>` : ''}${domainData.nameserver3 ? `<li>🌐 ${domainData.nameserver3}</li>` : ''}${domainData.nameserver4 ? `<li>🌐 ${domainData.nameserver4}</li>` : ''}</ul><div><strong>Authentication Code:</strong> ${domainData.authCode} 🔑</div><div><strong>Domain Locked:</strong> ${domainData.isDomainLocked ? 'Yes 🔒' : 'No 🔓'}</div><div><strong>Privacy Protection:</strong> ${domainData.isPrivacyProtection ? 'Enabled 🛡️' : 'Disabled ❌'}</div><div><strong>Thief Protection:</strong> ${domainData.isThiefProtected ? 'Enabled 🛡️' : 'Disabled ❌'}</div>`;
    
                // Display the formatted domain details in the chat
                updateChatLog(formattedData, 'bot');
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
    
    const authCodeRegex = /\b([\w.-]+\.[a-z]{2,})\b(?:\s+\w+)*\s+(?:auth(?:orization|orisation)?\s*code|authcode|epp\s+(?:code|key))\b|\b(?:auth(?:orization|orisation)?\s*code|authcode|epp\s+(?:code|key))\b(?:\s+\w+)*\s+\b([\w.-]+\.[a-z]{2,})\b/i;

const authCodeMatch = queryText.match(authCodeRegex); // 🔥 Match against user input

if (authCodeMatch) {
    const domainName = (authCodeMatch[1] || authCodeMatch[2]).trim(); // Capture from either part

    // 🔄 Notify user that fetching process has started
    updateChatLog(`🔄 Fetching Auth Code for ${domainName}...`, 'bot');

    // 🚫 Disable chat interactions during API call
    disableChat();

    try {
        console.log('🔍 Fetching auth code for:', domainName);
        const response = await fetch(`/api/domain-auth-code?domain=${encodeURIComponent(domainName)}`);

        if (!response.ok) {
            throw new Error(`❌ Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📜 Auth code response:', data);

        if (data.success) {
            console.log('✅ Auth Code:', data.authCode);
            updateChatLog(`🔑 Auth Code for ${domainName}: ${data.authCode}`, 'bot');
        } else {
            updateChatLog(`⚠️ ${data.message}`, 'bot');
        }          

    } catch (error) {
        console.error("🚨 Error fetching auth code:", error);
        updateChatLog("⚠️ Unable to fetch auth code at this time. Please try again later.", 'bot');
    }

    // ✅ Re-enable chat after API response
    enableChat();

    document.getElementById("domain-query-text").value = "";
    return;
} else {
    console.log("❌ No auth code request detected.");
}

const domainregisterRegex = /\b(?:when|check)\b.*?\b(?:was|did|is)?\s*([\w.-]+\.[a-z]{2,})\b.*?\b(register|registered|registration\s*date)\b|\b(?:registration\s*date\s*(?:for|of)?|when\s*was|check\s*when)\s*([\w.-]+\.[a-z]{2,})\b|\b([\w.-]+\.[a-z]{2,})\s*(?:registration\s*date)\b/i;

const userInput4 = document.getElementById("domain-query-text").value;
const domainregisterMatch = userInput4.match(domainregisterRegex);

console.log("✅ Matched Registration Query:", domainregisterMatch);

if (domainregisterMatch) {
    const domainName = domainregisterMatch[1] || domainregisterMatch[3] || domainregisterMatch[4]; // Extract domain
    console.log(`Extracted Domain: ${domainName}`);

    // Show fetching message & disable chat
    updateChatLog(`🔍 Fetching registration date for <strong>${domainName}</strong>...`, 'bot');
    disableChat();

    try {
        console.log('Fetching domain details for:', domainName);
        const response = await fetch(`/api/domain-info?domain=${encodeURIComponent(domainName)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Domain details response:', data);

        if (data.success && data.domainData) {
            console.log('Domain data:', data.domainData);

            const timestamp = data.domainData.creationDate || null;
            let registrationDate = "Not available";

            if (timestamp) {
                registrationDate = new Date(timestamp).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
            }

            updateChatLog(
                `📅 The domain <strong>${domainName}</strong> was registered on <strong>${registrationDate}</strong>.`,
                'bot'
            );
        } else {
            updateChatLog(
                `❌ No registration data found for <strong>${domainName}</strong>. It might be unregistered or unavailable.`,
                'bot'
            );
        }

    } catch (error) {
        console.error("Error fetching domain details:", error);
        updateChatLog("⚠️ Unable to fetch domain details at this time.", 'bot');
    }

    // Enable chat again after fetching
    enableChat();

    document.getElementById("domain-query-text").value = "";
    return;
}

const balanceMatch = queryText.match(/\b(?:what(?:'s| is)?|show|check|get|tell me|fetch)?\s*(?:my|the)?\s*(?:current|available)?\s*(?:balance|funds|amount|money|credit|account balance)\b/i);

if (balanceMatch) {
    try {
        updateChatLog(`🔍 Fetching your current balance...`, 'bot');
        
        const response = await fetch(`/api/balance`, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Failed to fetch balance. Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            // Use the answer field from the backend response
            const balanceMessage = result.answer || 'Balance not available';
            updateChatLog(balanceMessage, 'bot');
        } else {
            updateChatLog(`Error: ${result.message}`, 'bot');
        }

        document.getElementById('domain-query-text').value = "";

    } catch (error) {
        console.error('Error fetching balance:', error);
        updateChatLog('Failed to retrieve balance information', 'bot');
    }
    return;
}


const theftProtectionSection = document.getElementById("theft-protection-section");
const theftProtectionDropdown = document.getElementById("theft-protection-dropdown");
const theftProtectionDomainInput = document.getElementById("theft-protection-domain-name");

if (!inputElement) {
    console.error("❌ Input field not found!");
} else {
    const usersInput = inputElement.value.trim();
    console.log(`📝 User Input: "${usersInput}"`);

// Updated Regex: Detects "theft protection" in any form, with or without action/domain
    const theftRegex = /\b(?:enable|disable|on|off|switch\s+on|switch\s+off)?\s*\/?(?:enable|disable|on|off|switch\s+on|switch\s+off)?\s*(?:theft\s*protection|thief\s*protection)/i;

    const theftMatch = usersInput.match(theftRegex);

    if (theftMatch) {
        console.log("✅ Theft Protection command detected in input.");

        let actionMatch = usersInput.match(/\b(enable|disable|on|off|switch\s+on|switch\s+off)/i);
        let action = actionMatch ? actionMatch[1].toLowerCase() : ""; // Extract action

        let domainMatch = usersInput.match(/\b([\w.-]+\.[a-z]{2,})\b/); // Detect domain name if present
        let domain = domainMatch ? domainMatch[1].trim() : ""; // Extracted domain (or empty)

        console.log(`📌 Extracted Domain: ${domain || "None"}`);
        console.log(`📌 Selected Action: ${action || "None"}`);

        updateChatLog(
            domain
                ? "🛡️ Please enter the domain name and select the action (Enable/Disable) from the dropdown, then click 'Update Theft Protection'."
                : "🛡️ Please provide a domain name to enable/disable theft protection.",
            "bot"
        );

        let selectedAction = "";
        if (["on", "enable", "switch on"].includes(action)) {
            selectedAction = "enabled";
        } else if (["off", "disable", "switch off"].includes(action)) {
            selectedAction = "disabled";
        }

        if (selectedAction) {
            theftProtectionDropdown.value = selectedAction;
        }

        theftProtectionDomainInput.value = domain; // Keep blank if no domain provided
        theftProtectionSection.style.display = "block";
        document.getElementById('login-chat-section').style.display = 'none';

        // 🚨 Prevent further execution (Stops fallback logic)
        return;
    } else {
            console.log("❌ No valid Theft Protection command detected.");
        }
    }

const privacyProtectionSection = document.getElementById("privacy-protection-section");
const privacyProtectionDropdown = document.getElementById("privacy-protection-dropdown");
const privacyProtectionDomainInput = document.getElementById("privacy-protection-domain-name");

if (!inputElement) {
    console.error("❌ Input field not found!");
} else {
    const usersInput = inputElement.value.trim();
    console.log(`📝 User Input: "${usersInput}"`);

    // Regex to match "enable/disable privacy protection for domain.com"
    const privacyRegex = /(?:^|\s)(enable|disable)\s+privacy\s+protection\s*(?:for\s+)?([\w.-]+\.[a-z]{2,})/i;
    const privacyMatch = usersInput.match(privacyRegex);

    if (privacyMatch) {
        console.log("✅ Privacy Protection command detected.");

        const selectedAction = privacyMatch[1];  // "enable" or "disable"
        const domain = privacyMatch[2];  // Extracted domain name

        console.log(`📌 Selected Action: ${selectedAction}, Domain: ${domain}`);

        updateChatLog("🔄 Please enter the domain name and select 'Enable' or 'Disable' privacy protection from the dropdown, then click 'Update Privacy Protection'.", "bot");

        // Set dropdown value based on extracted action
        privacyProtectionDropdown.value = selectedAction.toLowerCase() === "enable" ? "enabled" : "disabled";

        // Populate domain input field
        privacyProtectionDomainInput.value = domain;

        // Show Privacy Protection Section
        privacyProtectionSection.style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";
        return;
    }
}

const lockUnlockSection = document.getElementById("domain-lock-section");
const lockUnlockDropdown = document.getElementById("domain-lock-dropdown");
const lockUnlockDomainInput = document.getElementById("domain-lock-name");

if (!inputElement) {
    console.error("❌ Input field not found!");
} else {
    const usersInput = inputElement.value.trim();
    console.log(`📝 User Input: "${usersInput}"`);

    // Updated Regex: Supports various lock/unlock commands
    const lockUnlockRegex = /\b(lock|unlock|secure|remove\s+lock|turn\s+on\s+lock|turn\s+off\s+lock|enable\s+domain\s+lock|disable\s+domain\s+lock|lock\/unlock)(?:\s+(?:the\s+|my\s+)?(?:domain\s*)?([\w.-]+\.[a-z]{2,}))?/i;
    const lockUnlockMatch = usersInput.match(lockUnlockRegex);

    if (lockUnlockMatch) {
        console.log("✅ Lock/Unlock command detected.");

        const selectedAction = lockUnlockMatch[1];  // Extracted action: "lock", "unlock", etc.
        const domain = lockUnlockMatch[2] ? lockUnlockMatch[2].trim() : "";  // Set to "" if undefined

        console.log(`📌 Selected Action: ${selectedAction}`);
        console.log(`📌 Extracted Domain: "${domain || 'None'}"`); // Logs "None" when no domain is found

        updateChatLog("📝 Please enter the domain name and select 'Lock' or 'Unlock' from the dropdown, then click 'Update Lock Status'.", "bot");

        // Set dropdown value based on extracted action
        lockUnlockDropdown.value = selectedAction.toLowerCase() === "lock" ? "locked" : "unlocked";

        // Populate domain input field (empty if no domain is found)
        lockUnlockDomainInput.value = domain;

        // Show Lock/Unlock Section
        lockUnlockSection.style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";
        return;
    }
}

const suspendUnsuspendSection = document.getElementById("domain-suspension-section");
const suspendUnsuspendDropdown = document.getElementById("domain-suspension-dropdown");
const suspendUnsuspendDomainInput = document.getElementById("domain-suspension-name");

if (!inputElement) {
    console.error("❌ Input field not found!");
} else {
    const usersInput = inputElement.value.trim();
    console.log(`📝 User Input: "${usersInput}"`);

    // Regex to match "suspend/unsuspend domain.com"
    const suspendUnsuspendRegex = /\b(suspend|unsuspend)(?:\/(suspend|unsuspend))?\s*(?:the\s+)?(?:domain\s*)?(?:for\s+)?([\w.-]+\.[a-z]{2,})?/i;
    const suspendUnsuspendMatch = usersInput.match(suspendUnsuspendRegex);

    if (suspendUnsuspendMatch) {
        console.log("✅ Suspend/Unsuspend command detected.");

        const selectedAction = suspendUnsuspendMatch[1] || suspendUnsuspendMatch[2];  // Extracted "suspend" or "unsuspend"
        const domain = suspendUnsuspendMatch[3] ? suspendUnsuspendMatch[3].trim() : "";  // Empty string if domain not found

        console.log(`📌 Selected Action: ${selectedAction}`);
        console.log(`📌 Extracted Domain: "${domain || 'None'}"`); // Logs "None" when no domain is found

        updateChatLog("🔄 Please enter the domain name and select 'Suspend' or 'Unsuspend' from the dropdown, then click 'Update Suspension Status'.", "bot");

        // Set dropdown value
        suspendUnsuspendDropdown.value = selectedAction.toLowerCase() === "suspend" ? "suspended" : "unsuspended";

        // Populate domain input field (empty if no domain found)
        suspendUnsuspendDomainInput.value = domain;

        // Show Suspend/Unsuspend Section
        suspendUnsuspendSection.style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";
        return;
    }
}

if (!inputElement) {
    console.error("❌ Input field not found!");
} else {
    const usersInput = inputElement.value.trim();
    console.log(`📝 User Input: "${usersInput}"`);

    const privacyRegex = /\b(update|enable|disable|turn\s*on|turn\s*off)(?:\/(update|enable|disable|turn\s*on|turn\s*off))?\s*(?:the\s+)?(?:privacy[-\s]*protection)\s*(?:for\s+([\w.-]+\.[a-z]{2,}))?/i;
    const privacyMatch = usersInput.match(privacyRegex);

    if (privacyMatch) {
        console.log("✅ Privacy Protection command detected.");

        const action = privacyMatch[1]?.toLowerCase() || "";
        const domain = privacyMatch[3] ? privacyMatch[3].trim() : ""; 

        console.log(`📌 Action: ${action || "None provided"}`);
        console.log(`🌍 Domain: ${domain || "None provided"}`);

        document.getElementById("privacy-protection-section").style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";

        if (action) {
            const isEnablePrivacy = action.includes("enable") || action === "turn on";
            console.log(`🔄 Converted Boolean Value: ${isEnablePrivacy}`);

            if (!window.apiCallTriggered) {
                window.apiCallTriggered = true;
                sendPrivacySetting(domain, isEnablePrivacy);
            }
        } else {
            console.log("⚠️ No enable/disable/update action provided. Prompt user for selection.");
        }
        return;
    } else {
        console.log("❌ No valid privacy protection command detected.");
    }
}

const lockRegex = /(?:.*\s)?\b(lock|unlock)\s*(?:my\s*domain\s*|this\s*domain\s*)?([\w.-]+)/i;

if (inputElement) {
    const userInput = inputElement.value.trim(); // Get user input
    const lockmatch = userInput.match(lockRegex); // Match regex against input

    if (lockmatch) {  // ✅ Correctly check if the regex found a match
        const submitButton = document.getElementById('submitDomainQuery');
        const locktoggleContainer = document.getElementById('domain-lock-toggle-container');

        if (locktoggleContainer && submitButton) {
            locktoggleContainer.style.display = 'flex';
            submitButton.style.width = '55%';

            // 🛠 Extract the domain dynamically from user input
            const domain = lockmatch[2] || "mydomain.com"; // Default if no domain found
            inputElement.value = `Lock/Unlock ${domain}`;

            // ⏳ Check if 30 seconds have passed since the last tooltip
            const now = Date.now();
            if (now - lastTooltipTime > 30000) {  // 30 seconds = 30000 ms
                lastTooltipTime = now; // Update last tooltip time

                if (typeof highlightPlaceholder === "function") {
                    //const tooltipRef = highlightPlaceholder(inputElement, inputElement.value, domain, "Enter your Domain Name");

                    // ⏳ Hide tooltip after 5 seconds
                    setTimeout(() => {
                        if (tooltipRef) {
                            tooltipRef.remove();
                        }
                    }, 3500);
                }
            } else {
                console.log("⏳ [TOOLTIP] Skipped - Shown within the last 30 seconds.");
            }
        } else {
            console.error("❌ [ERROR] Missing elements: submit button or toggle container.");
        }
    }
}

const updatenameRegex = /(change|update)\s(?:name\s)?servers?\s(for\s([^\s]+))/i;
const userInput = document.getElementById("domain-query-text").value; // Get value of the input element

const updatenamematch = userInput.match(updatenameRegex);

if (updatenamematch) {
    const domainName = updatenamematch[3]; // Extracted domain name from the regex match

    // Show the "name-server-container" and hide the "login-chat-section"
    document.getElementById("name-server-container").style.display = "flex";
    document.getElementById("login-chat-section").style.display = "none";

    // Set the extracted domain name in the input field
    document.getElementById("domain-name-input").value = domainName;

    console.log(`Domain Name: ${domainName}`); // Optionally log the extracted domain name
} else {
    console.log("No match found.");
}

const updateNameServerRegex = /\b(?:update|change|modify)\s+\w*\s*name\s*servers?\s*(?:for|on)?\s*([\w.-]+\.[a-z]{2,})?\b/i;

const updateNameServerMatch = userInput.match(updateNameServerRegex);

if (updateNameServerMatch) {
    const domainName = updateNameServerMatch[1] ? updateNameServerMatch[1].trim() : ""; // Capture domain if present

    // ✅ Ensure visibility toggle works even on repeated input
    document.getElementById("name-server-container").style.display = "none"; 
    void document.getElementById("name-server-container").offsetHeight; // Force reflow
    document.getElementById("name-server-container").style.display = "flex"; 
    document.getElementById("name-server-update-section").style.display = "flex"; 

    document.getElementById("login-chat-section").style.display = "block"; 
    setTimeout(() => {
        document.getElementById("login-chat-section").style.display = "none";
    }, 50); // Reset UI state

    // ✅ Ensure query input is reset
    document.getElementById("domain-query-text").value = "";
    setTimeout(() => {
        document.getElementById("domain-query-text").value = " ";
    }, 10);

    // ✅ UI Styling Adjustments
    document.getElementById("nameserver-container").style.width = "100%";
    document.getElementById("update-nameserver-button-group").style.width = "100%";
    document.getElementById("addNameServer").style.borderRadius = "5px";
    document.getElementById("addNameServer").style.fontSize = "10px";
    document.getElementById("addNameServer").style.height = "90%";
    document.getElementById("updateNameServer").style.fontSize = "10px";
    document.getElementById("updateNameServer").style.height = "90%";
    document.getElementById("updateNameServer").style.borderRadius = "5px";
    document.getElementById("chat-log").style.height = "60%";
    document.getElementById("updatenamebackbutton").style.fontSize = "12px";
    document.getElementById("updatenamebackbutton").style.height = "90%";
    document.getElementById("domain-name-input").style.height = "85%";
    document.getElementById("nameserver-container").style.marginTop = "-10px";

    // ✅ Set domain name if provided
    document.getElementById("domain-name-input").value = domainName;

    updateChatLog(
        `🔄 Please enter the domain name and the name servers that need to be updated. You can add more name servers by clicking '➕ Add Name Server' button. Maximum 4 name servers can be added. Then click '🖊 Update Name Server' button to save the changes.`,
        "bot"
    );

    console.log(`📌 Domain Name: ${domainName || "Not provided"}`); // Log extracted domain
    return;
} else {
    console.log("❌ No match found.");
}

const updatechildnameRegex = /\b(?:how\s+(?:do|can)\s+i\s+(?:add|create|set\s*up|register)\s+(?:a\s+)?child\s*(?:name\s*server|nameserver)|add\s+(?:a\s+)?child\s*(?:name\s*server|nameserver)|child\s*(?:name\s*server|nameserver))(?:\s+for\s+([\w.-]+\.[a-z]{2,}))?\b/i;

const updatechildnamematch = userInput.match(updatechildnameRegex);

if (updatechildnamematch) {
    const domainName = updatechildnamematch[1] ? updatechildnamematch[1].trim() : ""; // Extract domain or empty string

    // Show relevant section and hide login chat
    document.getElementById("add-child-name-server-section").style.display = "flex";
    document.getElementById("chat-log").style.height = "60%";
    document.getElementById("login-chat-section").style.display = "none";
    document.getElementById('domain-query-text').value = "";

    // Set domain input field (leave empty if no domain provided)
    document.getElementById("child-domain-name").value = domainName;

    updateChatLog("🛠️ Enter Domain Name, Hostname, and IP Address for the child nameserver. You can add upto 4 child nameservers using the '➕Add Child Name Server' button.", "bot");


    console.log(`✅ Extracted Domain Name: ${domainName || "None (User needs to enter manually)"}`);
    return;
} else {
    console.log("❌ No match found.");
}


const TLdsregex = /\b(?:give|show|list|fetch|get)\s+me\s+(?:a\s+)?(?:list)\s+of\s+(?:high[-\s]*value|premium)\s+domain\s+(?:tlds|extensions|suggestions|names)\s*(?:for)?\s*([\w.-]+)\??\b/i;
const updatetldmatch = userInput.match(TLdsregex);

if (updatetldmatch) {
    updateChatLog('🌍 <strong>High-value TLDs include:</strong><br>🔹 .com<br>🔹 .net<br>🔹 .org<br>🔹 .ai<br>🔹 .io<br>🔹 .xyz<br>🔹 .co<br>These TLDs are considered premium due to their popularity and value in the digital market.','bot');
    document.getElementById('domain-query-text').value = "";
} else {
    console.log("No match found.");
}

const chatbotactions = /\b(?:what|which|can)\s+(?:tasks|actions|functions|things|services|capabilities|can)\s+(?:this\s+)?(?:chatbot|bot|assistant|ai)\s+(?:do|perform|help\s+with|assist\s+with|allow\s+me\s+to\s+do|be\s+used\s+for|help\s+with)\??\b/i;
const chatbotactionsmatch = userInput.match(chatbotactions);

if (chatbotactionsmatch) {
    updateChatLog('This platform offers domain management, 🔒 security controls, and domain status management, with 📞 customer support available for assistance. 🚀','bot');
    document.getElementById('domain-query-text').value = "";
} else {
    console.log("No match found.");
}
// If all other conditions fail, execute this fallback
try {
    console.log('Sending query to backend:', queryText);

    // Disable chat input and show "Generating response... Please wait ⏳"
    disableChat();
    updateChatLog("Generating response... Please wait ⏳", 'bot');

    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const signal = controller.signal;

    // Set a timeout to show "Too many requests..." after 10 seconds
    const timeout10s = setTimeout(() => {
        updateChatLog("Too many requests at this moment. Please wait... ⏳", 'bot');
    }, 10000);

    // Set another timeout to abort the request after 20 seconds
    const timeout20s = setTimeout(() => {
        controller.abort();
        removeLastBotMessage(); // Remove previous "waiting" messages
        updateChatLog("Request timed out. Please try again later.", 'bot');
        enableChat();
    }, 20000);

    const response = await fetch('/api/domain-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
        signal // Attach the abort signal
    });

    // Clear timeouts since response was received in time
    clearTimeout(timeout10s);
    clearTimeout(timeout20s);

    if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);

    // Remove "Generating response..." and "Too many requests..." messages
    removeLastBotMessage();

    if (data.success) {
        if (data.answer?.trim()) {
            updateChatLog(data.answer, 'bot');
        } else {
            updateChatLog("Sorry, I couldn't find an answer for that.", 'bot');
        }
    } else {
        updateChatLog(`Error: ${data.message}`, 'bot');
    }


} catch (error) {
    if (error.name === 'AbortError') {
        console.warn("Fetch request was aborted due to timeout.");
    } else {
        console.error("Error with fetch request:", error);
        removeLastBotMessage();
        updateChatLog("Sorry, I can't answer that right now. Let me know if you need any other help. 😊", 'bot');
    }
} finally {
    // Re-enable chat input after response
    enableChat();
    document.getElementById("domain-query-text").value = "";
}

// Hide tooltip and clear input
hideTooltipOnInput?.(); 

if (queryInput) {
    queryInput.value = ""; // Clears input field
}

if (inputElement) {
    inputElement.value = ""; // Clears another input if applicable
}
}

//----------------------------------------------- Back button after verification --------------------------------------------------//

function goBackToQuerySection() {
    console.log("Navigating back to query section...");
  
    // Show the query section
    document.getElementById('login-chat-section').style.display = 'flex';
    document.getElementById('domain-query-text').value = '';
    console.log("login-chat-section is now visible");
  
    // Hide the other sections
    const sectionsToHide = ['domain-section', 'domain-options', 'domain-options-next', 'domain-registration-section' , 'domain-transfer-section' , 'domain-renewal-section' , 'domain-availability-section' , 'name-server-update-section', 'add-child-name-server-section' ,'theft-protection-section' , 'privacy-protection-section' , 'domain-lock-section' , 'domain-suspension-section', 'additional-settings-section', 'name-server-container'];
    
    sectionsToHide.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.style.display = 'none';
        console.log(`Hid section: ${sectionId}`);
      } else {
        console.log(`Element not found: ${sectionId}`);
      }
    });
    resetNameServers();
    resetChildNameServers()
  }

//--------------------------------------------------- Event Listeners Section ------------------------------------------------------//

// ✅ Fix duplicate event listeners for 'back-to-previous-section'
const backButton = document.getElementById("back-to-previous-section");
if (backButton && !backButton.dataset.listenerAttached) {
    backButton.dataset.listenerAttached = "true";
    backButton.addEventListener("click", goBackToPreviousSection);
}

// ✅ Centralized Enter Key Event Handling
document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation(); // ⛔ Prevent multiple triggers

        console.log("🛑 Stopped multiple Enter key events.");
        const activeElement = document.activeElement;

        if (!activeElement) return;

        switch (true) {
            case activeElement.classList.contains("chat-input"):
                console.log("💬 Chat Input - Enter key pressed");
                document.getElementById("submit-question")?.click();
                break;
            case activeElement.classList.contains("email-input"):
                console.log("📧 Email Input - Enter key pressed");
                document.getElementById("submit-email")?.click();
                break;
            case activeElement.id === "domain-query-text":
                console.log("🌍 Domain Query Input - Enter key pressed");
                submitDomainQuery();
                break;
            case activeElement.id === "otp-code":
                console.log("🔑 OTP Input - Enter key pressed");
                verifyOTP();
                break;
        }
    }
});

// ✅ OTP Verification Click Event
document.getElementById("verify-otp")?.addEventListener("click", verifyOTP);

// ✅ Fix issue with Enter key on domain query input
const domainQueryInput = document.getElementById("domain-query-text");
if (domainQueryInput && !domainQueryInput.dataset.listenerAttached) {
    domainQueryInput.dataset.listenerAttached = "true";
    domainQueryInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            console.log("🌍 Domain Query Input - Enter key pressed");
            submitDomainQuery();
        }
    });
}

if (chatInput && !chatInput.dataset.listenerAttached) {
    chatInput.dataset.listenerAttached = "true";
    chatInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            console.log("💬 Enter key pressed in chat input");
            document.getElementById("submit-question")?.click();
        }
    });
}


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

    // Ensure buttonContainer is part of the chat log for proper scrolling
    chatLog.appendChild(buttonContainer);

    if (container && window.getComputedStyle(container).display !== "none") {
        // Small delay to ensure rendering updates before scrolling
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
    const emailSection = document.getElementById('email-section');
    if (emailSection) emailSection.style.display = 'none';

    const signupText = document.getElementById('signup-text');
    if (signupText) signupText.style.display = 'none';

    const loginText = document.getElementById('login-text');
    if (loginText) loginText.style.display = 'flex';

    const userInputSection = document.getElementById('user-input-section');
    if (userInputSection) userInputSection.style.display = 'flex';

    const initialMessage = document.getElementById('initial-message');
    if (initialMessage) initialMessage.style.display = 'flex';

    const otpSection = document.getElementById('otp-section');
    if (otpSection) otpSection.style.display = 'none';

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("collapsed");

    const chatLog = document.getElementById("chat-log");
    if (chatLog) chatLog.innerHTML = '';

    const faqPostLogin = document.getElementById('faq-post-login');
    if (faqPostLogin) faqPostLogin.style.display = 'none';

    const userQuestion = document.getElementById('user-question');
    if (userQuestion) userQuestion.value = ''; // Reset input field

    // Show all active elements
    Array.from(document.getElementsByClassName("active")).forEach(element => {
        element.style.display = 'flex';
    });

    updateChatLog("Welcome! 👋 I'm here to assist you. If you’d like to know what I can do, just click the 'ℹ️' button at the top. Let me know how can I help! 😊", 'bot');
}


async function getDomainId(domainName) {
    return 1; // Replace with actual API call if needed
}

function gobactkostartsection(){
    document.getElementById("otp-section").style.display = 'none';
    document.getElementById("otp-code").style.display = 'none';
    document.getElementById("verify-otp").style.display = 'none';
    document.getElementById("resend-otp").style.display = 'none';
    document.getElementById("email-section").style.display = 'flex';
    document.getElementById("user-email").value = '';
}

const chatHistory = [...document.querySelectorAll('.chat-message')]
  .map(msg => msg.textContent); // Get chat messages

fetch('/api/domain-queries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: userQuery, chatHistory })
})
  .then(res => res.json())
  .then(data => console.log(data));
  
function removeLastBotMessage() {
    const chatLog = document.getElementById('chat-log');
    if (chatLog?.lastChild?.classList.contains('bot-message')) {
        chatLog.removeChild(chatLog.lastChild);
    }
}