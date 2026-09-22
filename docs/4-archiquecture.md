# 04 — Arquitectura

**Producto:** Amorta
**Versión:** 1.0
**Objetivo:** Definir arquitectura técnica, frontend, backend, seguridad, persistencia y decisiones técnicas principales.

---

## 1. Principios de arquitectura

Amorta debe priorizar:

- simplicidad;
- confiabilidad de los cálculos;
- protección del historial;
- facilidad de mantenimiento;
- bajo costo operativo;
- buena experiencia móvil;
- posibilidad de evolucionar sin rehacer el sistema.

No necesitamos microservicios, colas, eventos, CQRS ni infraestructura compleja.

La arquitectura será deliberadamente un **monolito web pequeño**.

---

# 2. Stack

```text
Frontend + Backend
Next.js + TypeScript

Hosting
Vercel

Database
PostgreSQL - Neon

ORM
Drizzle ORM

Validation
Zod

Testing
Vitest

E2E
Playwright
```

### ¿Por qué Next.js?

Porque nos permite mantener:

```text
UI
+
Backend
+
Server Actions / API
```

en el mismo proyecto.

Para Amorta eso significa menos infraestructura, menos repositorios y menos contexto para Codex.

---

# 3. Arquitectura general

```text
┌─────────────────────────────┐
│                             │
│        Navegador            │
│     Teléfono / Tablet       │
│                             │
│       React / Next.js       │
│                             │
└──────────────┬──────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────┐
│                             │
│          VERCEL             │
│                             │
│          Next.js            │
│                             │
│   ┌─────────────────────┐   │
│   │        UI           │   │
│   └─────────────────────┘   │
│              │              │
│   ┌─────────────────────┐   │
│   │ Application Layer   │   │
│   └─────────────────────┘   │
│              │              │
│   ┌─────────────────────┐   │
│   │ Financial Engine    │   │
│   └─────────────────────┘   │
│              │              │
│   ┌─────────────────────┐   │
│   │ Persistence         │   │
│   └──────────┬──────────┘   │
│              │              │
└──────────────┼──────────────┘
               │
               │ TLS
               ▼
       ┌───────────────┐
       │               │
       │     NEON      │
       │  PostgreSQL   │
       │               │
       └───────────────┘
```

No existe un backend separado desplegado en otro proveedor.

**Vercel ejecuta la aplicación y Neon almacena los datos.**

---

# 4. Capas internas

Aunque sea un proyecto pequeño, no mezclaremos cálculo financiero directamente dentro de componentes React.

Usaremos aproximadamente:

```text
UI
 ↓
Application
 ↓
Domain
 ↓
Infrastructure
```

No significa implementar Clean Architecture ceremonial.

Solamente significa separar responsabilidades.

---

# 5. UI

Responsable de:

- mostrar información;
- recibir datos;
- navegación;
- formularios;
- confirmaciones;
- feedback al usuario.

Ejemplo:

```text
Registrar pago

Q [ 6,000 ]

Fecha
[ 15/10/2026 ]

[ CONTINUAR ]
```

La UI **no decide** cuánto corresponde a interés.

Envía:

```text
amount
paymentDate
financingId
```

al servidor.

---

# 6. Application Layer

Coordina casos de uso.

Ejemplos conceptuales:

```text
simulateFinancing()
createFinancing()

getFinancing()
listFinancings()

previewPayment()
registerPayment()

voidPayment()

getPaymentHistory()
generateProjection()
```

Esta capa coordina dominio + persistencia.

---

# 7. Financial Engine

Esta será la parte más importante técnicamente.

Tendrá funciones puras para cálculos financieros.

Ejemplo conceptual:

```text
calculateInterest()
calculatePayment()
calculateTerm()
applyPayment()
generateProjection()
recalculateProjection()
```

Debe poder funcionar sin:

- React;
- Next.js;
- Neon;
- HTTP;
- navegador.

Ejemplo:

```text
calculateInterest({
  balance: 765000,
  annualRate: 6,
  days: 30
})
```

↓

```text
3772.60
```

Esto nos permite probar exhaustivamente la matemática.

---

# 8. Una sola fuente para las fórmulas

Nunca debemos tener:

```text
Frontend calcula interés de una manera
Backend calcula interés de otra
Calendario utiliza otra fórmula
```

Todas las operaciones utilizan el mismo:

```text
Financial Engine
```

Por ejemplo:

```text
Simulation
       │
       ▼
Financial Engine

Payment
       │
       ▼
Financial Engine

Projection
       │
       ▼
Financial Engine
```

Esto evita diferencias entre lo que se previsualizó y lo que finalmente se guardó.

---

# 9. Cálculos en servidor

La UI puede hacer pequeñas operaciones de presentación, pero los cálculos financieros definitivos deben ejecutarse en el servidor.

Especialmente:

