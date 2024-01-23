import io
from io import StringIO
import pandas as pd
import numpy as np
import json
from datetime import datetime
from google.cloud import storage
from PyPDF2 import PdfReader
from sklearn.neighbors import KNeighborsClassifier
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain, create_extraction_chain
from langchain.prompts import ChatPromptTemplate

from .database import get_training_statements


def extract_text_from_pdf_bucket(pdf_blob):
    # Loading pdf object from gcs storage
    storage_client = storage.Client()

    bucket_name = "loan_originator_bucket"
    source_blob_name = pdf_blob

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)

    pdf_bytes = blob.download_as_bytes()
    pdf_file_obj = io.BytesIO(pdf_bytes)

    # Extracting text
    pdf_reader = PdfReader(pdf_file_obj)

    extracted_text = ""

    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        extracted_text += page.extract_text() + "\n"

    pdf_file_obj.close()

    return extracted_text


def preprocess_df(df):
    def parse_date(date_str):
        # First, try parsing with the 'YYYY-MM' format
        parsed_date = pd.to_datetime(date_str, format="%Y-%m", errors="coerce")

        # If parsing failed (resulted in NaT), try to infer the datetime format
        if pd.isna(parsed_date):
            parsed_date = pd.to_datetime(
                date_str, infer_datetime_format=True, errors="coerce"
            )

        return parsed_date

    df["Date"] = df["Date"].apply(parse_date)
    df["Amount"] = pd.to_numeric(df["Amount"])
    df["Category"] = df["Category"].str.strip()
    df["Amount"] = np.where(
        df["Deposit"] == "YES", df["Amount"].abs(), -df["Amount"].abs()
    )

    df["Category"] = df["Category"].fillna("Other", inplace=True)

    df.dropna(subset=["Date", "Amount", "Deposit"], inplace=True)

    # TODO: remove months without complete data
    return df


def get_transactions_text(statement_text, log=False):
    # Running transaction extraction LLM Chain
    llm_model = ChatOpenAI(
        model_name="gpt-4-1106-preview", temperature=0, max_tokens=1054
    )

    transaction_extraction_system_template = """You are an experienced loan originator and financial analyst. 
  You will help with extracting information from bank statements."""
    transaction_extraction_human_template = """Here is a bank statement, for each bank transaction, give the following information
  in comma-separated format (Date, Description, Value, Deposit, Category). For Date, convert the date into the 
  format "YYYY-MM". For description, do not include any commas that exist in the description. For Value, put a positive number and make sure it has a number format (only one dot).
  For Deposit, put YES if the transaction is a deposit and NO if it is a withdrawal.
  For category, try to predict the category from the transaction description from the following list [
      "Deposits - Salary Paycheck",
      "Deposits - Transfers In",
      "Withdrawals - Cash Withdrawals ATM",
      "Withdrawals - Transfers Out",
      "Payments - Mortgage",
      "Payments - Rent",
      "Payments - Utility Bills",
      "Payments - Loan Payments",
      "Payments - Credit Card Payments",
      "Payments - Insurance Premiums",
      "Purchases - Groceries Food",
      "Purchases - Dining Restaurants",
      "Purchases - Retail Clothing",
      "Purchases - Gas Fuel",
      "Investments - Stock Bond Purchases",
      "Investments - Retirement Account Contributions",
      "Fees Charges - Account Maintenance Fees",
      "Fees Charges - Overdraft Fees",
      "Other"
  ]. Only respond with the list of comma-separated values for all transactions in the bank statement, and do not include any other text in the response. Here is the statement: {bank_statement}"""

    transaction_extraction_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", transaction_extraction_system_template),
            ("human", transaction_extraction_human_template),
        ]
    )

    transactions_chain = transaction_extraction_prompt | llm_model

    response = transactions_chain.invoke({"bank_statement": statement_text})

    if log:
        print(f"Transactions Text", response.content)

    return response.content


