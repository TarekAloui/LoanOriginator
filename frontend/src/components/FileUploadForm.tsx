/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";

type FileWithPreview = File & {
  preview: string;
  name: string;
  type: string;
  size: number;
};

const FileUploadForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(
    null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Validate if the selected file is a PDF
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file.");
        return;
      }

      // Create a preview and set the selected file
      const fileWithPreview = {
        preview: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
      };
      setSelectedFile(fileWithPreview as FileWithPreview);

      console.log(file.name);
    }
  };

  const removeFile = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.preview);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the file input
      }
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

      const fileWithPreview = {
        preview: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
      };
      setSelectedFile(fileWithPreview as FileWithPreview);
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
              <div className="flex items-center justify-between mb-5 rounded-md bg-[#F5F7FB] py-4 px-8 w-full">
                {/* Left Section: PDF Icon and File Name */}
                <div className="flex items-center space-x-4">
                  {/* PDF Icon */}
                  <img src="/pdf_icon.png" alt="PDF Icon" className="h-6 w-6" />
                  {/* File name */}
                  <span className="truncate text-base font-medium text-[#07074D]">
                    {selectedFile.name}
                  </span>
                </div>

                {/* Right Section: Remove Button */}
                <button
                  className="text-[#07074D] ml-auto" // ml-auto pushes the button to the right
                  onClick={removeFile}
                  type="button"
                >
                  <svg
                    className="h-6 w-6" // Adjust size as needed
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#ff0033"
                    strokeWidth="0.8879999999999999"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke="#CCCCCC"
                      stroke-width="0.192"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM8.96963 8.96965C9.26252 8.67676 9.73739 8.67676 10.0303 8.96965L12 10.9393L13.9696 8.96967C14.2625 8.67678 14.7374 8.67678 15.0303 8.96967C15.3232 9.26256 15.3232 9.73744 15.0303 10.0303L13.0606 12L15.0303 13.9696C15.3232 14.2625 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2625 15.3232 13.9696 15.0303L12 13.0607L10.0303 15.0303C9.73742 15.3232 9.26254 15.3232 8.96965 15.0303C8.67676 14.7374 8.67676 14.2625 8.96965 13.9697L10.9393 12L8.96963 10.0303C8.67673 9.73742 8.67673 9.26254 8.96963 8.96965Z"
                        fill="#ff0033"
                      ></path>{" "}
                    </g>
                  </svg>
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
