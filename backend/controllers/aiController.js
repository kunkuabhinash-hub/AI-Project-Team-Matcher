import { checkAIHealth } from '../services/aiService.js';

// @desc    Check health of the Python AI Matching Service
// @route   GET /api/ai/health
// @access  Private
export const getAIHealth = async (req, res) => {
  try {
    const result = await checkAIHealth();
    
    if (result.status === 'error') {
      return res.status(503).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAIHealth controller:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
