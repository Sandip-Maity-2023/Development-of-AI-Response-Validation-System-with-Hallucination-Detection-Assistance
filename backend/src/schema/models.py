from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class ClaimVerification(BaseModel):
    claim: str = Field(description="Extracted claim from AI response")
    supported: bool = Field(description="True if supported by reference, False if hallucinated/unsupported")
    evidence: str = Field(description="Direct source snippet supporting or contradicting claim")

class AgentScoreOutput(BaseModel):
    score: float = Field(ge=0.0, le=10.0, description="Dimension score from 0.0 to 10.0")
    reasoning: str = Field(description="Detailed explanation of score assignment")
    evidence: Optional[List[str]] = Field(default=[], description="Supporting evidence or context quotes")
    hallucinations: Optional[List[ClaimVerification]] = Field(default=[], description="List of verified claims")
    omissions: Optional[List[str]] = Field(default=[], description="Aspects of question omitted in response")

class FinalVerdictOutput(BaseModel):
    overall_score: float = Field(ge=0.0, le=100.0)
    verdict: Literal["Pass", "Needs Improvement", "Fail"]
    relevance_score: float
    accuracy_score: float
    hallucination_score: float
    completeness_score: float
    summary_reasoning: str
    key_fail_points: List[str]
    