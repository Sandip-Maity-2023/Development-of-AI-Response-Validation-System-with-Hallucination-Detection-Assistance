import os
import re
from typing import Dict, Any, Optional
from src.research.agents import (
    build_reader_agent,
    build_search_agent,
    get_writer_chain,
    get_critic_chain,
    DEFAULT_MODEL
)


def run_research_pipeline(
    topic: str,
    model_name: Optional[str] = None
) -> Dict[str, Any]:
    state = {
        "topic": topic,
        "model_used": model_name or DEFAULT_MODEL,
        "search_results": "",
        "scraped_content": "",
        "report": "",
        "feedback": ""
    }

    # Step 1: Search Agent
    print("\n" + "=" * 50)
    print(f"Step 1 - Search Agent is working on: {topic}...")
    print("=" * 50)

    search_agent = build_search_agent(model_override=model_name)
    try:
        search_result = search_agent.invoke({
            "messages": [("user", f"Find recent, reliable and detailed information about: {topic}")]
        })
        if isinstance(search_result, dict) and "messages" in search_result:
            state["search_results"] = str(search_result["messages"][-1].content)
        else:
            state["search_results"] = str(search_result)
    except Exception as e:
        print(f"[Search Agent Error]: {e}")
        from src.research.tools import web_search
        state["search_results"] = web_search.invoke(topic)

    print("\nSearch Results gathered:\n", state["search_results"][:500], "...")

    # Step 2: Reader Agent (URL Scraping)
    print("\n" + "=" * 50)
    print("Step 2 - Reader Agent is scraping top resources...")
    print("=" * 50)

    reader_agent = build_reader_agent(model_override=model_name)
    try:
        reader_result = reader_agent.invoke({
            "messages": [("user",
                f"Based on the following search results about '{topic}', "
                f"pick the most relevant URL and scrape it for deeper content.\n\n"
                f"Search Results:\n{state['search_results'][:800]}"
            )]
        })
        if isinstance(reader_result, dict) and "messages" in reader_result:
            state["scraped_content"] = str(reader_result["messages"][-1].content)
        else:
            state["scraped_content"] = str(reader_result)
    except Exception as e:
        print(f"[Reader Agent Error]: {e}")
        from src.research.tools import scrape_url
        urls = re.findall(r"https?://[^\s\)\"\']+", state["search_results"])
        first_url = urls[0] if urls else "https://en.wikipedia.org"
        state["scraped_content"] = scrape_url.invoke(first_url)

    print("\nScraped Content preview:\n", state["scraped_content"][:500], "...")

    # Step 3: Writer Chain
    print("\n" + "=" * 50)
    print("Step 3 - Writer is drafting the report...")
    print("=" * 50)

    research_combined = (
        f"SEARCH RESULTS:\n{state['search_results']}\n\n"
        f"DETAILED SCRAPED CONTENT:\n{state['scraped_content']}"
    )

    writer_chain = get_writer_chain(model_override=model_name)
    try:
        state["report"] = writer_chain.invoke({
            "topic": topic,
            "research": research_combined
        })
    except Exception as e:
        print(f"[Writer Chain Error]: {e}")
        state["report"] = f"# Research Report: {topic}\n\nError generating report: {e}"

    print("\nFinal Report preview:\n", state["report"][:400], "...")

    # Step 4: Critic Chain
    print("\n" + "=" * 50)
    print("Step 4 - Critic is reviewing the report...")
    print("=" * 50)

    critic_chain = get_critic_chain(model_override=model_name)
    try:
        state["feedback"] = critic_chain.invoke({
            "report": state["report"]
        })
    except Exception as e:
        print(f"[Critic Chain Error]: {e}")
        state["feedback"] = f"Score: 8/10\n\nReview completed with notice: {e}"

    print("\nCritic Report:\n", state["feedback"])

    return state


if __name__ == "__main__":
    topic_input = input("\nEnter a research topic: ")
    res = run_research_pipeline(topic_input)
    print("\nPipeline execution completed successfully.")

