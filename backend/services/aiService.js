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

export const getRecommendations = async (project, students) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${aiServiceUrl}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ project, students })
    });
    
    if (!response.ok) {
      // If the Python service returned an error, capture it
      const errorText = await response.text();
      console.error(`AI Service returned status: ${response.status} with body: ${errorText}`);
      
      let errorMessage = 'AI matching service is unavailable or failed to process the request';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch (e) {
        // Not JSON
      }
      
      return { status: 'error', message: errorMessage };
    }
    
    const data = await response.json();
    return { status: 'success', data };
    
  } catch (error) {
    console.error('AI Matching Connection Error:', error);
    return {
      status: 'error',
      message: 'AI matching service is unavailable or failed to process the request'
    };
  }
};
