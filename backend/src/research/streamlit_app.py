import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import streamlit as st
from src.research.pipeline import run_research_pipeline
from src.research.agents import SUPPORTED_MODELS, DEFAULT_MODEL

# Configure Streamlit page
st.set_page_config(
    page_title="ResearchMind | Multi-Agent AI",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Dark custom styling
st.markdown("""
<style>
    .stApp {
        background-color: #0b0f19;
        color: #f1f5f9;
    }
    .metric-card {
        background: #151d30;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
    }
    .stButton>button {
        background-color: #4f46e5;
        color: white;
        border-radius: 8px;
        font-weight: 600;
        border: none;
        padding: 0.6rem 1.4rem;
    }
    .stButton>button:hover {
        background-color: #4338ca;
    }
    .report-box {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 12px;
        padding: 24px;
        color: #e2e8f0;
    }
</style>
""", unsafe_allow_html=True)

st.title("🧠 MultiAgent ResearchMind")
st.caption("Autonomous multi-agent research pipeline powered by LangChain & Google Gemini")

with st.sidebar:
    st.header("⚙️ Configuration")
    model_choice = st.selectbox(
        "Gemini Model",
        options=sorted(list(SUPPORTED_MODELS)),
        index=sorted(list(SUPPORTED_MODELS)).index(DEFAULT_MODEL) if DEFAULT_MODEL in SUPPORTED_MODELS else 0
    )
    api_key_input = st.text_input("Gemini API Key (optional override)", type="password")
    if api_key_input:
        os.environ["GEMINI_API_KEY"] = api_key_input
    tavily_key = st.text_input("Tavily API Key (optional override)", type="password")
    if tavily_key:
        os.environ["TAVILY_API_KEY"] = tavily_key

    st.markdown("---")
    st.markdown("### 🔄 Pipeline Stages")
    st.markdown("1. **Search Agent** (Tavily/Web)")
    st.markdown("2. **Reader Agent** (BS4 Scraper)")
    st.markdown("3. **Writer Chain** (Structured Draft)")
    st.markdown("4. **Critic Chain** (Audit & Scoring)")

topic = st.text_input("Enter Research Topic:", placeholder="e.g. Next-Generation Battery Technologies for Electric Aircraft")

if st.button("🚀 Start Deep Research", disabled=not topic.strip()):
    progress_bar = st.progress(0, text="Initializing research agents...")
    
    with st.spinner("Step 1/4: Search Agent querying sources..."):
        progress_bar.progress(25, text="Searching the web for reliable sources...")
    
    results = run_research_pipeline(topic=topic.strip(), model_name=model_choice)
    progress_bar.progress(100, text="Research complete!")

    # Display Report
    st.markdown("## 📄 Research Report")
    st.markdown(results["report"])

    # Download Button
    st.download_button(
        label="📥 Download Research Report (.md)",
        data=results["report"],
        file_name=f"research_report_{topic.replace(' ', '_')[:30]}.md",
        mime="text/markdown"
    )

    # Critic Review
    st.markdown("---")
    st.markdown("## ⚖️ Critic Chain Evaluation")
    st.info(results["feedback"])

    # Expandable raw data panels
    with st.expander("🔍 Raw Search Results (Search Agent)"):
        st.code(results["search_results"], language="markdown")

    with st.expander("📖 Raw Scraped Web Content (Reader Agent)"):
        st.code(results["scraped_content"], language="text")

