import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { serverEnv } from "@/lib/env";

export type AuthenticatedUser = {
  id: string;
};

export const getAuthenticatedUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    return {
      id: serverEnv.AMORTA_SINGLE_USER_ID,
    };
  },
);

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
