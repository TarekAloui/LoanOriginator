import React from "react";
import ResultsComponent from "../../../components/ResultsComponent";

export default function page({ params }: { params: { statement_id: string } }) {
  return <ResultsComponent statementId={params.statement_id} />;
}
