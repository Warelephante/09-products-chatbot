# Chatbot
To get started, create a new Codespace from this repo.

## OpenAI chat setup

Create `js/secrets.js` with your OpenAI API key:

```js
const apiKey = 'YOUR_API_KEY';
```

The chat loads rental listings from `rentals.json` and sends them with the conversation to the OpenAI Chat Completions API using GPT-4o. It asks two or three preference questions, then ranks the best matching rentals using their catalog details. Responses use line breaks for readability and a conversational tone. The catalog availability dates are from 2025 and should be verified. This browser-only example is for learning: visitors can inspect browser scripts and access any key used here. For a production app, keep the key on a server and send chat requests through your backend.
