export type SearchParamsInput = Record<string, string | string[] | undefined>;

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export function getFlashMessage(searchParams: SearchParamsInput) {
  const success = decodeURIComponent(getFirstValue(searchParams.success));
  const error = decodeURIComponent(getFirstValue(searchParams.error));

  if (error) {
    return {
      type: "error" as const,
      message: error,
    };
  }

  if (success) {
    return {
      type: "success" as const,
      message: success,
    };
  }

  return null;
}