def process_statement_pdf(statement_pdf_blob, log=False):
    # Uploads the pdf to firebase storage and saves the url
    # Creates a dataframe of transactions extracted using the LLM model
    # Saves other metadata such as "country" and "bank name" of the statement

    # pulling pdf into langchain
    statement_text = extract_text_from_pdf_bucket(statement_pdf_blob)

    transactions_text = get_transactions_text(statement_text, log)

    # Creating dataframe

    df = pd.read_csv(
        StringIO(transactions_text),
        header=None,
        names=["Date", "Transaction Details", "Amount", "Deposit", "Category"],
        on_bad_lines="skip",
    )

    # Pre-process and clean dataframe
    df = preprocess_df(df)

    # Extracting metadata
    metadata_schema = {
        "properties": {
            "country_code_iso_3166_standard": {"type": "string"},
            "bank_name": {"type": "string"},
            "statement_year": {"type": "integer"},
        },
        "required": ["country_code", "bank_name", "statement_year"],
    }

    # Run metadata extraction llm chain
    llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo")
    chain = create_extraction_chain(metadata_schema, llm)
    meta_data = chain.invoke(transactions_text)[0]

    statement_data = {
        "country_code": meta_data["country_code_iso_3166_standard"],
        "bank_name": meta_data["bank_name"],
        "statement_year": meta_data["statement_year"],
        "statement_pdf_blob": statement_pdf_blob,
        "transactions_df": df,
    }

    if log:
        print(
            f"Statement Data for {statement_data['statement_pdf_blob']}", statement_data
        )

    return statement_data


def replace_nat_with_none(obj):
    if isinstance(obj, dict):
        return {k: replace_nat_with_none(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nat_with_none(v) for v in obj]
    elif isinstance(obj, pd.Timestamp):
        return obj.strftime("%Y-%m")
    elif pd.isna(obj):
        return None
    else:
        return obj


def generate_for_against_loan_reasons(statement_analysis, log=False):
    # Asks llm to provide reasons for and against giving a loan
    # Running transaction extraction LLM Chain
    llm_model = ChatOpenAI(
        model_name="gpt-4-1106-preview", temperature=0, max_tokens=1054
    )

    transaction_extraction_system_template = """You are an experienced loan originator and financial analyst. You will help with creating decisions of whether or not to give a loan based on a bank statement data"""
    transaction_extraction_human_template = """Here is a bank statement analysis for a client. Use this data to provide a bullet-point list of reasons to provide a loan then a list of reason for not providing a loan. 
  Only include relevant, strong and useful reasons and back each reason with numerical data from the analysis. Include headers for each list ("Reasons for:" and "Reasons against") but no other text and do not make up facts. Here is the statement analysis: {statement_analysis}"""

    transaction_extraction_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", transaction_extraction_system_template),
            ("human", transaction_extraction_human_template),
        ]
    )

    transactions_chain = transaction_extraction_prompt | llm_model

    response = transactions_chain.invoke(
        {"statement_analysis": json.dumps(statement_analysis)}
    )

    if log:
        print(f"Transactions Text", response.content)

    return response.content


