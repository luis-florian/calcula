"use client";

import { useActionState } from "react";

import { loginAction, type LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form className="calculation-form standalone" action={formAction}>
      <label className="field">
        <span>Usuario</span>
        <span className="input-wrap">
          <input
            autoComplete="username"
            autoFocus
            name="username"
            placeholder="mariof"
            required
          />
        </span>
      </label>

      <label className="field">
        <span>Contraseña</span>
        <span className="input-wrap">
          <input
            autoComplete="current-password"
            name="password"
            required
            type="password"
          />
        </span>
      </label>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="primary-action" disabled={pending}>
        {pending ? "ENTRANDO..." : "ENTRAR"}
      </button>
    </form>
  );
}
