// translator-worker.js
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.0';

let generator;

async function initializeGenerator() {
  generator = await pipeline('text-generation', 'onnx-community/gemma-3-1b-it-ONNX', { dtype: 'int8' });
  // Notify the main thread that the generator is ready
  postMessage({ type: 'ready' });
}

initializeGenerator();

onmessage = async function(event) {
  const { messages, options } = event.data;
  try {
    if (!generator) {
      await initializeGenerator();
    }
    const output = await generator(messages, options);
    const result = output[0].generated_text.at(-1).content;
    postMessage({ type: 'result', result });
  } catch (err) {
    postMessage({ type: 'error', error: err.message });
  }
};
