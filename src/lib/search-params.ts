export type SearchParamsShape = Record<string, string | string[] | undefined>;

export async function resolveSearchParams(
  input?: SearchParamsShape | Promise<SearchParamsShape>,
) {
  if (!input) {
    return {} as SearchParamsShape;
  }

  return await input;
}