```text
registerPayment()
```

Nunca aceptaremos del navegador:

```text
interest = 3500
principal = 2500
closingBalance = 700000
```

como verdad.

El navegador envía solamente:

```text
paymentDate
amount
financingId
```

El servidor obtiene el saldo real y la tasa desde Neon y calcula nuevamente.

---

# 10. Flujo de registro de pago

La UX tiene dos pasos:

```text
CONTINUAR
```

y posteriormente:

```text
CONFIRMAR PAGO
```

Arquitectónicamente:

```text
Usuario escribe
Q6,000
15/10/2026

        ↓

previewPayment()

        ↓

Servidor consulta Financing

        ↓

Financial Engine

        ↓

Devuelve:

Interés        Q3,772.60
Capital        Q2,227.40
Nuevo saldo    Q762,772.60

        ↓

UI muestra confirmación
```

Todavía **no guardamos nada**.

Cuando presiona:

**CONFIRMAR PAGO**

↓

```text
registerPayment()
```

El servidor **vuelve a calcular**.

No confiamos simplemente en el preview anterior.

---

# 11. Transacciones

Registrar un pago implica dos operaciones:

```text
INSERT payment

UPDATE financing.current_balance
```

Deben ejecutarse dentro de una única **transacción PostgreSQL**.

Conceptualmente:

```text
BEGIN

crear Payment

actualizar Financing.current_balance

COMMIT
```

Si algo falla:

```text
ROLLBACK
```

Nunca queremos:

> Payment guardado pero saldo sin actualizar.

o:

> Saldo actualizado pero Payment inexistente.

---

# 12. Concurrencia

Aunque inicialmente probablemente exista un solo usuario, protegeremos una situación como:

```text
Teléfono
     ↓
Registrar Q6,000

Tablet
     ↓
Registrar Q6,000
```

al mismo tiempo.

El servidor debe trabajar contra el estado actual de la venta dentro de una transacción.

No basaremos un pago en un saldo viejo que el navegador tenía abierto desde hace diez minutos.

No necesitamos infraestructura sofisticada, pero sí consistencia transaccional.

---

# 13. Dinero y precisión

JavaScript `number` no será nuestra representación principal para cálculos monetarios delicados.

Utilizaremos una estrategia decimal exacta.

Por ejemplo:

```text
decimal.js
```

y PostgreSQL:

```text
NUMERIC
```

Nunca:

```text
FLOAT
REAL
```

para dinero.

---

# 14. Política de redondeo

Necesitamos una única regla.

Propuesta inicial:

**Los valores monetarios se redondean a 2 decimales utilizando ROUND_HALF_UP.**

Ejemplo:

```text
Q3772.604
→
Q3772.60
```

Esta regla debe vivir dentro del Financial Engine.

No:

```text
Math.round()
```

distribuido por componentes.

⚠️ Esta política debe validarse con los ejemplos reales de tu papá.

---

# 15. Fechas

Los cálculos financieros trabajan con fechas calendario.

Ejemplo:

```text
2026-09-15
2026-10-15
```

↓

```text
30 días
```

No necesitamos horas.

La capa financiera debe trabajar con:

```text
LocalDate
```

conceptualmente, no con timestamps UTC para representar fechas de pago.

En PostgreSQL:

```text
DATE
```

---

# 16. Generación de fechas mensuales

Tenemos pendiente el caso:

> Primer pago: 31 de enero.

¿Qué sucede en febrero?

Propuesta inicial:

**usar el último día válido del mes.**

Entonces:

```text
31 enero
28 febrero
31 marzo
30 abril
31 mayo
```

El día contractual continúa siendo:

```text
31
```

aunque febrero tenga 28.

Esto deberá validarse durante pruebas.

---

# 17. Autenticación

Aquí simplificaría bastante.

Aunque inicialmente la utilice únicamente tu papá, **no dejaría la aplicación públicamente accesible sin autenticación**, porque contiene información financiera.

Para el MVP necesitamos:

```text
Login
 ↓
Sesión
 ↓
Amorta
```

No necesitamos:

- registro público;
- organizaciones;
- roles;
- permisos empresariales;
- administración de usuarios.

Una sola cuenta puede ser suficiente inicialmente.

La implementación concreta de autenticación puede resolverse con un proveedor compatible con Next.js/Vercel.

La contraseña nunca se almacenará manualmente en nuestra tabla.

---

# 18. Sesión sencilla

Debido al usuario:

**no deberíamos obligarlo a iniciar sesión continuamente.**

Después de autenticarse correctamente, la sesión debería mantenerse durante un período razonable en su dispositivo personal.

La seguridad debe existir sin convertir cada apertura de Amorta en una experiencia frustrante.

---

# 19. Autorización

Aunque inicialmente exista un solo usuario, cada `Financing` debería pertenecer a un usuario.

