import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';

let generator;

async function initializeGenerator() {
  generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', { dtype: 'uint8' });
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
    postMessage({ result });
  } catch (err) {
    postMessage({ error: err.message });
  }
};