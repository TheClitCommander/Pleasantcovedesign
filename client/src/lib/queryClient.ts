import { QueryClient } from "@tanstack/react-query";
import { auth } from "./auth";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string, {
          headers: {
            ...auth.getAuthHeader(),
          },
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      },
    },
  },
});

export const apiRequest = async (
  method: string,
  url: string,
  body?: any
): Promise<Response> => {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...auth.getAuthHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res;
};
