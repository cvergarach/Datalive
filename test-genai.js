import { GoogleGenAI } from '@google/genai';
import * as genai from '@google/genai';

console.log('Exports from @google/genai:', Object.keys(genai));

try {
    const ai = new GoogleGenAI({ apiKey: 'dummy' });
    console.log('ai instance keys:', Object.keys(ai));
    console.log('ai.files keys:', Object.keys(ai.files));
    console.log('ai.models keys:', Object.keys(ai.models));
} catch (e) {
    console.error('Error initializing GoogleGenAI:', e.message);
}
