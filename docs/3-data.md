# 03 — Modelo de datos

**Producto:** Amorta
**Versión:** 1.0
**Objetivo:** Definir la información que debe persistir el MVP y las relaciones entre sus entidades.

---

## 1. Principios

El modelo debe permitir:

- guardar una venta financiada;
- conocer sus condiciones originales;
- conocer su saldo actual;
- registrar cada pago recibido;
- conservar el historial financiero;
- recalcular la proyección futura;
- corregir errores sin perder trazabilidad;
- finalizar una venta;
- soportar operaciones que duren muchos años.

La **proyección** puede cambiar.

La **historia de lo que realmente ocurrió** no debe perderse.

---

# 2. Modelo conceptual

Para el MVP necesitamos principalmente tres entidades:

```text
Financing
   │
   ├──── Payment
   │
   ├──── Payment
   │
   ├──── Payment
   │
   └──── Payment
   │
   └──── Projection
```

Conceptualmente:

**Financing** = la venta/acuerdo.

**Payment** = dinero que realmente recibió el vendedor.

**Projection** = el plan de pagos que actualmente esperamos hacia el futuro.

Hay una diferencia importante:

> Los `Payment` son hechos históricos.

> La `Projection` es un cálculo y puede regenerarse.

---

# 3. Financing

Representa una compraventa financiada.

Ejemplo:

> Casa zona 10 — Juan Pérez
> Q765,000 al 6% anual.

Campos principales:

```text
Financing

id

name
buyer_name

initial_capital
current_balance

annual_interest_rate

calculation_mode
target_payment
target_end_date

first_payment_date
expected_payment_day

status

created_at
updated_at
completed_at
```

---

# 4. Identificación

### `id`

Identificador interno único.

Ejemplo:

```text
fin_123
```

El usuario nunca necesita verlo.

---

### `name`

Nombre con el que el vendedor reconoce la operación.

Ejemplo:

```text
Casa zona 10
```

Obligatorio.

---

### `buyer_name`

Nombre del comprador.

Ejemplo:

```text
Juan Pérez
```

Inicialmente puede ser opcional.

---

# 5. Condiciones financieras

### `initial_capital`

Capital original financiado.

```text
765000.00
```

Una vez iniciada la venta, este valor representa el acuerdo original y **no debería modificarse silenciosamente**.

---

### `current_balance`

Saldo pendiente actual.

Ejemplo:

```text
712430.50
```

Se actualiza al registrar pagos.

Aunque matemáticamente podríamos reconstruirlo recorriendo todos los pagos, guardar el saldo actual permite consultar la aplicación fácilmente.

Los pagos continúan siendo la fuente histórica que permite verificarlo.

---

### `annual_interest_rate`

Tasa anual acordada.

Ejemplo:

```text
6.0000
```

Representa:

**6% anual.**

No guardaremos `0.06` como representación visible.

---

# 6. Modalidad original

Necesitamos recordar cómo se creó la operación.

### `calculation_mode`

Valores:

```text
PAYMENT
TERM
```

`PAYMENT`:

> “Quiero recibir aproximadamente Q6,000 mensuales.”

`TERM`:

> “Quiero terminar aproximadamente en 15 años.”

---

### `target_payment`

Pago acordado/proyectado.

Ejemplo:

```text
6000.00
```

Puede originarse porque el usuario lo escribió o porque Amorta lo calculó.

---

### `target_end_date`

Fecha final proyectada.

Ejemplo:

```text
2041-09-15
```

Es especialmente importante porque acordamos provisionalmente:

> Si existe un pago extraordinario, se mantiene la fecha final y se recalculan los pagos futuros.

Por lo tanto necesitamos conservar esta referencia.

---

# 7. Fechas

### `first_payment_date`

Primera fecha acordada.

```text
2026-10-15
```

---

### `expected_payment_day`

Día esperado del mes.

```text
15
```

Esto facilita generar las fechas futuras.

Ejemplo:

> Cada día 15.

La regla para días 29, 30 o 31 todavía está pendiente de definición.

---

# 8. Estado de la venta

### `status`

Inicialmente:

```text
ACTIVE
COMPLETED
```

No necesitamos introducir diez estados.

`ACTIVE`

Todavía existe saldo pendiente.

`COMPLETED`

Saldo cancelado.

Posteriormente podrían aparecer `CANCELLED`, etc., pero no forman parte del MVP actual.

---

# 9. Payment

Esta es probablemente la entidad más importante desde el punto de vista histórico.

Cada vez que el vendedor selecciona:

**REGISTRAR PAGO**

creamos un `Payment`.

```text
Payment

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

created_at
```

Ejemplo real:

```text
payment_date:       2026-10-15

amount:             6000.00

previous_payment_date:
                    2026-09-15

days_elapsed:       30

opening_balance:    765000.00

interest_amount:    3772.60

principal_amount:   2227.40

closing_balance:    762772.60
```

