import { unstable_noStore as noStore } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";

type DatabaseHealth = {
  ok: boolean;
  message?: string;
};

function extractErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Unable to connect to MongoDB.";
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  noStore();

  try {
    await connectToDatabase();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: extractErrorMessage(error),
    };
  }
}
