"use server";

import { redirect } from "next/navigation";

import { deleteSale } from "@/application/delete-sale";
import { requireAuthenticatedUser } from "@/lib/auth";

export async function deleteSaleAction(formData: FormData) {
  const financingId = String(formData.get("financingId") ?? "");

  if (!financingId) {
    return;
  }

  const user = await requireAuthenticatedUser();
  await deleteSale({
    financingId,
    ownerId: user.id,
  });

  redirect("/");
}
