from langchain_openai import ChatOpenAI
from src.schema.models import AgentScoreOutput
from config.prompts import HALLUCINATION_PROMPT

class HallucinationDetectionAgent:
    def __init__(self, model_name: str = "gpt-4o"):
        self.llm = ChatOpenAI(model=model_name, temperature=0.0).with_structured_output(AgentScoreOutput)

    async def evaluate(self, question: str, response: str, reference_contexts: List[str]) -> AgentScoreOutput:
        context_str = "\n\n".join(reference_contexts) if reference_contexts else "No reference context provided."
        prompt = HALLUCINATION_PROMPT.format(
            question=question,
            response=response,
            context=context_str
        )
        return await self.llm.ainvoke(prompt)

    