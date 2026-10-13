import { SWRConfiguration } from "swr";

export class FetchError extends Error {
  info: any;
  status: number;
  constructor(message: string, info: any, status: number) {
    super(message);
    this.name = "FetchError";
    this.info = info;
    this.status = status;
  }
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    let errorInfo: any;
    try {
      errorInfo = await res.json();
    } catch {
      errorInfo = { message: res.statusText };
    }
    throw new FetchError(
      errorInfo?.error || errorInfo?.message || "An error occurred while fetching data.",
      errorInfo,
      res.status
    );
  }
  return res.json();
};

export const defaultSWRConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  focusThrottleInterval: 5000,
  dedupingInterval: 3000,
  revalidateOnReconnect: true,
  keepPreviousData: true,
  errorRetryCount: 2,
};
