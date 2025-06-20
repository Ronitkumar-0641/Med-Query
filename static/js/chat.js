class MedicalChatbot {
    constructor() {
        this.chatForm = document.getElementById('chatForm');
        this.messageInput = document.getElementById('messageInput');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatContainer = document.getElementById('chatContainer');
        this.sendButton = document.getElementById('sendButton');
        this.resetButton = document.getElementById('resetChat');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.characterCount = document.getElementById('characterCount');
        this.emojiButton = document.getElementById('emojiButton');
        
        this.isLoading = false;
        this.currentStage = 'name';
        this.maxCharacters = 500;
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.resetButton.addEventListener('click', () => this.resetChat());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit(e);
            }
        });
        
        // Character count functionality
        this.messageInput.addEventListener('input', () => this.updateCharacterCount());
        
        // Initialize character count
        this.updateCharacterCount();
        
        // Emoji button functionality
        if (this.emojiButton) {
            this.emojiButton.addEventListener('click', () => this.showEmojiPicker());
        }
        
        // Focus on input
        this.messageInput.focus();
        
        // Load chat history
        this.loadChatHistory();
        
        // Initialize quick tip buttons
        this.initQuickTips();
        
        // Initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    async loadChatHistory() {
        try {
            const response = await fetch('/api/chat/history');
            if (response.ok) {
                const messages = await response.json();
                
                // Clear existing messages except welcome message
                const welcomeMessage = this.chatMessages.firstElementChild;
                this.chatMessages.innerHTML = '';
                
                if (messages.length === 0) {
                    // Show welcome message if no history
                    this.chatMessages.appendChild(welcomeMessage);
                } else {
                    // Display chat history
                    messages.forEach(message => {
                        this.displayMessage(message.message, message.is_bot, false);
                    });
                }
                
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    // Character count update
    updateCharacterCount() {
        if (!this.characterCount) return;
        
        const currentLength = this.messageInput.value.length;
        this.characterCount.textContent = `${currentLength}/${this.maxCharacters}`;
        
        if (currentLength > this.maxCharacters) {
            this.characterCount.classList.add('text-red-500');
            this.characterCount.classList.remove('text-gray-400');
            this.sendButton.disabled = true;
        } else {
            this.characterCount.classList.remove('text-red-500');
            this.characterCount.classList.add('text-gray-400');
            if (!this.isLoading) {
                this.sendButton.disabled = false;
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Display user message
        this.displayMessage(message, false);
        this.messageInput.value = '';
        this.updateCharacterCount();
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Update current stage
            this.currentStage = data.stage;
            
            // Display bot response with typing delay
            setTimeout(() => {
                this.displayMessage(data.response, true);
                this.setLoading(false);
                this.messageInput.focus();
            }, 1000);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.setLoading(false);
            this.displayMessage(
                'Sorry, I encountered an error processing your message. Please try again.',
                true
            );
            this.messageInput.focus();
        }
    }
    
    displayMessage(message, isBot, animate = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start';
        
        if (animate) {
            messageDiv.classList.add('message-enter');
        }
        
        if (isBot) {
            messageDiv.innerHTML = `
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-gradient-to-br from-medical-blue to-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <i data-feather="heart" class="h-5 w-5 text-white"></i>
                    </div>
                </div>
                <div class="ml-4 max-w-sm lg:max-w-lg">
                    <div class="bg-white rounded-2xl rounded-tl-md p-4 shadow-md border border-blue-100 bot-message">
                        <p class="text-gray-800 leading-relaxed">${this.formatMessage(this.escapeHtml(message))}</p>
                    </div>
                    <div class="flex items-center mt-2 ml-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span class="text-xs text-gray-500">Medical Bot • ${this.getTimeString()}</span>
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="flex-shrink-0 ml-auto order-2">
                    <div class="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-md">
                        <i data-feather="user" class="h-5 w-5 text-white"></i>
                    </div>
                </div>
                <div class="mr-4 max-w-sm lg:max-w-lg order-1">
                    <div class="bg-gradient-to-r from-medical-blue to-blue-600 text-white rounded-2xl rounded-tr-md p-4 shadow-md user-message">
                        <p class="leading-relaxed">${this.escapeHtml(message)}</p>
                    </div>
                    <div class="flex items-center justify-end mt-2 mr-2">
                        <span class="text-xs text-gray-500">You • ${this.getTimeString()}</span>
                        <div class="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                    </div>
                </div>
            `;
        }
        
        this.chatMessages.appendChild(messageDiv);
        
        // Replace feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        this.scrollToBottom();
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        this.sendButton.disabled = loading;
        this.messageInput.disabled = loading;
        
        if (loading) {
            this.showTypingIndicator();
            this.sendButton.innerHTML = '<i data-feather="loader" class="h-5 w-5 animate-spin"></i>';
        } else {
            this.hideTypingIndicator();
            this.sendButton.innerHTML = '<i data-feather="send" class="h-5 w-5"></i>';
        }
        
        // Replace feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    showTypingIndicator() {
        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.classList.add('hidden');
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
    
    async resetChat() {
        if (confirm('Are you sure you want to start over? This will clear your current conversation.')) {
            try {
                const response = await fetch('/api/chat/reset', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    // Clear chat messages
                    this.chatMessages.innerHTML = `
                        <div class="flex items-start animate-fadeIn">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 bg-gradient-to-br from-medical-blue to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                    <i data-feather="heart" class="h-5 w-5 text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4 max-w-sm lg:max-w-lg">
                                <div class="bg-white rounded-2xl rounded-tl-md p-4 shadow-md border border-blue-100">
                                    <p class="text-gray-800 leading-relaxed">Hello! I'm your medical assistant. Let's start by getting to know you better. What is your name?</p>
                                </div>
                                <div class="flex items-center mt-2 ml-2">
                                    <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span class="text-xs text-gray-500">Medical Bot • just now</span>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    this.currentStage = 'name';
                    this.messageInput.focus();
                    
                    // Replace feather icons
                    if (typeof feather !== 'undefined') {
                        feather.replace();
                    }
                    
                    this.scrollToBottom();
                } else {
                    throw new Error('Failed to reset chat');
                }
            } catch (error) {
                console.error('Error resetting chat:', error);
                alert('Failed to reset chat. Please try again.');
            }
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Simple emoji picker
    showEmojiPicker() {
        const emojis = ['😊', '😄', '😢', '😮', '😕', '😌', '👍', '👎', '❤️', '💚', '💙', '💛'];
        const emojiHtml = emojis.map(emoji => 
            `<button type="button" class="emoji-btn p-2 hover:bg-gray-100 rounded" data-emoji="${emoji}">${emoji}</button>`
        ).join('');
        
        // Remove existing picker
        const existingPicker = document.getElementById('emojiPicker');
        if (existingPicker) {
            existingPicker.remove();
            return;
        }
        
        const picker = document.createElement('div');
        picker.id = 'emojiPicker';
        picker.className = 'absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 z-10';
        picker.innerHTML = emojiHtml;
        
        // Position relative to emoji button
        const emojiButtonRect = this.emojiButton.getBoundingClientRect();
        const inputRect = this.messageInput.getBoundingClientRect();
        picker.style.position = 'absolute';
        picker.style.right = '12px';
        picker.style.bottom = '100%';
        
        this.messageInput.parentElement.appendChild(picker);
        
        // Add click listeners to emoji buttons
        picker.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.messageInput.value += emoji;
                this.updateCharacterCount();
                picker.remove();
                this.messageInput.focus();
            });
        });
        
        // Close picker when clicking outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!picker.contains(e.target) && e.target !== this.emojiButton) {
                    picker.remove();
                }
            }, { once: true });
        }, 100);
    }
    
    // Initialize quick tip buttons
    initQuickTips() {
        const quickTipButtons = document.querySelectorAll('.quick-tip-btn');
        quickTipButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tip = button.dataset.tip;
                if (tip) {
                    this.messageInput.value = tip;
                    this.updateCharacterCount();
                    this.messageInput.focus();
                    
                    // Scroll to chat input
                    this.messageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
    }
    
    // Get current time string
    getTimeString() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Enhanced message formatting for medical responses
    formatMessage(text) {
        // Convert **bold** to <strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-medical-blue">$1</strong>');
        
        // Convert *italic* to <em>
        text = text.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');
        
        // Format numbered lists
        text = text.replace(/^\d+\.\s(.+)$/gm, '<div class="ml-4 mb-2"><span class="inline-flex items-center justify-center w-6 h-6 bg-medical-blue text-white text-xs rounded-full mr-2">$1</span>$2</div>');
        
        // Format bullet points
        text = text.replace(/^[•-]\s(.+)$/gm, '<div class="ml-4 mb-1 flex items-start"><span class="w-2 h-2 bg-medical-blue rounded-full mt-2 mr-3 flex-shrink-0"></span><span>$1</span></div>');
        
        // Format section headers (lines that end with :)
        text = text.replace(/^([A-Z][^:\n]*):$/gm, '<h4 class="font-semibold text-medical-blue mt-4 mb-2 border-b border-blue-100 pb-1">$1</h4>');
        
        // Format EMERGENCY or WARNING text
        text = text.replace(/(EMERGENCY|WARNING|URGENT|IMMEDIATE)/gi, '<span class="bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">$1</span>');
        
        // Format medication names (common OTC drugs)
        text = text.replace(/\b(acetaminophen|ibuprofen|aspirin|naproxen|diphenhydramine|loratadine|cetirizine|omeprazole|ranitidine|simethicone|loperamide|bismuth subsalicylate)\b/gi, '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">$1</span>');
        
        // Format dosage information
        text = text.replace(/(\d+\s*mg|\d+\s*ml|\d+\s*tablets?|\d+\s*capsules?)/gi, '<span class="bg-green-100 text-green-800 px-1 py-0.5 rounded text-sm font-medium">$1</span>');
        
        // Format DISCLAIMER text
        text = text.replace(/(DISCLAIMER|NOTE|IMPORTANT)/gi, '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">$1</span>');
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
}

// Initialize the chatbot when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MedicalChatbot();
});

// Handle page visibility change to maintain connection
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible, you could refresh chat status here
        console.log('Page is now visible');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
    // You could show a notification here
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    // You could show a notification here
});