Esto es deliberadamente más información que simplemente:

```text
fecha + Q6,000
```

Porque dentro de 8 años queremos poder responder:

> ¿Por qué después de este pago el saldo quedó exactamente en Q762,772.60?

Y tendremos todos los datos utilizados para calcularlo.

---

# 10. Fórmula asociada al Payment

Para cada pago:

```text
days_elapsed =
payment_date - previous_payment_date
```

Después:

```text
interest =
opening_balance
× annual_interest_rate
× days_elapsed
÷ 365
```

Después:

```text
principal =
payment_amount - interest
```

Finalmente:

```text
closing_balance =
opening_balance - principal
```

Y:

```text
Financing.current_balance =
Payment.closing_balance
```

---

# 11. Primer pago

Existe un caso especial:

> ¿Desde qué fecha empieza a generar intereses el primer pago?

`first_payment_date` no es suficiente para saberlo.

Necesitamos conocer la fecha desde la cual comienza el financiamiento.

Agregaría entonces a `Financing`:

```text
start_date
```

Ejemplo:

```text
start_date:         2026-09-15
first_payment_date: 2026-10-15
```

Entonces:

```text
P = 30 días
```

Esto evita inventar que el primer período siempre dura exactamente un mes.

---

# 12. Projection

Aquí tomaría una decisión de arquitectura de datos importante:

**la proyección no tiene la misma importancia histórica que los pagos.**

Por ejemplo:

Hoy esperamos:

```text
15/10 → Q6,000
15/11 → Q6,000
15/12 → Q6,000
...
```

Pero después de un pago extraordinario podría convertirse en:

```text
15/11 → Q5,850
15/12 → Q5,850
...
```

No necesitamos tratar ambas proyecciones como si ambas hubieran ocurrido.

Para el MVP podemos tener:

```text
Projection

id
financing_id

payment_number
expected_date

opening_balance
expected_payment
expected_interest
expected_principal
expected_closing_balance
```

---

# 13. ¿Guardar la proyección o calcularla?

Tenemos dos posibilidades.

**A — Guardar las 180, 240, etc. filas.**

o

**B — Calcularlas cuando sean necesarias.**

Para Amorta v1 recomiendo inicialmente **calcular la proyección a partir del estado actual y guardarla solamente si encontramos una necesidad concreta de persistencia**.

¿Por qué?

Porque la proyección cambia cuando existen pagos reales diferentes.

Entonces nuestra información verdaderamente importante es:

```text
Financing
+
Payments
```

A partir de eso podemos generar:

```text
Projection[]
```

cuando el usuario abre:

**Ver plan de pagos.**

Eso mantiene el modelo mucho más limpio.

Por lo tanto `Projection` sería inicialmente un **modelo calculado**, no necesariamente una tabla PostgreSQL.

---

# 14. Simulaciones no guardadas

Cuando el usuario está en:

**Calcular → modificar → calcular → modificar...**

no necesitamos guardar cada intento en Neon.

Por ejemplo:

```text
Q765,000
6%
Q6,000

↓

resultado

↓

cambia a Q7,000

↓

resultado
```

Todo esto puede existir temporalmente en la aplicación.

Solamente:

**GUARDAR VENTA**

crea un `Financing`.

Esto evita llenar la base de datos con simulaciones descartadas.

---

# 15. Pago esperado vs. pago real

No necesitamos crear anticipadamente 180 `Payment`.

Los pagos reales aparecen únicamente cuando efectivamente se recibe dinero.

Ejemplo:

```text
Projection

Octubre   Q6,000
Noviembre Q6,000
Diciembre Q6,000
```

Después:

```text
Payments

15 octubre
Q6,000
```

Noviembre y diciembre **todavía no son Payments**.

Son solamente proyecciones.

Esta separación será muy importante para evitar inconsistencias.

---

# 16. Corrección de pagos

Aquí recomiendo desde ya una estrategia:

**no modificar silenciosamente un pago histórico.**

Agregaría:

```text
Payment

status
voided_at
void_reason
```

Estados:

```text
CONFIRMED
VOIDED
```

Si el usuario registró:

```text
Q60,000
```

pero realmente eran:

```text
Q6,000
```

la aplicación puede:

1. marcar el registro incorrecto como `VOIDED`;
2. crear el pago correcto;
3. recalcular los pagos posteriores.

De esta manera conservamos evidencia de qué ocurrió.

En la UI puede seguir diciendo simplemente:

**Corregir pago**

La complejidad queda dentro del sistema.

---

# 17. Orden de los pagos

Los pagos deben tener un orden determinista:

```text
payment_date
created_at
```

Esto importa porque el saldo de un pago depende del anterior.

