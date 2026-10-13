"use client";

import React from "react";
import { SWRConfig } from "swr";
import { defaultSWRConfig } from "@/lib/swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={defaultSWRConfig}>{children}</SWRConfig>;
}
