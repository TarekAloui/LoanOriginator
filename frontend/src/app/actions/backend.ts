"use server";

const getLoanPrediction = async (statement_id: string) => {
  try {
    const response = await fetch(`/api/loan_prediction/${statement_id}`, {
      method: "GET",
    });

    if (!response.ok) {
      return {
        error: `Failed to get loan prediction: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    return { error: "Get Loan Prediction Server Error", status: 500 };
  }
};
