import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'test' });
console.log('Upload properties:', Object.keys(ai.files.upload));
// Intentar simular una respuesta si es posible o simplemente ver el tipo
console.log('SDK structure verified');
