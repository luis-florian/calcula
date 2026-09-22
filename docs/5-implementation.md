# 05 — Plan de implementación

**Producto:** Amorta
**Versión:** 1.0
**Objetivo:** Convertir las especificaciones de producto, UX, datos y arquitectura en un plan incremental que pueda ser ejecutado por Codex sin intentar construir toda la aplicación de una sola vez.

---

## 1. Estrategia de desarrollo

Amorta se desarrollará verticalmente y en incrementos pequeños.

Cada fase debe terminar con algo **ejecutable, probado y revisable**.

El flujo será:

```text
Especificación
      ↓
Tarea pequeña
      ↓
Codex crea plan
      ↓
Implementación
      ↓
Tests
      ↓
Revisión
      ↓
Checkpoint
      ↓
Siguiente tarea
```

Codex no debe implementar funcionalidades futuras simplemente porque parezcan convenientes.

Los documentos `/docs` son la fuente de verdad.

---

# 2. Orden general

```text
FASE 0   Proyecto base
   ↓
FASE 1   Motor financiero
   ↓
FASE 2   Simulador
   ↓
FASE 3   Persistencia
   ↓
FASE 4   Mis ventas
   ↓
FASE 5   Registro de pagos
   ↓
FASE 6   Calendario e historial
   ↓
FASE 7   Corrección y finalización
   ↓
FASE 8   Autenticación y seguridad
   ↓
FASE 9   UX + accesibilidad
   ↓
FASE 10  QA + producción
```

El **motor financiero se implementa antes que la interfaz completa**.

---

# 3. Fase 0 — Proyecto base

### Objetivo

Tener una aplicación mínima ejecutándose localmente y desplegable en Vercel.

### Tarea 0.1 — Inicializar proyecto

Configurar:

```text
Next.js
TypeScript
ESLint
Prettier
Vitest
Playwright
```

Crear estructura inicial:

```text
src/
  app/
  components/
  domain/
  application/
  db/
  validation/
  lib/

docs/
```

### Criterios de aceptación

```text
npm run dev       ✓
npm run build     ✓
npm run lint      ✓
npm run test      ✓
```

Sin funcionalidad financiera todavía.

---

### Tarea 0.2 — Configuración base

Configurar:

- variables de entorno;
- `.env.example`;
- alias/imports;
- configuración de tests;
- estructura de errores;
- formateo.

Nunca introducir secretos reales en Git.

### Checkpoint

**Proyecto vacío pero saludable y desplegable.**

---

# 4. Fase 1 — Motor financiero

Esta es la fase técnicamente más importante.

**No necesita base de datos ni UI real.**

---

## Tarea 1.1 — Tipos financieros

Definir conceptos:

```text
Money
AnnualInterestRate
Payment
Balance
FinancialDate
```

Definir política decimal y redondeo.

Utilizar una librería decimal; no realizar cálculos monetarios importantes mediante `number`.

---

## Tarea 1.2 — Interés por período

Implementar:

```text
calculateInterest({
  balance,
  annualRate,
  startDate,
  endDate
})
```

Conceptualmente:

```text
days = endDate - startDate

interest =
balance × annualRate × days / 365
```

Tests:

```text
30 días
31 días
28 días
29 días
cambio de año
6%
0%
saldos grandes
redondeo
```

---

## Tarea 1.3 — Aplicar pago

Implementar:

```text
applyPayment()
```

Entrada:

```text
openingBalance
annualRate
previousDate
paymentDate
paymentAmount
```

Salida:

```text
daysElapsed
interest
principal
closingBalance
```

Ejemplo de referencia:

```text
Capital: Q765,000
Tasa: 6%
Período: 30 días
Pago: Q6,000
```

Debe producir:

```text
Interés        Q3,772.60
Capital        Q2,227.40
Saldo          Q762,772.60
```

---

## Tarea 1.4 — Generar fechas

Implementar generación mensual.

Debe soportar:

```text
15 ene → 15 feb → 15 mar

31 ene → último día feb → 31 mar
```

Manteniendo conceptualmente el día contractual original.

---

## Tarea 1.5 — Calcular plazo

Caso:

> Capital + tasa + pago → ¿cuánto tarda?

Implementar:

```text
calculateTerm()
```

Debe generar períodos sucesivamente hasta alcanzar saldo cero.

Debe existir protección contra:

```text
payment <= interest
```

