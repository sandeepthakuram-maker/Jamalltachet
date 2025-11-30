<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart AI - Live Search</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="chat-container">
            <div class="chat-header">
                <h1>🔍 Smart AI with Live Search</h1>
                <p>हर सवाल का तुरंत जवाब - Internet से Live Data</p>
            </div>
            
            <div class="search-status" id="search-status">
                🔍 AI Internet पर Search कर रहा है...
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <div class="message bot-message">
                    <strong>नमस्ते! मैं Live Search AI हूँ</strong><br>
                    ✅ हर सवाल का <strong>तुरंत जवाब</strong><br>
                    ✅ <strong>Internet से Live Data</strong><br>
                    ✅ <strong>Real-time Information</strong><br><br>
                    
                    <em>कुछ भी पूछिए:</em><br>
                    • "Weather in Delhi"<br>
                    • "Cricket score"<br>
                    • "News today"<br>
                    • कोई भी सवाल!
                </div>
            </div>
            
            <div class="typing" id="typing" style="display: none;">
                🔍 AI Internet पर Search कर रहा है...
            </div>
            
            <div class="chat-input-container">
                <input type="text" id="chat-input" placeholder="अपना सवाल यहाँ टाइप करें...">
                <button id="send-btn">Search</button>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
