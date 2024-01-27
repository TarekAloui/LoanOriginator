/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useState } from "react";
import {
  MonthlySummary,
  StatementAnalysis,
  Transaction,
} from "@/Models/BackendModels";
import {
  getLoanPrediction,
  saveTrainingDatapoint,
} from "@/app/actions/backend";
import { helix } from "ldrs";
import {
  Card,
  Subtitle,
  Metric,
  Text,
  Divider,
  Callout,
  BarList,
  SearchSelect,
  SearchSelectItem,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  LineChart,
  Icon,
} from "@tremor/react";
import {
  CheckCircleIcon,
  ExclamationIcon,
  ArrowCircleLeftIcon,
} from "@heroicons/react/solid";
import { DocumentTextIcon } from "@heroicons/react/outline";
import { useRouter } from "next/navigation";
import { getPDFPublicURL } from "@/app/actions/gcloud";
import { GiPayMoney, GiReceiveMoney } from "react-icons/gi";
import { TbSolarElectricity } from "react-icons/tb";
import { MdOutlineBedroomParent } from "react-icons/md";

// Charts and Table components

interface MonthlyTrendsProps {
  monthlySummary: MonthlySummary[];
}

const MonthlyTrends: React.FC<MonthlyTrendsProps> = ({ monthlySummary }) => {
  if (!monthlySummary) {
    return null;
  }

  interface DepositWithdrawalsDataPoint {
    month: number;
    Deposits: number;
    Withdrawals: number;
  }

  interface ExpensesDataPoint {
    month: number;
    "Rent and Mortgage Payments": number;
    "Utility Payments": number;
    "Loan Payments": number;
  }

  interface AverageBalanceDataPoint {
    month: number;
    "Average Balance": number;
  }

  interface MonthlyTrendsData {
    depositsWithdrawalsData: DepositWithdrawalsDataPoint[];
    expensesData: ExpensesDataPoint[];
    averageBalanceData: AverageBalanceDataPoint[];
  }

  const processDataForLineCharts = (
    monthlySummary: MonthlySummary[]
  ): MonthlyTrendsData => {
    const depositsWithdrawalsData: DepositWithdrawalsDataPoint[] = [];
    const expensesData: ExpensesDataPoint[] = [];
    const averageBalanceData: AverageBalanceDataPoint[] = [];

    monthlySummary.forEach((summary, index) => {
      depositsWithdrawalsData.push({
        month: index + 1,
        Deposits: summary.total_deposits,
        Withdrawals: -summary.total_withdrawals,
      });
      expensesData.push({
        month: index + 1,
        "Rent and Mortgage Payments": -summary.rent_mortgage_payments,
        "Utility Payments": -summary.utility_payments,
        "Loan Payments": -summary.loan_payments,
      });
      averageBalanceData.push({
        month: index + 1,
        "Average Balance": summary.average_balance,
      });
    });

    return { depositsWithdrawalsData, expensesData, averageBalanceData };
  };

  const { depositsWithdrawalsData, expensesData, averageBalanceData } =
    processDataForLineCharts(monthlySummary);

  return (
    <div className="mb-6 ml-6 flex w-full h-full">
      <Card className="w-full h-full">
        <Subtitle className="mb-6">Monthly Trends</Subtitle>
        <TabGroup>
          <TabList>
            <Tab>Deposits vs Withdrawals Trends</Tab>
            <Tab>Expenses Trends</Tab>
            <Tab>Average Balance Trends</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <LineChart
                data={depositsWithdrawalsData} // Combine data
                index="month"
                categories={["Deposits", "Withdrawals"]}
                colors={["green", "red"]}
              />
            </TabPanel>
            <TabPanel>
              <LineChart
                data={expensesData}
                index="month"
                categories={[
                  "Rent and Mortgage Payments",
                  "Utility Payments",
                  "Loan Payments",
                ]}
                colors={["blue", "orange", "red"]}
              />
            </TabPanel>
            <TabPanel>
              <LineChart
                data={averageBalanceData}
                index="month"
                categories={["Average Balance"]}
                colors={["purple"]}
              />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  );
};