para evitar ciclos infinitos.

Resultado:

```text
numberOfPayments
estimatedEndDate
lastPayment
totalInterest
totalPaid
```

---

## Tarea 1.6 — Calcular pago por plazo

Caso:

> Capital + tasa + fecha final → ¿cuánto debería pagar?

Implementar:

```text
calculatePaymentForTerm()
```

Aquí no asumir una fórmula simplificada `rate / 12` si el dominio utiliza **días reales**.

El resultado debe ser consistente con el mismo motor que genera el calendario.

Puede utilizarse un algoritmo numérico para encontrar el pago que produzca saldo aproximadamente cero en la fecha objetivo.

Tests obligatorios.

---

## Tarea 1.7 — Generar proyección

Implementar:

```text
generateProjection()
```

Salida:

```text
[
  {
    paymentNumber,
    expectedDate,
    openingBalance,
    payment,
    interest,
    principal,
    closingBalance
  }
]
```

Debe funcionar para ambas modalidades.

### Checkpoint crítico

Antes de continuar:

**detener desarrollo y revisar manualmente varios cálculos.**

Este es nuestro primer gran checkpoint.

No construir UI financiera encima de un motor que todavía no confiamos.

---

# 5. Fase 2 — Simulador

Ahora conectamos el motor con una interfaz.

Todavía **sin guardar ventas**.

---

## Tarea 2.1 — Inicio

Crear pantalla inicial siguiendo `02-ux.md`.

Acciones principales:

```text
Mis ventas
Calcular
```

Si todavía no existen ventas:

```text
Todavía no tiene ventas guardadas.

[ CALCULAR UNA VENTA ]
```

---

## Tarea 2.2 — Elegir modalidad

Implementar:

**QUIERO INDICAR EL PAGO**

y:

**QUIERO INDICAR EL TIEMPO**

Botones/tarjetas grandes.

---

## Tarea 2.3 — Formulario por pago

Campos:

```text
Capital
Tasa anual
Pago aproximado
Fecha inicial
Primera fecha de pago
```

Nota: agregamos explícitamente **fecha inicial**, porque `03-data.md` detectó que la necesitamos para calcular el primer período.

Validar los datos antes de calcular.

---

## Tarea 2.4 — Formulario por plazo

Campos:

```text
Capital
Tasa anual
Plazo
Fecha inicial
Primera fecha de pago
```

Inicialmente el plazo puede expresarse en años.

---

## Tarea 2.5 — Resultado

Mostrar:

```text
Capital
Tasa

Pago aproximado
Tiempo aproximado
Número de pagos
Total de intereses
Total a recibir
Primera fecha
Última fecha
```

Permitir:

```text
VER PLAN
CAMBIAR DATOS
```

`GUARDAR VENTA` todavía puede permanecer deshabilitado/ausente hasta la siguiente fase.

---

## Tarea 2.6 — Previsualización del calendario

Mostrar inicialmente los primeros pagos.

Permitir:

**VER MÁS PAGOS**

No renderizar innecesariamente cientos de elementos simultáneamente.

### Checkpoint

En este momento tendremos nuestro **primer producto realmente utilizable**:

> Tu papá puede ingresar condiciones y Amorta calcula el negocio.

Antes incluso de implementar Neon, esta versión puede probarse con él.

---

# 6. Fase 3 — Persistencia

Ahora introducimos Neon.

---

## Tarea 3.1 — Neon + Drizzle

Configurar:

```text
PostgreSQL / Neon
Drizzle
migrations
```

Ambientes separados:

```text
development
production
```

---

## Tarea 3.2 — Financing

Crear tabla según `03-data.md`.

Como mínimo:

```text
id
owner_id
name
buyer_name

initial_capital
current_balance
annual_interest_rate

calculation_mode
target_payment
target_end_date

start_date
first_payment_date
expected_payment_day

status

created_at
updated_at
completed_at
```

Utilizar `NUMERIC` para dinero/tasas y `DATE` para fechas financieras.

---

## Tarea 3.3 — Payment

Crear:

```text
id
financing_id

payment_date
amount

previous_payment_date
days_elapsed

opening_balance
interest_amount
principal_amount
closing_balance

status
voided_at
void_reason

created_at
```

---

## Tarea 3.4 — Guardar simulación como venta

Agregar a la previsualización:

**GUARDAR VENTA**

