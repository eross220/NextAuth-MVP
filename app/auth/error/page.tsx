"use client";
import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  console.log("error!!!!!!!!");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="text-red-500">{error || "An unknown error occurred."}</p>
      {/* Optionally link back to login or home */}
    </div>
  );
}
