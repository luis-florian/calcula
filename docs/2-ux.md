# 02 — UX y pantallas

**Producto:** Amorta _(nombre provisional)_
**Versión:** 1.0
**Objetivo:** Definir navegación, pantallas y comportamiento del MVP.

---

## 1. Principio general

Amorta está diseñada principalmente para una persona adulta mayor con poca experiencia utilizando aplicaciones.

La interfaz debe sentirse más cercana a una:

**agenda + calculadora + libreta de pagos**

que a un sistema financiero.

Las acciones principales serán solamente:

**Calcular una venta → Guardarla → Consultarla → Registrar pagos**

El sistema realiza automáticamente los cálculos financieros.

---

# 2. Navegación principal

La aplicación tendrá únicamente **dos secciones principales**:

### Mis ventas

Lugar donde aparecen los negocios que ya fueron guardados.

### Calcular

Permite realizar una nueva simulación sin guardar nada inicialmente.

En móvil podrían existir dos botones inferiores grandes:

```text
┌─────────────────────────────────┐
│                                 │
│          CONTENIDO              │
│                                 │
│                                 │
├────────────────┬────────────────┤
│   Mis ventas   │    Calcular    │
└────────────────┴────────────────┘
```

No habrá menús complejos ni navegación de múltiples niveles.

---

# 3. Pantalla — Mis ventas

Será la pantalla inicial.

Debe responder inmediatamente:

> **¿Quién me debe y cuánto me debe?**

Ejemplo:

```text
AMORTA

Mis ventas

┌──────────────────────────────────┐
│ Casa - Juan Pérez                │
│                                  │
│ Saldo pendiente                  │
│ Q712,430.50                       │
│                                  │
│ Próximo pago                     │
│ 15 de octubre                    │
│                                  │
│ Pago aproximado                  │
│ Q6,000                           │
│                                  │
│           VER VENTA              │
└──────────────────────────────────┘


┌──────────────────────────────────┐
│ Terreno - Carlos López           │
│                                  │
│ Saldo pendiente                  │
│ Q185,300                         │
│                                  │
│ Próximo pago                     │
│ 22 de octubre                    │
│                                  │
│           VER VENTA              │
└──────────────────────────────────┘


        + CALCULAR NUEVA VENTA
```

Las ventas finalizadas no deberían ocupar espacio entre las ventas activas.

Podrían existir posteriormente bajo:

**Ver ventas finalizadas**

---

# 4. Pantalla — Nueva simulación

Al seleccionar:

**CALCULAR NUEVA VENTA**

no mostramos inmediatamente un formulario enorme.

Primero preguntamos:

> ### ¿Qué quiere calcular?

Dos tarjetas grandes:

```text
┌──────────────────────────────────┐
│ QUIERO INDICAR EL PAGO           │
│                                  │
│ Ejemplo: quiero recibir          │
│ Q6,000 cada mes.                 │
│                                  │
│ Calcularemos cuánto tiempo       │
│ tardará en terminar.             │
└──────────────────────────────────┘


┌──────────────────────────────────┐
│ QUIERO INDICAR EL TIEMPO         │
│                                  │
│ Ejemplo: quiero terminar         │
│ en 15 años.                      │
│                                  │
│ Calcularemos cuánto debería      │
│ recibir cada mes.                │
└──────────────────────────────────┘
```

Evitaría nombres como:

`Modalidad A / Modalidad B`.

---

# 5. Flujo A — Indicar pago

Si selecciona:

**QUIERO INDICAR EL PAGO**

aparece:

```text
CALCULAR VENTA

¿Cuánto se financiará?

Q [ 765,000        ]


¿Cuál será el interés anual?

[ 6 ] %


¿Cuánto quiere recibir cada mes?

Q [ 6,000          ]


¿Cuándo será el primer pago?

[ 15 / 10 / 2026 ]


          CALCULAR
```

No mostraríamos fórmulas.

No preguntamos número de pagos porque precisamente eso es lo que queremos calcular.

---

# 6. Flujo B — Indicar tiempo

Si selecciona:

**QUIERO INDICAR EL TIEMPO**

cambia solamente una parte:

```text
CALCULAR VENTA

¿Cuánto se financiará?

Q [ 765,000        ]


¿Cuál será el interés anual?

[ 6 ] %


¿En cuánto tiempo quiere
terminar de recibir los pagos?

[ 15 ] años


¿Cuándo será el primer pago?

[ 15 / 10 / 2026 ]


          CALCULAR
```

El sistema determinará el pago periódico correspondiente.

---

# 7. Resultado de simulación

Esta es una de las pantallas más importantes.

Primero mostramos **el resultado**, no la matemática.

Ejemplo:

