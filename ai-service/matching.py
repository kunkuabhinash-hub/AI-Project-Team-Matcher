import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
import json

# Since we want structured JSON output, we can define the response schema for Gemini (if supported by the specific model version)
# Or we can just use response_mime_type="application/json" and instruct it carefully.
# We will use Gemini 1.5 Flash as it is fast and supports JSON.
generation_config = types.GenerateContentConfig(
    temperature=0.2,
    top_p=0.95,
    top_k=64,
    max_output_tokens=8192,
    response_mime_type="application/json",
)

def match_students_to_project(project_data: dict, students_data: list) -> dict:
    if not os.environ.get("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY is not configured.")

    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    prompt = f"""
    You are an AI project team matching assistant.
    
    Your job is to analyze:
    1. Project requirements
    2. Student skills
    3. Student interests
    4. Student experience
    5. Student availability
    
    Then recommend students whose profiles align with the project.
    
    IMPORTANT MATCHING RULES:
    - Required skills should have high importance.
    - Relevant interests should contribute to compatibility.
    - Relevant experience should contribute to compatibility.
    - Availability should be considered.
    - Do not recommend students solely because they have many skills.
    - Do not invent skills, experience, interests, or availability.
    - Use only information supplied in the request.
    - Do not invent students.
    - Do not invent project requirements.
    - Do not claim a student has a skill that is absent from their profile.
    - Prefer complementary skills when useful for forming a team.
    - Respect the requested team size (Do not recommend more than {project_data.get('teamSize', 1)} students).
    - The creator should not be recommended as a candidate if they are already the project owner.
    - Recommendations must be explainable using the supplied data.
    
    PROJECT DATA:
    {json.dumps(project_data, indent=2)}
    
    STUDENTS DATA:
    {json.dumps(students_data, indent=2)}
    
    Respond STRICTLY in the following JSON format without Markdown formatting:
    {{
      "projectId": "{project_data.get('id')}",
      "recommendations": [
        {{
          "studentId": "...",
          "matchScore": 0,
          "matchedSkills": [],
          "matchingReasons": [],
          "skillGaps": []
        }}
      ]
    }}
    
    Make sure `matchScore` is an integer between 0 and 100.
    """

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=prompt,
        config=generation_config,
    )
    
    try:
        result_json = json.loads(response.text)
        return result_json
    except json.JSONDecodeError as e:
        print("Failed to parse Gemini response as JSON:", response.text)
        raise ValueError("Invalid JSON returned by Gemini")
