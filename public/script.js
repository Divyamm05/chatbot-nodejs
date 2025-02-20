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
  const chatbox = document.getElementById('chatbox');
  const chatContainer = document.getElementById('chat-container');

  if (chatbox.classList.contains('minimized')) {
    chatbox.classList.remove('minimized');
    chatbox.classList.add('visible');
    chatContainer.style.display = "flex"; // Show container smoothly
  } else if (chatbox.classList.contains('visible')) {
    chatbox.classList.remove('visible');
    chatbox.classList.add('minimized');

    // Wait for animation to complete before hiding the container
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
      scrollToBottom();
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

  const newMessage = document.createElement('div');
  newMessage.className = sender === 'bot' ? 'bot-message message' : 'user-message message';

  if (message === "Generating domain names...") {
      newMessage.innerHTML = `<span>${message}</span> <div class="loading-spinner"></div>`;
  } else {
      newMessage.innerHTML = message.replace(/\n/g, "<br>");
  }

  chatLog.appendChild(newMessage);
  scrollToBottom();

  // Show auth buttons if the bot response matches predefined responses
  if (sender === 'bot' && checkBotResponse(message)) {
      chatLog.appendChild(authButtonsContainer); // Append after last message
      authButtonsContainer.style.display = 'flex';
      scrollToBottom(); // Ensure chat scrolls to bottom
  } else {
      authButtonsContainer.style.display = 'none';
  }

  // Show suggest buttons if the bot response matches domain suggestion triggers
  if (sender === 'bot' && checkDomainSuggestions(message)) {
      chatLog.appendChild(suggestButtonsContainer); // Append after last message
      suggestButtonsContainer.style.display = 'flex';
      scrollToBottom(); // Ensure chat scrolls to bottom
  } else {
      suggestButtonsContainer.style.display = 'none';
  }

  scrollToBottom();

  
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
      "Thank you for reaching out! To access detailed pricing for TLDs and services, please sign up. Once registered, you’ll have instant access to all pricing details and exclusive offers!"
  ];

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
        chatbox.style.transform = 'translateX(0)';
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
  userInput.value = question;
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
      if (chatLog) {
        chatLog.scrollTop = chatLog.scrollHeight;
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
          document.getElementById('otp-section').style.display = 'none';
          document.getElementById('login-chat-section').style.display = 'flex'; 
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

    updateChatLog(`Your question: ${queryText}`, 'user');
    updateChatLog('Searching for domain-related information...', 'bot');

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
