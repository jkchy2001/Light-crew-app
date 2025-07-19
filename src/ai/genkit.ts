import {genkit} from 'genkit';
// Intentionally left blank.
// The Google AI plugin was removed because no API key was available.
// If you add a key, you can re-initialize the plugin here.
// e.g., import {googleAI} from '@genkit-ai/googleai';
// and then inside genkit(), add plugins: [googleAI()]

export const ai = genkit({
  model: 'googleai/gemini-2.0-flash',
});
