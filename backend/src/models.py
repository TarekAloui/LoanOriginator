from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date


class MonthlySummary(BaseModel):
    total_deposits: Optional[float] = Field(
        None, description="Total amount of deposits for the month"
    )
    total_withdrawals: Optional[float] = Field(
        None, description="Total amount of withdrawals for the month"
    )
    average_balance: Optional[float] = Field(
        None, description="Average balance for the month"
    )
    net_savings: Optional[float] = Field(
        None,
        description="Net savings for the month, calculated as total deposits minus total withdrawals",
    )
    rent_mortgage_payments: Optional[float] = Field(
        None, description="Total payments for rent or mortgage for the month"
    )
    utility_payments: Optional[float] = Field(
        None, description="Total utility payments for the month"
    )
    loan_payments: Optional[float] = Field(
        None, description="Total loan payments for the month"
    )
    rent_mortgage_to_income_ratio: Optional[float] = Field(
        None, description="Ratio of rent/mortgage payments to total deposits"
    )
    utilities_to_income_ratio: Optional[float] = Field(
        None, description="Ratio of utility payments to total deposits"
    )
    loan_to_income_ratio: Optional[float] = Field(
        None, description="Ratio of loan payments to total deposits"
    )
    YearMonth: Optional[date] = Field(None, description="Year and month of the summary")


class Transaction(BaseModel):
    Date: Optional[date] = Field(None, description="Date of the transaction")
    Transaction_Details: Optional[str] = Field(
        None, description="Details or description of the transaction"
    )
    Amount: Optional[float] = Field(None, description="Amount of the transaction")
    Category: Optional[str] = Field(None, description="Category of the transaction")


class StatementAnalysis(BaseModel):
    """
    Represents the detailed analysis of a bank statement, including various financial metrics,
    summaries of monthly activities, and categorized transactions.
    """

    country_code: Optional[str] = Field(
        None, description="The country code following ISO 3166 standard"
    )
    bank_name: Optional[str] = Field(
        None, description="The name of the bank from which the statement is issued"
    )
    statement_year: Optional[int] = Field(
        None, description="The year the bank statement corresponds to"
    )
    statement_pdf_blob: Optional[str] = Field(
        None,
        description="Reference to the Google Cloud Storage blob containing the statement PDF",
    )
    monthly_deposit_mean: Optional[float] = Field(
        None, description="The mean of monthly deposits over the statement period"
    )
    monthly_withdrawal_mean: Optional[float] = Field(
        None, description="The mean of monthly withdrawals over the statement period"
    )
    monthly_rent_mean: Optional[float] = Field(
        None, description="The mean of monthly rent or mortgage payments"
    )
    monthly_utilities_mean: Optional[float] = Field(
        None, description="The mean of monthly utility payments"
    )
    monthly_loan_payment_mean: Optional[float] = Field(
        None, description="The mean of monthly loan payments"
    )
    monthly_balance_mean: Optional[float] = Field(
        None, description="The mean of the account balance at the end of each month"
    )
    monthly_summary: Optional[List[MonthlySummary]] = Field(
        None, description="List of summarized financial metrics for each month"
    )
    transactions: Optional[List[Transaction]] = Field(
        None, description="List of individual transactions extracted from the statement"
    )
    for_against: Optional[str] = Field(
        None,
        description="Textual analysis providing reasons for and against approving a loan based on the statement analysis",
    )
    loan_decision: Optional[bool] = Field(
        None,
        description="Decision on whether to grant a loan based on the statement analysis. It's optional and can be True (grant loan), False (deny loan), or not provided.",
    )
