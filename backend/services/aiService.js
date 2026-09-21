// Internal service for communicating with the Python FastAPI AI Matching Service

export const checkAIHealth = async () => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // We expect the AI service to be at exactly this internal URL
    const response = await fetch(`${aiServiceUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`AI Service returned status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI Service Connection Error:', error);
    // Return a structured error rather than throwing to avoid crashing the server ungracefully
    return {
      status: 'error',
      message: 'AI matching service is unavailable'
    };
  }
};
