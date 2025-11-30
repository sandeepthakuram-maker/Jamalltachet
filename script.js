// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing');
const searchStatus = document.getElementById('search-status');

// Conversation Memory
let conversationHistory = [];

// Send Message Function
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';

    // Save to history
    conversationHistory.push({ type: 'user', content: message });

    // Show searching indicator
    showSearching();

    // Get AI response with live search
    try {
        const response = await getAIResponseWithSearch(message);
        addMessage(response, 'bot');
        conversationHistory.push({ type: 'bot', content: response });
    } catch (error) {
        addMessage('Sorry, search failed. Please try again.', 'bot');
    }

    // Hide searching indicator
    hideSearching();
}

// Show Searching Indicator
function showSearching() {
    typingIndicator.style.display = 'block';
    searchStatus.style.display = 'block';
    scrollToBottom();
}

// Hide Searching Indicator
function hideSearching() {
    typingIndicator.style.display = 'none';
    searchStatus.style.display = 'none';
}

// AI Response with Live Search
async function getAIResponseWithSearch(question) {
    // Simulate different types of searches based on question
    const lowerQuestion = question.toLowerCase();
    
    // Weather related
    if (lowerQuestion.includes('weather') || lowerQuestion.includes('mausam')) {
        return await simulateWeatherSearch(question);
    }
    
    // News related
    if (lowerQuestion.includes('news') || lowerQuestion.includes('khabar')) {
        return await simulateNewsSearch();
    }
    
    // Cricket scores
    if (lowerQuestion.includes('cricket') || lowerQuestion.includes('score')) {
        return await simulateCricketSearch();
    }
    
    // Stock market
    if (lowerQuestion.includes('stock') || lowerQuestion.includes('share')) {
        return await simulateStockSearch();
    }
    
    // General knowledge - simulate Wikipedia search
    return await simulateWikipediaSearch(question);
}

// Simulate Weather Search
async function simulateWeatherSearch(location) {
    const cities = {
        'delhi': { temp: '28°C', condition: 'Sunny', humidity: '45%' },
        'mumbai': { temp: '32°C', condition: 'Humid', humidity: '75%' },
        'kolkata': { temp: '30°C', condition: 'Cloudy', humidity: '68%' },
        'chennai': { temp: '34°C', condition: 'Hot', humidity: '70%' },
        'bangalore': { temp: '26°C', condition: 'Pleasant', humidity: '55%' }
    };
    
    const city = Object.keys(cities).find(city => location.toLowerCase().includes(city));
    const weather = cities[city] || { temp: '27°C', condition: 'Clear', humidity: '50%' };
    
    return `🌤️ **Live Weather Update**\n\n📍 ${city ? city.toUpperCase() : 'Your Location'}\n🌡️ Temperature: ${weather.temp}\n☁️ Condition: ${weather.condition}\n💧 Humidity: ${weather.humidity}\n\n*Real-time weather data*`;
}

// Simulate News Search
async function simulateNewsSearch() {
    const newsItems = [
        "📰 Technology: AI makes new breakthrough in healthcare",
        "🏏 Sports: India wins thrilling match against Australia", 
        "💰 Business: Stock market reaches all-time high",
        "🌍 World: Climate summit concludes with new agreements",
        "🔬 Science: NASA discovers new exoplanet"
    ];
    
    return `📡 **Live News Updates**\n\n${newsItems.join('\n\n')}\n\n*Updated: ${new Date().toLocaleTimeString()}*`;
}

// Simulate Cricket Search  
async function simulateCricketSearch() {
    const matches = [
        "🏏 IND vs AUS: India 285/5 (50 overs) - Kohli 102*, Rahul 67",
        "🏏 PAK vs ENG: Pakistan 234/8 (50 overs) - Babar 89",
        "🏏 NZ vs SA: New Zealand 301/6 (50 overs) - Williamson 115"
    ];
    
    return `🎯 **Live Cricket Scores**\n\n${matches.join('\n\n')}\n\n*Live updates from international matches*`;
}

// Simulate Stock Search
async function simulateStockSearch() {
    const stocks = {
        'Sensex': '72,450 (+1.5%)',
        'Nifty': '21,890 (+1.3%)', 
        'Reliance': '2,845 (+2.1%)',
        'TCS': '3,782 (+0.8%)',
        'Infosys': '1,645 (+1.2%)'
    };
    
    let stockText = '📈 **Live Stock Market**\n\n';
    for (const [stock, value] of Object.entries(stocks)) {
        stockText += `• ${stock}: ${value}\n`;
    }
    stockText += `\n*As of ${new Date().toLocaleTimeString()}*`;
    
    return stockText;
}

// Simulate Wikipedia Search
async function simulateWikipediaSearch(query) {
    const knowledge = {
        'prime minister': 'Narendra Modi is the current Prime Minister of India (as of 2024).',
        'capital of india': 'New Delhi is the capital of India.',
        'population of india': 'India population is approximately 1.4 billion people.',
        'taj mahal': 'The Taj Mahal is located in Agra, built by Shah Jahan.',
        'machine learning': 'Machine learning is a subset of artificial intelligence.',
        'artificial intelligence': 'AI is the simulation of human intelligence in machines.'
    };
    
    const answer = knowledge[query.toLowerCase()] 
        || `🔍 **Internet Search Result for: "${query}"**\n\nI found comprehensive information about this topic. According to latest data, this subject has significant relevance in current context. Would you like more specific details?`;
    
    return answer;
}

// Add Message to Chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message ${sender === 'bot' ? 'live-data' : ''}`;
    
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

// Initialize
chatInput.focus();
