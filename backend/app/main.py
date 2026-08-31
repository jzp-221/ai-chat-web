import asyncio
import json
import os
from collections.abc import AsyncIterator
from typing import Literal

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = "mock-fast"


LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_API_BASE_URL = os.getenv("LLM_API_BASE_URL", "https://api.openai.com/v1").rstrip("/")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")


def create_mock_reply(model: str, prompt: str) -> str:
    """根据前端传来的模型名称，生成不同风格的模拟回复。"""
    if model == "mock-creative":
        return (
            f"关于“{prompt}”，我们可以换一个更有想象力的角度来思考："
            "先提出大胆的想法，再把它拆成可以执行的小步骤。"
        )

    if model == "mock-balanced":
        return (
            f"我收到了你的问题：“{prompt}”。"
            "我会先理解目标，再给出清晰、稳妥的回答。"
        )

    return f"快速回复：我收到了“{prompt}”。"


async def stream_text(
    text: str, request: Request, delay: float = 0.03
) -> AsyncIterator[str]:
    for character in text:
        if await request.is_disconnected():
            return

        payload = json.dumps({"content": character}, ensure_ascii=False)
        yield f"data: {payload}\n\n"
        await asyncio.sleep(delay)


async def stream_real_reply(
    chat_request: ChatRequest, request: Request
) -> AsyncIterator[str]:
    if not LLM_API_KEY:
        async for event in stream_text(
            "尚未配置大模型密钥，请先在后端设置 LLM_API_KEY。", request
        ):
            yield event
        yield "data: [DONE]\n\n"
        return

    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": LLM_MODEL,
        "messages": [message.model_dump() for message in chat_request.messages],
        "stream": True,
    }

    timeout = httpx.Timeout(60.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream(
            "POST",
            f"{LLM_API_BASE_URL}/chat/completions",
            headers=headers,
            json=body,
        ) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if await request.is_disconnected():
                    return

                if not line.startswith("data:"):
                    continue

                data = line[5:].strip()
                if not data or data == "[DONE]":
                    continue

                chunk = json.loads(data)
                content = chunk.get("choices", [{}])[0].get("delta", {}).get("content")

                if content:
                    payload = json.dumps({"content": content}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"

    yield "data: [DONE]\n\n"


app = FastAPI(title="AI Chat API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(chat_request: ChatRequest, request: Request) -> StreamingResponse:
    user_messages = [
        message.content
        for message in chat_request.messages
        if message.role == "user"
    ]
    prompt = user_messages[-1] if user_messages else ""

    async def mock_event_stream() -> AsyncIterator[str]:
        reply = create_mock_reply(chat_request.model, prompt)

        async for event in stream_text(reply, request):
            yield event

        yield "data: [DONE]\n\n"

    event_stream = (
        stream_real_reply(chat_request, request)
        if chat_request.model == "real-ai"
        else mock_event_stream()
    )

    return StreamingResponse(
        event_stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
