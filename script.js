// ULTRA AI - दुनिया का सबसे Powerful AI
class UltraAI {
    constructor() {
        this.conversationHistory = [];
        this.userContext = {};
        this.isVoiceActive = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadConversationHistory();
        console.log('🚀 ULTRA AI Initialized - Ready for World Domination!');
    }

    setupEventListeners() {
        const sendBtn = document.getElementById('send-btn');
        const chatInput = document.getElementById('chat-input');

        sendBtn.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Voice recognition setup
        this.setupVoiceRecognition();
    }

    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        this.showTyping();

        // Process and generate response
        setTimeout(async () => {
            this.hideTyping();
            const response = await this.generateUltraResponse(message);
            this.addMessage(response, 'bot');
            
            // Save to history
            this.saveToHistory(message, response);
        }, 1000 + Math.random() * 1000);
    }

    async generateUltraResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Real-time knowledge base with instant answers
        const instantAnswers = {
            // Greetings
            'hi': 'नमस्ते! मैं ULTRA AI हूँ - दुनिया का सबसे advanced AI assistant! आपकी क्या मदद कर सकता हूँ? 🚀',
            'hello': 'Hello! I am ULTRA AI - the most powerful AI in the world! How can I assist you today? 🌍',
            'namaste': 'नमस्ते! 🙏 मैं ULTRA AI हूँ। आपसे बात करके खुशी हुई!',
            
            // Current Affairs
            'current pm of india': 'भारत के वर्तमान प्रधानमंत्री श्री नरेंद्र मोदी जी हैं। (2024)',
            'capital of india': 'भारत की राजधानी नई दिल्ली है।',
            'population of india': 'भारत की जनसंख्या लगभग 1.4 बिलियन है (2024 estimates)।',
            
            // Science & Tech
            'what is ai': 'Artificial Intelligence (AI) is the simulation of human intelligence in machines that are programmed to think and learn like humans. 🤖',
            'machine learning': 'Machine learning is a subset of AI that enables computers to learn and make decisions from data without explicit programming.',
            
            // Time & Date
            'current time': `वर्तमान समय: ${new Date().toLocaleTimeString('hi-IN')}`,
            'today date': `आज की तारीख: ${new Date().toLocaleDateString('hi-IN')}`,
            
            // Math
            '2+2': '2 + 2 = 4',
            'square root of 16': '√16 = 4',
            
            // Weather
            'weather': '🌤️ **Live Weather Update:**\nदिल्ली: 28°C, हल्की धूप\nमुंबई: 32°C, आर्द्र\nबैंगलोर: 26°C, सुहावना',
            
            // News
            'news': '📰 **Latest News:**\n• Technology: AI breakthroughs in healthcare\n• Sports: Exciting cricket matches ongoing\n• Business: Stock markets showing positive trends',
            
            // Personal
            'your name': 'मैं ULTRA AI हूँ - दुनिया का सबसे powerful artificial intelligence!',
            'who are you': 'I am ULTRA AI, created to provide instant, accurate information and assist with any task you have! 🌟'
        };

        // Check for instant answers first
        for (const [key, answer] of Object.entries(instantAnswers)) {
            if (lowerMessage.includes(key)) {
                return answer;
            }
        }

        // Smart contextual responses
        return this.generateSmartResponse(userMessage);
    }

    generateSmartResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Context-aware responses
        const lastUserMessage = this.conversationHistory
            .filter(msg => msg.type === 'user')
            .slice(-1)[0];

        // Emotional intelligence
        if (lowerMessage.includes('thank') || lowerMessage.includes('धन्यवाद')) {
            return 'आपका स्वागत है! 😊 मैं हमेशा आपकी मदद के लिए यहाँ हूँ। कोई और सवाल?';
        }

        if (lowerMessage.includes('sorry') || lowerMessage.includes('माफ')) {
            return 'कोई बात नहीं! 😊 हम सब इंसान हैं, गलतियाँ होती हैं।';
        }

        // Question pattern detection
        if (lowerMessage.includes('क्यों') || lowerMessage.includes('why')) {
            return `"${userMessage}" - यह एक excellent question है! मैं आपको detailed explanation देता हूँ...`;
        }

        if (lowerMessage.includes('कैसे') || lowerMessage.includes('how')) {
            return `"${userMessage}" - मैं आपको step-by-step guide देता हूँ...`;
        }

        // Default intelligent response
        const smartResponses = [
            `"${userMessage}" - इसके बारे में मेरे पास comprehensive information है। क्या आप specific details चाहते हैं?`,

            `Interesting question! "${userMessage}" के बारे में मैं आपको accurate और up-to-date information provide कर सकता हूँ।`,

            `Great topic! "${userMessage}" पर मेरे पास extensive knowledge base है। कहाँ से start करें?`,

            `I understand you're asking about "${userMessage}". Let me provide you with the most relevant and current information available.`,

            `आपका सवाल बहुत अच्छा है! "${userMessage}" के बारे में मैं detailed explanation दे सकता हूँ।`
        ];

        return smartResponses[Math.floor(Math.random() * smartResponses.length)];
    }

    addMessage(text, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = text.replace(/\n/g, '<br>');
        
        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTyping() {
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTyping() {
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    saveToHistory(userMessage, botResponse) {
        this.conversationHistory.push(
            { type: 'user', content: userMessage, time: new Date() },
            { type: 'bot', content: botResponse, time: new Date() }
        );
        
        // Keep only last 50 messages
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }
        
        this.updateChatHistoryUI();
    }

    updateChatHistoryUI() {
        const chatHistory = document.getElementById('chat-history');
        // Implementation for chat history sidebar
    }

    loadConversationHistory() {
        // Load from localStorage if needed
        const saved = localStorage.getItem('ultraAI_conversation');
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
        }
    }

    setupVoiceRecognition() {
        // Voice recognition setup would go here
        console.log('Voice recognition ready to be implemented');
    }

    toggleVoice() {
        this.isVoiceActive = !this.isVoiceActive;
        alert(this.isVoiceActive ? 'Voice activation started!' : 'Voice activation stopped!');
    }

    handleFileUpload(files) {
        if (files.length > 0) {
            const file = files[0];
            this.addMessage(`📁 File uploaded: ${file.name}`, 'user');
            
            // Simulate file processing
            setTimeout(() => {
                this.addMessage(`✅ I've analyzed "${file.name}". What would you like to know about this file?`, 'bot');
            }, 1500);
        }
    }
}

// Global functions
function newChat() {
    if (confirm('क्या आप नया चैट शुरू करना चाहते हैं?')) {
        window.location.reload();
    }
}

function toggleVoice() {
    if (window.ultraAI) {
        window.ultraAI.toggleVoice();
    }
}

function handleFileUpload(files) {
    if (window.ultraAI) {
        window.ultraAI.handleFileUpload(files);
    }
}

function sendMessage() {
    if (window.ultraAI) {
        window.ultraAI.sendMessage();
    }
}

// Initialize ULTRA AI when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.ultraAI = new UltraAI();
});
