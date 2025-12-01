const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

// 1. मैसेज भेजने का फंक्शन
function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // यूजर का मैसेज दिखाएं
    addMessage(text, 'user');
    chatInput.value = '';

    // AI "सोच रहा है" दिखाएं
    showTyping(true);

    // AI का जवाब (Simulated)
    // यहाँ हम असली AI जैसा delay डाल रहे हैं
    setTimeout(() => {
        const response = generateAIResponse(text);
        showTyping(false);
        addMessage(response, 'ai');
    }, 1500 + Math.random() * 1000); // 1.5 से 2.5 सेकंड का रैंडम समय
}

// 2. स्क्रीन पर मैसेज जोड़ने का फंक्शन
function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerText = text;
    chatMessages.appendChild(div);
    
    // ऑटो-स्क्रॉल नीचे तक
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 3. टाइपिंग इंडिकेटर कंट्रोल
function showTyping(show) {
    typingIndicator.style.display = show ? 'flex' : 'none';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 4. AI का "दिमाग" (Basic Logic)
// असली में यहाँ API कॉल होती है, पर अभी हम इसे स्मार्ट बना रहे हैं
function generateAIResponse(input) {
    input = input.toLowerCase();

    if (input.includes('hello') || input.includes('hi') || input.includes('नमस्ते')) {
        return "नमस्ते! मैं ULTRA AI हूँ। मैं आपकी कैसे मदद कर सकता हूँ?";
    }
    if (input.includes('kya kar sakte ho') || input.includes('help')) {
        return "मैं कोडिंग कर सकता हूँ, आपके सवालों का जवाब दे सकता हूँ, और दुनिया का सबसे एडवांस एनालिसिस कर सकता हूँ।";
    }
    if (input.includes('kaise ho') || input.includes('how are you')) {
        return "मैं एक AI हूँ, इसलिए मेरे पास भावनाएं नहीं हैं, लेकिन मेरा सिस्टम 100% ऑप्टिमाइज्ड चल रहा है! आप कैसे हैं?";
    }
    if (input.includes('time') || input.includes('samay')) {
        return "अभी का समय है: " + new Date().toLocaleTimeString();
    }
    if (input.includes('creator') || input.includes('kisne banaya')) {
        return "मुझे मेरे शानदार डेवलपर (यानी आपने) ने बनाया है!";
    }
    
    // अगर कुछ समझ न आए
    return "यह बहुत दिलचस्प सवाल है। मैं अपने डेटाबेस में इसे सर्च कर रहा हूँ... क्या आप इसे थोड़ा विस्तार में बता सकते हैं?";
}

// 5. 'Enter' बटन दबाने पर मैसेज भेजें
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// 6. नई चैट का फंक्शन
function newChat() {
    chatMessages.innerHTML = '';
    addMessage("नई चैट शुरू हो गई है। पूछिए क्या पूछना है!", 'ai');
}
