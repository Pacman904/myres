class RealTimeVoiceAssistant {
    constructor(apiKey, options = {}) {
        this.apiKey = "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";
        this.options = {
            language: options.language || 'en-US',
            autoStart: options.autoStart || false,
            apiEndpoint: options.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
        };

        this.isListening = false;
        this.audioStream = null;
        this.initialize();
    }

    async initialize() {
        try {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = true;
            this.recognition.lang = this.options.language;

            this.recognition.onresult = (event) => this.handleSpeech(event);
            this.recognition.onerror = (error) => console.error('Speech recognition error:', error);

            if (this.options.autoStart) {
                this.start();
            }
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    async handleSpeech(event) {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ');

        console.log('User said:', transcript);
        this.sendToAPI(transcript);
    }

    async sendToAPI(inputText) {
        try {
            const response = await fetch(this.options.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are a helpful voice assistant." },
                        { role: "user", content: inputText }
                    ],
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const reply = data.choices[0]?.message?.content;
            console.log('Assistant replied:', reply);
            this.speak(reply);
        } catch (error) {
            console.error('Error sending to API:', error);
        }
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.options.language;
            window.speechSynthesis.speak(utterance);
        } else {
            console.error('Speech synthesis not supported in this browser.');
        }
    }

    start() {
        if (!this.isListening) {
            this.isListening = true;
            this.recognition.start();
            console.log('Voice assistant started.');
        }
    }

    stop() {
        if (this.isListening) {
            this.isListening = false;
            this.recognition.stop();
            console.log('Voice assistant stopped.');
        }
    }
}

// Add event listener for the "Rufen Sie uns an" button
document.addEventListener('DOMContentLoaded', () => {
    const callButton = document.getElementById('call-button');

    const assistant = new RealTimeVoiceAssistant("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", {
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        language: 'en-US',
        autoStart: false
    });

    callButton.addEventListener('click', () => {
        if (assistant.isListening) {
            assistant.stop();
            callButton.textContent = 'Rufen Sie uns an';
            callButton.classList.remove('active');
        } else {
            assistant.start();
            callButton.textContent = 'Anruf beenden';
            callButton.classList.add('active');
        }
    });
});

export { RealTimeVoiceAssistant };
