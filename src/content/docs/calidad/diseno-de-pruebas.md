---
title: 'Diseño de pruebas'
description: 'Comprueba contratos observables con casos pequeños, entradas deterministas y errores que no dejen cambios a medias.'
section: calidad
order: 1
since: 8
---

## Una prueba protege una promesa

Una prueba útil responde a una pregunta: si usas esta operación como lo haría su cliente,
¿obtienes lo que promete? No basta con ejecutar líneas sin que salte una excepción.
Necesitas comparar un resultado observable con una expectativa decidida antes de ejecutar.

Observa valores devueltos, estado accesible por la interfaz pública o efectos en una frontera
externa. No inspecciones campos privados ni invoques métodos privados mediante reflexión.
Si cambias de algoritmo sin cambiar el contrato, esas pruebas deberían seguir pasando.

Todos los ejemplos de este capítulo usan Java 8 y se han ejecutado con el JDK 21.
No necesitan bibliotecas de pruebas. Los `AssertionError` son explícitos: no dependen de
activar `java -ea`, a diferencia de la sentencia `assert` del lenguaje.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Una pregunta, tres pasos</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Prepara</span>
      <code class="diagram__value">Arrange</code>
      <span class="diagram__hint">Fija los datos y el estado inicial que exige el caso.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Actúa</span>
      <code class="diagram__value">Act</code>
      <span class="diagram__hint">Invoca la operación pública cuyo contrato quieres comprobar.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Comprueba</span>
      <code class="diagram__value">Assert</code>
      <span class="diagram__hint">Contrasta el resultado y los efectos que forman esa promesa.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">El resultado esperado viene del contrato, no de repetir la implementación dentro de la prueba.</figcaption>
</figure>

## Arrange, act, assert sin ceremonia

Supón una reserva de plazas. `reserve` admite cantidades positivas que no superen la
capacidad disponible; si rechaza una petición, no cambia las plazas. `available()` permite
observar el estado sin saber cómo se almacena. Guarda el programa como `ReservationCheck.java`.

```java
public class ReservationCheck {
    public static final class Seats {
        private int available;

        public Seats(int capacity) {
            if (capacity < 0) {
                throw new IllegalArgumentException("negative capacity");
            }
            available = capacity;
        }

        public int available() {
            return available;
        }

        public void reserve(int count) {
            if (count <= 0) {
                throw new IllegalArgumentException("positive count required");
            }
            if (count > available) {
                throw new IllegalStateException("not enough seats");
            }
            available -= count;
        }
    }

    public static void main(String[] args) {
        Seats seats = new Seats(3);           // Arrange
        seats.reserve(2);                     // Act
        equal(1, seats.available());          // Assert
        System.out.println("reservation OK");
    }

    private static void equal(int expected, int actual) {
        if (expected != actual) {
            throw new AssertionError("expected " + expected + ", got " + actual);
        }
    }
}
```

Compila y ejecuta en una carpeta de trabajo que contenga el archivo:

```sh
javac --release 8 -Xlint:-options ReservationCheck.java
java ReservationCheck
```

Salida exacta:

```text
reservation OK
```

`equal` es un auxiliar de la prueba, no una puerta trasera del objeto.
Su comparación usa el método público. En un proyecto real, una biblioteca de pruebas
aporta estas aserciones y un ejecutor para descubrir los casos automáticamente.

## Un motivo para fallar no significa una sola aserción

Una prueba llamada `reservingTwoLeavesOneSeat` describe una regla concreta.
Una llamada a `reserve` y una consulta bastan para ese caso. Si añades después cancelaciones,
correos y descuentos, un fallo ya no te dice qué promesa has roto.

En cambio, rechazar una operación puede exigir varias aserciones: el tipo de excepción,
su mensaje si pertenece al contrato y que el estado siga intacto. Todas responden al mismo
motivo: una reserva inválida debe rechazarse sin consumir plazas.

No conviertas «una aserción» en una regla mecánica. Separa escenarios, no consecuencias
inseparables del mismo escenario. Cada caso debe poder ejecutarse solo y en cualquier orden.
Crear un objeto nuevo por caso suele resultar más claro que reiniciar una instancia compartida.

## Diseña los límites antes de escribir más casos

Una reserva de dos plazas en una sala de tres no demuestra qué ocurre en los extremos.
Dibuja las clases de entradas y elige representantes con una expectativa explícita.

| Caso | Preparación | Expectativa |
| --- | --- | --- |
| Mínimo válido | Tres plazas, reservar una | Quedan dos |
| Límite exacto | Tres plazas, reservar tres | Quedan cero |
| Justo fuera | Tres plazas, reservar cuatro | Error y quedan tres |
| Cero | Tres plazas, reservar cero | Error y quedan tres |
| Negativo | Tres plazas, reservar menos una | Error y quedan tres |
| Sin capacidad | Cero plazas, reservar una | Error y quedan cero |

No necesitas enumerar todos los enteros. Necesitas cubrir las decisiones relevantes y sus
fronteras. Si tu dominio usa importes, cadenas o fechas, pregunta también por vacío, longitud
máxima, cambio de mes y valores ausentes según lo que acepte el contrato.

## Comprueba el error completo

