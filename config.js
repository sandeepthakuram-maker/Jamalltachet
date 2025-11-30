// Configuration for AI Chat
const CONFIG = {
    AI_NAME: "AI Assistant",
    DEFAULT_LANGUAGE: "hi",
    MAX_MESSAGES: 100,
    TYPING_DELAY: 1000,
    THEMES: ['light', 'dark', 'blue']
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
