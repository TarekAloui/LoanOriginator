/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";

type FileWithPreview = File & { preview: string };

const FileUploadForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(
    null
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Validate if the selected file is a PDF
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file.");
        return;
      }

      // Create a preview and set the selected file
      const fileWithPreview = { ...file, preview: URL.createObjectURL(file) };
      setSelectedFile(fileWithPreview);
    }
  };

  const removeFile = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.preview);
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow for the drop event to fire
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Optionally, you can manage some state to change the drop area style
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Validate if the selected file is a PDF
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file.");
        return;
      }

      const fileWithPreview = { ...file, preview: URL.createObjectURL(file) };
      setSelectedFile(fileWithPreview);
    }
  };

  return (
    <div className="flex items-center justify-center p-12 w-2/3">
      <div
        className="mx-auto w-full bg-white rounded-lg"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <form
          className="py-6 px-9"
          action="https://formbold.com/s/FORM_ID"
          method="POST"
        >
          <div className="mb-6 pt-4">
            <label className="mb-5 block text-xl font-semibold text-[#07074D]">
              Upload File
            </label>

            <div className="mb-8">
              <input
                type="file"
                name="file"
                id="file"
                className="sr-only"
                onChange={handleFileChange}
                accept=".pdf" // Restrict file picker to PDF files
              />
              <label
                htmlFor="file"
                className="relative flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-[#e0e0e0] p-12 text-center"
              >
                <div>
                  <span className="mb-2 block text-xl font-semibold text-[#07074D]">
                    Drop files here
                  </span>
                  <span className="mb-2 block text-base font-medium text-[#6B7280]">
                    Or
                  </span>
                  <span className="inline-flex rounded border border-[#e0e0e0] py-2 px-7 text-base font-medium text-[#07074D]">
                    Browse
                  </span>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center space-x-4 mb-5 rounded-md bg-[#F5F7FB] py-4 px-8">
                {/* PDF Icon */}
                <img
                  src="/pdf_icon.png"
                  alt="PDF Icon"
                  className="h-6 w-6"
                />{" "}
                {/* Adjust the size as needed */}
                {/* File name */}
                <span className="truncate text-base font-medium text-[#07074D]">
                  {selectedFile.name}
                </span>
                {/* Existing remove button */}
                <button
                  className="text-[#07074D]"
                  onClick={removeFile}
                  type="button"
                >
                  {/* SVG code here */}
                </button>
              </div>
            )}
          </div>

          <div>
            <button className="hover:shadow-form w-full rounded-md bg-[#6A64F1] py-3 px-8 text-center text-base font-semibold text-white outline-none">
              Send File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUploadForm;
