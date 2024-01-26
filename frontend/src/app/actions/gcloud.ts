"use server";

import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import { revalidateTag } from "next/cache";
import { v4 as uuidv4 } from "uuid"; // Import uuid

const storage =
  process.env.NODE_ENV === "development"
    ? new Storage({
        projectId: process.env.PROJECT_ID,
        credentials: {
          client_email: process.env.CLIENT_EMAIL,
          private_key: process.env.GCS_PRIVATE_KEY,
        },
      })
    : new Storage();

const uploadFileToGCloud = async (data: FormData) => {
  try {
    const file: File | null = data.get("file") as unknown as File;
    if (!file) {
      return { error: "No file provided", status: 400 };
    }

    // Generate a unique filename using uuid
    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const blobName = `statements/${uniqueFileName}`;
    const contentType = file.type; // MIME type of the file

    // Define the config for generating the signed URL
    const config: GetSignedUrlConfig = {
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
      contentType, // Important, must match the actual content type of the file
    };

    // Generate the signed URL
    const [url] = await storage
      .bucket(process.env.GCP_BUCKET_NAME as string)
      .file(blobName)
      .getSignedUrl(config);

    // Get the file content as a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Send the file content to the signed URL
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: buffer,
    });

    if (!response.ok) {
      return {
        error: `Failed to upload file to Google Cloud Storage: ${response.statusText}`,
        status: response.status,
      };
    }

    revalidateTag("get_loan_prediction_endpoint");

    // Return the unique filename
    return { fileName: uniqueFileName, status: 200 };
  } catch (error) {
    console.error("Error uploading file to Google Cloud Storage", error);
    return { error: "Error uploading file", status: 500 };
  }
};

export { uploadFileToGCloud };
