interface MonthlySummary {
  total_deposits: number;
  total_withdrawals: number;
  average_balance: number;
  net_savings: number;
  rent_mortgage_payments: number;
  utility_payments: number;
  loan_payments: number;
  rent_mortgage_to_income_ratio: number;
  utilities_to_income_ratio: number;
  loan_to_income_ratio: number;
  YearMonth: string | null;
}

interface Transaction {
  Date: string;
  Description: string;
  Amount: number;
  Category: string;
}

interface StatementAnalysis {
  country_code: string;
  bank_name: string;
  statement_year: number;
  statement_pdf_blob: string;
  monthly_deposit_mean: number;
  monthly_withdrawal_mean: number;
  monthly_rent_mean: number;
  monthly_utilities_mean: number;
  monthly_loan_payment_mean: number;
  monthly_balance_mean: number;
  monthly_summary: MonthlySummary[];
  transactions: Transaction[];
  for_against: string;
  loan_decision: number;
}

interface FetchResponse {
  statement_analysis: StatementAnalysis;
  statement_analysis_ref: string;
}

export type { MonthlySummary, Transaction, StatementAnalysis, FetchResponse };
