// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing');
const searchStatus = document.getElementById('search-status');

// Conversation Memory - बातचीत याद रखेगा
let conversationHistory = [];
let userName = '';

// Send Message Function
async function sendMessage() {
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
    }, 1500);
}

// Human-like Response Generator
function generateHumanResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Extract name if provided
    if ((lowerMessage.includes('mera naam') || lowerMessage.includes('my name is')) && !userName) {
        const nameMatch = userMessage.match(/(mera naam|my name is)\s+([a-zA-Zअ-ज़]+)/i);
        if (nameMatch) {
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

    // How are you - इंसानों जैसे जवाब
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

    // Human-like conversation for personal questions
    if (lowerMessage.includes('tum es trike se bat kr skte hoo') || lowerMessage.includes('human ki tarah bat karo')) {
        return `हाँ बिल्कुल! मैं तुम्हारे जैसे ही बात कर सकता हूँ। 😄\n\nतुम जैसे बोलोगे, मैं वैसे ही जवाब दूंगा। कोई formal बातचीत नहीं - बिल्कुल दोस्तों जैसी बातचीत!`;
    }

    // Weather related
    if (lowerMessage.includes('weather') || lowerMessage.includes('mausam')) {
        return `🌤️ **आज का मौसम**\n\nदिल्ली: 28°C, हल्की धूप\nमुंबई: 32°C, नमी\nबैंगलोर: 26°C, सुहावना\n\nकिस शहर का मौसम जानना चाहते हो?`;
    }

    // News
    if (lowerMessage.includes('news') || lowerMessage.includes('khabar')) {
        return `📰 **आज की ताजा खबरें**\n\n• Technology में नए innovation\n• Sports में रोमांचक मैच\n• Business updates\n• Entertainment news\n\nकिस topic की खबर चाहिए?`;
    }

    // Context aware responses - पिछली बातचीत याद रखेगा
    const lastUserMessage = conversationHistory
        .filter(msg => msg.type === 'user')
        .slice(-2, -1)[0];

    if (lastUserMessage) {
        if (lowerMessage.includes('uske bare mein') || lowerMessage.includes('about that')) {
            return `हाँ हाँ! तुमने पिछली बार "${lastUserMessage.content}" के बारे में पूछा था। उसी topic पर और बात करते हैं?`;
        }
    }

    // Personal touch if name is known
    if (userName) {
        const personalResponses = [
            `${userName}, तुमने पूछा: "${userMessage}" - यह तो बहुत interesting topic है! इसके बारे में क्या जानना चाहते हो?`,
            `अच्छा सवाल पूछा ${userName}! इसके बारे में मैं तुम्हें अच्छी जानकारी दे सकता हूँ।`,
            `वाह ${userName}! तुम्हारा सवाल अच्छा है। इसके बारे में बात करते हैं!`
        ];
        
        if (lowerMessage.includes('kyu') || lowerMessage.includes('why') || lowerMessage.includes('kaise')) {
            return `${userName}, तुम "क्यों" पूछ रहे हो? समझ गया! मैं तुम्हें detailed explanation दूंगा।`;
        }
        
        return personalResponses[Math.floor(Math.random() * personalResponses.length)];
    }

    // Default human-like responses
    const humanResponses = [
        `अच्छा सवाल है! 😊 इसके बारे में तुम क्या जानना चाहते हो? मैं तुम्हें अच्छे से समझा सकता हूँ।`,

        `वाह! तुमने interesting topic उठाया है। इसके बारे में बात करके मजा आएगा! 🤔`,

        `हाँ हाँ! "${userMessage}" - इसके बारे में मेरे पास अच्छी जानकारी है। तुम्हें किस aspect में interest है?`,

        `तुम्हारा सवाल अच्छा लगा! 😄 इस topic पर हम घंटों बात कर सकते हैं। कहाँ से शुरू करें?`,

        `समझ गया! तुम "${userMessage}" के बारे में जानना चाहते हो। मैं तुम्हें simple और clear जवाब दूंगा।`
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
chatInput.focus();

// Welcome message after load
setTimeout(() => {
    addMessage('तुम जैसे बोलोगे, मैं वैसे ही जवाब दूंगा! कोई formal बातचीत नहीं - बिल्कुल दोस्तों जैसी बातचीत! 😄', 'bot');
}, 2000);