```text
RESULTADO

Capital
Q765,000

Interés
6% anual


────────────────────────────────

Pago aproximado

       Q6,456

       cada mes

────────────────────────────────

Tiempo aproximado

       15 años

       180 pagos

────────────────────────────────

Total aproximado a recibir
Q1,162,XXX


Primer pago
15 de octubre de 2026

Último pago aproximado
15 de septiembre de 2041


       VER PLAN DE PAGOS


       GUARDAR VENTA


       CAMBIAR DATOS
```

Si el usuario llegó indicando Q6,000, entonces el protagonista de esta pantalla será el **tiempo resultante**.

Si llegó indicando 15 años, el protagonista será el **pago resultante**.

---

# 8. Pantalla — Plan proyectado

Aquí debemos evitar mostrar 180 filas de golpe.

Primero:

```text
PLAN DE PAGOS

Pago aproximado
Q6,456 mensual

Termina aproximadamente
Septiembre 2041


────────────────────────────────

15 OCT 2026

Pago             Q6,456
Interés           Q3,XXX
Abono a capital   Q2,XXX
Saldo             Q762,XXX


15 NOV 2026

Pago             Q6,456
Interés           Q3,XXX
Abono a capital   Q2,XXX
Saldo             Q759,XXX


15 DIC 2026

Pago             Q6,456
Interés           Q3,XXX
Abono a capital   Q2,XXX

              ...

        VER MÁS PAGOS
```

Podríamos agrupar posteriormente por año:

**2026 · 2027 · 2028...**

Eso se decidirá al construir/probar la UI.

---

# 9. Guardar venta

Desde la simulación:

**GUARDAR VENTA**

La aplicación pregunta solamente información necesaria para identificarla:

```text
GUARDAR VENTA

¿Cómo quiere identificar esta venta?

[ Casa zona 10              ]


¿A quién se la vendió?

[ Juan Pérez                ]


              CONTINUAR
```

Antes de guardar definitivamente:

```text
CONFIRMAR VENTA

Casa zona 10
Juan Pérez

Capital
Q765,000

Interés
6%

Pago aproximado
Q6,456

Primer pago
15 octubre 2026

Final aproximado
septiembre 2041


        GUARDAR VENTA

        REGRESAR
```

Esto protege contra errores.

---

# 10. Pantalla — Detalle de venta

Una vez guardada, esta probablemente será **la pantalla que más utilizará tu papá**.

Por eso debe ser extremadamente sencilla:

```text
← MIS VENTAS


CASA ZONA 10

Juan Pérez


       SALDO PENDIENTE

        Q712,430.50


────────────────────────────────

Próximo pago

15 DE OCTUBRE

Aproximadamente
Q6,000


       REGISTRAR PAGO


────────────────────────────────

Ver plan de pagos

Ver pagos recibidos

Datos de la venta
```

El botón más importante es:

**REGISTRAR PAGO**

---

# 11. Registrar pago

No debe preguntarle cosas que el sistema pueda calcular.

```text
REGISTRAR PAGO

Casa zona 10


¿Cuánto recibió?

Q [ 6,000          ]


¿Qué día recibió el dinero?

[ 15 / 10 / 2026 ]


             CONTINUAR
```

Nada más.

---

# 12. Confirmación del pago

Antes de modificar las cuentas:

```text
REVISE EL PAGO

Recibió

       Q6,000

el 15 de octubre de 2026


────────────────────────────────

Interés de este período
Q3,520

Abono a la deuda
Q2,480

Saldo anterior
Q712,430

Nuevo saldo
Q709,950


────────────────────────────────

       CONFIRMAR PAGO

       REGRESAR
```

El usuario puede revisar antes de confirmar.

---

# 13. Pago superior al esperado

Supongamos que debía aproximadamente Q6,000 pero recibe:

**Q12,000**

No le preguntamos:

> ¿Desea amortizar principal?

El sistema ya conoce la regla.

La confirmación podría mostrar:

```text
REVISE EL PAGO

Recibió

       Q12,000


Este pago es mayor
al esperado.


Interés             Q3,520
Abono a la deuda    Q8,480


Nuevo saldo
Q703,950


Sus próximos pagos
serán menores.

Fecha final estimada:
Septiembre 2041


       CONFIRMAR PAGO
```

Lenguaje cotidiano primero; detalle financiero después.

---

# 14. Pago inferior al esperado

Por ejemplo:

Esperado:

**Q6,000**

Recibido:

**Q4,000**

Mostramos:

```text
REVISE EL PAGO

Esperado aproximadamente
Q6,000

Recibió
Q4,000


El pago fue menor
al esperado.


Interés
Q3,520

Abono a la deuda
Q480


Nuevo saldo
Q711,950


       CONFIRMAR PAGO
```

No mostramos mora porque no existe en el MVP.

El comportamiento futuro exacto quedará sujeto a las reglas pendientes de `01-product.md`.

---

# 15. Pago registrado

Después de confirmar necesitamos una respuesta inequívoca:

```text
        ✓

PAGO REGISTRADO


Recibió
Q6,000


Nuevo saldo

Q709,950


Próximo pago

15 DE NOVIEMBRE


           LISTO
```

