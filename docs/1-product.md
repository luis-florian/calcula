# 01 — Definición de producto

**Producto:** Amorta _(nombre provisional)_
**Versión del documento:** 1.0
**Estado:** Definición inicial del MVP

## 1. Propósito

Amorta es una aplicación sencilla para **calcular y dar seguimiento a compraventas financiadas con interés calculado sobre el saldo pendiente**.

Está pensada inicialmente para un vendedor que acuerda con un comprador pagar un inmueble u otro bien mediante pagos periódicos.

La aplicación debe permitir dos momentos distintos:

**Antes del negocio:** simular diferentes condiciones y visualizar cómo sería el plan de pagos.

**Después de acordarlo:** guardar la operación y registrar los pagos que realmente se reciben hasta cancelar el saldo.

El producto debe ser genérico. No debe asumir un capital, tasa, plazo o pago mensual específicos.

---

## 2. Usuario principal

El usuario inicial es una **persona adulta mayor con muy poca experiencia utilizando computadoras y aplicaciones**.

Actualmente realiza este tipo de cálculos y registros utilizando principalmente:

- papel;
- agenda;
- calculadora.

Por lo tanto, la facilidad de uso tiene prioridad sobre la cantidad de funcionalidades.

La aplicación debe utilizar lenguaje cotidiano y evitar exigir conocimientos financieros o tecnológicos.

Por ejemplo, preferir:

> **Saldo pendiente: Q650,000**

sobre conceptos internos como:

> `Outstanding principal balance`

---

## 3. Concepto financiero

Una operación parte de un capital pendiente `C` y una tasa de interés anual `T`.

El interés se calcula sobre el **saldo actual**, considerando los días transcurridos:

$$
I=C\times T\times\frac{P}{365}
$$

Donde:

- `C` = capital/saldo pendiente.
- `T` = tasa anual.
- `P` = días transcurridos entre fechas.
- `I` = interés generado durante ese período.

Cuando se recibe un pago:

$$
A=Pago-I
$$

Donde `A` representa la cantidad que realmente reduce el capital.

Posteriormente:

$$
NuevoSaldo=C-A
$$

El nuevo saldo se utiliza para los cálculos posteriores.

### Ejemplo

Si:

- Saldo = Q765,000
- Tasa = 6%
- Han transcurrido 30 días
- Pago recibido = Q6,000

Entonces:

**Interés:** Q3,772.60

**Abono a capital:** Q2,227.40

**Nuevo saldo:** Q762,772.60

---

# 4. Simulación de una operación

Antes de registrar una venta, el usuario debe poder realizar simulaciones libremente.

Existirán **dos formas principales de calcularla**.

### Modalidad A — Indicar cuánto quiere recibir

El usuario proporciona, por ejemplo:

> Capital: **Q765,000**
> Tasa anual: **6%**
> Pago aproximado: **Q6,000 mensuales**
> Primera fecha: **15/10/2026**

La aplicación calcula aproximadamente:

> **Tiempo necesario para terminar:** X años y X meses
> Cantidad de pagos: X
> Último pago: QX,XXX
> Intereses totales aproximados: QXXX,XXX
> Total aproximado a recibir: QXXX,XXX

Y genera el calendario proyectado.

### Modalidad B — Indicar cuándo quiere terminar

El usuario proporciona:

> Capital: **Q765,000**
> Tasa anual: **6%**
> Plazo: **15 años**
> Primera fecha: **15/10/2026**

La aplicación calcula:

> **Pago periódico aproximado: QX,XXX**
> Cantidad de pagos: 180
> Intereses totales aproximados: QXXX,XXX
> Total aproximado a recibir: QXXX,XXX

Y genera igualmente el calendario.

---

# 5. Previsualización

**Una simulación no constituye todavía una venta registrada.**

El usuario podrá modificar capital, tasa, pago, plazo y fechas todas las veces que necesite.

La aplicación mostrará un resumen y el calendario proyectado.

Solamente cuando el usuario esté conforme seleccionará:

**GUARDAR VENTA**

A partir de ese momento la operación pasa a formar parte de **Mis ventas**.

---

# 6. Seguimiento de una venta

Una venta guardada debe mostrar principalmente:

> **Casa Juan Pérez**
>
> Saldo pendiente
> **Q712,430**
>
> Próximo pago
> **15 de octubre**
>
> Pago aproximado
> **Q6,000**
>
> **REGISTRAR PAGO**
>
> Ver calendario · Ver pagos anteriores

El saldo pendiente debe ser uno de los elementos visualmente más importantes.

---

# 7. Registro de pagos

Cuando el vendedor recibe dinero, la interacción debe ser muy sencilla.

El usuario introduce únicamente:

**Cantidad recibida**

**Fecha en que recibió el pago**

La aplicación determina automáticamente:

- días transcurridos;
- interés generado;
- cantidad aplicada a capital;
- nuevo saldo;
- impacto sobre la proyección futura.

Antes de guardarlo definitivamente se presenta una confirmación:

> ### Revise el pago
>
> Recibió: **Q6,000**
>
> Interés: **Q3,772.60**
> Abono a capital: **Q2,227.40**
> Nuevo saldo: **Q762,772.60**
>
> **CONFIRMAR**

