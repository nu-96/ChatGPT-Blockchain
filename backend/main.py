from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from openai import OpenAI

# Initialize OpenAI client (Make sure to set OPENAI_API_KEY environment variable)
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("WARNING: OPENAI_API_KEY not set. Using mock response for testing.")
    client = None
else:
    client = OpenAI(api_key=api_key)

class Question(BaseModel):
    question: str

@app.get("/")
async def root():
    return {"message": "Hello from FastAPI"}

@app.post("/auth/register")
async def ask_chatgpt(payload: Question):
    if not client:
        return {
            "status": "success",
            "answer": f"MOCK RESPONSE: You asked: '{payload.question}'. Please set OPENAI_API_KEY for real answers."
        }
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": payload.question}
            ]
        )
        answer = response.choices[0].message.content
        return {
            "status": "success",
            "answer": answer
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
