import json
import os
import re
from typing import Any, Dict, Optional
import httpx
from src.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL

class JudgeAgent:
    name = "base"

    async def ask_llm(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        
        # If Gemini key is available and LLM_API_KEY is not explicitly set to OpenAI
        if gemini_api_key and (not LLM_API_KEY or "openai" not in LLM_BASE_URL.lower()):
            try:
                from google import genai
                client = genai.Client(api_key=gemini_api_key)
                prompt = f"{system_prompt}\n\nTask:\n{user_prompt}\n\nReturn strictly valid JSON only."
                response = client.models.generate_content(
                    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                    contents=prompt
                )
                text = response.text or "{}"
                return self._parse_json(text)
            except Exception as e:
                print(f"[{self.name}] Gemini call error: {e}")

        # Standard OpenAI-compatible API
        if LLM_API_KEY:
            try:
                url = LLM_BASE_URL.rstrip("/") + "/chat/completions"
                payload = {
                    "model": LLM_MODEL,
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ]
                }
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.post(
                        url,
                        headers={"Authorization": f"Bearer {LLM_API_KEY}"},
                        json=payload
                    )
                    resp.raise_for_status()
                    content = resp.json()["choices"][0]["message"]["content"]
                    return self._parse_json(content)
            except Exception as e:
                print(f"[{self.name}] LLM call error: {e}")

        return {}

    def _parse_json(self, content: str) -> Dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except Exception:
                    pass
        return {}

    def normalize_score(self, value: Any, default: float = 0.0) -> float:
        try:
            val = float(value)
            return round(max(0.0, min(100.0, val)), 1)
        except (TypeError, ValueError):
            return float(default)

    async def evaluate(self, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError

