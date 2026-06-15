from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json

app = FastAPI(title="Chatbot Service")

# OLLAMA_URL = "http://ollama:11434"
import os
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2:1b")


SYSTEM_PROMPT = """You are a helpful academic assistant for an educational platform called SnapLearn.
You help students, teachers, and parents with:
- Academic questions and explanations
- Understanding course content
- Help with assignments and exercises
- General study advice and tips
- Platform-related guidance

Be concise, friendly, and encouraging. If a question is not academic or educational, 
politely redirect the conversation back to learning topics."""

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    userId: Optional[str] = None
    userRole: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    model: str

@app.get("/health")
def health():
    return {"status": "UP"}

@app.get("/info")
def info():
    return {"service": "Python Chatbot Service", "model": MODEL_NAME, "status": "UP"}

@app.get("/models")
async def get_models():
    """List available Ollama models"""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            return res.json()
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Ollama unreachable: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Build conversation history for context
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add role context if available
    if req.userRole:
        role_context = f"The user is a {req.userRole} on the platform."
        messages[0]["content"] += f"\n{role_context}"

    # Add conversation history
    for msg in req.history[-10:]:  # keep last 10 messages for context
        messages.append({"role": msg.role, "content": msg.content})

    # Add current message
    messages.append({"role": "user", "content": req.message})

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            res = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": MODEL_NAME,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 512,
                    }
                }
            )
            data = res.json()
            reply = data["message"]["content"]
            return ChatResponse(reply=reply, model=MODEL_NAME)

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Ollama took too long to respond")
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Ollama error: {str(e)}")

@app.post("/stream")
async def chat_stream(req: ChatRequest):
    """Streaming endpoint — returns text as it's generated"""
    from fastapi.responses import StreamingResponse

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if req.userRole:
        messages[0]["content"] += f"\nThe user is a {req.userRole}."
    for msg in req.history[-10:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    async def generate():
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json={"model": MODEL_NAME, "messages": messages, "stream": True}
            ) as res:
                async for line in res.aiter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            token = chunk.get("message", {}).get("content", "")
                            if token:
                                yield f"data: {json.dumps({'token': token})}\n\n"
                            if chunk.get("done"):
                                yield "data: [DONE]\n\n"
                        except:
                            continue

    return StreamingResponse(generate(), media_type="text/event-stream")