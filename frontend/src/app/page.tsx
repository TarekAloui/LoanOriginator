import FileUploadForm from "@/components/FileUploadForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center justify-center w-3/4">
        <div>
          <p className="text-lg md:text-lg lg:text-xl xl:text-2xl font-semibold text-center mb-6 text-white">
            Please upload your bank statement and we will take it from here!
          </p>
        </div>
        <FileUploadForm />
      </div>
    </main>
  );
}
