const myProgress = new ProgressBar.Circle('#progress', {
    color: "palegreen",
    strokeWidth: 10.0,
    trailColor: 'transparent',
    text: {
        style: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            padding: 0,
            margin: 0,
            fontSize: '30px',
            fontWeight: 'bold',
            transform: {
                prefix: true,
                value: 'translate(-50%, -50%)'
            }
        }
    },
});

myProgress.animate(0.1);
myProgress.setText("10%");

import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';

myProgress.animate(0.7);
myProgress.setText("70%");


class AudioVisualizer {
    constructor(audioContext, processFrame, processError) {
        this.audioContext = audioContext;
        this.processFrame = processFrame;
        this.connectStream = this.connectStream.bind(this);
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(this.connectStream)
            .catch((error) => {
                if (processError) {
                    processError(error);
                }
            });
    }

    connectStream(stream) {
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        this.analyser.smoothingTimeConstant = 0.5;
        this.analyser.fftSize = 32;

        this.initRenderLoop(this.analyser);
    }

    initRenderLoop() {
        const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        const processFrame = this.processFrame || (() => { });

        const renderFrame = () => {
            this.analyser.getByteFrequencyData(frequencyData);
            processFrame(frequencyData);

            requestAnimationFrame(renderFrame);
        };
        requestAnimationFrame(renderFrame);
    }
}

const visualMainElement = document.querySelector('main');
const visualValueCount = 16;
let visualElements;
const createDOMElements = () => {
    let i;
    for (i = 0; i < visualValueCount; ++i) {
        const elm = document.createElement('div');
        visualMainElement.appendChild(elm);
    }

    visualElements = document.querySelectorAll('main div');
};

createDOMElements();

const destroyDOMElements = () => {
    visualMainElement.innerHTML = ''; // Clear the existing elements
};

const restoreButton = () => {
    destroyDOMElements();
    const button = document.createElement('button');
    button.onclick = originalOnClick;
    button.innerText = 'Старт';
    // button.id = "startButton"
    visualMainElement.appendChild(button);
    // startButton = document.getElementById('startButton');
    // console.log(startButton);
    restoreDOMElements();
};

const restoreDOMElements = () => {
    let i;
    for (i = 0; i < visualValueCount; ++i) {
        const elm = document.createElement('div');
        visualMainElement.appendChild(elm);
    }
};

const init = () => {
    // Creating initial DOM elements
    const audioContext = new AudioContext();
    const initDOM = () => {
        visualMainElement.innerHTML = '';
        createDOMElements();
    };
    initDOM();

    // Swapping values around for a better visual effect
    const dataMap = { 0: 15, 1: 10, 2: 8, 3: 9, 4: 6, 5: 5, 6: 2, 7: 1, 8: 0, 9: 4, 10: 3, 11: 7, 12: 11, 13: 12, 14: 13, 15: 14 };
    const processFrame = (data) => {
        const values = Object.values(data);
        let i;
        for (i = 0; i < visualValueCount; ++i) {
            const value = values[dataMap[i]] / 255;
            const elmStyles = visualElements[i].style;
            elmStyles.transform = `scaleY( ${value} )`;
            elmStyles.opacity = Math.max(.25, value);
        }
    };

    const processError = () => {
        visualMainElement.classList.add('error');
        visualMainElement.innerText = 'Please allow access to your microphone in order to see this demo.';
    }

    const a = new AudioVisualizer(audioContext, processFrame, processError);
};

const startButton = document.getElementById('startButton');
const processingImage = document.getElementById('processing');
const resultParagraph = document.getElementById('result');
const generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', { dtype: 'q4' });

myProgress.animate(1.0);
myProgress.setText("100%");

myProgress.destroy();
document.getElementById("progress").remove();

resultParagraph.style.display = "block";

let originalOnClick = startButton.onclick;

// Get references to the dropdown and textarea elements
const dropdown1 = document.getElementById('dropdown1');
const dropdown2 = document.getElementById('dropdown2');
const glossaryTextarea = document.getElementById('glossary');
const codeToLanguage = {
    'ru-RU': 'Russian',
    'en-US': 'English',
    'cmn-Hans-CN': 'Chinese'
}
let formValues;
let prompt;

// Function to retrieve the selected values and textarea text
function getFormValues() {
    // Get the selected value from dropdown1
    const dropdown1Value = dropdown1.value;

    // Get the selected value from dropdown2
    const dropdown2Value = dropdown2.value;

    // Get the text from the textarea
    const glossary = glossaryTextarea.value;

    // Return an object containing the values
    return {
        dropdown1: dropdown1Value,
        dropdown2: dropdown2Value,
        glossary: glossary
    };
}

// Check if SpeechRecognition is supported
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    startButton.onclick = () => {
        formValues = getFormValues();
        console.log(formValues); // Display the values in the console
        recognition.lang = formValues.dropdown2;
        recognition.start();
        console.log('Speech recognition started');
        resultParagraph.textContent = "";
        init();
    };

    recognition.onresult = async (event) => {
        const speechResult = event.results[0][0].transcript;
        console.log(speechResult);
        // Define the prompt and list of messages
        const text = speechResult;
        if (formValues.glossary != "") {
            prompt = `You are a translation machine. Your interface with users will be voice. 
Your sole function is to translate the provided text from ${codeToLanguage[formValues.dropdown2]} to ${codeToLanguage[formValues.dropdown1]}.
Do not add, omit, or alter any information.
Always take into account the terms provided in the glossary: ${formValues.glossary}. 
The terms of the glossary in ${codeToLanguage[formValues.dropdown2]} must be translated as specified in the glossary, irrespective of their meaning.
Do not provide explanations, opinions, timestamps or any additional text beyond the direct translation.
Use polite forms in translation.
Avoid usage of unpronouncable punctuation.
Do not provide explanations, opinions, timestamps or any additional text beyond the direct translation.
Use polite forms in translation.
Avoid usage of unpronounceable punctuation.`
        } else {
            prompt = `You are a translation machine. Your interface with users will be voice. 
Your sole function is to translate the provided text from ${codeToLanguage[formValues.dropdown2]} to ${codeToLanguage[formValues.dropdown1]}.
Do not add, omit, or alter any information.
Do not provide explanations, opinions, timestamps or any additional text beyond the direct translation.
Use polite forms in translation.
Avoid usage of unpronounceable punctuation.`
        }
        console.log(prompt);
        const messages = [
            { role: 'system', content: prompt },
            { role: 'user', content: text }
        ]

        const output = await generator(messages, { max_new_tokens: 128 });
        console.log("Result", output[0])
        const result = output[0].generated_text.at(-1).content
        processingImage.style.display = "none";
        resultParagraph.style.display = "block";
        resultParagraph.textContent = result;
        speakText(result);
    };

    recognition.onspeechend = () => {
        recognition.stop();
        console.log('Speech recognition stopped');
        originalOnClick = startButton.onclick;
        //startButton.onclick = null; // Remove the onclick to avoid memory leaks 
        restoreButton();
        if (resultParagraph.textContent.trim() === '') {
            resultParagraph.style.display = "none";
            processingImage.style.display = "block";
        }
    };

    recognition.onerror = (event) => {
        console.log('Error occurred in recognition: ' + event.error);
        restoreButton();
    };
} else {
    restoreButton();
    console.log('Speech Recognition is not supported in this browser.');
}

// Speech synthesis function
function speakText(text) {
    if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure the utterance
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        synth.speak(utterance);
    } else {
        console.log('Speech Synthesis is not supported in this browser.');
    }
}