import { appInfo } from "@/lib/app-info";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="welcome-panel" aria-labelledby="home-title">
        <p className="eyebrow">Proyecto base</p>
        <h1 id="home-title">{appInfo.name}</h1>
        <p>
          Aplicación mínima lista para comenzar a construir el simulador y el
          seguimiento de ventas financiadas.
        </p>
      </section>
    </main>
  );
}
