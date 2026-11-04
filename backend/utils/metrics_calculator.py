def calculate_composite_score(rel: float, acc: float, hal: float, comp: float) -> dict:
    # Groundedness score is derived from inverse hallucination risk
    groundedness = hal 
    
    overall = (rel * 0.25) + (acc * 0.30) + (groundedness * 0.30) + (comp * 0.15)
    scaled_overall = round(overall * 10, 2)  # Scale from 0-10 to 0-100%
    
    if scaled_overall >= 80.0:
        verdict = "Pass"
    elif scaled_overall >= 60.0:
        verdict = "Needs Improvement"
    else:
        verdict = "Fail"

    return {"score": scaled_overall, "verdict": verdict}