def extract_analysis_from_statement_df(statement_data, log=False):
    df = statement_data["transactions_df"]
    # Calculating monthly summaries
    monthly_summary = df.groupby([df["Date"].dt.year, df["Date"].dt.month]).agg(
        total_deposits=pd.NamedAgg(column="Amount", aggfunc=lambda x: x[x > 0].sum()),
        total_withdrawals=pd.NamedAgg(
            column="Amount", aggfunc=lambda x: x[x < 0].sum()
        ),
        average_balance=pd.NamedAgg(column="Amount", aggfunc="mean"),
    )

    monthly_summary["net_savings"] = (
        monthly_summary["total_deposits"] + monthly_summary["total_withdrawals"]
    )

    # calculating monthly payments by category
    specific_payments = (
        df.groupby([df["Date"].dt.year, df["Date"].dt.month, "Category"])["Amount"]
        .sum()
        .unstack(fill_value=0)
    )

    monthly_utility_payments = specific_payments.get("Payments - Utility Bills", 0)
    monthly_loan_payments = specific_payments.get("Payments - Loan Payments", 0)
    monthly_mortgage_payments = specific_payments.get("Payments - Mortgage", 0)
    monthly_rent_payments = specific_payments.get("Payments - Rent", 0)
    monthly_rent_mortgage_payments = monthly_rent_payments + monthly_mortgage_payments

    # extending monthly_summary with other data
    monthly_summary["rent_mortgage_payments"] = monthly_rent_mortgage_payments
    monthly_summary["utility_payments"] = monthly_utility_payments
    monthly_summary["loan_payments"] = monthly_loan_payments

    monthly_summary["rent_mortgage_to_income_ratio"] = np.where(
        (monthly_summary["total_deposits"] > 0)
        & (monthly_summary["total_deposits"].notna()),
        monthly_summary["rent_mortgage_payments"].abs()
        / monthly_summary["total_deposits"],
        np.nan,
    )

    monthly_summary["utilities_to_income_ratio"] = np.where(
        (monthly_summary["total_deposits"] > 0)
        & (monthly_summary["total_deposits"].notna()),
        monthly_summary["utility_payments"].abs() / monthly_summary["total_deposits"],
        np.nan,
    )

    monthly_summary["loan_to_income_ratio"] = np.where(
        (monthly_summary["total_deposits"] > 0)
        & (monthly_summary["total_deposits"].notna()),
        monthly_summary["loan_payments"].abs() / monthly_summary["total_deposits"],
        np.nan,
    )

    # calculating means accross all months

    monthly_deposit_mean = monthly_summary["total_deposits"].mean()
    monthly_withdrawal_mean = monthly_summary["total_withdrawals"].mean()
    monthly_rent_mean = monthly_summary["rent_mortgage_payments"].mean()
    monthly_utilities_mean = monthly_summary["utility_payments"].mean()
    monthly_loan_payment_mean = monthly_summary["loan_payments"].mean()
    monthly_balance_mean = monthly_summary["average_balance"].mean()

    # formatting monthly_summary for json
    monthly_summary["YearMonth"] = monthly_summary.index.map(
        lambda x: datetime(int(x[0]), int(x[1]), 1)
    ).map(lambda x: x.strftime("%Y-%m"))

    monthly_summary = monthly_summary.set_index("YearMonth")

    monthly_summary_list = monthly_summary.to_dict(
        orient="records"
    )  # formatted for the json

    # TODO: find average salary data for the country/year, compare with current statement and add to data

    statement_analysis = {
        "country_code": statement_data["country_code"],
        "bank_name": statement_data["bank_name"],
        "statement_year": statement_data["statement_year"],
        "statement_pdf_blob": statement_data["statement_pdf_blob"],
        "monthly_deposit_mean": monthly_deposit_mean,
        "monthly_withdrawal_mean": monthly_withdrawal_mean,
        "monthly_rent_mean": monthly_rent_mean,
        "monthly_utilities_mean": monthly_utilities_mean,
        "monthly_loan_payment_mean": monthly_loan_payment_mean,
        "monthly_balance_mean": monthly_balance_mean,
        "monthly_summary": monthly_summary_list,
        "transactions": statement_data["transactions_df"].to_dict(orient="records"),
    }

    # cleaning statement analysis from NaT values for json serialization to work
    statement_analysis = replace_nat_with_none(statement_analysis)

    statement_analysis["for_against"] = generate_for_against_loan_reasons(
        statement_analysis
    )

    if log:
        print(
            f"Statement Analysis for {statement_analysis['statement_pdf_blob']}",
            statement_analysis,
        )

    return statement_analysis


# Part 2: Running Classification into Loan / No Loan


def extract_training_features_labels(training_statements):
    features = []
    target_labels = []

    for statement in training_statements:
        # Extract features (order should match for all statements)
        feature_vector = [
            statement["monthly_deposit_mean"],
            statement["monthly_withdrawal_mean"],
            statement["monthly_rent_mean"],
            statement["monthly_utilities_mean"],
            statement["monthly_loan_payment_mean"],
            statement["monthly_balance_mean"],
        ]

        # Append the feature vector to the features list
        features.append(feature_vector)

        # Append the loan decision to the target labels list
        target_labels.append(statement["loan_decision"])

    # Convert lists to numpy arrays
    X = np.array(features)
    y = np.array(target_labels)
    return X, y


def predict_loan_decision(statement_analysis, log=True):
    # Extract features
    feature_vector = [
        [
            statement_analysis["monthly_deposit_mean"],
            statement_analysis["monthly_withdrawal_mean"],
            statement_analysis["monthly_rent_mean"],
            statement_analysis["monthly_utilities_mean"],
            statement_analysis["monthly_loan_payment_mean"],
            statement_analysis["monthly_balance_mean"],
        ]
    ]

    training_statements = get_training_statements(log)

    knn = KNeighborsClassifier(n_neighbors=3)  # Adjust n_neighbors as needed

    # Extract features and labels from training data
    X, y = extract_training_features_labels(training_statements)

    # Fit the model
    knn.fit(X, y)

    # Predict on the test data
    y_pred = knn.predict(feature_vector)

    return y_pred[0]