Por ejemplo:

```text
Pago 1
↓
Saldo Q760,000

Pago 2
↓
Saldo Q755,000

Pago 3
↓
Saldo Q750,000
```

Si corregimos Pago 1, necesitamos recalcular Pago 2 y Pago 3.

Por eso los pagos forman conceptualmente una **cadena de cálculos**.

---

# 18. Dinero

Nunca utilizar `float` para dinero.

En PostgreSQL/Neon utilizaremos tipos exactos, por ejemplo:

```text
NUMERIC
```

Conceptualmente trabajaremos siempre con precisión monetaria.

Ejemplo:

```text
765000.00
```

y definiremos una política única de redondeo para todo el motor financiero.

Esta política deberá tener pruebas automatizadas.

---

# 19. Fechas

Para fechas financieras utilizaremos conceptualmente:

```text
DATE
```

y no timestamps cuando la hora sea irrelevante.

Nos importa:

> 15 de octubre de 2026

no:

> 15 octubre 2026, 14:32:51 UTC.

`created_at`, en cambio, sí será timestamp porque representa cuándo se creó un registro dentro del sistema.

Esto también evita muchos problemas innecesarios de zona horaria en los cálculos financieros.

---

# 20. Relaciones

El modelo queda muy pequeño:

```text
┌─────────────────────────────┐
│         FINANCING           │
├─────────────────────────────┤
│ id                          │
│ name                        │
│ buyer_name                  │
│ initial_capital             │
│ current_balance             │
│ annual_interest_rate        │
│ calculation_mode            │
│ target_payment              │
│ target_end_date             │
│ start_date                  │
│ first_payment_date          │
│ expected_payment_day        │
│ status                      │
│ created_at                  │
│ updated_at                  │
│ completed_at                │
└──────────────┬──────────────┘
               │
               │ 1:N
               ▼
┌─────────────────────────────┐
│           PAYMENT           │
├─────────────────────────────┤
│ id                          │
│ financing_id                │
│ payment_date                │
│ amount                      │
│ previous_payment_date       │
│ days_elapsed                │
│ opening_balance             │
│ interest_amount             │
│ principal_amount            │
│ closing_balance             │
│ status                      │
│ voided_at                   │
│ void_reason                 │
│ created_at                  │
└─────────────────────────────┘
```

Y:

```text
Projection[]
```

se calcula utilizando:

```text
Financing + Payments + reglas financieras
```

---

# 21. Qué NO guardar

Evitaría campos derivados innecesarios como:

```text
years_remaining
months_remaining
total_paid_display
formatted_balance
formatted_date
```

Eso se calcula.

Por ejemplo:

```text
total_received =
SUM(Payment.amount)
```

No necesitamos guardar continuamente ese número.

Menos datos duplicados significa menos posibilidades de inconsistencias.

---

# 22. Backup y durabilidad

Hay una consideración que para esta aplicación considero más importante de lo normal.

Esto no es una app que tu papá utilizará tres meses.

Una venta podría durar:

**5, 10, 15 o incluso 20 años.**

Por lo tanto, los datos deben sobrevivir:

- cambios de teléfono;
- cambios de navegador;
- actualizaciones de Amorta;
- nuevas versiones del frontend;
- errores humanos;
- cambios futuros de infraestructura.

La información **no puede depender de localStorage o del dispositivo**.

Neon será la fuente persistente.

La estrategia concreta de backups y recuperación se definirá en `04-architecture.md`.

---

# 23. Modelo mínimo del MVP

Finalmente, a nivel de base de datos, el MVP puede comenzar literalmente con:

```text
financings
payments
```

Dos tablas.

No necesitamos:

```text
customers
properties
installments
payment_schedules
transactions
accounts
ledgers
contracts
```

todavía.

Si el producto evoluciona, podremos normalizarlo posteriormente.

Para el problema actual:

> **Una venta tiene muchos pagos.**

es suficiente.

---

# 24. Preguntas abiertas

Quedan algunas decisiones que deben alinearse posteriormente con `01-product.md`:

**Pago inferior al interés:** necesitamos decidir cómo representar interés no cubierto.

**Corrección histórica:** ya proponemos `VOIDED + nuevo Payment`, pero debemos definir exactamente cómo recalcular pagos posteriores.

**Cambio del acuerdo:** si después de 5 años comprador y vendedor acuerdan cambiar de 6% a 5%, ¿se modifica el Financing o necesitamos versiones del acuerdo? Fuera del MVP por ahora.

**Pago en la misma fecha:** decidir si pueden existir dos pagos diferentes el mismo día.

**Fecha inicial:** confirmar exactamente qué fecha representa el comienzo de generación de intereses.

**Redondeo:** definir cuándo redondeamos interés y saldo a centavos.

Estas preguntas no bloquean el modelo inicial.