Solicitar:

```text
Nombre de venta
Comprador
```

Mostrar confirmación.

Persistir solamente después de confirmar.

### Checkpoint

Ahora:

```text
Simular
→ Revisar
→ Guardar
→ Recargar navegador
→ Venta continúa existiendo
```

---

# 7. Fase 4 — Mis ventas

## Tarea 4.1 — Listado

Mostrar ventas `ACTIVE`.

Cada tarjeta:

```text
Nombre
Comprador
Saldo pendiente
Próximo pago
Pago aproximado
```

---

## Tarea 4.2 — Detalle

Implementar:

```text
SALDO PENDIENTE

Próximo pago

Pago aproximado

[ REGISTRAR PAGO ]

Ver plan
Ver pagos recibidos
Datos de la venta
```

El saldo debe dominar visualmente la pantalla.

---

## Tarea 4.3 — Ventas finalizadas

Separar:

```text
ACTIVE
COMPLETED
```

Las finalizadas no deben mezclarse con las ventas que requieren atención.

---

# 8. Fase 5 — Registro de pagos

Segundo punto crítico del sistema.

---

## Tarea 5.1 — Formulario

Solamente:

```text
Cantidad recibida
Fecha recibida
```

---

## Tarea 5.2 — Preview

Implementar:

```text
previewPayment()
```

Servidor:

```text
Financing
     ↓
Financial Engine
     ↓
resultado
```

No modifica DB.

Mostrar:

```text
Cantidad recibida
Días
Interés
Abono a deuda
Saldo anterior
Nuevo saldo
```

---

## Tarea 5.3 — Confirmación

Al presionar:

**CONFIRMAR PAGO**

ejecutar:

```text
registerPayment()
```

El servidor vuelve a leer el estado actual y **recalcula**.

No confía en los valores enviados por el preview.

---

## Tarea 5.4 — Transacción

Dentro de PostgreSQL:

```text
BEGIN

calcular usando estado actual

INSERT payment

UPDATE financing

COMMIT
```

Ante error:

```text
ROLLBACK
```

---

## Tarea 5.5 — Doble envío

Proteger:

```text
doble clic
refresh
request repetido
```

como mínimo mediante UI deshabilitada durante el envío y mecanismo server-side apropiado.

---

## Tarea 5.6 — Resultado

Mostrar:

```text
✓ PAGO REGISTRADO

Recibió
Q6,000

Nuevo saldo
QXXX,XXX

Próximo pago
XX/XX/XXXX
```

### Checkpoint crítico

Probar manualmente:

```text
pago normal
pago mayor
pago menor
pago tarde
```

y comparar cálculos con papel/calculadora.

---

# 9. Fase 6 — Recalcular y consultar

## Tarea 6.1 — Nueva proyección

Después de cada pago real:

```text
currentBalance
+
fecha último pago
+
targetEndDate
```

alimentan nuevamente al Financial Engine.

Si el pago fue extraordinario y mantenemos la fecha final:

**recalcular pago futuro aproximado.**

No necesitamos persistir toda la nueva proyección.

---

## Tarea 6.2 — Plan de pagos

Combinar visualmente:

```text
PASADO
Payments reales

──────── HOY ────────

FUTURO
Projection calculada
```

Esto sería muy útil.

Ejemplo:

```text
15 JUL   ✓ Q6,000
15 AGO   ✓ Q12,000
15 SEP   ✓ Q6,000

──────── HOY ────────

15 OCT     Q5,850
15 NOV     Q5,850
15 DIC     Q5,850
...
```

Así tu papá puede entender inmediatamente qué ocurrió y qué esperamos ahora.

---

## Tarea 6.3 — Historial

Mostrar pagos reales en orden cronológico inverso.

Cada pago permite ver:

```text
Cantidad
Fecha
Interés
Capital
Saldo anterior
Saldo posterior
```

---

# 10. Fase 7 — Correcciones y finalización

## Tarea 7.1 — Corregir pago

UX:

```text
Corregir este pago
```

Internamente:

```text
Payment incorrecto
      ↓
VOIDED

Payment corregido
      ↓
CONFIRMED
```

---

## Tarea 7.2 — Recalcular historia posterior

Si se corrige un pago antiguo:

```text
Pago 1 ← corregido
  ↓
recalcular Pago 2
  ↓
recalcular Pago 3
  ↓
...
  ↓
currentBalance
  ↓
Projection
```

