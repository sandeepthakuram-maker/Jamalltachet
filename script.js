// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing');
const searchStatus = document.getElementById('search-status');

// Conversation Memory
let conversationHistory = [];
let userName = '';

// Send Message Function
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';

    // Save to history
    conversationHistory.push({ type: 'user', content: message, time: new Date() });

    // Show searching indicator
    showSearching();

    // Get AI response
    setTimeout(() => {
        hideSearching();
        const response = generateHumanResponse(message);
        addMessage(response, 'bot');
        conversationHistory.push({ type: 'bot', content: response, time: new Date() });
    }, 1000);
}

// Human-like Response Generator - FIXED
function generateHumanResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Extract name if provided
    if ((lowerMessage.includes('mera naam') || lowerMessage.includes('my name is')) && !userName) {
        const nameMatch = userMessage.match(/(mera naam|my name is)\s+([a-zA-Zअ-ज़]+)/i);
        if (nameMatch && nameMatch[2]) {
            userName = nameMatch[2];
            return `बहुत खूब ${userName}! 😊 तुम्हारा नाम सुनकर अच्छा लगा। मैं तुम्हारी क्या मदद कर सकता हूँ?`;
        }
    }

    // Greetings - सीधे जवाब
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('namaste') || lowerMessage.includes('hey')) {
        const greetings = [
            `हाय! कैसे हो? मैं तुम्हारी क्या मदद कर सकता हूँ? 😊`,
            `नमस्ते! तुम सुनाओ, कैसे हो? क्या चल रहा है?`,
            `हेय! तुम्हारा दिन कैसा चल रहा है? कुछ बात करोगे?`,
            `हैलो! मैं तैयार हूँ बातचीत के लिए। क्या हाल है?`
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // How are you
    if (lowerMessage.includes('kaise ho') || lowerMessage.includes('how are you') || lowerMessage.includes('kya haal hai')) {
        const responses = [
            `मैं तो बढ़िया हूँ भाई! तुम सुनाओ, कैसे हो? आज का दिन कैसा चल रहा है?`,
            `बस यूँ ही चल रहा हूँ! तुम्हारे सवालों के जवाब देने में। तुम कैसे हो?`,
            `मस्त हूँ! तुम्हारे साथ बात करके अच्छा लग रहा है। तुम बताओ कैसे हो?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Name questions
    if (lowerMessage.includes('tumhara naam') || lowerMessage.includes('your name') || lowerMessage.includes('kaun ho')) {
        return `मैं एक Smart AI Assistant हूँ! लेकिन तुम मुझे कोई भी नाम दे सकते हो। तुम्हारा क्या नाम है?`;
    }

    // Weather
    if (lowerMessage.includes('weather') || lowerMessage.includes('mausam')) {
        return `🌤️ **आज का मौसम**\n\nदिल्ली: 28°C, हल्की धूप\nमुंबई: 32°C, नमी\nबैंगलोर: 26°C, सुहावना\n\nकिस शहर का मौसम जानना चाहते हो?`;
    }

    // News
    if (lowerMessage.includes('news') || lowerMessage.includes('khabar')) {
        return `📰 **आज की ताजा खबरें**\n\n• Technology में नए innovation\n• Sports में रोमांचक मैच\n• Business updates\n• Entertainment news\n\nकिस topic की खबर चाहिए?`;
    }

    // Cricket
    if (lowerMessage.includes('cricket') || lowerMessage.includes('score')) {
        return `🏏 **Live Cricket Scores**\n\nIND vs AUS: India 285/5 (50 overs)\nPAK vs ENG: Match starting soon\n\nकौन सा match देखना चाहते हो?`;
    }

    // Numbers - सीधे जवाब
    if (/^\d+$/.test(userMessage.trim())) {
        const number = parseInt(userMessage.trim());
        return `तुमने नंबर ${number} लिखा है! 😄 क्या इस नंबर के बारे में कुछ और जानना चाहते हो?`;
    }

    // Simple questions - सीधे जवाब
    if (lowerMessage.includes('kyu') || lowerMessage.includes('why')) {
        return `अच्छा सवाल है! तुम "क्यों" पूछ रहे हो? मैं तुम्हें detailed explanation दे सकता हूँ।`;
    }

    if (lowerMessage.includes('kaise') || lowerMessage.includes('how')) {
        return `तुम्हें "कैसे" जानना है? मैं step-by-step समझा सकता हूँ!`;
    }

    if (lowerMessage.includes('kya') || lowerMessage.includes('what')) {
        return `तुम "क्या" पूछ रहे हो? मैं clear जवाब दूंगा!`;
    }

    // Personal touch if name is known
    if (userName) {
        const personalResponses = [
            `${userName}, तुमने पूछा: "${userMessage}" - यह तो बहुत interesting topic है!`,
            `अच्छा सवाल पूछा ${userName}! इसके बारे में बात करते हैं।`,
            `वाह ${userName}! तुम्हारा सवाल अच्छा है। इसके बारे में क्या जानना चाहते हो?`
        ];
        return personalResponses[Math.floor(Math.random() * personalResponses.length)];
    }

    // Default human-like responses - NO MORE SEARCH RESULTS!
    const humanResponses = [
        `अच्छा सवाल है! 😊 इसके बारे में तुम क्या जानना चाहते हो?`,

        `वाह! तुमने interesting topic उठाया है। इसके बारे में बात करके मजा आएगा! 🤔`,

        `हाँ हाँ! "${userMessage}" - इसके बारे में मेरे पास अच्छी जानकारी है।`,

        `तुम्हारा सवाल अच्छा लगा! 😄 इस topic पर हम बात कर सकते हैं।`,

        `समझ गया! तुम "${userMessage}" के बारे में जानना चाहते हो। मैं तुम्हें simple और clear जवाब दूंगा।`,

        `ओह! तुमने "${userMessage}" के बारे में पूछा। इसके बारे में काफी कुछ बताया जा सकता है!`,

        `अच्छा लगा तुम्हारा सवाल! 😊 चलो इसके बारे में बात करते हैं।`
    ];

    return humanResponses[Math.floor(Math.random() * humanResponses.length)];
}

// Show Searching Indicator
function showSearching() {
    typingIndicator.style.display = 'block';
    typingIndicator.classList.add('searching');
    searchStatus.style.display = 'block';
    scrollToBottom();
}

// Hide Searching Indicator
function hideSearching() {
    typingIndicator.style.display = 'none';
    typingIndicator.classList.remove('searching');
    searchStatus.style.display = 'none';
}

// Add Message to Chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Format message with line breaks
    const formattedText = text.replace(/\n/g, '<br>');
    messageDiv.innerHTML = formattedText;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Scroll to Bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize - Focus on input
window.addEventListener('load', () => {
    chatInput.focus();
});

// NO WELCOME MESSAGE - Clean Start