interface MonthlyExpensesBarListProps {
  monthlySummary: MonthlySummary[] | null;
}

const MonthlyExpensesBarList: React.FC<MonthlyExpensesBarListProps> = ({
  monthlySummary,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(0);
  if (!monthlySummary) {
    return <p>No monthly summary data</p>;
  }

  // Prepare data for the BarList
  const barListData = [
    {
      name: "Total Deposits",
      icon: () => <GiPayMoney className="h-5 w-5 text-white mr-2" />,
      value: monthlySummary[selectedMonth].total_deposits,
    },
    {
      name: "Total Withdrawals",
      icon: () => <GiReceiveMoney className="h-5 w-5 text-white mr-2" />,
      value: -monthlySummary[selectedMonth].total_withdrawals, // Assuming withdrawals are negative
    },
    {
      name: "Rent/ Mortgage Payment",
      icon: () => (
        <MdOutlineBedroomParent className="h-5 w-5 text-white mr-2" />
      ),
      value: -monthlySummary[selectedMonth].rent_mortgage_payments,
    },
    {
      name: "Utility Payments",
      icon: () => <TbSolarElectricity className="h-5 w-5 text-white mr-2" />,
      value: -monthlySummary[selectedMonth].utility_payments,
    },
  ];

  const handleMonthChange = (value: string) => {
    setSelectedMonth(Number(value));
  };

  return (
    <div className="mb-6 ml-6 flex w-full">
      <Card className="w-full h-max">
        <div className="flex flex-row mb-6 w-full justify-between">
          <Subtitle className="mb-6">Monthly Overview</Subtitle>
          <SearchSelect
            value={selectedMonth.toString()}
            onValueChange={handleMonthChange}
            className="w-1/3"
          >
            {monthlySummary.map((summary, index) => (
              <SearchSelectItem key={index} value={index.toString()}>
                {`Month ${index + 1}`}
              </SearchSelectItem>
            ))}
          </SearchSelect>
        </div>
        <BarList data={barListData} className="mt-2" color={"#f3b334"} />
      </Card>
    </div>
  );
};

interface TransactionDetailsTableProps {
  transactionList: Transaction[];
}

const TransactionDetailsTable: React.FC<TransactionDetailsTableProps> = ({
  transactionList,
}) => {
  return <div>Transaction Details Table Placeholder</div>;
};

// Main Results Component

const ResultsPage: React.FC<{ statementId: string }> = ({ statementId }) => {
  const [analysisData, setAnalysisData] = useState<StatementAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  helix.register();

  const handleBack = () => {
    router.back();
  };

  // Function to handle view statement button click
  const handleViewStatement = async () => {
    if (analysisData && analysisData.statement_pdf_blob) {
      const response = await getPDFPublicURL(analysisData.statement_pdf_blob);

      if (response.status !== 200) {
        // If the API call was not successful, show an error message
        alert(`Failed to load statement: ${response.error}`);
        return;
      }

      window.open(response.url, "_blank");
    }
  };

  const handleAgreeOnClick = async () => {
    try {
      const response = await saveTrainingDatapoint(statementId);

      if (response.status !== 200) {
        // If the API call was not successful, show an error message
        alert(`Failed to save training data point: ${response.error}`);
        return;
      }

      alert("Training data point saved successfully!");
      router.back();

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
        const response = await getLoanPrediction(statementId);
        if (response.status !== 200) {
          setError("Server Failure. Please try again.");
          setLoading(false);
        } else {
          setAnalysisData(response.data.statement_analysis);
          setLoading(false);
        }
      } catch (err) {
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };
    fetchData();
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen ">
        <div className="text-2xl font-semibold text-[#f3b334] pb-14">
          Processing your statement... This may take a while
        </div>
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
      <div className="w-3/4 max-h-[80vh] overflow-y-auto p-10 bg-gray-100 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Statement Analysis and Loan Decision Overview
          </h1>
          <div className="flex flex-row">
            <button
              onClick={handleViewStatement}
              className="rounded text-indigo-700 hover:text-indigo-850 py-2 px-4 mr-2 flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 text-indigo-700 hover:text-indigo-850 mr-2" />{" "}
              View Statement
            </button>
            <button
              onClick={handleBack}
              className="rounded py-2 px-4 text-gray-800 flex items-center"
            >
              <ArrowCircleLeftIcon className="h-10 w-10 text-gray-800 mr-2" />
            </button>
          </div>
        </div>
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
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Decision Factors:
        </h2>
        <Card>
          <Callout
            className="mb-6"
            title="Reasons Supporting Loan Approval"
            icon={CheckCircleIcon}
            color="teal"
          >
            <ul className="list-disc pl-6 text-gray-800">
              {reasonsForArray?.map((reason, index) => (
                <li key={index} className="text-gray-200">
                  {reason}
                </li>
              ))}
            </ul>
          </Callout>

          <Divider></Divider>

          <Callout
            className="mb-6"
            title="Reasons Against Loan Approval"
            icon={ExclamationIcon}
            color="rose"
          >
            <ul className="list-disc pl-6 text-gray-800">
              {reasonsAgainstArray?.map((reason, index) => (
                <li key={index} className="text-gray-200">
                  {reason}
                </li>
              ))}
            </ul>
          </Callout>
        </Card>
        <hr className="my-6" />
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Statement Analysis:
        </h2>
        <div className="mb-6 flex flex-row w-full h-max">
          <div className="flex flex-col mb-6 justify-center h-auto">
            <Card className="max-w-lg mx-auto left h-max flex-grow">
              <Subtitle className="pb-5">Description</Subtitle>
              <p className="text-gray-400">
                Bank Name: {analysisData?.bank_name}
              </p>
              <p className="text-gray-400">
                Country Code: {analysisData?.country_code}
              </p>
              <p className="text-gray-400">
                Statement Year: {analysisData?.statement_year}
              </p>
              <Divider></Divider>
              <Subtitle className="pb-5">Deposits and Withdrawals</Subtitle>
              <Text>Monthly Deposit Mean</Text>
              <Metric className="pb-3">
                {analysisData?.monthly_deposit_mean}
              </Metric>
              <Text>Monthly Withdrawal Mean</Text>
              <Metric className="pb-3">
                {analysisData?.monthly_withdrawal_mean}
              </Metric>
              <Text>Monthly Balance Mean</Text>
              <Metric className="pb-3">
                {analysisData?.monthly_balance_mean}
              </Metric>
              <Divider></Divider>
              <Subtitle className="pb-5">Expenses Overview</Subtitle>
              <Text>Monthly Rent Mean</Text>
              <Metric className="pb-3">
                {analysisData?.monthly_rent_mean}
              </Metric>
              <Text>Monthly Loan Payment Mean</Text>
              <Metric className="pb-3">
                {analysisData?.monthly_loan_payment_mean}
              </Metric>
              <Text>Monthly Utilities Mean</Text>
              <Metric className="pb-3">
                {analysisData?.monthly_utilities_mean}
              </Metric>
            </Card>
          </div>
          <div className="flex flex-col w-full">
            <MonthlyExpensesBarList
              monthlySummary={analysisData?.monthly_summary ?? null}
            ></MonthlyExpensesBarList>

            {analysisData?.monthly_summary && (
              <MonthlyTrends
                monthlySummary={analysisData?.monthly_summary}
              ></MonthlyTrends>
            )}
          </div>
        </div>

        {analysisData?.transactions && (
          <TransactionDetailsTable
            transactionList={analysisData?.transactions}
          ></TransactionDetailsTable>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleAgreeOnClick}
            className="rounded bg-[#f3b334] py-2 px-4 text-white"
          >
            Confirm Decision
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