Esto reduce el riesgo de registrar accidentalmente cantidades o fechas incorrectas.

---

# 8. Plan proyectado vs. pagos reales

La aplicación debe distinguir entre:

**Plan proyectado:** lo que debería ocurrir si se cumplen las condiciones acordadas.

**Historial real:** lo que efectivamente ocurrió.

Por ejemplo:

| Fecha  | Esperado |  Recibido |    Saldo |
| ------ | -------: | --------: | -------: |
| 15 ene |   Q6,000 |  Q6,000 ✓ | Q762,772 |
| 15 feb |   Q6,000 |  Q6,000 ✓ | Q760,XXX |
| 15 mar |   Q6,000 | Q12,000 ✓ | Q751,XXX |
| 15 abr |   Q5,9XX |         — | Q751,XXX |

Un pago real nunca debe eliminar o alterar silenciosamente el historial anterior.

---

# 9. Pagos diferentes a lo proyectado

El monto mensual **no necesariamente es una cuota rígida**.

El comprador puede entregar una cantidad diferente.

### Pago superior

Si entrega más dinero, el interés correspondiente al período se cubre y una cantidad mayor reduce el capital.

El sistema recalcula la proyección futura.

Para el MVP hemos decidido que el recálculo tendrá como referencia **mantener la fecha final proyectada**, por lo que un abono adicional a capital puede producir pagos futuros menores.

### Pago inferior

También debe poder registrarse.

El sistema calculará cuánto cubrió interés y cuánto redujo capital, dejando reflejado el saldo real.

La proyección futura se actualizará de acuerdo con las reglas que terminemos definiendo durante las pruebas.

### Pago tardío

Al utilizar días reales (`P`), un pago realizado después de la fecha proyectada tendrá más días de generación de interés.

**No se agregará mora ni penalización adicional en el MVP.**

---

# 10. Calendario

Cada venta tendrá un calendario/plan de pagos fácil de consultar.

Debe permitir identificar rápidamente:

**Pagado ✓**

**Próximo pago**

**Pagos futuros**

No buscamos inicialmente construir un calendario tradicional complejo. Puede ser una lista cronológica que visualmente se comporte como una **agenda o libreta de pagos**.

El diseño exacto se definirá en `02-ux.md`.

---

# 11. Principios de UX

Debido al usuario objetivo:

- texto suficientemente grande;
- botones grandes;
- alto contraste;
- pocas opciones simultáneas;
- lenguaje cotidiano;
- cantidades monetarias claramente visibles;
- evitar navegación escondida;
- confirmar operaciones importantes;
- permitir corregir errores;
- evitar términos técnicos innecesarios;
- mantener comportamientos consistentes entre pantallas.

El objetivo no es que el usuario **aprenda a utilizar software financiero**.

El software debe parecerse conceptualmente a la **agenda de pagos que ya conoce**.

---

# 12. Alcance del MVP

El MVP incluirá:

**Simular → Previsualizar → Guardar venta → Consultar venta → Registrar pagos → Recalcular → Consultar calendario/historial → Finalizar venta.**

Quedan explícitamente fuera de la primera versión:

mora y penalizaciones, contabilidad formal, facturación, múltiples monedas avanzadas, roles empresariales, reportes complejos, dashboards financieros, integraciones bancarias y cualquier funcionalidad administrativa que no sea necesaria para realizar el flujo principal.

---

# 13. Ciclo de validación

No se pretende definir todas las reglas de negocio perfectamente antes de permitir que el usuario pruebe la aplicación.

El proceso será:

**Definir → Implementar MVP → Usuario lo prueba → Toma notas → Revisamos → Ajustamos especificación → Nueva versión.**

Esto es particularmente importante para UX.

La primera versión permitirá descubrir comportamientos que resulten naturales en papel pero que todavía no hayamos considerado digitalmente.

---

## 14. Preguntas abiertas ⚠️

No inventaría estas respuestas todavía. Las dejaría explícitamente registradas:

**1. Pago menor al esperado.**
¿Simplemente se recalcula el plan o existe conceptualmente una cantidad pendiente correspondiente a ese período?

**2. Pago extraordinario.**
Hemos definido provisionalmente que se conserva la **fecha final** y disminuyen los pagos futuros. Debemos confirmar durante las pruebas que este sea exactamente el comportamiento esperado.

**3. Último pago.**
Debemos precisar el tratamiento exacto del interés generado hasta la fecha del último pago.

**4. Fechas.**
¿Qué sucede cuando el día acordado no existe en un determinado mes? Ejemplo: pagos programados para el día 31.

**5. Corrección de errores.**
Necesitamos definir si un pago registrado incorrectamente se edita, se anula y reemplaza, o se maneja mediante otra estrategia.

**6. Pago inferior al interés.**
Si durante un período se generan Q4,000 de interés y el comprador entrega solamente Q3,000, debemos definir cómo se representa ese Q1,000 restante.

Estas seis preguntas **no bloquean el diseño inicial**, pero sí deberían resolverse antes de considerar estable el motor financiero.
