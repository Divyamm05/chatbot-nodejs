  // Function to toggle the chatbox visibility
  function toggleChatbox() {
    if (chatbox.classList.contains('minimized')) {
      chatbox.classList.remove('minimized');
      chatbox.classList.add('visible');
    } else if (chatbox.classList.contains('visible')) {
      chatbox.classList.remove('visible');
      chatbox.classList.add('minimized');
    }
  }

  function closeChatbox() {
    const chatbox = document.getElementById('chatbox');
    chatbox.classList.toggle('minimized');
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
          document.getElementById('domain-options').style.display = 'flex'; 
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
        document.getElementById('domain-options').style.display = 'flex'; 
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

        document.getElementById('domain-section').style.display = 'none';
        document.getElementById('domain-options-next').style.display = 'flex';

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
