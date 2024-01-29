"use server";

const getLoanPrediction = async (statement_id: string) => {
  try {
    const endpoint = `${process.env.BACKEND_URL}/get_loan_prediction_endpoint/?statement_pdf_blob=statements/${statement_id}`;

    const response = await fetch(endpoint, {
      method: "POST", // Consider if POST is appropriate for your use case or if it should be GET.
      next: { tags: ["get_loan_prediction_endpoint"], revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text(); // Get the error detail from the response
      return {
        error: `Failed to get loan prediction: ${errorText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { data, status: 200 };
  } catch (error) {
    return { error: "Get Loan Prediction Server Error", status: 500 };
  }
};

const saveTrainingDatapoint = async (statement_analysis_ref: string) => {
  try {
    const endpoint = `${process.env.BACKEND_URL}/save_training_datapoint_endpoint/?statement_analysis_ref=${statement_analysis_ref}`;
    const response = await fetch(endpoint, {
      method: "POST",
      next: { tags: [statement_analysis_ref] },
    });

    if (!response.ok) {
      const errorText = await response.text(); // Get the error detail from the response
      return {
        error: `Failed to save training datapoint: ${errorText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { data, status: 200 };
  } catch (error) {
    return { error: "Save Training Datapoint Server Error", status: 500 };
  }
};

export { getLoanPrediction, saveTrainingDatapoint };
