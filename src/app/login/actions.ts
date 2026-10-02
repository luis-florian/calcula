"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    await signIn("credentials", {
      password: formData.get("password"),
      redirectTo: "/",
      username: formData.get("username"),
    });

    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Usuario o contraseña incorrectos.",
      };
    }

    throw error;
  }
}
