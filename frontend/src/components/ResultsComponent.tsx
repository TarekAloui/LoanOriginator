"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatementAnalysis } from "@/Models/BackendModels";
import {
  getLoanPrediction,
  saveTrainingDatapoint,
} from "@/app/actions/backend";

const ResultsPage: React.FC<{ statementId: string }> = ({ statementId }) => {
  const [analysisData, setAnalysisData] = useState<StatementAnalysis | null>(
    null
  );
  const [statement_ref, setStatementRef] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAgreeOnClick = async () => {
    // Check if statement_ref is available
    if (!statement_ref) {
      alert("Statement reference is missing!");
      return;
    }

    try {
      setLoading(true); // Set loading to true while the API call is being made
      const response = await saveTrainingDatapoint(statement_ref);

      if (response.status !== 200) {
        // If the API call was not successful, show an error message
        alert(`Failed to save training data point: ${response.error}`);
        setLoading(false);
        return;
      }

      // If the API call was successful, handle the success scenario
      console.log("Training data point saved successfully:", response.data);
      alert("Training data point saved successfully!");
      setLoading(false);

      // Optionally, you can redirect the user to another page or take any other action
    } catch (error) {
      // Handle any errors that occur during the API call
      console.error("Error saving training data point:", error);
      alert("An error occurred while saving the training data point.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching loan prediction...");
        const response = await getLoanPrediction(statementId);

        console.log("Response:", response);

        if (response.status !== 200) {
          setError("Server Failure. Please try again.");
          setLoading(false);
        } else {
          setAnalysisData(response.data.statement_analysis);
          setStatementRef(response.data.statement_ref);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching loan prediction:", err);

        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };
    fetchData();
  }, [statementId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-[#f3b334]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="mb-4 text-xl text-red-600">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="rounded bg-[#f3b334] py-2 px-4 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Separate reasons for and reasons against
  const reasons = analysisData?.for_against.split("Reasons against:");
  const reasonsFor = reasons?.[0].replace("Reasons for:", "").trim();
  const reasonsAgainst = reasons?.[1]?.trim();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#07074D]">
      {" "}
      {/* Updated background color */}
      <div className="w-3/4 p-10 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          {" "}
          {/* Updated text color */}
          Results for statement {statementId}
        </h1>
        <div className="mb-6">
          {analysisData?.loan_decision === 1 ? (
            <p className="text-xl font-bold text-green-600">
              Congrats! Your loan is approved.
            </p>
          ) : (
            <p className="text-xl font-bold text-red-600">
              Unfortunately, we are not able to approve your loan at this time.
            </p>
          )}
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {" "}
            {/* Updated text color */}
            Reasons For:
          </h2>
          <p className="text-gray-700">
            {" "}
            {/* Updated text color */}
            {reasonsFor}
          </p>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {" "}
            {/* Updated text color */}
            Reasons Against:
          </h2>
          <p className="text-gray-700">
            {" "}
            {/* Updated text color */}
            {reasonsAgainst}
          </p>
        </div>
        <hr className="my-6" />
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {" "}
            {/* Updated text color */}
            Statement Analysis:
          </h2>
          {/* Include other details from the statement analysis here */}
          <p className="text-gray-700">
            Bank Name: {analysisData?.bank_name}
          </p>{" "}
          {/* Updated text color */}
          <p className="text-gray-700">
            Monthly Deposit Mean: {analysisData?.monthly_deposit_mean}
          </p>{" "}
          {/* Updated text color */}
          {/* ... Add other relevant details */}
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleAgreeOnClick}
            className="rounded bg-[#f3b334] py-2 px-4 text-white"
          >
            Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