Esta operación requiere tests especialmente cuidadosos.

---

## Tarea 7.3 — Último pago

Cuando el pago correspondiente cancela el saldo:

```text
closingBalance = 0
```

Actualizar:

```text
Financing.status = COMPLETED
completed_at = ...
```

Nunca generar saldo negativo por redondeo.

---

## Tarea 7.4 — Resumen final

Mostrar:

```text
VENTA COMPLETADA

Capital
Total recibido
Total intereses
Fecha inicial
Fecha final
```

---

# 11. Fase 8 — Autenticación y seguridad

La autenticación puede desarrollarse aquí antes de producción, aunque durante las fases iniciales trabajemos localmente con un usuario de desarrollo.

## Tarea 8.1

Seleccionar proveedor de autenticación.

Requisitos:

- compatible con Next.js/Vercel;
- sesión persistente;
- experiencia extremadamente sencilla;
- sin registro público;
- posibilidad de una sola cuenta inicialmente.

La elección debe registrarse como decisión técnica.

---

## Tarea 8.2

Proteger todas las rutas privadas.

---

## Tarea 8.3

Aplicar `owner_id`.

Toda consulta:

```text
financingId
+
authenticatedUserId
```

Nunca consultar únicamente por ID.

---

## Tarea 8.4

Revisar:

```text
secrets
environment variables
server/client boundaries
database permissions
error leakage
```

---

# 12. Fase 9 — UX y accesibilidad

Aquí no agregamos features.

**Pulimos lo existente.**

Revisar:

```text
tamaño de letra
contraste
botones
espaciado
formularios
fechas
dinero
mensajes
navegación
loading
errores
confirmaciones
```

---

## Prueba principal

Darle Amorta a tu papá **sin explicarle el flujo previamente**, dentro de lo posible.

Observar dónde:

- se detiene;
- pregunta qué hacer;
- toca algo incorrecto;
- no encuentra una función;
- no entiende una palabra;
- duda si algo quedó guardado.

No corregirlo inmediatamente en la app durante la prueba.

Registrar las observaciones.

Ejemplo:

```text
TEST PAPÁ #1

✓ Encontró "Calcular"

✓ Entendió capital

? No entendió "tasa anual"

✗ No encontró cómo regresar

? Preguntó si el pago ya estaba guardado

✗ Calendario demasiado pequeño
```

Esas notas alimentan:

```text
02-ux.md v1.1
```

---

# 13. Fase 10 — QA final

Antes de producción ejecutar una matriz financiera.

Por ejemplo:

| Caso                |       Capital | Tasa | Comportamiento      |
| ------------------- | ------------: | ---: | ------------------- |
| Normal              |      Q765,000 |   6% | Pago mensual        |
| Sin interés         |      Q100,000 |   0% | Pago mensual        |
| Pago alto           |      Q100,000 |   6% | Finaliza rápido     |
| Pago insuficiente   |      Q765,000 |   6% | Debe rechazarse     |
| Pago extraordinario |      Q765,000 |   6% | Reduce pago futuro  |
| Pago tardío         |      Q765,000 |   6% | Más días de interés |
| Último pago         | saldo pequeño |   6% | Termina en Q0       |

Los resultados importantes deben verificarse independientemente.

---

# 14. QA de persistencia

Probar:

```text
crear venta
cerrar navegador
volver
datos siguen ahí

registrar pago
volver
saldo correcto

doble clic
no duplica

error de DB
no deja estado parcial

corregir pago
historia consistente
```

---

# 15. QA responsive

Como mínimo:

```text
teléfono
tablet
desktop
```

Prioridad:

**teléfono/tablet.**

---

# 16. Producción

Antes de entregar la primera versión:

```text
✓ Production Neon separado
✓ migrations aplicadas
✓ variables Vercel
✓ autenticación
✓ HTTPS
✓ tests
✓ build
✓ backup/recovery revisado
✓ usuario real creado
```

Deploy:

```text
main
 ↓
Vercel
 ↓
Amorta Production
```

---

# 17. Primera prueba real

No considero:

> “Está desplegado.”

como final del MVP.

El verdadero milestone es:

> **Tu papá logra calcular una operación y posteriormente registrar un pago sin nuestra ayuda.**

Ahí obtenemos feedback.

---

# 18. Ciclo después del MVP

Después de la primera prueba:

