function toggleAssistantLogo(show) {
  const assistantLogo = document.getElementById("assistant-logo");
  
  if (show) {
    assistantLogo.classList.remove("hidden");
  } else {
    assistantLogo.classList.add("hidden");
  }
}

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

  // Ensure CSS for buttons is added only once
  if (!document.getElementById('register-domain-css')) {
      const style = document.createElement('style');
      style.id = 'register-domain-css';
      style.innerHTML = `
        .register-button, .transfer-button {
          padding: 10px 10px;
          font-family: 'Inter', sans-serif;
          font-size: 600;
          font-size: 16px;
          cursor: pointer;
          border: none;
          color: #2c3e50;
          border-radius: 20px;
          background-color: #f1c40f;
          transition: background-color 0.3s ease;
          margin-top: 12px;
          display: block;  /* Ensures button is on a new line */
          width: 100%;  /* Makes button full width */
          text-align: center;  /* Centers text */
        }
        .register-button:hover, .transfer-button:hover {
          background-color: #d4ac0d;
        }
        .button-container {
          width: 100%;  /* Ensures it takes the full width */
          display: block;  /* Forces new line */
          margin-top: 10px; /* Adds spacing */
        }
      `;
      document.head.appendChild(style);
  }
  
  // Check for "register a domain" message
  if (sender === 'bot' && message.includes("register a domain")) {
      const registerButton = document.createElement('button');
      registerButton.textContent = "Register a Domain";
      registerButton.classList.add('register-button');
  
      registerButton.onclick = () => {
          const registrationSection = document.getElementById('domain-registration-section');
          const loginchatsection = document.getElementById('login-chat-section');
          if (registrationSection) {
              registrationSection.style.display = "block";
              loginchatsection.style.display = "none";
          }
      };
  
      // Ensure the button is always on a new line
      const buttonContainer = document.createElement('div');
      buttonContainer.classList.add('button-container');
      buttonContainer.appendChild(registerButton);
  
      newMessage.appendChild(buttonContainer);
  }  

