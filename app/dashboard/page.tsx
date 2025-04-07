"use client";
import { stat } from "fs";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    console.log("session", session, status);
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);
  if (status === "loading") {
    return <p>Loading...</p>;
  }
  if (status === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem-2rem)]">
        <h1 className="text-4xl font-bold mb-4">Welcome to DashBoard</h1>
        <p className="text-lg text-muted-foreground text-center max-w-lg">
          Protected Page
        </p>
      </div>
    );
  }
}
