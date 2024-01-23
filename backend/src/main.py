from fastapi import FastAPI, HTTPException
from .database import (
    save_statement_analysis,
    save_training_statement_analysis,
)
from .models import MonthlySummary, Transaction, StatementAnalysis
from .services import (
    process_statement_pdf,
    extract_analysis_from_statement_df,
    predict_loan_decision,
)

app = FastAPI()


@app.post("/get_loan_prediction_endpoint/")
async def get_loan_prediction_endpoint(statement_pdf_blob: str) -> StatementAnalysis:
    try:
        print("Running get_loan_prediction")
        print("Processing statement")
        statement_data = process_statement_pdf(statement_pdf_blob, log=True)
        print("Extracting Analysis")
        statement_analysis = extract_analysis_from_statement_df(
            statement_data, log=True
        )
        print("Running prediction")
        prediction = predict_loan_decision(statement_analysis)
        statement_analysis["loan_decision"] = prediction
        return statement_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/save_training_datapoint_endpoint/")
async def save_training_datapoint_endpoint(
    statement_analysis_ref: str, statement_analysis: StatementAnalysis
) -> dict[str, str]:
    try:
        save_training_statement_analysis(
            statement_analysis_ref, statement_analysis.model_dump()
        )
        return {"message": "Training data point saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
