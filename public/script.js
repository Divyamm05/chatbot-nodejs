//---------------------------------------------------- Defining constants section ------------------------------------------------------//
const allowedActions = ["enable theft protection", "disable theft protection", "renew domain", "transfer domain"];
const chatLog = document.getElementById('chat-log');
const authButtonsContainer = document.getElementById('auth-buttons-container');

const observer = new MutationObserver(() => {
const botMessages = chatLog.querySelectorAll('.bot-message');
const lastBotMessage = botMessages[botMessages.length - 1]?.textContent;

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
//---------------------------------------- Request OTP, Resend ,Verification Section and logout-----------------------------------------//

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
        document.getElementById('user-email').value = '';
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
                if (typeof clearchatlog === 'function') clearchatlog(); // ✅ Ensure function exists
                document.getElementById('domain-query-text').value = ''; // Reset the input field
                updateChatLog("Thank you for signing in 😊. You're all set to explore our 🚀 advanced features, including domain registration, renewal, transfer, and so much more.", 'bot');
                
                // ✅ Hide login elements & Show authenticated UI
                document.getElementById('login-text').style.display = 'none';
                document.getElementById('signup-text').style.display = 'none';
                document.getElementById('profile-icon').style.display = 'flex';
                document.getElementById('email-section').style.display = 'none';
                document.getElementById('otp-section').style.display = 'none';
                document.getElementById('login-chat-section').style.display = 'flex';
                document.getElementById('sidebar').style.display = 'flex';
                document.getElementById('logout-text').style.display = 'flex';
                document.getElementById('sidebar-content').style.display = 'none';
                document.getElementById('faq-post-login').style.display = 'flex';

                let isSignedIn = true; // ✅ Declare isSignedIn if not already defined
                localStorage.setItem('isSignedIn', 'true');
                if (typeof updateAuthUI === 'function') updateAuthUI(); // ✅ Ensure function exists
                if (typeof toggleSidebar === 'function') toggleSidebar(); // ✅ Ensure function exists
            } else {
                updateChatLog("Authentication failed. Please try again.", 'bot');
                document.getElementById("user-email").value = "";
            }
        })
        .catch(error => {
            console.error("❌ Error during authentication:", error);
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
                // ✅ Only show OTP section, NOT login-chat-section yet
                document.getElementById("otp-section").style.display = "flex";
                document.getElementById("verify-otp").style.display = "block";
                document.getElementById("resend-otp").style.display = "block";
                document.getElementById("back-otp-section").style.display = "block";
    
                document.getElementById("otp-code").value = "";
                updateChatLog('OTP has been sent to your email address. Please check your inbox.', 'bot');
            } else {
                // ✅ Ensure login-chat-section is NOT shown here
                updateChatLog('No OTP required. Please proceed.', 'bot');
            }
        } else {
            updateChatLog(data.message, 'bot');
        }
    });
}

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
        profileicon.style.display = 'flex';
        document.getElementById('logout-text').style.display = 'flex';
        sidebar.style.display = 'block';
        if (sidebar) sidebar.classList.remove("collapsed");

        // Use customerId (resellerId) from the response
        if (data.customerId) {


            localStorage.setItem('customerId', data.customerId);
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

function logout(){
    document.getElementById('login-text').style.display = 'flex';
    document.getElementById('signup-text').style.display = 'none';
    document.getElementById('profile-icon').style.display = 'flex';
    document.getElementById('email-section').style.display = 'none';
    document.getElementById('otp-section').style.display = 'none';
    document.getElementById('login-chat-section').style.display = 'none';
    document.getElementById('sidebar').style.display = 'flex';
    document.getElementById('logout-text').style.display = 'none';
    document.getElementById('sidebar-content').style.display = 'flex';
    document.getElementById('faq-post-login').style.display = 'none';
    document.getElementById('user-input-section').style.display = "flex";
    const sectionsToHide = ['domain-section', 'domain-options', 'domain-options-next', 'domain-registration-section' , 'domain-transfer-section' , 'domain-renewal-section' , 'domain-availability-section' , 'name-server-update-section', 'add-child-name-server-section' ,'theft-protection-section' , 'privacy-protection-section' , 'domain-lock-section' , 'domain-suspension-section', 'additional-settings-section', 'name-server-container'];
    
    sectionsToHide.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {


        element.style.display = 'none';

    } else {
      }
    });
    clearchatlog();
    document.getElementById('user-question').value = ''; // Reset the input field
    updateChatLog("Welcome! 👋 I'm here to assist you. If you’d like to know what I can do, just click the 'ℹ️' button at the top. Let me know how can I help! 😊", 'bot');
}

//---------------------------------------------- Show and hide Chatbot, Sidebar Section -----------------------------------------------//

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

function openChatbox() {
    const chatbox = document.getElementById('chatbox');
    const chatContainer = document.getElementById('chat-container');

    if (!chatbox || !chatContainer) return;

    chatbox.classList.add('visible');
    chatbox.classList.remove('minimized');

    chatContainer.classList.add('visible');
    chatContainer.classList.remove('minimized');

    // Prevent duplicate event listeners
    document.removeEventListener('click', outsideChatboxClickListener);
    document.addEventListener('click', outsideChatboxClickListener);
}

function closeChatbox() {
    const chatbox = document.getElementById('chatbox');
    const chatContainer = document.getElementById('chat-container');

    if (!chatbox || !chatContainer) return;

    chatbox.classList.add('minimized');
    chatbox.classList.remove('visible');

    chatContainer.classList.add('minimized');
    chatContainer.classList.remove('visible');


    setTimeout(() => {
        chatContainer.style.display = "none"; // ✅ Hide it after animation
    }, 400);

    // Remove event listener to prevent multiple bindings
    document.removeEventListener('click', outsideChatboxClickListener);
}

