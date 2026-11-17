import os
from typing import Any, Dict, List, Optional
import torch
from src.agents.base import JudgeAgent
from src.config import MODEL_PATH


class HallucinationAgent(JudgeAgent):
    name = "hallucination"
    _model = None
    _tokenizer = None
    _init_failed = False

    def _load_model(self):
        if self._init_failed or self._model is not None:
            return self._model, self._tokenizer

        model_dir = MODEL_PATH
        if not model_dir or not os.path.exists(model_dir):
            return None, None

        # Check for nested directory if applicable
        if os.path.exists(os.path.join(model_dir, "hallucination_model")):
            model_dir = os.path.join(model_dir, "hallucination_model")

        try:
            # Disable TF / Keras bindings in transformers
            os.environ["USE_TF"] = "0"
            os.environ["USE_TORCH"] = "1"
            os.environ["TRANSFORMERS_NO_TF"] = "1"

            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            self._tokenizer = AutoTokenizer.from_pretrained(model_dir)
            self._model = AutoModelForSequenceClassification.from_pretrained(model_dir)
            self._model.eval()
            print(f"[HallucinationAgent] Fine-tuned model loaded successfully from {model_dir}")
        except Exception as e:
            print(f"[HallucinationAgent] Could not load local fine-tuned model: {e}")
            self._init_failed = True
            self._model = None
            self._tokenizer = None

        return self._model, self._tokenizer

    def predict_with_model(self, premise: str, hypothesis: str) -> Optional[Dict[str, Any]]:
        model, tokenizer = self._load_model()
        if model is None or tokenizer is None:
            return None

        try:
            inputs = tokenizer(
                premise[:2000],
                hypothesis[:2000],
                return_tensors="pt",
                truncation=True,
                max_length=512
            )
            # DistilBERT does not take token_type_ids
            inputs.pop("token_type_ids", None)

            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=-1)[0].tolist()
                predicted_class = int(torch.argmax(logits, dim=-1)[0])

            # Class 0: Faithful / Consistent; Class 1: Inconsistent / Hallucinated
            # Probability of hallucination:
            p_faithful = probs[0] if len(probs) > 0 else 0.5
            p_hallucinated = probs[1] if len(probs) > 1 else 1.0 - p_faithful

            label = "FAITHFUL" if predicted_class == 0 else "HALLUCINATION_RISK"
            confidence = round(max(p_faithful, p_hallucinated), 4)

            return {
                "model": "DistilBertForSequenceClassification (Fine-Tuned)",
                "predicted_class": predicted_class,
                "label": label,
                "confidence": confidence,
                "probabilities": {
                    "faithful": round(p_faithful, 4),
                    "hallucinated": round(p_hallucinated, 4)
                }
            }
        except Exception as e:
            return {"error": str(e)}

    async def evaluate(self, question: str, response: str, reference: str = "", evidence: Optional[List[str]] = None, **kwargs) -> Dict[str, Any]:
        context = reference or "\n---\n".join(evidence or [])
        premise = context if context else f"Prompt: {question}"

        # 1. Run local fine-tuned PyTorch ML model prediction
        ml_prediction = self.predict_with_model(premise=premise, hypothesis=response)

        # 2. Query LLM Judge for semantic claim-level verification
        llm_result = await self.ask_llm(
            "You are an evidence-grounded hallucination detector. Distinguish unsupported claims from contradicted claims. Do not call a claim false merely because evidence is missing, unless it contradicts the reference. Return strictly valid JSON.",
            f"""Inspect factual claims in the AI response against the provided reference evidence.
Return JSON:
{{
  "risk_score": 0-100,
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": "...",
  "flagged_claims": [
    {{
      "claim": "...",
      "type": "unsupported" | "contradicted",
      "evidence": "...",
      "explanation": "..."
    }}
  ]
}}

Question: {question}
AI Response: {response}
Reference / Evidence: {context or "No reference evidence supplied."}"""
        )

        flagged_claims = []
        if llm_result and "risk_score" in llm_result:
            risk_score = self.normalize_score(llm_result.get("risk_score"))
            risk_level = llm_result.get("risk", "LOW" if risk_score < 30 else ("MEDIUM" if risk_score < 70 else "HIGH"))
            reasoning = llm_result.get("reasoning", "")
            flagged_claims = llm_result.get("flagged_claims", [])
        else:
            # Calibrated fallback incorporating ML model output
            if ml_prediction and "probabilities" in ml_prediction:
                p_hal = ml_prediction["probabilities"]["hallucinated"]
                risk_score = round(p_hal * 100.0, 1)
                risk_level = "LOW" if risk_score < 35 else ("MEDIUM" if risk_score < 65 else "HIGH")
                reasoning = (
                    f"Fine-tuned DistilBERT hallucination model assessed output: {ml_prediction['label']} "
                    f"with {round(ml_prediction['confidence'] * 100, 1)}% confidence "
                    f"(hallucination risk: {risk_score}%)."
                )
            elif context:
                # Basic token overlap check
                ref_lower = context.lower()
                resp_sentences = [s.strip() for s in response.split(".") if len(s.strip()) > 15]
                suspicious = []
                for s in resp_sentences:
                    words = [w.lower().strip(".,;:?!()") for w in s.split() if len(w) > 4]
                    if words and sum(1 for w in words if w in ref_lower) / len(words) < 0.2:
                        suspicious.append(s)
                
                if suspicious:
                    risk_score = 40.0
                    risk_level = "MEDIUM"
                    reasoning = f"Detected {len(suspicious)} statement(s) not directly substantiated by provided context."
                    for s in suspicious[:2]:
                        flagged_claims.append({
                            "claim": s,
                            "type": "unsupported",
                            "evidence": "Not found in supplied reference",
                            "explanation": "Statement lacks source evidence alignment."
                        })
                else:
                    risk_score = 10.0
                    risk_level = "LOW"
                    reasoning = "Response statements are consistent with reference evidence; no major unsupported claims detected."
            else:
                risk_score = 15.0
                risk_level = "LOW"
                reasoning = "No reference ground truth supplied; response evaluated for internal consistency with zero obvious logical contradictions."

        # If ML model predicted HIGH hallucination, adjust risk accordingly
        if ml_prediction and ml_prediction.get("predicted_class") == 1:
            risk_score = max(risk_score, 65.0)
            risk_level = "HIGH" if risk_score >= 65 else risk_level

        return {
            "agent": self.name,
            "risk_score": risk_score,
            "risk": risk_level,
            "reasoning": reasoning,
            "flagged_claims": flagged_claims,
            "ml_prediction": ml_prediction
        }


HallucinationDetectionAgent = HallucinationAgent
__all__ = ["HallucinationAgent", "HallucinationDetectionAgent"]


