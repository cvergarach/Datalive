import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY not found in environment variables');
}

const client = new GoogleGenAI({ apiKey });

class GeminiService {
  constructor() {
    this.model = 'gemini-2.5-flash';
  }

  /**
   * Upload file to Gemini
   */
  async uploadFile(filePath, displayName = null, mimeType = null) {
    try {
      const fileName = displayName || path.basename(filePath);
      const effectiveMimeType = mimeType || this.getMimeType(filePath);

      console.log(`📂 Subiendo archivo a Gemini desde: ${filePath}, MimeType: ${effectiveMimeType}`);

      const uploadResult = await client.files.upload({
        file: filePath,
        config: {
          displayName: fileName,
          mimeType: effectiveMimeType
        }
      });

      console.log(`✅ Archivo subido a Gemini: ${uploadResult.uri}`);

      return {
        uri: uploadResult.uri,
        name: uploadResult.name,
        displayName: uploadResult.displayName,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes
      };
    } catch (error) {
      console.error('❌ Error de subida en Gemini SDK:', error);
      if (error.response) {
        console.error('Detalles del error (response):', JSON.stringify(error.response, null, 2));
      }
      throw new Error(`Error en el SDK de Gemini al subir: ${error.message}`);
    }
  }

  /**
   * Check file status
   */
  async getFileStatus(fileName) {
    try {
      const file = await client.files.get({ name: fileName });
      return {
        uri: file.uri,
        state: file.state, // PROCESSING, ACTIVE, FAILED
        name: file.name
      };
    } catch (error) {
      console.error('Error getting file status:', error);
      throw new Error(`Failed to get file status: ${error.message}`);
    }
  }

  /**
   * Wait for file to be ACTIVE
   */
  async waitForFileActive(fileName, maxAttempts = 30, intervalMs = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getFileStatus(fileName);

      if (status.state === 'ACTIVE') {
        return status;
      }

      if (status.state === 'FAILED') {
        throw new Error('File processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('File processing timeout');
  }

  /**
   * Search/query in a file
   */
  async queryFile(fileUri, prompt) {
    try {
      const result = await client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                fileData: {
                  fileUri: fileUri,
                  mimeType: 'application/pdf'
                }
              },
              { text: prompt }
            ]
          }
        ]
      });

      return result.text;
    } catch (error) {
      console.error('Error querying file:', error);
      throw new Error(`Failed to query file: ${error.message}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileName) {
    try {
      await client.files.delete({ name: fileName });
      console.log(`🗑️ File deleted from Gemini: ${fileName}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get MIME type from file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.json': 'application/json'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export default new GeminiService();