function outsideChatboxClickListener(event) {
    const chatbox = document.getElementById('chat-container');
    const assistantLogo = document.getElementById('assistant-logo');

    if (!chatbox || !assistantLogo) {
        console.error("⚠️ Chatbox or Assistant Logo not found!");
        return;
    }

    // Check if the clicked element is inside the chatbox or the assistant logo


    if (!chatbox.contains(event.target) && !assistantLogo.contains(event.target)) {
        closeChatbox();


    } else {
    }
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

    
  const chatLog = document.querySelector('.chat-log');
  if (!chatLog) {
      console.error("Chat log element not found.");
      return;
  }
  let chatContainer = document.getElementById("chat-container");
  let messageElement = document.createElement("div");
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

          @media (max-height: 600px){
          .register-button, .transfer-button, .available-button, .update-button, .renew-button, .child-ns-button {
              font-size: 9px;
           }
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

  if (
    sender === 'user' && isUserSignedIn &&
    (message == "How do I register a domain?")
) {
    document.getElementById("domain-availability-section").style.display="flex";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("login-chat-section").style.display="none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("check-domain-input").value= "";
    document.getElementById("check-domain-button").style.borderRadius = "20px";
    document.getElementById("domain-availability-section").style.gap = "0px"
    return;
}

if (
    sender === 'user' && isUserSignedIn &&
    message.trim().toLowerCase() === "how can i renew a domain?"
) {

    // Show renewal section and hide unnecessary sections
    document.getElementById("domain-renewal-section").style.display = "flex";
    document.getElementById("domain-availability-section").style.display = "none";
    document.getElementById("domain-registration-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("login-chat-section").style.display = "none";
    document.getElementById("domain-transfer-section").style.display = "none"; 
    document.getElementById("name-server-update-section").style.display = "none";

    // Clear domain input field
    document.getElementById("renew-domain-name").value = "";
    return;
}

if (
    sender === 'user' && isUserSignedIn &&
    message === "How do I transfer IN/OUT domains?"
) {
    updateChatLog("Enter authcode(EPP code) and enable or disable Whois protection to transfer your domain to us seamlessly.", "bot");
    document.getElementById("domain-renewal-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display = "none";
    document.getElementById("domain-registration-section").style.display = "none";
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("login-chat-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("domain-transfer-section").style.display = "flex"; // Kept only one
    document.getElementById("name-server-update-section").style.display = "none";
    // Clear domain input field
    document.getElementById("transfer-domain-name").value = "";
    const chatLog = document.getElementById("chat-log");
    const height = window.innerHeight;


    if (height <= 320) {
        chatLog.style.height = "21%";
    } else if (height <= 380) {
        chatLog.style.height = "25%";
    } else if (height <= 573) {
        chatLog.style.height = "33%";
    } else if (height <= 600) {
        chatLog.style.height = "58%";
    } else if (height <= 640) {
        chatLog.style.height = "62%";
    } else {
        chatLog.style.height = "64%";
    }

    window.addEventListener("load", adjustChatLogHeight);
window.addEventListener("resize", adjustChatLogHeight);
    return;
}

if (
    sender === 'user' && isUserSignedIn &&
    message === "How can I update the name servers for a domain?"
) {
    updateChatLog("🔄 Please enter the domain name and the name servers that need to be updated. You can add more name servers by clicking '➕ Add Name Server' button. Maximum 4 name servers can be added. Then click '🖊 Update Name Server' button to save the changes.","bot");
    document.getElementById("domain-renewal-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display = "none";
    document.getElementById("domain-registration-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("login-chat-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("domain-transfer-section").style.display = "none"; 
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "flex";
    document.getElementById("name-server-container").style.display = "flex";
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

    // Clear domain input field
    document.getElementById("domain-name-input").value = "";

    const chatLog = document.getElementById("chat-log");
    const height = window.innerHeight; // Get total window height

    if (height <= 320) {
        chatLog.style.height = "10%";
        document.getElementById("domain-name-input").style.height= "20px";
        document.getElementById("name-server-update-section").style.gap = "5px";
        document.getElementById("update-nameserver-button-group").style.height= "32px";
        document.getElementById("nameserver-container").style.gap= "5px";
        document.getElementById("addNameServer").style.fontSize= "8px";
        document.getElementById("updateNameServer").style.fontSize= "8px";
        document.getElementById("updatenamebackbutton").style.fontSize= "10px";
        document.querySelectorAll(".ns-input input").forEach(input => {
            input.style.height = "20px";
        });

    } else if (height <= 380) {
        chatLog.style.height = "10%";
        document.getElementById("domain-name-input").style.height= "20px";
        document.getElementById("name-server-update-section").style.gap = "5px";
        document.getElementById("update-nameserver-button-group").style.height= "32px";
        document.getElementById("nameserver-container").style.gap= "5px";
        document.getElementById("addNameServer").style.fontSize= "8px";
        document.getElementById("updateNameServer").style.fontSize= "8px";
        document.getElementById("updatenamebackbutton").style.fontSize= "10px";
        document.querySelectorAll(".ns-input input").forEach(input => {
            input.style.height = "20px";
        });
    } else if (height <= 480) {
        chatLog.style.height = "30%";
    } else if (height <= 573) {
        chatLog.style.height = "52%";
    } else if (height <= 600) {
        chatLog.style.height = "58%";
    } else if (height <= 640) {
        chatLog.style.height = "62%";
    } else {
        chatLog.style.height = "64%";
    }

    return;
}

if (
    sender === 'user' && isUserSignedIn &&
    message === "How can I add a child nameserver?"
) {
    updateChatLog("🛠️ Enter Domain Name, Hostname, and IP Address for the child nameserver. You can add upto 4 child nameservers using the '➕Add Child Name Server' button.", "bot");
    const chatLog = document.getElementById("chat-log");
    const height = window.innerHeight; // Get total window height

    document.getElementById("domain-renewal-section").style.display = "none";
    document.getElementById("domain-renewal-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display = "none";
    document.getElementById("domain-registration-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("login-chat-section").style.display = "none";
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "flex";
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
    // Clear domain input field
    document.getElementById("child-domain-name").value = "";

    // ✅ Adjust chat log height dynamically
    if (height <= 320) {
        chatLog.style.height = "10%";
    
        const childDomain = document.getElementById("child-domain-name");
        const childNameserver = document.getElementById("childnameserver1");
        const childIP = document.getElementById("child-ip-address1");
    
        if (childDomain) childDomain.style.height = "5px";
        if (childNameserver) childNameserver.style.height = "5px";
        if (childIP) childIP.style.height = "5px";    
    } else if (height <= 480) {
        chatLog.style.height = "20%";
    } else if (height <= 525) {
        chatLog.style.height = "47%";
    } else if (height <= 573) {
        chatLog.style.height = "52%";
    } else if (height <= 600) {
        chatLog.style.height = "58%";
    } else {
        chatLog.style.height = "64%"; // Fallback for larger screens
    }

    return;
}

if (
    sender === 'user' && isUserSignedIn &&
    (message == "Enable/disable privacy protection for mydomain.com")
) {
    document.getElementById("privacy-protection-section").style.display = "flex";
    document.getElementById("domain-availability-section").style.display="none";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("login-chat-section").style.display="none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("privacy-protection-domain-name").value= "";

    const chatLog = document.getElementById("chat-log");
    const height = window.innerHeight; // Get total window height
    if (height <= 320) {
        chatLog.style.height = "15%";
    } else if (height <= 480) {
        chatLog.style.height = "35%";
    } else if (height <= 525) {
        chatLog.style.height = "47%";
    } else if (height <= 573) {
        chatLog.style.height = "52%";
    } else if (height <= 600) {
        chatLog.style.height = "58%";
    } else if (height <= 640) {
        chatLog.style.height = "62%";
    } else {
        chatLog.style.height = "64%"; // ✅ Ensure there's a fallback value
    }
    return;
}

if (
    sender === 'user' && isUserSignedIn &&
    (message == "Lock/unlock mydomain.com")
) {
    document.getElementById("domain-lock-section").style.display = "flex";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display="none";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("login-chat-section").style.display="none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("domain-lock-name").value= "";

    updateChatLog("🛠️ Enter Domain Name, Hostname, and IP Address for the child nameserver. You can add upto 4 child nameservers using the '➕Add Child Name Server' button.", "bot");
    const chatLog = document.getElementById("chat-log");
    const height = window.innerHeight; // Get total window height
    if (height <= 320) {
        chatLog.style.height = "15%";
    } else if (height <= 480) {
        chatLog.style.height = "35%";
    } else if (height <= 525) {
        chatLog.style.height = "47%";
    } else if (height <= 573) {
        chatLog.style.height = "52%";
    } else if (height <= 600) {
        chatLog.style.height = "58%";
    } else if (height <= 640) {
        chatLog.style.height = "62%";
    } else {
        chatLog.style.height = "64%"; // ✅ Ensure there's a fallback value
    }
    return;
}

if (
    sender === 'user' && isUserSignedIn &&
    (message == "Enable/disable theft protection for mydomain.com")
) {
    document.getElementById("theft-protection-section").style.display = "flex";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display="none";
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("login-chat-section").style.display="none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("theft-protection-domain-name").value= "";

    const chatLog = document.getElementById("chat-log");
    const height = window.innerHeight; // Get total window height
    if (height <= 320) {
        chatLog.style.height = "15%";
    } else if (height <= 480) {
        chatLog.style.height = "35%";
    } else if (height <= 525) {
        chatLog.style.height = "47%";
    } else if (height <= 573) {
        chatLog.style.height = "52%";
    } else if (height <= 600) {
        chatLog.style.height = "58%";
    } else if (height <= 640) {
        chatLog.style.height = "62%";
    } else {
        chatLog.style.height = "64%"; // ✅ Ensure there's a fallback value
    }
    return;
}

if (
    sender === 'user' && isUserSignedIn &&
    (message == "Suspend/Unsuspend mydomain.com")
) {
    document.getElementById("domain-suspension-section").style.display = "flex";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display="none";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("login-chat-section").style.display="none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    document.getElementById("domain-suspension-name").value= "";

    const chatLog = document.getElementById("chat-log");
    const height = window.innerHeight; // Get total window height
    if (height <= 320) {
        chatLog.style.height = "15%";
        document.getElementById("manageDomainSuspension").style.fontSize= "9px";
    } else if (height <= 480) {
        chatLog.style.height = "35%";
    } else if (height <= 525) {
        chatLog.style.height = "47%";
    } else if (height <= 573) {
        chatLog.style.height = "52%";
    } else if (height <= 600) {
        chatLog.style.height = "58%";
    } else if (height <= 640) {
        chatLog.style.height = "62%";
    } else {
        chatLog.style.height = "64%"; // ✅ Ensure there's a fallback value
    }
    return;
}

  // Call scrollToBottom only once
  scrollToBottom();
  chatContainer.appendChild(messageElement);
    
  return messageElement; 
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

function updateAuthUI() {
        const authContainer = document.getElementById('auth-buttons-container');
        if (isSignedIn && authContainer) {
            authContainer.style.display = 'none';
        }
}

//------------ Prefills chat input with a domain query, highlights the domain name placeholder, and show a tooltip section ------------//

function fillChatInput(question) {
    console.trace("🔍 fillChatAndAsk() CALLED!");

    const userInput = document.getElementById("user-question");
    const askButton = document.getElementById("submit-question"); // Pre-login "Ask" button

    if (!userInput || !askButton) {
        console.error("❌ Chat input field or 'Ask' button not found!");
        return;
    }

    updateChatInput(userInput, question);



    setTimeout(() => {
        askButton.click();
    }, 10);
}

function fillChatAndSubmit(question) {
    console.trace("🔍 fillChatAndSubmit() CALLED!");

    const userInput = document.getElementById("domain-query-text");
    const submitButton = document.getElementById("submitDomainQuery"); // Post-login "Submit" button

    if (!userInput || !submitButton) {
        console.error("❌ Chat input field or 'Submit' button not found!");
        return;
    }

    updateChatInput(userInput, question);


    setTimeout(() => {
        submitButton.click();
    }, 10);
}

function fillChatAndSubmitandshowquerybar(question) {
    console.trace("🔍 fillChatAndSubmitandshowquerybar() CALLED!");

    const userInput = document.getElementById("domain-query-text");
    const submitButton = document.getElementById("submitDomainQuery"); // Post-login "Submit" button
    const loginChatSection = document.getElementById("login-chat-section");

    if (!userInput || !submitButton) {
        console.error("❌ Chat input field or 'Submit' button not found!");
        return;
    }
    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display="none";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";

    // Make login-chat-section visible first
    if (loginChatSection) {
        loginChatSection.style.display = "flex"; 
        document.getElementById("domain-query-text").value = "";
    } else {
    }

    updateChatInput(userInput, question);

    setTimeout(() => {
        submitButton.click();
    }, 10);
}

function updateChatInput(inputField, question) {
    const normalizedQuestion = question.trim().toLowerCase();
    const normalizedInput = inputField.value.trim().toLowerCase();

    if (normalizedInput === normalizedQuestion) {
        console.warn("❌ Duplicate question detected, ignoring...");
        return;
    }

    inputField.value = ""; // Clear input first
    setTimeout(() => {
        inputField.value = question;
        inputField.focus();
    }, 10);
}

let tooltipDomain = null;
let tooltipDate = null;
let tooltipCategory = null;

function fillChatInputWithPlaceholder(template) {

    const chatInput = document.getElementById('domain-query-text');
    const submitButton = document.getElementById('submitDomainQuery');
    const lockToggle = document.getElementById('domain-lock-dropdown-container');
    const suspendToggle = document.getElementById('domain-suspend-toggle-container');
    const privacyToggle = document.getElementById('domain-privacy-dropdown');
    const loginChatSection = document.getElementById("login-chat-section");

    if (!chatInput) {
        console.error("❌ Chat input field not found!");
        return;
    }

    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display="none";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";

    // Make login-chat-section visible first
    if (loginChatSection) {
        loginChatSection.style.display = "flex"; // or "flex" based on your styling

    } else {
        console.error("❌ 'login-chat-section' not found!");
    }


    // Avoid triggering multiple times
    if (chatInput.value.trim() === template.trim()) {
        console.warn("⚠️ Duplicate template detected, ignoring...");
        return;
    }

    chatInput.value = template;
    chatInput.focus();

    // Highlight "mydomain.com" and show tooltip
    tooltipDomain = highlightPlaceholder(chatInput, template, "mydomain.com", "Enter your domain name here.", tooltipDomain);
    autoHideTooltip(tooltipDomain);

    // Extract action name and fetch API details
    const actionName = extractActionName(template);

    if (actionName) {
        getAPIDetails(template, actionName);
    } else {
        console.log("❌ No action name detected.");
    }

    // Always show submit button
    submitButton.style.display = 'block';

    // Lock Toggle
    if (!lockToggle) {
        console.error("❌ Lock toggle container not found! Check the HTML ID.");
    } else {
        if (/how do I (lock|unlock)\/?(lock|unlock)? (.+)/i.test(template)) {
            lockToggle.style.display = 'block';
        } else {
            lockToggle.style.display = 'none';
        }
    }

    // Privacy Toggle
    if (!privacyToggle) {
        console.error("❌ Privacy toggle container not found! Check the HTML ID.");
    } else {
        if (/privacy protection (.+)/i.test(template)) {
            privacyToggle.style.display = 'block';
        } else {
            privacyToggle.style.display = 'none';
        }
    }

    // Suspend Toggle
    if (!suspendToggle) {
        console.error("❌ Suspend toggle container not found! Check the HTML ID.");
    } else {
        if (/suspend domain (.+)/i.test(template)) {
            suspendToggle.style.display = 'block';

        } else {
            suspendToggle.style.display = 'none';

        }
    }

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

        // ✅ Adjust for small screens (height < 320px)
        if (window.innerHeight < 320) {
            leftPosition = rect.left + window.scrollX; // Move to start of input
            topPosition = rect.top + window.scrollY + rect.height + 5; // Below input
        }

        tooltipRef.style.left = `${placeholderX}px`;
        tooltipRef.style.top = `${placeholderY}px`;
    }

    return tooltipRef;
}

function autoHideTooltip(tooltipRef) {
    setTimeout(() => {
        if (tooltipRef) {
            tooltipRef.remove();
            tooltipRef = null;
        }
    }, 4000);
}

function fillChatInputWithPlaceholderDate(template) {
    const chatInput = document.getElementById('domain-query-text');
    const loginChatSection = document.getElementById("login-chat-section");

    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display="none";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";

    if (loginChatSection) {
        loginChatSection.style.display = "flex"; 
    } else {
        console.error("❌ 'login-chat-section' not found!");
    }

    chatInput.value = template;
    chatInput.focus();

    // Highlight "dd-mm-yyyy" and show tooltip
    tooltipDate = highlightPlaceholder(chatInput, template, "dd-mm-yyyy", "Enter a valid date (dd-mm-yyyy).", tooltipDate);
    autoHideTooltip(tooltipDate);
}

function fillChatInputWithPlaceholderCategory(template) {
    const chatInput = document.getElementById('domain-query-text');
    const loginChatSection = document.getElementById("login-chat-section");


    document.getElementById("domain-suspension-section").style.display = "none";
    document.getElementById("theft-protection-section").style.display = "none";
    document.getElementById("domain-lock-section").style.display = "none";
    document.getElementById("privacy-protection-section").style.display = "none";
    document.getElementById("domain-availability-section").style.display="none";
    document.getElementById("domain-renewal-section").style.display="none";
    document.getElementById("domain-registration-section").style.display="none";
    document.getElementById("domain-transfer-section").style.display = "none";
    document.getElementById("name-server-update-section").style.display = "none";
    document.getElementById("add-child-name-server-section").style.display = "none";
    // Make login-chat-section visible first
    if (loginChatSection) {
        loginChatSection.style.display = "flex"; // or "flex" based on your styling
    } else {
        console.error("❌ 'login-chat-section' not found!");
    }

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

    disableChat();
    // Send API request
    fetch(`/api/manage-theft-protection?domainName=${domainName}&enable=${isEnabled}`)
    .then(response => response.json())
    .then(data => {

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


        const response = await axios.get(url, { headers: { "Accept": "application/json" } });


        const message = response.data?.responseMsg?.message || "Unknown response from API";
        const isAvailable = response.data?.responseMsg?.message === "Domain Available for Registration";


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

    // Define a unique ID for the availability message
    const availabilityMessageId = "check-availability-message-div";

    // Check if a previous message exists
    let checkAvailabilityDiv = document.getElementById(availabilityMessageId);

    if (checkAvailabilityDiv) {
        // Replace previous message instead of removing it
        checkAvailabilityDiv.innerHTML = "🔍 Checking domain availability...";
    } else {
        // Add new message if none exists
        updateChatLog(`<div id="${availabilityMessageId}">🔍 Checking domain availability...</div>`, "bot");
    }

    document.getElementById('domain-query-text').value = ''; 

    try {
        const response = await fetch(`/api/check-domain?domain=${domainInput}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.message?.includes("Error checking domain availability")) {
            throw new Error(data.message);
        }

        if (!data.hasOwnProperty("available")) {
            throw new Error("Missing 'available' property in API response.");
        }


        // Get the existing message again in case it was modified
        checkAvailabilityDiv = document.getElementById(availabilityMessageId);

        if (checkAvailabilityDiv) {
            // ✅ Replace with success message
            checkAvailabilityDiv.innerHTML = "✅ Domain Check Complete!";
        } else {
            // ✅ If the message was somehow removed, add a meaningful message
            updateChatLog("✅ Domain check completed! Proceed with the next step.", "bot");
        }

        // Prepare new availability message
        let availabilityMessage;
        
        if (data.available) {

            availabilityMessage = `✅ <strong>${domainInput}</strong> is available for registration!<br>Do you want to register this domain?
                <div style="display: flex; gap: 10px; margin-top: -12px; margin-left:-85px;">
                    <button onclick="handleYesClick('${domainInput}')" style="padding:8px 12px; border:none; cursor:pointer; background-color:#008CBA; color:white; border-radius:5px;">Yes</button>
                    <button onclick="handleNoClick()" style="padding:8px 12px; border:none; cursor:pointer; background-color:#ccc; color:#000; border-radius:5px; margin-left:-83px;">No</button>
                </div>`;
        } else {

            availabilityMessage = `❌ <strong>${domainInput}</strong> is already taken. Try another name?
                <div style="display: flex; margin-top: -15px; margin-left:-37px;">
                    <button onclick="handleTryAnother()" style=" border:none; cursor:pointer; background-color:#008CBA; color:white; border-radius:5px;">Try Another Name</button>
                    <button onclick="handleSuggestAlternatives('${domainInput}')" style=" border:none; cursor:pointer; background-color:#ccc; color:#000; border-radius:5px; margin-left: -28px;">Suggest Alternatives</button>
                </div>`;
        }

        // ✅ Add new availability message to chat
        updateChatLog(availabilityMessage, 'bot');

        // ✅ Scroll chat to the bottom
        scrollToBottom();
    } catch (error) {
        console.error("❌ Caught an error inside try block:", error);
        updateChatLog("⚠️ Error checking domain availability. Please try again later.", "bot");
    }
}

function handleYesClick(domainInput) {

    // Hide previous sections
    document.getElementById("domain-availability-section").style.display = "none";
    document.getElementById("login-chat-section").style.display = "none";

    // Find the chat log and replace the registration prompt
    const chatLog = document.getElementById("chat-log"); // Replace with actual chat log ID
    if (chatLog) {
        chatLog.innerHTML = chatLog.innerHTML.replace(
            /✅ <strong>.*is available for registration!.*?<div.*?<\/div>/s, 
            "📌 <strong>Great choice!</strong> Now, let's proceed with registration. 🛠"
        );
    }

    // 📝 New domain registration prompt with emojis
    let registrationMessage = `📝 <strong>Enter your domain name and select duration ⏳.</strong>\nAdditionally, you can add more info like 🌍 name servers, 🌐 language, etc., by clicking the ➕ <strong>"More Details"</strong> button.`;

    // Add the new message to chat
    updateChatLog(registrationMessage, "bot");

    // Show domain registration section
    const domainRegistrationSection = document.getElementById("domain-registration-section");
    if (domainRegistrationSection) {
        domainRegistrationSection.style.display = "flex";
        document.getElementById("domain-button-group").style.display="flex";
        document.getElementById("domain-name").value = domainInput; // Prefill the domain name
    } else {
        console.error("❌ 'domain-registration-section' NOT found in the DOM!");
    }
}

function handleNoClick() {

    // Find the chat log and replace the registration prompt
    const chatLog = document.getElementById("chat-log");
    if (chatLog) {
        chatLog.innerHTML = chatLog.innerHTML.replace(
            /✅ <strong>.*is available for registration!.*?<div.*?<\/div>/s, 
            "No worries! Let me know if you need anything else. 😊"
        );
    }

    // Hide the domain availability section and show the login chat section
    document.getElementById("domain-availability-section").style.display = "none";
    document.getElementById("login-chat-section").style.display = "flex";
}

function handleTryAnother() {

    const domainInputField = document.getElementById("check-domain-input");
    if (domainInputField) {
        domainInputField.value = ""; // Clear input
        domainInputField.focus(); // Refocus
    } else {
        console.error("❌ 'check-domain-input' NOT found in the DOM!");
    }

    // ✅ Replace the previous "Domain is already taken" message
    const chatLog = document.getElementById("chat-log");
    if (chatLog) {
        chatLog.innerHTML = chatLog.innerHTML.replace(
            /❌ <strong>.*? is already taken.*?<div.*?<\/div>/s, 
            "💡 Enter another domain name to check availability. 🔍"
        );
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

document.getElementById("check-domain-button").addEventListener("click", function () {
    const domainName = document.getElementById("check-domain-input").value.trim();
    if (!domainName) {
        addChatMessage("bot", "Please enter a domain name.");
        return;
    }
    checkDomainAvailability(domainName);
});

let suggestionData = []; 
let suggestionIndex = 0;
const SUGGESTION_BATCH_SIZE = 5; 

async function fetchDomainSuggestions(domainInput) {
    try {

        // Ensure "www." is removed before sending
        if (domainInput.startsWith("www.")) {
            domainInput = domainInput.replace(/^www\./, "");
        }

        // ✅ Replace the "Domain is already taken" message
        const chatLog = document.getElementById("chat-log");
        if (chatLog) {
            chatLog.innerHTML = chatLog.innerHTML.replace(
                /❌ <strong>.*? is already taken.*?<div.*?<\/div>/s, 
                "💡 Here are more similar domain suggestions ⬇️"
            );
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

        let suggestionMessage = "(Click on a domain to register it)<br>";
        slice.forEach((suggestion, index) => {
            const suggestionNumber = startNumber + index;
            suggestionMessage += `<br>${suggestionNumber}. <a href="#" onclick="event.preventDefault(); selectDomain('${suggestion.domainName}')" style="color: white; text-decoration: underline;">${suggestion.domainName}</a> - 💰 $${suggestion.price}`;
        });

        // ✅ Append "More Suggestions?" prompt with buttons
        if (suggestionIndex < suggestionData.length) {
            suggestionMessage += `<br><br><span>Would you like more suggestions?</span>  
            <span style="display: inline-flex; gap: 10px; margin-left: 10px;">
                <button onclick="fetchDomainSuggestions('${domainInput}')" style="background-color: #008CBA; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">Yes</button>  
                <button onclick="handleNoSuggestionsClick()" style="background-color: #ccc; color: black; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px;">No</button>
            </span>`;
        }

        addChatMessage("bot", suggestionMessage);
    } catch (error) {
        console.error("❌ Error fetching domain suggestions:", error);
        addChatMessage("bot", "⚠️ Error fetching domain suggestions. Please try again later.");
    }
}

function handleNoSuggestionsClick() {
    addChatMessage("bot", "Okay! Let me know if you need anything else. 😊");
    document.getElementById("domain-availability-section").style.display = "none";
    document.getElementById("login-chat-section").style.display = "flex";
    document.getElementById("login-chat-section").value = "";
}

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
    document.getElementById("domain-button-group").style.display="flex";
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

function showDomainRegistration(domainName) {

    document.getElementById("domain-name").value = domainName;
    document.getElementById("domain-registration-section").style.display = "block";
    document.getElementById("domain-button-group").style.display="flex";
}

function goBackToCheckSection() {
    document.getElementById("domain-registration-section").style.display = "none";
    document.getElementById("check-availability-section").style.display = "block";
}

function addadditionaldomaindetails() {
    const additionalsection = document.getElementById("additional-settings-section");

    if (additionalsection) {
        additionalsection.style.display = "flex"; // ✅ Corrected string format
        document.getElementById('chat-log').style.height = '30%';
        document.getElementById('domain-button-group').style.display = 'none';
        document.getElementById('close-additional-settings-buttons').style.display = 'flex';
        document.getElementById('close-additional-settings-buttons').style.height = '5vh';
        document.getElementById('additional-settings-section').style.marginTop = '-6px';

        // Check screen height
        if (window.innerHeight <= 600) {
            document.getElementById('closeadditionaldomaindetails').style.fontSize = '9px';
            document.getElementById('registerDomain').style.fontSize = '9px';
        } else {
            document.getElementById('closeadditionaldomaindetails').style.fontSize = '12px';
            document.getElementById('registerDomain').style.fontSize = '12px';
        }
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
        updateChatLog("⚠️ Please fill in all required fields.", "bot");
        return;
    }

    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
        updateChatLog("⚠️ Please enter a valid domain name.", "bot");
        return;
    }

    try {
        // 🔍 Fetch domain availability + price from backend
        const response = await fetch(`/api/check-domain?domain=${domainName}`);
        const data = await response.json();

        if (!data.success) {
            updateChatLog("❌ Error fetching domain availability.", "bot");
            return;
        }

        if (!data.available) {
            updateChatLog(`❌ ${domainName} is not available for registration.`, "bot");
            return;
        }

        const price = data.registrationFee * parseInt(duration, 10);

        // 📝 Confirmation Message
        const confirmationHtml = `<div id="confirmation-message-div">Do you want to register the domain <strong>${domainName}</strong>?\n💰 <strong>Registration Price: $${price.toFixed(2)}</strong>
                <div class="button-container-register">
                    <button id="yesButton">Yes</button>
                    <button id="noButton">No</button>
                </div>
        `;

        // ✅ Update chat log
        setTimeout(() => {
            updateChatLog(confirmationHtml, "bot");

            setTimeout(() => {
                const buttonContainers = document.querySelectorAll(".button-container-register");
                const lastButtonContainer = buttonContainers[buttonContainers.length - 1]; // Select latest
            
                if (lastButtonContainer) {
            
                    const yesButton = lastButtonContainer.querySelector("#yesButton");
                    const noButton = lastButtonContainer.querySelector("#noButton");
            
                    if (yesButton) {
    yesButton.onclick = () => {
        // Find the confirmation message div
        const confirmationMessage = document.getElementById("confirmation-message-div");

        if (confirmationMessage) {
            // Replace the content with a message indicating the process is starting
            confirmationMessage.innerHTML = `🔄 Proceeding to register your domain <strong>${domainName}</strong>...`;
        }

        // Proceed with registration
        confirmRegistration(domainName, duration, additionalsection.style.display === "flex");
    };
}

                    if (noButton) {
                        noButton.onclick = () => {
                            // Find the confirmation message div
                            const confirmationMessage = document.getElementById("confirmation-message-div");
                    
                            if (confirmationMessage) {
                                // Replace its content with the cancellation message
                                confirmationMessage.innerHTML = "❌ Domain registration canceled.";
                            }
                    
                            // Hide sections
                            document.getElementById("domain-registration-section").style.display = "none";
                            document.getElementById("additional-settings-section").style.display = "none";
                            document.getElementById("login-chat-section").style.display = "flex";
                            document.getElementById("login-chat-section").value = "";
                        };
                    }                    
                }
            }, 50);
        }, 50);
    } catch (error) {
        updateChatLog("⚠️ Failed to fetch domain price. Please try again.", "bot");
    }
}

function confirmRegistration(domainName, duration, isAdditionalVisible) {
    updateChatLog("⏳ Registering your domain, please wait...", "bot");
    disableChat();
    let apiUrl = `/api/register-domain?WebsiteName=${domainName}&Duration=${duration}&ProductType=1`;

    if (isAdditionalVisible) {
        const ns1 = document.getElementById("ns1").value.trim();
        const ns2 = document.getElementById("ns2").value.trim();
        const ns3 = document.getElementById("ns3").value.trim();
        const ns4 = document.getElementById("ns4").value.trim();
        const language = document.getElementById("language").value.trim();
        const isEnablePremium = document.getElementById("enable-premium").checked ? 1 : 0;
        const isWhoisProtection = document.getElementById("whois-protection").checked ? true : false;

        apiUrl += `&ns1=${ns1}&ns2=${ns2}&isEnablePremium=${isEnablePremium}&IsWhoisProtection=${isWhoisProtection}`;
        if (ns3) apiUrl += `&ns3=${ns3}`;
        if (ns4) apiUrl += `&ns4=${ns4}`;
        if (language) apiUrl += `&lang=${language}`;

        const usPurpose = document.getElementById("us-app-purpose").value.trim();
        const usNexusCategory = document.getElementById("us-nexus-category").value.trim();

        if (usPurpose && usNexusCategory) {
            apiUrl += `&isUs=1&appPurpose=${usPurpose}&nexusCategory=${usNexusCategory}`;
        }
    }

    fetch(apiUrl, { method: "GET" })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                updateChatLog(`✅ <strong>${domainName}</strong> has been successfully registered!`, "bot");
            } else {
                updateChatLog(`❌ Error: ${result.message}`, "bot");
            }
            enableChat();
            document.getElementById("domain-registration-section").style.display = "none";
            document.getElementById("additional-settings-section").style.display = "none";
            document.getElementById("login-chat-section").style.display = "flex";
            document.getElementById("login-chat-section").value = "";
        })
        .catch(error => {
            updateChatLog("⚠️ Internal Server Error", "bot");
            enableChat();
        });
}

//------------------------------------------------- Enable/Disable Chatbox Section ---------------------------------------------------//

function disableChat() {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
      chatContainer.style.pointerEvents = "none";
      chatContainer.style.opacity = "0.85";
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

function showChatConfirmation(message, confirmCallback, cancelCallback) {
    const confirmationHtml = `
        🟠 ${message}
        <div style="display: flex; gap: 10px; margin-top: 8px;">
            <button 
                onclick="(${confirmCallback})();" 
                style="padding: 8px 12px; background-color: #066; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Confirm
            </button>
            <button 
                onclick="(${cancelCallback})();" 
                style="padding: 8px 12px; background-color: #ccc; color: #000; border: none; border-radius: 5px; cursor: pointer;">
                Cancel
            </button>
        </div>
    `;

    updateChatLog(confirmationHtml, "bot");
}

function showChatPopup(message, isSuccess = true, isProcessing = false) {
    let chatMessage = isProcessing 
        ? `⏳ ${message}` 
        : isSuccess 
            ? `✅ ${message}` 
            : `❌ ${message}`;

    updateChatLog(chatMessage, "bot");
}

//---------------------------------------------------- Transfer Domain Section ------------------------------------------------------//

async function transferDomain() {
    const domainName = document.getElementById('transfer-domain-name').value.trim();
    const authCode = document.getElementById('auth-code').value.trim();
    const isWhoisProtection = document.getElementById('transfer-whois-protection').value === 'yes';

    if (!domainName || !authCode) {
        updateChatLog("⚠️ Please fill in all required fields.", "bot");
        return;
    }

    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
        updateChatLog("⚠️ Please enter a valid domain name.", "bot");
        return;
    }

    try {
        // 🔍 Fetch transfer fee from backend
        const feeResponse = await fetch(`/api/get-transfer-fee?domain=${domainName}`);
        const feeData = await feeResponse.json();

        if (!feeData.success) {
            updateChatLog("❌ Error fetching transfer fee.", "bot");
            return;
        }

        const transferFee = parseFloat(feeData.transferFee);
        const uniqueId = `transfer-message-${Date.now()}`; // Generate a unique ID

        // 📝 Show transfer confirmation inside chat log
        const confirmationHtml = `<div id="${uniqueId}"> Do you want to transfer the domain <strong>${domainName}</strong>?<br>💰 <strong>Transfer Fee: $${transferFee.toFixed(2)}</strong>
            <div class="button-container-renew">
                <button id="yesTransfer-${uniqueId}" style="background-color: #008CBA; color=white;">Yes</button>
                <button id="noTransfer-${uniqueId}" style="background-color: #ccc; color: black; margin-left: -7vh;">No</button>
            </div>
        </div>`;

        updateChatLog(confirmationHtml, "bot");

        // 🎨 Wait for buttons to be rendered
        setTimeout(() => {
            const yesButton = document.getElementById(`yesTransfer-${uniqueId}`);
            const noButton = document.getElementById(`noTransfer-${uniqueId}`);

            if (yesButton) {
                yesButton.onclick = async () => {
                    const transferMessageDiv = document.getElementById(uniqueId);
                    if (transferMessageDiv) {
                        transferMessageDiv.innerHTML = "✅ Processing domain transfer...";
                    }
                    await confirmDomainTransfer(domainName, authCode, isWhoisProtection);

                    if (transferMessageDiv) {
                        transferMessageDiv.innerHTML = "✅ Request made to transfer domain name.";
                    }
                };
            }

            if (noButton) {
                noButton.onclick = () => {
                    const transferMessageDiv = document.getElementById(uniqueId);

                    if (transferMessageDiv) {
                        // ✅ Replace message and remove buttons
                        transferMessageDiv.innerHTML = "❌ Domain transfer canceled.";
                    }

                    // ✅ Hide the transfer section and return to login chat
                    document.getElementById('domain-transfer-section').style.display = 'none';
                    document.getElementById('login-chat-section').style.display = 'flex';
                    document.getElementById('domain-query-text').value = '';
                };
            }
        }, 50);
    } catch (error) {
        console.error("❌ Error fetching transfer fee:", error);
        updateChatLog("❌ Could not fetch transfer fee. Please try again.", "bot");
    }
}

async function confirmDomainTransfer(domainName, authCode, isWhoisProtection) {
    updateChatLog(`🔄 Initiating domain transfer for <strong>${domainName}</strong>, please wait...`, "bot");
    disableChat();
    try {
        const response = await fetch('/api/transfer-domain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domainName, authCode, isWhoisProtection }),
        });

        const result = await response.json();

        updateChatLog(result.success ? `✅ ${result.message}` : `❌ Error: ${result.message}`, "bot");

        // Reset input fields and switch back to chat mode
        document.getElementById('domain-transfer-section').style.display = 'none';
        document.getElementById('login-chat-section').style.display = 'flex';
        document.getElementById('domain-query-text').value = '';
        enableChat();
    } catch (error) {
        console.error('❗ Unexpected error during domain transfer:', error);
        updateChatLog("❌ An error occurred during domain transfer. Please try again later.", "bot");
        enableChat();
    }
}

//----------------------------------------------------- Renew Domain Section --------------------------------------------------------//
async function renewDomain() {
    const domainName = document.getElementById("renew-domain-name").value.trim();
    const duration = document.getElementById("renew-duration").value;

    if (!domainName || !duration) {
        updateChatLog("⚠️ Please fill in all required fields.", "bot");
        return;
    }

    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
        updateChatLog("⚠️ Please enter a valid domain name.", "bot");
        return;
    }

    if (duration < 1 || duration > 10) {
        updateChatLog("⚠️ Please enter a valid renewal duration (1-10 years).", "bot");
        return;
    }

    try {
        // 🔍 Fetch renewal fee from backend
        const response = await fetch(`/api/get-renewal-fee?domain=${encodeURIComponent(domainName)}`);
        const data = await response.json();

        if (!data.success) {
            updateChatLog("❌ Error fetching domain renewal fee.", "bot");
            return;
        }

        const renewalFeePerYear = parseFloat(data.renewalFeePerYear);
        const totalPrice = renewalFeePerYear * duration;
        const uniqueId = `renewal-message-${Date.now()}`; // Generate a unique ID

        // 📝 Show renewal confirmation inside chat log
        const confirmationHtml = `<div id="${uniqueId}"> Renewing your domain <strong>${domainName}</strong> for <strong>${duration}</strong> year(s)?<br>💰 <strong>Renewal Price: $${totalPrice.toFixed(2)}</strong>
            <div class="button-container-renew">
                <button id="yesRenew-${uniqueId}" style="background-color: #008CBA; color=white;">Yes</button>
                <button id="noRenew-${uniqueId}" style="background-color: #ccc; color: black; margin-left: -7vh;">No</button>
            </div>
        </div>`;

        updateChatLog(confirmationHtml, "bot");

        // 🎨 Wait for buttons to be rendered
        setTimeout(() => {
            const yesButton = document.getElementById(`yesRenew-${uniqueId}`);
            const noButton = document.getElementById(`noRenew-${uniqueId}`);

            if (yesButton) {
                yesButton.onclick = async () => {
                    const renewalMessageDiv = document.getElementById(uniqueId);
                    if (renewalMessageDiv) {
                        renewalMessageDiv.innerHTML = "✅ Processing domain renewal...";
                    }
                    await confirmRenewal(domainName, duration);

                    if (renewalMessageDiv) {
                        renewalMessageDiv.innerHTML = "✅ Domain renewed successfully!";
                    }
                };
            }

            if (noButton) {
                noButton.onclick = () => {
                    const renewalMessageDiv = document.getElementById(uniqueId);

                    if (renewalMessageDiv) {
                        // ✅ Replace message and remove buttons
                        renewalMessageDiv.innerHTML = "❌ Domain renewal canceled.";
                    }

                    // ✅ Hide the renewal section and return to login chat
                    document.getElementById('domain-renewal-section').style.display = 'none';
                    document.getElementById('login-chat-section').style.display = 'flex';
                    document.getElementById('domain-query-text').value = '';
                };
            }
        }, 50);
    } catch (error) {
        updateChatLog("⚠️ Failed to fetch renewal fee. Please try again.", "bot");
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
        document.getElementById('domain-query-text').value = '';
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

    nameServerCount++; // Increment first

    const container = document.getElementById("nameserver-container");

    const input = document.createElement("input");
    input.type = "text";
    input.id = `nameserver${nameServerCount}`;
    input.placeholder = `Enter Name Server ${nameServerCount}`;
    input.required = true;

    const nsInputWrapper = document.createElement("div");
    nsInputWrapper.classList.add("ns-input");
    nsInputWrapper.appendChild(input);

    container.appendChild(nsInputWrapper);

    // ✅ Adjust chat log height based on screen size
    if (nameServerCount >= 3) {
        if (window.matchMedia("(max-width: 768px)").matches) {
            document.getElementById("chat-log").style.height = "45%";
        }
        if (window.matchMedia("(max-width: 400px)").matches) {
            document.getElementById("chat-log").style.height = "40%";
        }
        document.getElementById("chat-log").style.height = "55%";

        document.querySelectorAll(".chat-input").forEach(input => {
            input.style.borderRadius = "0";
            input.style.gap = "10px";
        });
    }

    // ✅ If window height is < 320px, set all inputs to 20px height
    if (window.innerHeight < 380) {
        document.getElementById("chat-log").style.height = "18%";
        document.getElementById("name-server-update-section").style.gap = "4px";
        document.getElementById("update-nameserver-button-group").style.height = "32px"; // ✅ Keep this

        document.querySelectorAll(".ns-input input").forEach(input => {
            input.style.height = "20px";
        });

        document.getElementById("domain-name-input").style.height = "20px";
    } else if (window.innerHeight < 480) {
        document.getElementById("chat-log").style.height = "22%";
        document.getElementById("name-server-update-section").style.gap = "4px";
        document.getElementById("updateNameServer").style.height = "32px"; 
        document.getElementById("updateNameServer").style.fontSize = "9px"; 
        document.getElementById("update-nameserver-button-group").style.fontSize = "9px"; // ✅ Keep this

        document.querySelectorAll(".ns-input input").forEach(input => {
            input.style.height = "20px";
        });
    }       
}

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


    try {
        const response = await fetch(apiUrl);
        const result = await response.json();
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

    // ✅ Adjust height and styles if screen is < 320px
    if (window.innerHeight < 320) {
        document.getElementById("chat-log").style.height = "10%";
        
        // Apply 10px height to child name server inputs
        document.querySelectorAll(".childns-input input").forEach(input => {
            input.style.height = "10px";
        });

        // ✅ Adjust `child-domain-name` field to 10px
        document.getElementById("child-domain-name").style.height = "10px";

        // ✅ Apply styles to `#childnameserver-container`
        const nsWrapper = document.getElementById("childnameserver-container");
        nsWrapper.style.marginTop = "-13px";
        nsWrapper.style.display = "flex";
        nsWrapper.style.flexWrap = "wrap";
        nsWrapper.style.gap = "2px";
    } else if (window.innerHeight < 380) {
        document.getElementById("chat-log").style.height = "20%";
        
        // Apply 10px height to child name server inputs
        document.querySelectorAll(".childns-input input").forEach(input => {
            input.style.height = "10px";
        });

        // ✅ Adjust `child-domain-name` field to 10px
        document.getElementById("child-domain-name").style.height = "10px";

        // ✅ Apply styles to `#childnameserver-container`
        const nsWrapper = document.getElementById("childnameserver-container");
        nsWrapper.style.marginTop = "-13px";
        nsWrapper.style.display = "flex";
        nsWrapper.style.flexWrap = "wrap";
        nsWrapper.style.gap = "2px";
    }  else if (childNameServerCount >= 3) {
        document.getElementById("chat-log").style.height = "47%";
    }

    // ✅ Fix: Apply border-radius correctly
    document.querySelectorAll(".chat-input").forEach(input => {
        input.style.borderRadius = "0";
    });
}

window.addEventListener("load", function () {
    if (window.innerHeight < 320) {
        document.querySelectorAll(".childns-input input").forEach(input => {
            input.style.height = "10px"; // Ensure first inputs have correct height
        });

        // ✅ Adjust `child-domain-name` on load
        document.getElementById("child-domain-name").style.height = "10px";

        // ✅ Apply styles to `#childnameserver-container` on load
        const nsWrapper = document.getElementById("childnameserver-container");
        nsWrapper.style.marginTop = "-13px";
        nsWrapper.style.display = "flex";
        nsWrapper.style.flexWrap = "wrap";
        nsWrapper.style.gap = "2px";
    }
});

window.addEventListener("load", function () {
    if (window.innerHeight < 320) {
        document.querySelectorAll(".childns-input input").forEach(input => {
            input.style.height = "10px"; // Ensure first inputs have correct height
        });

        // ✅ Adjust `child-domain-name` on load
        document.getElementById("child-domain-name").style.height = "10px";
    }
});

window.addEventListener("load", function () {
    if (window.innerHeight < 320) {
        document.querySelectorAll(".childns-input input").forEach(input => {
            input.style.height = "10px";  // Ensure first inputs have correct height
        });
    }
});

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

        try {
            const response = await fetch(apiUrl);
            const result = await response.json();

            // Show the result in the chat log
            showChildNSPopup(
                result.success ? "Child Name Server added successfully!" : "Failed to add Child Name Server.",
                result.success
            );
            document.getElementById('domain-query-text').value = "";
        } catch (error) {
            console.error("[FRONTEND] ❌ Error:", error);
            showChildNSPopup("Error connecting to server.", false);
            document.getElementById('domain-query-text').value = "";
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

    updateChatLog(`⏳ Updating domain suspension status for ${domainName}...`, "bot");

    // Disable button to prevent duplicate requests
    disableChat();

    fetch(`/api/suspend-domain?domainName=${encodeURIComponent(domainName)}&suspend=${isSuspended}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
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
            document.getElementById('domain-suspension-section').style.display = "none";
            document.getElementById('login-chat-section').style.display = "flex";
            document.getElementById('domain-query-text').value = "";
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


    // Show loading message in chatlog
    updateChatLog(`⏳ Updating privacy protection status for ${domainName}...`, "bot");
    disableChat();
    // Send API request
    fetch(`/api/manage-privacy-protection?domainName=${domainName}&enable=${isEnabled ? "true" : "false"}`)
        .then(response => response.json())
        .then(data => {

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

    updateChatLog(`⏳ Updating domain lock status for ${domainName}...`, "bot");

    disableChat();
    fetch(`/api/lock-domain?domainName=${domainName}&lock=${isLocked ? "true" : "false"}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateChatLog(`✅ Domain lock for ${domainName} has been successfully ${isLocked ? "locked" : "unlocked"}.`, "bot");
            } else {
                // If responseData.message exists, use it; otherwise, fallback to data.message
                const errorMessage = data.fullResponse?.responseData?.message || data.message || "Unable to process request.";
                updateChatLog(`${errorMessage}`, "bot");
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
    })
    .catch(error => {
        console.error('Error submitting category:', error);
    });
}

function extractActionName(userQuery) {
    const normalizedQuery = userQuery.toLowerCase().trim();
    return allowedActions.find(action => normalizedQuery.includes(action.toLowerCase())) || null;
}

//------------------------------------------- Submit Domain query after login Section ----------------------------------------------//

async function submitDomainQuery() {
    const inputElement = document.getElementById("domain-query-text");
    const submitButton = document.getElementById('submitDomainQuery'); // Replace with the actual button ID
    submitButton.disabled = true; // Disable button
    setTimeout(() => { submitButton.disabled = false; }, 500);
    const queryInput = document.getElementById('domain-query-text');
    const queryText = queryInput.value.trim();

    if (!queryText) {
        updateChatLog("Please enter a valid query to proceed.", 'bot');
        return;
    }

    updateChatLog(`${queryText}`, 'user');

        // List of predefined domain-related queries
        const predefinedQueries = [
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
              const response = await fetch('/api/domain-queries', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: queryText }),
              });
  
              if (!response.ok) {
                  throw new Error(`Failed to fetch data. Status: ${response.status}`);
              }
  
              const data = await response.json();
  
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
    
        // Enhanced regex to capture various greetings and specific phrases
        const basicGreetingRegex = /^(hi|hello|hey|howdy|greetings|what(?:'s| is) up|wassup|sup|yo|good\s(?:morning|afternoon|evening|day)|how\s+are\s+you|how\s+(?:is it going|have you been|do you do)|what(?:'s| is)\s+(?:new|happening)|how's\s+(?:everything|life)|long time no see|nice to meet you|pleased to meet you|good to see you)[!.,?\s]*$/i;    
        const greetingMatch = userInput.match(basicGreetingRegex);
    
        if (greetingMatch) {
    
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
    
        // Delay to allow UI updates
        setTimeout(() => {
            const domainInput = document.getElementById("check-domain-input");
            const checkButton = document.getElementById("check-domain-button");
    
            if (!domainInput) {
                console.error("❌ Error: Domain input field not found!");
                return;
            }
    
            if (checkButton) {
                checkButton.style.borderRadius = "20px"; // UI update
            }
    
            domainInput.value = domainName;
            domainInput.dispatchEvent(new Event("input", { bubbles: true }));
    
    
            // Delay handleCheckDomain() to ensure input is set
            setTimeout(() => {
                handleCheckDomain();
            }, 200);
        }, 100);
    
        document.getElementById("login-chat-section").value = "";
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
    
    
        updateChatLog("Enter duration and click renew button to renew your domain seamlessly.","bot");
    
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
    
        return; // 🚀 **This prevents the AI fallback from being triggered!**
    }    
    

    const transferMatch = queryText.match(
        /\b(?:transfer|move|how (?:do|can) i transfer (?:in|out)?)\b(?:\s+([a-zA-Z0-9-.]+\.[a-z]{2,}))?/i
    );
    
    if (transferMatch) {
    
        if (transferMatch[2]) {
            updateChatLog(`Enter authcode(EPP code) and enable or disable Whois protection to transfer your domain to us seamlessly.`, 'bot');
    
            // Show the transfer section
            document.getElementById("domain-transfer-section").style.display = "block";
            document.getElementById("login-chat-section").style.display = "none";
    
            // Prefill domain input field
            document.getElementById("transfer-domain-name").value = transferMatch[2];
        } else {
            console.log("No domain found, but transfer/move keyword detected.");
        }
        return;
    }
    

if (queryText.match(/\b(?:registered\s+on|registration\s+date\s*[:]?|when\s*was\s*it\s*registered\??)\s*(\d{1,2}-\d{1,2}-\d{4})\b/)) {
    const dateMatch = queryText.match(/\d{1,2}-\d{1,2}-\d{4}/);
    
        if (!dateMatch) {
            updateChatLog("⚠️ Please specify a valid date in the format dd-mm-yyyy.", 'bot');
            return;
        }
    
        const inputDate = dateMatch[0];  
    
        updateChatLog(`📡 Fetching domains registered on: ${inputDate}`, "bot");
    
        disableChat(); 
    
        try {

            const response = await fetch(`/api/registrationdate-domains?date=${encodeURIComponent(inputDate)}`);
    
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
    
            const data = await response.json();
    
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

        const response = await fetch(`/api/expiring-domains?date=${encodeURIComponent(selectedDate)}`);


        if (!response.ok) {
            throw new Error(`❌ Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();

        let message = `⏳ Domains Expiring on ${selectedDate}:\n`;

        if (data.success && data.domains.length > 0) {
            data.domains.forEach(domain => {
                message += `🔹 ${domain.domainName} \n`;
            });

            updateChatLog(message, 'bot');
        } else {
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



if (deletedDomainMatch) {
    const selectedDate = deletedDomainMatch[4]?.trim(); // Ensure correct capture group


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

    updateChatLog(`📡 Fetching domains deleting on: ${selectedDate}`, "bot");
    disableChat();
    try {
        const response = await fetch(`/api/expiring-domains?date=${encodeURIComponent(expirationDate)}`);


        if (!response.ok) {
            throw new Error(`❌ Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.domains.length > 0) {
            let message = `⏳ Domains deleting on ${selectedDate}:\n`;

            data.domains.forEach(domain => {
                message += `🔹 ${domain.domainName} \n`;
            });
            enableChat();
            updateChatLog(message, 'bot');
        } else {
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

        const response = await fetch(`/api/tld-suggestions?websiteName=${encodeURIComponent(baseName)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch TLDs. Status: ${response.status}`);
        }

        const data = await response.json();

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
            const response = await fetch(`/api/domain-info?domain=${encodeURIComponent(domainName)}`);
    
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
    
            const data = await response.json();
    
            if (data.success) {
    
                // Beautify and format the domain data for display
                const domainData = data.domainData;
                const formattedData = `<div><strong>📄 Domain Information for ${domainName}</strong></div><div><strong>Status:</strong> ${domainData.status} ${domainData.isDomainLocked ? '🔒' : '🔓'}</div><div><strong>Creation Date:</strong> ${new Date(domainData.creationDate).toLocaleDateString()} 🗓️</div><div><strong>Expiration Date:</strong> ${new Date(domainData.expirationDate).toLocaleDateString()} ⏳</div><div><strong>Nameservers:</strong></div><ul style="margin: 0; padding: 0; list-style-type: none;">${domainData.nameserver1 ? `<li>🌐 ${domainData.nameserver1}</li>` : ''}${domainData.nameserver2 ? `<li>🌐 ${domainData.nameserver2}</li>` : ''}${domainData.nameserver3 ? `<li>🌐 ${domainData.nameserver3}</li>` : ''}${domainData.nameserver4 ? `<li>🌐 ${domainData.nameserver4}</li>` : ''}</ul></div><div><strong>Domain Locked:</strong> ${domainData.isDomainLocked ? 'Yes 🔒' : 'No 🔓'}</div><div><strong>Privacy Protection:</strong> ${domainData.isPrivacyProtection ? 'Enabled 🛡️' : 'Disabled ❌'}</div><div><strong>Thief Protection:</strong> ${domainData.isThiefProtected ? 'Enabled 🛡️' : 'Disabled ❌'}</div>`;
    
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
        const response = await fetch(`/api/domain-auth-code?domain=${encodeURIComponent(domainName)}`);

        if (!response.ok) {
            throw new Error(`❌ Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
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


if (domainregisterMatch) {
    const domainName = domainregisterMatch[1] || domainregisterMatch[3] || domainregisterMatch[4]; // Extract domain

    // Show fetching message & disable chat
    updateChatLog(`🔍 Fetching registration date for <strong>${domainName}</strong>...`, 'bot');
    disableChat();

    try {
        const response = await fetch(`/api/domain-info?domain=${encodeURIComponent(domainName)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.domainData) {

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
        document.getElementById('domain-query-text').value = "";
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

    // Updated Regex: Detects "theft protection" in any form, with or without action/domain
    const theftRegex = /\b(?:enable|disable|on|off|switch\s+on|switch\s+off)?\s*\/?(?:enable|disable|on|off|switch\s+on|switch\s+off)?\s*(?:theft\s*protection|thief\s*protection)/i;
    const theftMatch = usersInput.match(theftRegex);

    if (theftMatch) {
        updateChatLog(
            "🛡️ Please enter the domain name and select the action (Enable/Disable) from the dropdown, then click 'Update Theft Protection'.",
            "bot"
        );
        let actionMatch = usersInput.match(/\b(enable|disable|on|off|switch\s+on|switch\s+off)/i);
        let action = actionMatch ? actionMatch[1].toLowerCase() : ""; // Extract action

        let domainMatch = usersInput.match(/\b([\w.-]+\.[a-z]{2,})\b/); // Detect domain name if present
        let domain = domainMatch ? domainMatch[1].trim() : ""; // Extracted domain (or empty)

        // 🛑 Ignore "mydomain.com" or other placeholder values
        const ignoredDomains = ["mydomain.com", "example.com", "test.com"];
        if (!domain || domain.length < 4 || ignoredDomains.includes(domain.toLowerCase())) {
            console.error("❌ Invalid or placeholder domain detected:", domain);
            return;
        }


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

    const lockUnlockSection = document.getElementById("domain-lock-section");
    const lockUnlockDropdown = document.getElementById("domain-lock-dropdown");
    const lockUnlockDomainInput = document.getElementById("domain-lock-name");
    
    if (!inputElement) {
        console.error("❌ Input field not found!");
    } else {
        const usersInput = inputElement.value.trim();
    
        // Updated Regex: Supports various lock/unlock commands
        const lockUnlockRegex = /\b(lock|unlock|secure|remove\s+lock|turn\s+on\s+lock|turn\s+off\s+lock|enable\s+domain\s+lock|disable\s+domain\s+lock|lock\/unlock)\s+(?:the\s+|my\s+)?(?:domain\s*)?([\w.-]+\.[a-z]{2,})?/i;
        const lockUnlockMatch = usersInput.match(lockUnlockRegex);
    
        if (lockUnlockMatch) {
            updateChatLog("📝 Please enter the domain name and select 'Lock' or 'Unlock' from the dropdown, then click 'Update Lock Status'.", 'bot');
            const selectedAction = lockUnlockMatch[1].toLowerCase();  // Extracted action: "lock", "unlock", etc.
            let domain = lockUnlockMatch[2] ? lockUnlockMatch[2].trim() : "";  // Set to "" if undefined
    
            // 🛑 Ignore "mydomain.com" or other placeholder values
            const ignoredDomains = ["mydomain.com", "example.com", "test.com"];
            if (!domain || domain.length < 4 || ignoredDomains.includes(domain.toLowerCase())) {
                console.error("❌ Invalid or placeholder domain detected:", domain);
                return;
            }

    
            // Set dropdown value based on extracted action
            lockUnlockDropdown.value = selectedAction === "lock" ? "locked" : "unlocked";
    
            // Populate domain input field
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

    // Regex to match "suspend/unsuspend domain.com"
    const suspendUnsuspendRegex = /\b(suspend|unsuspend)(?:\/(suspend|unsuspend))?\s*(?:the\s+)?(?:domain\s*)?(?:for\s+)?([\w.-]+\.[a-z]{2,})?/i;
    const suspendUnsuspendMatch = usersInput.match(suspendUnsuspendRegex);

    if (suspendUnsuspendMatch) {

        const selectedAction = suspendUnsuspendMatch[1] || suspendUnsuspendMatch[2];  // Extracted "suspend" or "unsuspend"
        let domain = suspendUnsuspendMatch[3] ? suspendUnsuspendMatch[3].trim() : "";  // Empty string if domain not found
        updateChatLog("🔄 Please enter the domain name and select 'Suspend' or 'Unsuspend' from the dropdown, then click 'Update Suspension Status'.", "bot");

        // 🛑 Ignore "mydomain.com" or other placeholder values
        const ignoredDomains = ["mydomain.com", "example.com", "test.com"];
        if (!domain || domain.length < 4 || ignoredDomains.includes(domain.toLowerCase())) {
            console.error("❌ Invalid or placeholder domain detected:", domain);
            return;
        }


        // Set dropdown value
        suspendUnsuspendDropdown.value = selectedAction.toLowerCase() === "suspend" ? "suspended" : "unsuspended";

        // Populate domain input field
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

    const privacyRegex = /\b(update|enable|disable|turn\s*on|turn\s*off)(?:\/(update|enable|disable|turn\s*on|turn\s*off))?\s*(?:the\s+)?(?:privacy[-\s]*protection)\s*(?:for\s+)?((?:[\w-]+\.)+[a-z]{2,})/i;
    const privacyMatch = usersInput.match(privacyRegex);

    if (privacyMatch) {
        updateChatLog("🔄 Please enter the domain name and select 'Enable' or 'Disable' privacy protection from the dropdown, then click 'Update Privacy Protection'.", 'bot');

        let action = privacyMatch[1]?.toLowerCase() || "";
        let domain = privacyMatch[3] ? privacyMatch[3].trim() : ""; 



        // 🛑 Ignore "mydomain.com" or placeholder values
        const ignoredDomains = ["mydomain.com", "example.com", "test.com"];
        if (!domain || domain.length < 4 || ignoredDomains.includes(domain.toLowerCase())) {
            console.error("❌ Invalid or placeholder domain detected:", domain);
            return;
        }

        document.getElementById("privacy-protection-section").style.display = "block";
        document.getElementById("login-chat-section").style.display = "none";


        privacyProtectionDomainInput.value = domain;


        // ✅ Ensure Value Persists
        setTimeout(() => {
            privacyProtectionDomainInput.value = domain;
        }, 100);

        if (action) {
            const isEnablePrivacy = action.includes("enable") || action === "turn on";
        } else {
            console.log("⚠️ No enable/disable/update action provided. Prompt user for selection.");
        }
        return;
    } else {
        console.log("❌ No valid privacy protection command detected.");
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
  
    // Show the query section
    document.getElementById('login-chat-section').style.display = 'flex';
    document.getElementById('domain-query-text').value = '';
  
    // Hide the other sections
    const sectionsToHide = ['domain-section', 'domain-options', 'domain-options-next', 'domain-registration-section' , 'domain-transfer-section' , 'domain-renewal-section' , 'domain-availability-section' , 'name-server-update-section', 'add-child-name-server-section' ,'theft-protection-section' , 'privacy-protection-section' , 'domain-lock-section' , 'domain-suspension-section', 'additional-settings-section', 'name-server-container'];
    
    sectionsToHide.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.style.display = 'none';
      } else {
        console.log(`Element not found: ${sectionId}`);
      }
    });
    resetNameServers();
    resetChildNameServers()
  }

//--------------------------------------------------- Event Listeners Section ------------------------------------------------------//

const backButton = document.getElementById("back-to-previous-section");
if (backButton) {
    backButton.removeEventListener("click", goBackToPreviousSection);
    backButton.addEventListener("click", goBackToPreviousSection);
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation(); 


        const activeElement = document.activeElement;

        if (activeElement) {
            if (activeElement.classList.contains("chat-input")) {
                document.getElementById("submit-question").click();
            } else if (activeElement.classList.contains("email-input")) {
                document.getElementById("submit-email").click();
            } else if (activeElement.id === "domain-query-text") {
                submitDomainQuery();
            }
        }
    }
});

document.getElementById('otp-code').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      // Trigger the OTP verification function when Enter is pressed
      verifyOTP();
    }
});

document.getElementById('verify-otp').addEventListener('click', function() {
    verifyOTP();
});

const domainQueryInput = document.getElementById("domain-query-text");
if (domainQueryInput) {
    domainQueryInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {


            event.preventDefault();
            submitDomainQuery();
        }
    });
}

document.getElementById("user-question").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {


        event.preventDefault(); // Prevents accidental form submission or newline entry

        // Trigger the button click
        document.getElementById("submit-question").click();
    }
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

    // Ensure buttonContainer is part of the chat log for proper scrolling
    chatLog.appendChild(buttonContainer);

    if (container && window.getComputedStyle(container).display !== "none") {
        // Small delay to ensure rendering updates before scrolling
        setTimeout(() => {
            chatLog.scrollTop = chatLog.scrollHeight;
        }, 100);
    }
}

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

function closeInfo() {
    let infoBox = document.getElementById("info-box");
    if (infoBox) {
        infoBox.remove();
        document.removeEventListener("click", outsideClickListener);
    }
}

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
  
function removeLastBotMessage() {
    const chatLog = document.getElementById('chat-log');
    if (chatLog?.lastChild?.classList.contains('bot-message')) {
        chatLog.removeChild(chatLog.lastChild);
    }
}