// Check for "transfer a domain" message
if (
  sender === 'bot' &&
  (message.includes("transfer") || message.includes("domain transfer")) &&
  !message.includes("transferring") // Ensure "transferring" doesn't trigger the button
) {
  const transferButton = document.createElement('button');
  transferButton.textContent = "Transfer a Domain";
  transferButton.classList.add('transfer-button');

  transferButton.onclick = () => {
      const transferSection = document.getElementById('domain-transfer-section');
      const loginchatsection = document.getElementById('login-chat-section');
      if (transferSection) {
          transferSection.style.display = "block";
          loginchatsection.style.display = "none";
      }
  };

  newMessage.appendChild(transferButton);
}

  // Show auth buttons if response matches predefined responses
  if (sender === 'bot' && checkBotResponse(message)) {
      if (typeof authButtonsContainer !== 'undefined' && authButtonsContainer) {
          chatLog.appendChild(authButtonsContainer);
          authButtonsContainer.style.display = 'flex';
      } else {
          console.warn("authButtonsContainer is undefined");
      }
  } else if (authButtonsContainer) {
      authButtonsContainer.style.display = 'none';
  }

  // Show suggest buttons if response matches domain suggestions
  if (sender === 'bot' && checkDomainSuggestions(message)) {
      if (typeof suggestButtonsContainer !== 'undefined' && suggestButtonsContainer) {
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

function checkBotResponse(response) {
  const botMessages = [
      "To perform this action, you need to sign up. Create an account today to gain access to our platform and manage your domains effortlessly. Take control of your domain portfolio now!",
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!",
      "Please login/signup to access all the features.",
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!",
      "You can sign up by providing your email and setting up an account with us.",
      "Yes, you can register and manage domain names on this platform. SignUp/LogIn to access all features.",
      "Yes, an account is required for some advanced features."
  ];

  scrollToBottom();

  return botMessages.includes(response);
}

function checkDomainRegistrationResponse(response) {
  const expectedResponse = "I can assist you with domain registration. Please visit the register domain name section to proceed.";

  return botMessages.includes(response);
}

const suggestButtonsContainer = document.getElementById('suggest-buttons-container');

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
  const ns1 = document.getElementById("ns1").value.trim();
  const ns2 = document.getElementById("ns2").value.trim();
  const ns3 = document.getElementById("ns3").value.trim();
  const ns4 = document.getElementById("ns4").value.trim();
  const customerId = document.getElementById("customer-id").value.trim();
  const isWhoisProtection = document.getElementById("whois-protection").value === "yes";
  const isEnablePremium = document.getElementById("enable-premium").value === "yes" ? 1 : 0;
  const lang = document.getElementById("language").value;

  let appPurpose = "";
  let nexusCategory = "";
  if (domainName.endsWith(".us")) {
      appPurpose = document.getElementById("us-app-purpose").value;
      nexusCategory = document.getElementById("us-nexus-category").value;

      if (!appPurpose || !nexusCategory) {
          alert("For .us domains, you must select App Purpose and Nexus Category.");
          return;
      }
  }

  if (!domainName || !duration || !ns1 || !ns2 || !customerId) {
      alert("Please fill in all required fields.");
      return;
  }

  const requestData = {
      domainName,
      duration,
      ns1,
      ns2,
      ns3: ns3 || null,
      ns4: ns4 || null,
      customerId,
      isWhoisProtection,
      isEnablePremium,
      lang: lang || null,
      ...(domainName.endsWith(".us") && { appPurpose, nexusCategory })
  };

  const registerButton = document.querySelector("button[onclick='registerDomain()']");
  registerButton.disabled = true;  // Disable button during request

  try {
      const response = await fetch("/api/register-domain", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(requestData)
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
          alert("Domain registered successfully!");
          console.log("Success:", result);
      } else {
          alert("Error: " + result.message);
          console.error("Error:", result);
      }
  } catch (error) {
      console.error("Request failed:", error);
      alert("An error occurred. Please try again.");
  } finally {
      registerButton.disabled = false;  // Re-enable button
  }
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
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
    if (chatLog) {
        chatLog.scrollTop = chatLog.scrollHeight;
    } else {
        console.error("Chat log element not found.");
    }
}
    
    // Function to show the button press in the chat log
    function logButtonPress(buttonName) {
      updateChatLog(`You pressed the "${buttonName}" button.`, 'user');
    }

    let userEmail = '';
    async function requestOTP() {
      const emailInput = document.getElementById('user-email');
      const email = emailInput.value.trim();
    
      if (!email) {
        updateChatLog('Please enter a valid email.', 'bot');
        return;
      }
      
      updateChatLog(`Email entered: ${email}`, 'user');
      
      try {
        const response = await fetch('/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      
        if (!response.ok) {
          const data = await response.json();
          updateChatLog(data.message || 'An error occurred. Please try again.', 'bot');
          
          emailInput.value = '';  
          return;  
        }
      
        const data = await response.json();
        console.log("API Response:", data);
      
        if (data.success) {
          updateChatLog(data.message, 'bot');
          if (email === 'tester@abc.com') {
            updateChatLog('Logged in as tester. No OTP required.', 'bot');
            document.getElementById('email-section').style.display = 'none';
            document.getElementById('login-chat-section').style.display = 'flex';
            document.getElementById('sidebar-content').style.display = 'none';
            document.getElementById('faq-post-login').style.display = 'flex'; 
          } else {
            document.getElementById('email-section').style.display = 'none';
            document.getElementById('otp-section').style.display = 'flex'; 
            document.getElementById('resend-otp').style.display = 'block';
          }
        } else {
          updateChatLog('Failed to send OTP. Please try again.', 'bot');
        }
      } catch (error) {
        console.error('Error:', error);
      }
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
    async function verifyOTP() {
      const email = document.getElementById('user-email').value.trim();
      const otp = document.getElementById('otp-code').value.trim();
  
      if (!otp) {
          updateChatLog('Please enter the OTP to proceed.', 'bot');
          return;
      }
  
      try {
          const response = await fetch('/api/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, otp }),
          });
  
          const data = await response.json();
  
          if (data.success) {
              updateChatLog(data.message || 'OTP verified successfully!', 'bot');
  
              // Hide OTP section and show chat section
              document.getElementById('otp-section').style.display = 'none';
              document.getElementById('login-chat-section').style.display = 'flex';
  
              // Show post-verification FAQs and hide pre-verification FAQs
              document.getElementById('sidebar-content').style.display = 'none';
              document.getElementById('faq-post-login').style.display = 'flex';
          } else {
              updateChatLog(data.message || 'OTP verification failed. Please try again.', 'bot');
          }
      } catch (error) {
          updateChatLog('An error occurred during OTP verification. Please try again later.', 'bot');
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
      <p>This chatbot helps with domain name suggestions, domain availability checks, and domain-related queries.</p>
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
  const sectionsToHide = ['domain-section', 'domain-options', 'domain-options-next', 'domain-registration-section' , 'domain-transfer-section'];

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

  async function submitDomainQuery() {
    console.log("submitDomainQuery called"); 

    const queryInput = document.getElementById('domain-query-text');
    const queryText = queryInput.value.trim();

    if (!queryText) {
      updateChatLog("Please enter a valid query to proceed.", 'bot');
      return;
    }

    updateChatLog(`${queryText}`, 'user');
  

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
        if (data.suggestions?.length > 0) {
          updateChatLog("Suggested Topics:", 'bot');
          data.suggestions.forEach(suggestion => {
            updateChatLog(`- ${suggestion}`, 'bot');
          });
        }

        if (data.answer) {
          updateChatLog(`Answer: ${data.answer}`, 'bot');

          const chatLog = document.querySelector('.chat-log');
          const answerElement = chatLog.querySelector('.bot-message:last-child');
          if (answerElement) {
            answerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          queryInput.value = "";
        }

      } else {
        updateChatLog(`Error: ${data.message}`, 'bot');
      }

    } catch (error) {
      console.error("Error with fetch request:", error);
      updateChatLog("This chatbot can answer domain related questions only", 'bot');
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

  document.getElementById('back-to-previous-section').addEventListener('click', goBackToPreviousSection);

  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault(); 
    
        console.log("Active Element ID: ", document.activeElement.id);

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
