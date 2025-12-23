import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Upload file to Gemini
   */
  async uploadFile(filePath, displayName = null) {
    try {
      const fileName = displayName || path.basename(filePath);

      const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType: this.getMimeType(filePath),
        displayName: fileName
      });

      console.log(`✅ File uploaded to Gemini: ${uploadResult.file.uri}`);

      return {
        uri: uploadResult.file.uri,
        name: uploadResult.file.name,
        displayName: uploadResult.file.displayName,
        mimeType: uploadResult.file.mimeType,
        sizeBytes: uploadResult.file.sizeBytes
      };
    } catch (error) {
      console.error('Error uploading file to Gemini:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Check file status
   */
  async getFileStatus(fileName) {
    try {
      const file = await fileManager.getFile(fileName);
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
      const result = await this.model.generateContent([
        {
          fileData: {
            fileUri: fileUri,
            mimeType: 'application/pdf' // Adjust based on file type
          }
        },
        { text: prompt }
      ]);

      return result.response.text();
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
      await fileManager.deleteFile(fileName);
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
