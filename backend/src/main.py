from fastapi import FastAPI, HTTPException
from .database import (
    save_statement_analysis,
    save_training_statement_analysis,
)
from .models import (
    MonthlySummary,
    Transaction,
    StatementAnalysis,
    LoanPredictionResponse,
)
from .services import (
    process_statement_pdf,
    extract_analysis_from_statement_df,
    predict_loan_decision,
)

app = FastAPI()


@app.post("/get_loan_prediction_endpoint/")
async def get_loan_prediction_endpoint(
    statement_pdf_blob: str,
) -> LoanPredictionResponse:
    try:
        statement_data = process_statement_pdf(statement_pdf_blob)
        statement_analysis = extract_analysis_from_statement_df(statement_data)
        prediction = predict_loan_decision(statement_analysis)
        statement_analysis["loan_decision"] = 1 if prediction else 0
        statement_analysis_ref = save_statement_analysis(statement_analysis)
        return {
            "statement_analysis": statement_analysis,
            "statement_analysis_ref": statement_analysis_ref,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/save_training_datapoint_endpoint/")
async def save_training_datapoint_endpoint(
    statement_analysis_ref: str,
) -> dict[str, str]:
    try:
        save_training_statement_analysis(statement_analysis_ref)
        return {"message": "Training data point saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