Guarda este segundo archivo como `RejectionCheck.java`, junto al anterior.
Comprueba el límite exacto y tres rechazos. Cada rechazo usa una instancia independiente.
El `AssertionError` posterior a `reserve` impide que la ausencia de excepción pase inadvertida.

```java
public class RejectionCheck {
    public static void main(String[] args) {
        ReservationCheck.Seats full = new ReservationCheck.Seats(3);
        full.reserve(3);
        equal(0, full.available());
        rejected(0, IllegalArgumentException.class, "positive count required");
        rejected(-1, IllegalArgumentException.class, "positive count required");
        rejected(4, IllegalStateException.class, "not enough seats");
        System.out.println("boundaries OK");
    }

    private static void rejected(int count, Class<? extends RuntimeException> type,
                                 String message) {
        ReservationCheck.Seats seats = new ReservationCheck.Seats(3);
        try {
            seats.reserve(count);
            throw new AssertionError("expected rejection");
        } catch (RuntimeException error) {
            if (error.getClass() != type || !message.equals(error.getMessage())) {
                throw new AssertionError("wrong rejection", error);
            }
        }
        equal(3, seats.available());
    }

    private static void equal(int expected, int actual) {
        if (expected != actual) {
            throw new AssertionError("expected " + expected + ", got " + actual);
        }
    }
}
```

Ejecuta `javac --release 8 -Xlint:-options ReservationCheck.java RejectionCheck.java`
y después `java RejectionCheck`. La salida exacta es:

```text
boundaries OK
```

No captures `Exception` para imprimir «todo bien». Tampoco pongas la comprobación del estado
solo dentro del `catch`: debe quedar claro que el rechazo ocurrió y que no hubo efectos parciales.
Repasa los [tipos de excepciones](/docs/fundamentos/excepciones/) si dudas sobre qué capturar.

## Controla el tiempo y el azar

Si una regla caduca a una hora, prueba antes, exactamente en el límite y después.
No esperes con `Thread.sleep` para llegar allí: es lento y depende del planificador.
Haz que la operación reciba un instante o un `Clock`; en pruebas, usa un reloj fijo.
Guarda este programa independiente como `ExpiryCheck.java`.

```java
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

public class ExpiryCheck {
    public static boolean expired(Instant deadline, Clock clock) {
        return !clock.instant().isBefore(deadline);
    }

    public static void main(String[] args) {
        Instant deadline = Instant.parse("2024-06-01T10:00:00Z");
        check(false, expired(deadline, Clock.fixed(deadline.minusSeconds(1), ZoneOffset.UTC)));
        check(true, expired(deadline, Clock.fixed(deadline, ZoneOffset.UTC)));
        check(true, expired(deadline, Clock.fixed(deadline.plusSeconds(1), ZoneOffset.UTC)));
        System.out.println("expiry OK");
    }

    private static void check(boolean expected, boolean actual) {
        if (expected != actual) {
            throw new AssertionError("wrong expiry decision");
        }
    }
}
```

Compila con `javac --release 8 -Xlint:-options ExpiryCheck.java` y ejecuta `java ExpiryCheck`.
La salida exacta es `expiry OK`, seguida de un salto de línea.
Si necesitas azar, pasa datos elegidos de antemano o una fuente controlable.
Una semilla fija ayuda a reproducir una secuencia, pero no demuestra todos los resultados posibles.

## Dobles en fronteras reales, no entre cada dos clases

Un doble sustituye una dependencia durante la prueba. Un stub devuelve respuestas preparadas;
un fake ofrece una implementación simplificada; un mock comprueba interacciones acordadas.
Son útiles ante un servidor de pagos, un servicio de correo o un almacenamiento externo.
No necesitas sustituir una lista, un valor de dominio o cada colaborador que hayas extraído.

Comprueba una interacción cuando sea el efecto público: por ejemplo, que se solicite un único
cobro con un importe y una clave de idempotencia concretos. No verifiques cuántas veces se
invoca un auxiliar privado. Complementa el doble con pruebas de integración de la frontera real:
un fake no demuestra que el servidor acepte tu protocolo ni que la base de datos aplique su esquema.

## Deja espacio para refactorizar

Una prueba de `available()` puede sobrevivir a sustituir un contador por un cálculo sobre reservas.
Una prueba del campo privado `available` no puede. Si un detalle cambia y el cliente no lo nota,
no debería obligarte a reescribir el contrato probado. No expongas campos solo para poder probarlos.

Con objetos de valor, compara contenido conforme a [los contratos de Object](/docs/objetos/object-y-contratos/),
no identidad salvo que compartir la misma instancia sea parte de la promesa.
Antes de dar un caso por bueno, comprueba que detectaría un resultado incorrecto plausible.
Ejecutar código sin aserciones da actividad, no evidencia de corrección.

## Qué te llevas

- Prueba comportamiento público y expresa de dónde sale el resultado esperado.
- Separa preparación, acción y comprobación; da a cada caso un motivo reconocible para fallar.
- En los errores, comprueba también que el estado no cambia.
- Elige límites y entradas deterministas, sin esperas reales ni azar accidental.
- Reserva los dobles para fronteras externas y deja los detalles internos libres para cambiar.
