import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <div className="app-frame login-frame">
      <main className="main-content narrow">
        <section className="login-view" aria-labelledby="login-title">
          <div className="form-heading">
            <p className="brand">AMORTA</p>
            <h1 id="login-title">Entrar a Amorta</h1>
          </div>
          <LoginForm />
        </section>
      </main>
    </div>
  );
}
