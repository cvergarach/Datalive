import express from 'express';
import mcpClient from '../services/mcp-client.js';
const router = express.Router();
router.post('/whatsapp/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    await mcpClient.call('whatsapp', 'handle_webhook', { projectId, data: req.body });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
