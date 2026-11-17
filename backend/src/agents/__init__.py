from src.agents.base import JudgeAgent
from src.agents.relevance import RelevanceAgent
from src.agents.accuracy import AccuracyAgent
from src.agents.hallucination import HallucinationAgent
from src.agents.completeness import CompletenessAgent
from src.agents.verdict import VerdictAgent

# Aliases matching orchestrator.py / details.txt conventions
RelevanceJudgeAgent = RelevanceAgent
AccuracyJudgeAgent = AccuracyAgent
HallucinationDetectionAgent = HallucinationAgent
CompletenessJudgeAgent = CompletenessAgent

__all__ = [
    "JudgeAgent",
    "RelevanceAgent",
    "AccuracyAgent",
    "HallucinationAgent",
    "CompletenessAgent",
    "VerdictAgent",
    "RelevanceJudgeAgent",
    "AccuracyJudgeAgent",
    "HallucinationDetectionAgent",
    "CompletenessJudgeAgent",
]

