import { CheckCircle2, CircleAlert } from "lucide-react";

type FlashAlertProps = {
  type: "success" | "error";
  message: string;
};

export function FlashAlert({ type, message }: FlashAlertProps) {
  const isSuccess = type === "success";

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        isSuccess
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          : "border-red-500/40 bg-red-500/10 text-red-200"
      }`}
    >
      <div className="flex items-start gap-2">
        {isSuccess ? (
          <CheckCircle2 className="mt-[1px] h-4 w-4 shrink-0" />
        ) : (
          <CircleAlert className="mt-[1px] h-4 w-4 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
