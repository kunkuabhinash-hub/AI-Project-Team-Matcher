import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
import json
import time

class GeminiServiceUnavailableError(Exception):
    pass

class GeminiResponseParsingError(Exception):
    pass


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
    - IMPORTANT: For the `studentId` field in the response, you MUST use the exact `id` string from the student's profile. Do not use their name.
    - CRITICAL: Use the `deterministicMatchedSkills` supplied in the students data as the precise `matchedSkills` array in your response. Do NOT add any skills to `matchedSkills` that are not in `deterministicMatchedSkills`.
    - CRITICAL: Never claim a skill is matched unless it appears in both the project requiredSkills and candidate skills (which is already calculated for you in `deterministicMatchedSkills`).
    - CRITICAL: If a candidate has no meaningful match, do not recommend them.
    - CRITICAL: `matchScore` must be at least the `baseMatchScore` provided for the student.
    
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

    max_retries = 3
    retry_delays = [2, 4, 8]
    
    for attempt in range(max_retries + 1):
        try:
            print(f"Gemini matching attempt {attempt+1}/{max_retries+1} started...")
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
                config=generation_config,
            )
            print(f"Gemini API request succeeded on attempt {attempt+1}")
            break  # Success, exit the retry loop
        except Exception as e:
            error_msg = str(e).upper()
            # Check for temporary errors (Rate limits, High demand, 503 Unavailable)
            is_temporary = any(term in error_msg for term in ["503", "UNAVAILABLE", "429", "TOO_MANY_REQUESTS"])
            
            if is_temporary:
                if attempt < max_retries:
                    delay = retry_delays[attempt]
                    print(f"Gemini API temporary error: {error_msg}. Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    print(f"Gemini API exhausted {max_retries} retries due to temporary errors.")
                    raise GeminiServiceUnavailableError("Gemini service is temporarily unavailable or experiencing high demand. Please try again later.")
            else:
                # If it's a hard error (e.g., 400, 403, 404), raise it immediately
                print(f"Gemini API hard failure: {error_msg}")
                raise e
    
    raw_text = response.text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    elif raw_text.startswith("```"):
        raw_text = raw_text[3:]
    
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
        
    raw_text = raw_text.strip()
    
    try:
        result_json = json.loads(raw_text)
        return result_json
    except json.JSONDecodeError as e:
        print("Failed to parse Gemini response as JSON. Raw response redacted.")
        raise GeminiResponseParsingError("Invalid non-JSON response returned by Gemini")
