import React from "react";

export default function page({ params }: { params: { statement_id: string } }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-3/4 p-10 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold text-[#07074D]">
          Results for statement {params.statement_id}
        </h1>
        {/* Add your content or components here */}
      </div>
    </div>
  );
}
