import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-background-secondary/95 px-4 py-2 text-sm text-foreground shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
        Loading...
      </div>
    </div>
  );
}