Por lo tanto agregaría al modelo:

```text
Financing

owner_id
```

Todas las consultas deben comprobar:

```text
financing.owner_id === authenticatedUser.id
```

No confiar solamente en que alguien no conoce el ID de otra venta.

Esto permite que mañana tú también tengas una cuenta sin rediseñar la base.

---

# 20. Validación

Todos los datos que entren al servidor se validan con Zod.

Ejemplos:

```text
capital > 0
annualRate >= 0
payment > 0
term > 0
paymentDate válida
name no vacío
```

Pero además existen validaciones financieras.

Por ejemplo:

> El pago mensual propuesto no alcanza para cubrir siquiera los intereses.

Eso no es un error de formulario.

Es una **regla de dominio**.

La respuesta debe poder convertirse en algo comprensible:

> **Con Q3,000 al mes la deuda no disminuiría. Pruebe con una cantidad mayor.**

---

# 21. Errores

Internamente:

```text
PAYMENT_TOO_LOW
INVALID_PAYMENT_DATE
FINANCING_NOT_FOUND
FINANCING_COMPLETED
...
```

UI:

> **El pago es demasiado bajo para reducir la deuda.**

Nunca mostrar a tu papá:

```text
500
PostgresError
ZodError
DecimalError
```

---

# 22. Logging

Los errores técnicos importantes deben quedar registrados.

Por ejemplo:

```text
operation
financingId
timestamp
error
```

Nunca registrar:

- contraseñas;
- tokens;
- secretos.

Para el MVP podemos aprovechar observabilidad disponible en Vercel sin construir nuestra propia plataforma.

---

# 23. Base de datos

Neon/PostgreSQL.

Tablas iniciales:

```text
users/auth provider
        │
        ▼

financings
        │
        │ 1:N
        ▼
payments
```

Dependiendo del proveedor de autenticación, `users` podría ni siquiera ser una tabla administrada directamente por Amorta.

---

# 24. Drizzle

Drizzle será responsable de:

```text
schema
migrations
queries
transactions
```

Ejemplo conceptual:

```text
src/db/schema/
  financings.ts
  payments.ts
```

No utilizaremos SQL disperso dentro de componentes.

---

# 25. Estructura aproximada

Sin sobrearquitectura:

```text
src/

  app/
    page.tsx

    sales/
    calculate/
    login/

  components/

  domain/
    financing/
      calculations.ts
      projection.ts
      types.ts

  application/
    financing/
    payments/

  db/
    schema/
    queries/

  validation/

  lib/
```

No necesitamos imponer Repository Pattern + Unit of Work + CQRS + Mediator simplemente porque los conocemos.

Si una abstracción no resuelve un problema actual, no entra al MVP.

---

# 26. Tests

Aquí sí sería exigente.

## Financial Engine

Debe tener cobertura especialmente fuerte.

Casos mínimos:

```text
interés 30 días
interés 31 días
febrero
año bisiesto
pago normal
pago mayor
pago menor
último pago
redondeo
plazo calculado
cuota calculada
proyección completa
```

Además:

```text
Q765,000
6%
Q6,000
```

debe tener resultados reproducibles.

---

# 27. Tests de aplicación

Casos como:

```text
crear financing
registrar payment
actualizar balance
corregir payment
completar financing
```

Aquí verificamos DB + reglas.

---

# 28. E2E

Playwright cubrirá pocos flujos, pero críticos.

### Happy path 1

```text
Login
→ Calcular por pago
→ Previsualizar
→ Guardar venta
```

### Happy path 2

```text
Abrir venta
→ Registrar pago
→ Confirmar
→ Ver nuevo saldo
```

### Happy path 3

```text
Calcular por plazo
→ obtener mensualidad
→ ver calendario
```

No necesitamos cientos de tests E2E.

---

# 29. Protección contra doble clic

Especialmente importante para:

**CONFIRMAR PAGO**

Cuando se presiona:

```text
CONFIRMAR PAGO
```

el botón se deshabilita inmediatamente:

```text
REGISTRANDO...
```

y no permite enviar dos veces accidentalmente.

Además, el backend debe protegerse contra duplicados razonables.

La UI por sí sola no es suficiente.

---

# 30. Backups

Dado que una venta puede existir durante muchos años, la estrategia de respaldo importa.

Usaremos las capacidades de recuperación/backups disponibles en Neon y verificaremos qué retención proporciona el plan utilizado antes de producción.

Además, una futura versión debería permitir:

**Exportar estado de cuenta**

por ejemplo a PDF/CSV.

Eso también ofrece al usuario una copia humana de su información.

---

# 31. Ambientes

Tendremos:

```text
Development
Production
```

Y si resulta útil durante desarrollo:

```text
Preview
```

Vercel permite previews por branch/PR.

Nunca deben apuntar accidentalmente a la base de producción.

