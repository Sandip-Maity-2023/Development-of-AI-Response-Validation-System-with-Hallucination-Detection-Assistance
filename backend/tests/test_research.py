import pytest
from src.research.tools import web_search, scrape_url
from src.research.pipeline import run_research_pipeline


def test_web_search():
    res = web_search.invoke("Quantum Computing advancements")
    assert res is not None
    assert len(res) > 20
    assert "Title:" in res or "http" in res


def test_scrape_url():
    # Test scraping on a reliable wiki page
    res = scrape_url.invoke("https://en.wikipedia.org/wiki/Artificial_intelligence")
    assert res is not None
    assert len(res) > 50


def test_research_pipeline():
    result = run_research_pipeline("Artificial Intelligence in Medical Diagnostics")
    assert "report" in result
    assert "feedback" in result
    assert "search_results" in result
    assert "scraped_content" in result
    assert "Key Findings" in result["report"]
    assert "Score:" in result["feedback"]

