import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: 'test' });
console.log('--- Client ---');
console.log('Models methods:', Object.keys(ai.models));
console.log('Files methods:', Object.keys(ai.files));

// Intentar ver si upload acepta path o requiere objeto
console.log('Upload params length:', ai.files.upload.length);