Idealmente:

```text
Local/Preview → Neon development

Production → Neon production
```

---

# 32. Variables y secretos

Secretos como:

```text
DATABASE_URL
AUTH_SECRET
```

se almacenan como variables de entorno.

Nunca:

```text
Git
AGENTS.md
/docs
source code
```

Codex tampoco deberá introducir secretos reales en el repositorio.

---

# 33. Deploy

Flujo sencillo:

```text
Git repository
      │
      ▼
Pull Request
      │
      ▼
Tests
      │
      ▼
Vercel Preview
      │
      ▼
Validación
      │
      ▼
Merge main
      │
      ▼
Vercel Production
```

Esto será especialmente útil cuando tu papá empiece a probar.

Podemos desarrollar un cambio, verlo nosotros y después liberárselo.

---

# 34. PWA

Dejaría preparada la aplicación para funcionar posteriormente como **PWA instalable**, pero no convertiría offline en requisito del MVP.

¿Por qué puede ser interesante?

Para tu papá, en vez de:

> Abra Safari → escriba dirección → etc.

podemos dejar un icono:

**Amorta**

en la pantalla del teléfono/tablet.

Lo toca y abre como una aplicación.

Eso puede mejorar considerablemente su experiencia sin construir una app iOS/Android nativa.

---

# 35. Offline

**Fuera del MVP.**

Registrar pagos offline introduce sincronización, conflictos y riesgo de duplicados.

Para una aplicación financiera pequeña prefiero inicialmente:

> Necesita conexión para registrar/modificar información.

a construir sincronización prematuramente.

---

# 36. Accesibilidad

No será simplemente un detalle visual.

Los componentes deben considerar:

```text
touch targets grandes
labels visibles
contraste suficiente
focus states
zoom del navegador
lectura clara
no depender únicamente de colores
```

Por ejemplo, no mostrar solamente:

🟢 / 🔴

sino:

**PAGADO ✓**

**PENDIENTE**

---

# 37. Decisiones técnicas

Resumiendo nuestros ADR pequeños:

| Decisión               | Elección                |
| ---------------------- | ----------------------- |
| Arquitectura           | Monolito web            |
| Lenguaje               | TypeScript              |
| Framework              | Next.js                 |
| Hosting                | Vercel                  |
| Database               | Neon PostgreSQL         |
| ORM                    | Drizzle                 |
| Validation             | Zod                     |
| Money                  | Decimal + NUMERIC       |
| Financial calculations | Domain module puro      |
| Projection             | Calculada, no histórica |
| Payments               | Históricos/persistidos  |
| Transactions           | PostgreSQL              |
| Unit tests             | Vitest                  |
| E2E                    | Playwright              |
| Mobile                 | Mobile-first            |
| Offline                | No MVP                  |
| PWA                    | Preparar / posible      |
| Deployment             | Git → Vercel            |

---

# 38. Lo que deliberadamente NO utilizaremos

Para evitar que Codex sobreconstruya:

```text
Microservices       ❌
Kafka               ❌
SQS                  ❌
Redis                ❌
Kubernetes           ❌
CQRS                 ❌
Event Sourcing       ❌
GraphQL              ❌
Separate backend     ❌
Separate frontend    ❌
Complex RBAC         ❌
Offline sync         ❌
```

No porque sean malas tecnologías.

Simplemente **Amorta no tiene esos problemas**.

---

# 39. Riesgos principales

### Riesgo 1 — Matemática incorrecta

Mitigación:

**Financial Engine puro + tests exhaustivos.**

### Riesgo 2 — Perder historial

Mitigación:

**Payments inmutables/void + PostgreSQL + backups.**

### Riesgo 3 — Usuario registra algo accidentalmente

Mitigación:

**Preview → confirmación → protección doble envío → corrección.**

### Riesgo 4 — UX demasiado tecnológica

Mitigación:

**Mobile-first + pruebas reales con tu papá.**

### Riesgo 5 — Reglas financieras todavía ambiguas

Mitigación:

No esconderlas dentro del código.

Las reglas pendientes permanecen documentadas y las vamos cerrando conforme hagamos las pruebas.

---

# 40. Arquitectura final del MVP

En su forma más sencilla:

```text
                  AMORTA

        ┌──────────────────────┐
        │                      │
        │      Next.js UI      │
        │                      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │                      │
        │   Application Layer  │
        │                      │
        └─────┬──────────┬─────┘
              │          │
              ▼          ▼
     ┌─────────────┐  ┌─────────────┐
     │ Financial   │  │ Persistence │
     │ Engine      │  │   Drizzle   │
     └─────────────┘  └──────┬──────┘
                             │
                             ▼
                       ┌───────────┐
                       │   Neon    │
                       │PostgreSQL │
                       └───────────┘
```

Todo desplegado desde **un proyecto**.
