"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatementAnalysis } from "@/Models/BackendModels";
import {
  getLoanPrediction,
  saveTrainingDatapoint,
} from "@/app/actions/backend";
import { helix } from "ldrs";

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
    helix.register();
    return (
      <div className="flex items-center justify-center min-h-screen">
        <l-helix size="150" speed="2.5" color="#f3b334" />
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

  // Process reasons for and against for better visual display
  const processReasons = (reasonText: string) => {
    return reasonText
      .split("**")
      .map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{part}</strong> : part
      );
  };

  const reasons = analysisData?.for_against.split("Reasons against:");
  const reasonsForArray = reasons?.[0]
    .replace("Reasons for:", "")
    .trim()
    .split("-")
    .filter((reason) => reason.trim() !== "")
    .map((reason) => processReasons(reason.trim()));
  const reasonsAgainstArray = reasons?.[1]
    ?.trim()
    .split("-")
    .filter((reason) => reason.trim() !== "")
    .map((reason) => processReasons(reason.trim()));

  return (
    <div className="flex items-center justify-center min-h-screen">
      {" "}
      {/* Updated background color */}
      <div className="w-3/4 max-h-[80vh] overflow-y-auto p-10 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Statement Analysis and Loan Decision Overview
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
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {" "}
          Decision Factors:
        </h2>
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-2">
            {" "}
            Reasons Supporting Loan Approval:
          </h3>
          <ul className="list-disc pl-6 text-gray-800">
            {reasonsForArray?.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-2">
            {" "}
            Reasons Against Loan Approval:
          </h3>
          <ul className="list-disc pl-6 text-gray-800">
            {reasonsAgainstArray?.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
        <hr className="my-6" />
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {" "}
            Statement Analysis:
          </h2>
          {/* Include other details from the statement analysis here */}
          <p className="text-gray-700">Bank Name: {analysisData?.bank_name}</p>
          <p className="text-gray-700">
            Country Code: {analysisData?.country_code}
          </p>
          <p className="text-gray-700">
            Statement Year: {analysisData?.statement_year}
          </p>
          <p className="text-gray-700">
            Monthly Deposit Mean: {analysisData?.monthly_deposit_mean}
          </p>
          <p className="text-gray-700">
            Monthly Withdrawal Mean: {analysisData?.monthly_withdrawal_mean}
          </p>
          <p className="text-gray-700">
            Monthly Rent Mean: {analysisData?.monthly_rent_mean}
          </p>
          <p className="text-gray-700">
            Monthly Utilities Mean: {analysisData?.monthly_utilities_mean}
          </p>
          <p className="text-gray-700">
            Monthly Loan Payment Mean: {analysisData?.monthly_loan_payment_mean}
          </p>
          <p className="text-gray-700">
            Monthly Balance Mean: {analysisData?.monthly_balance_mean}
          </p>
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
