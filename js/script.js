// Main function to initialize the chat interface
function initChat() {
    // Get all required DOM elements
    const chatToggle = document.getElementById('chatToggle');
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendButton = document.getElementById('sendMessage');
    const openIcon = document.querySelector('.open-icon');
    const closeIcon = document.querySelector('.close-icon');
    let rentalCatalog;
    const systemPrompt = 'You are the Offbeat Assistant, a friendly, natural-sounding vacation rental guide. Keep replies warm, conversational, and concise. Lead the user through 2 simple preference questions, one at a time, before recommending rentals. Ask a third question only if it would meaningfully improve the match, and never ask more than 3 total. Ask about preferences the catalog can address, such as the experience or theme they want, preferred location or region, and features or atmosphere that matter to them. Do not repeat questions or ask about information the user has already shared. After the questions, recommend the top 2 or 3 matches in ranked order. Format recommendations as a short introduction followed by a numbered list; put each rental name, location, and rating on its own line, then a short "Why it fits" line. Use line breaks between items and avoid long paragraphs. Recommend only rentals in the catalog; do not invent details. The catalog dates are all in 2025, so clearly tell the user to verify current availability and dates.';
    const openingMessage = 'I\'d love to help you find a retreat! What kind of experience or theme sounds most fun to you?';
    const conversation = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'assistant',
            content: openingMessage
        }
    ];

    // Load the rental data once and include it in the assistant's instructions.
    async function loadRentalCatalog() {
        if (rentalCatalog) {
            return;
        }

        const response = await fetch('./rentals.json');
        if (!response.ok) {
            throw new Error(`Could not load rentals.json (${response.status}).`);
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.rentals) || data.rentals.length === 0) {
            throw new Error('rentals.json must contain a non-empty rentals array.');
        }

        rentalCatalog = data.rentals;
        conversation[0].content = `${systemPrompt}\n\nRental catalog:\n${JSON.stringify(rentalCatalog, null, 2)}`;
    }

    // Keep the conversation in the same format used by the Chat Completions API.
    async function getChatResponse() {
        if (typeof apiKey === 'undefined' || !apiKey || apiKey === 'YOUR_API_KEY') {
            throw new Error('Add your OpenAI API key to js/secrets.js before using the chat.');
        }

        await loadRentalCatalog();

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                temperature: 0.7,
                messages: conversation,
                max_completion_tokens: 800
            })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `The API request failed (${response.status}).`);
        }

        const assistantMessage = data.choices?.[0]?.message?.content;
        if (!assistantMessage) {
            throw new Error('The API response did not include a message.');
        }

        return assistantMessage;
    }

    function addChatMessage(message, sender) {
        const chatMessage = document.createElement('div');
        chatMessage.classList.add('message', sender);
        chatMessage.textContent = message;
        chatMessages.appendChild(chatMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Toggle chat visibility and swap icons
    chatToggle.addEventListener('click', function() {
        chatBox.classList.toggle('active');
        openIcon.style.display = chatBox.classList.contains('active') ? 'none' : 'block';
        closeIcon.style.display = chatBox.classList.contains('active') ? 'block' : 'none';
    });

    // Handle user input and process messages
    async function handleUserInput(e) {
        e.preventDefault();
        if (sendButton.disabled) {
            return;
        }

        const message = userInput.value.trim();
        if (message) {
            userInput.value = '';

            addChatMessage(message, 'user');
            conversation.push({ role: 'user', content: message });
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';

            try {
                const assistantMessage = await getChatResponse();
                conversation.push({ role: 'assistant', content: assistantMessage });
                addChatMessage(assistantMessage, 'bot');
            } catch (error) {
                addChatMessage(`Sorry, I couldn't get a response: ${error.message}`, 'bot');
            } finally {
                sendButton.disabled = false;
                sendButton.textContent = 'Send';
            }
        }
    }

    // Listen for form submission
    document.getElementById('chatForm').addEventListener('submit', handleUserInput);
}

// Initialize the chat interface
initChat();