```text
Papá usa Amorta
      ↓
Notas
      ↓
Clasificar
      ↓
Bug / UX / nueva regla
      ↓
Actualizar /docs
      ↓
Nueva tarea Codex
      ↓
Implementar
      ↓
Nueva prueba
```

No modificar solamente código cuando descubramos una nueva regla.

Primero actualizamos la especificación correspondiente.

---

# 19. Features candidatas posteriores

No implementar todavía:

```text
Imprimir estado de cuenta
Exportar PDF
Exportar Excel
Recordatorios
Mora
Pagos semanales/quincenales
Notas por pago
Adjuntar recibos
Datos completos del inmueble
Datos completos comprador
Dashboard
PWA
Offline
```

Las pruebas reales decidirán cuáles tienen valor.

---

# 20. Estrategia de commits / PR

Cada tarea debe ser pequeña.

Preferible:

```text
feat: implement interest calculation

feat: implement payment application

feat: add financing simulation

feat: persist financing

feat: register payment
```

y no:

```text
feat: build Amorta
```

Cada PR debe poder responder:

> **¿Qué comportamiento agrega o modifica?**

---

# 21. Instrucción para Codex por tarea

No le entregaremos solamente:

> “Haz fase 5.”

Usaremos algo parecido a:

```text
Implement task 5.2 from docs/05-implementation.md.

Before coding:
1. Read AGENTS.md.
2. Read the relevant sections of:
   - docs/01-product.md
   - docs/02-ux.md
   - docs/03-data.md
   - docs/04-architecture.md
   - docs/05-implementation.md
3. Inspect the existing implementation.
4. Produce a concise implementation plan.
5. Identify any conflict between the code and specifications.

Then implement only task 5.2.

Do not implement future tasks.

Before finishing:
- run relevant tests;
- run typecheck;
- run lint;
- report files changed;
- report tests executed;
- report unresolved questions.
```

Esto evita que cada prompt tenga que volver a explicar Amorta desde cero.

---

# 22. Regla para ambigüedades

Esta será una instrucción particularmente importante para Codex:

> **Una ambigüedad financiera no se resuelve inventando una regla.**

Si encuentra algo como:

```text
¿Qué sucede si pago < interés?
```

y sigue marcado como pendiente:

**detener esa parte y reportarlo.**

Puede continuar con partes que no dependan de esa decisión.

---

# 23. Definition of Done por tarea

Una tarea está terminada cuando:

```text
✓ Cumple criterios de aceptación
✓ No implementa scope futuro
✓ Tests relevantes pasan
✓ TypeScript pasa
✓ Lint pasa
✓ Build continúa saludable
✓ No introduce secretos
✓ No rompe flujo existente
✓ Documentación sigue consistente
```

Para cambios financieros:

```text
✓ Tiene tests de cálculo
```

obligatoriamente.

---

# 24. Checkpoints humanos

No vamos a dejar a Codex implementar las 10 fases seguidas.

Nuestros checkpoints principales serán:

**Checkpoint A — Fase 1**

Revisamos matemática.

**Checkpoint B — Fase 2**

Tú pruebas simulador.

**Checkpoint C — Fase 5**

Revisamos registro real de pagos.

**Checkpoint D — Fase 7**

Revisamos correcciones e historial.

**Checkpoint E — Fase 9**

Tu papá prueba Amorta.

**Checkpoint F — Producción**

Primera operación real.

---

# 25. Qué optimizamos

El objetivo de este plan no es:

> escribir código lo más rápido posible.

Es:

> **hacer que Codex pueda avanzar rápido sin tomar decisiones de producto por nosotros.**

La responsabilidad queda separada:

```text
Nosotros
│
├── Qué construir
├── Cómo debe comportarse
├── Reglas financieras
└── Validación

Codex
│
├── Analizar código
├── Planificar implementación
├── Implementar
├── Crear tests
└── Verificar
```

---

# 26. Estado inicial del proyecto

Antes de darle la primera tarea a Codex, el repositorio debería contener:

```text
/docs
  01-product.md
  02-ux.md
  03-data.md
  04-architecture.md
  05-implementation.md

AGENTS.md
```

Y después:

```text
Codex
  ↓
Task 0.1
  ↓
Checkpoint
  ↓
Task 0.2
  ↓
Checkpoint
  ↓
Task 1.1
  ↓
...
```