`LISTO` regresa al detalle de la venta.

---

# 16. Historial de pagos

Debe parecer una libreta.

```text
PAGOS RECIBIDOS

Casa zona 10


15 SEP 2026                 ✓
Q6,000

Saldo después del pago
Q712,430


────────────────────────────

15 AGO 2026                 ✓
Q6,000

Saldo después del pago
Q714,XXX


────────────────────────────

15 JUL 2026                 ✓
Q12,000

Saldo después del pago
Q717,XXX
```

Al tocar un pago:

```text
PAGO DEL 15 DE SEPTIEMBRE

Recibido
Q6,000

Interés
Q3,XXX

Abono a deuda
Q2,XXX

Saldo anterior
Q714,XXX

Saldo resultante
Q712,430
```

---

# 17. Corregir un pago

Como estamos trabajando con dinero, **no pondría un botón "Eliminar" grande junto al pago**.

Dentro del detalle:

**Corregir este pago**

↓

Advertencia:

```text
CORREGIR PAGO

Cambiar este pago puede modificar
el saldo y los pagos posteriores.

¿Desea continuar?


       CONTINUAR

       CANCELAR
```

La implementación exacta —editar versus reversar y recrear— la decidiremos en arquitectura/datos.

Desde UX solamente necesitamos garantizar que **sea posible corregir errores y que no ocurra accidentalmente**.

---

# 18. Venta terminada

Cuando el saldo llegue a cero:

```text
        ✓

VENTA COMPLETADA


Casa zona 10
Juan Pérez


Total recibido
QX,XXX,XXX

Capital
Q765,000

Intereses recibidos
QXXX,XXX


Primer pago
15 octubre 2026

Último pago
8 junio 2040


       VER HISTORIAL
```

La venta pasa posteriormente a:

**Ventas finalizadas**

y deja de aparecer entre las operaciones activas.

---

# 19. Estados vacíos

La primera vez que abra la aplicación:

```text
AMORTA


Todavía no tiene
ventas guardadas.


Puede calcular cómo serían
los pagos de una venta.


       CALCULAR UNA VENTA
```

No debería enfrentarse a un dashboard vacío lleno de ceros.

---

# 20. Errores y validaciones

Los mensajes deben explicar **qué corregir**, no utilizar lenguaje técnico.

Evitar:

> `Invalid numeric input`

Usar:

> **Ingrese una cantidad mayor a Q0.**

Evitar:

> `Calculation failed`

Usar:

> **No pudimos calcular el plan. Revise los datos e intente nuevamente.**

Y cuando una combinación sea matemáticamente imposible —por ejemplo, un pago tan pequeño que ni siquiera cubre el interés— debemos explicarlo claramente en vez de generar un calendario infinito.

---

# 21. Formato visual

Como punto de partida:

**Dinero**

`Q765,000.00`

Nunca:

`765000`

**Tasas**

`6% anual`

**Fechas**

Preferentemente:

`15 de octubre de 2026`

en pantallas importantes.

En tablas/listas:

`15 OCT 2026`

**Botones**

Altos y fáciles de presionar.

**Tipografía**

Grande, especialmente cantidades, fechas y acciones.

---

# 22. Responsive

Aunque técnicamente será una aplicación web desplegada en Vercel, la UX debe priorizar:

**teléfono y tablet.**

No diseñaremos primero una aplicación de escritorio para después intentar reducirla a móvil.

Una interfaz de una sola columna debería cubrir prácticamente todo el MVP.

Esto también reduce muchísimo la complejidad de implementación.

---

# 23. Flujo completo del MVP

El recorrido principal queda:

```text
ABRIR AMORTA
     │
     ▼
 MIS VENTAS
     │
     ├───────────────┐
     │               │
     ▼               ▼
CALCULAR          VER VENTA
     │               │
     ▼               ▼
Elegir modo      Saldo actual
     │               │
     ▼               ▼
Ingresar datos   Registrar pago
     │               │
     ▼               ▼
Calcular         Cantidad + fecha
     │               │
     ▼               ▼
Previsualizar    Revisar cálculo
     │               │
     ├──────┐        ▼
     │      │      Confirmar
     ▼      ▼        │
Modificar Guardar    ▼
            │     Nuevo saldo
            ▼        │
        Mis ventas ◄─┘
```

Ese debería ser el **happy path que Codex debe proteger por encima de cualquier funcionalidad secundaria**.

---

# 24. Criterio fundamental de UX

Para cada pantalla nos haremos esta pregunta durante las pruebas:

> **¿Tu papá sabe qué debe hacer aquí sin que tú tengas que explicárselo?**

Si la respuesta es no, primero intentaremos **cambiar la interfaz**, no agregar un manual.

Y agregaría otra prueba muy importante:

> **¿Puede registrar correctamente un pago después de no utilizar Amorta durante un mes?**

Porque probablemente ese será el patrón real de uso.
