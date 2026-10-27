---
title: 'Fechas y horas con java.time'
description: 'Elige entre fechas locales e instantes, construye valores válidos y trabaja con un reloj controlado sin perderte con la zona.'
section: biblioteca
order: 1
since: 8
---

## Primero, qué dato quieres guardar

Un cumpleaños no es un instante universal. Una alarma a las ocho tampoco identifica por sí sola
un momento. Antes de llamar a un método, decide qué información tiene tu dato.
`java.time`, disponible desde Java 8, separa esas ideas en tipos distintos.

| Dato | Tipo | Ejemplo |
| --- | --- | --- |
| Día de calendario, sin hora | `LocalDate` | Fecha de nacimiento |
| Hora del día, sin fecha | `LocalTime` | Apertura de una tienda |
| Fecha y hora, sin zona | `LocalDateTime` | Hora local propuesta para una cita |
| Punto en la línea temporal | `Instant` | Momento en que se recibió un pago |

El prefijo `Local` significa que no hay zona ni desplazamiento respecto a UTC.
No quiere decir «la zona de tu ordenador». Un `LocalDateTime` no puede decirte si una
cita ocurre antes que un evento guardado como `Instant` sin añadir más información.

<figure class="diagram diagram--framed">
  <p class="diagram__label">De calendario a momento concreto</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Día y hora</span>
      <code class="diagram__value">LocalDate + LocalTime</code>
      <span class="diagram__hint">Dos valores que describen lo que marca un calendario y un reloj.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Fecha y hora local</span>
      <code class="diagram__value">LocalDateTime</code>
      <span class="diagram__hint">Juntarlos sigue sin aportar una zona horaria.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Instante</span>
      <code class="diagram__value">Instant</code>
      <span class="diagram__hint">Necesitas resolver la zona o aportar un offset para llegar aquí.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">La fecha y la hora no bastan para situarte en la línea temporal. El último paso requiere información adicional.</figcaption>
</figure>

## Construir sin depender del reloj

Usa `of` para campos separados y `parse` para el formato ISO que admite cada tipo.
En estas fábricas los meses van de 1 a 12; `Month` evita números poco expresivos.
Todos los programas de este capítulo son compatibles con Java 8.

Guarda este primero como `LocalValues.java`:

```java
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;

public class LocalValues {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2024, Month.FEBRUARY, 29);
        LocalTime time = LocalTime.of(9, 30);
        LocalDateTime appointment = date.atTime(time);

        System.out.println(date);
        System.out.println(time);
        System.out.println(appointment);
        System.out.println(appointment.toLocalDate().equals(date));
        System.out.println(LocalDate.parse("2024-02-29").getDayOfWeek());
    }
}
```

Salida:

```text
2024-02-29
09:30
2024-02-29T09:30
true
THURSDAY
```

El texto ISO coloca primero el año. `toString()` sirve para inspeccionar el valor,
no para decidir el formato que verá una persona en tu aplicación.
`getDayOfWeek()` devuelve un enum, no un nombre traducido al castellano.

## Inmutables: transformar devuelve otro valor

Las clases principales de `java.time` son inmutables. Una llamada a `plusDays` o `withHour`
no modifica el receptor: devuelve un resultado. Si lo ignoras, no has actualizado tu variable.
Esto permite compartir un valor sin que otro código cambie sus campos a escondidas.

```java
import java.time.LocalDate;

public class ImmutableDates {
    public static void main(String[] args) {
        LocalDate start = LocalDate.of(2024, 2, 28);
        start.plusDays(1);
        LocalDate next = start.plusDays(1);

        System.out.println(start);
        System.out.println(next);
        System.out.println(start.isBefore(next));
        System.out.println(next.equals(LocalDate.of(2024, 2, 29)));
    }
}
```

Salida:

```text
2024-02-28
2024-02-29
true
true
```

Compara valores con `equals`, `isBefore` o `isAfter`, no con `==`.
Que dos referencias apunten al mismo objeto no es la pregunta que te interesa aquí.
Una variable puede reasignarse al resultado; la inmutabilidad pertenece al objeto,
no convierte automáticamente tu variable en `final`.

## Los campos inválidos no se normalizan en silencio

`LocalDate.of(2023, 2, 29)` no se convierte en marzo: lanza `DateTimeException`.
`LocalTime.of(24, 0)` también falla; la medianoche se representa como `00:00`.
Los segundos válidos de `LocalTime` van de 0 a 59.

Para comprobarlo sin depender del texto del mensaje de la excepción:

```java
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalTime;

public class InvalidFields {
    public static void main(String[] args) {
        try {
            LocalDate.of(2023, 2, 29);
        } catch (DateTimeException ex) {
            System.out.println("Fecha inválida");
        }
        try {
            LocalTime.of(24, 0);
        } catch (DateTimeException ex) {
            System.out.println("Hora inválida");
        }
    }
}
```

Salida:

```text
Fecha inválida
Hora inválida
```

> [!OJO]
> Validar campos al construir y sumar meses son operaciones distintas. La aritmética de meses
> puede ajustar el día al último válido del mes de destino. No extrapoles la regla de `of`
> a todos los métodos de la API.

## `Instant`: cuándo ocurrió algo

`Instant` representa un punto en la línea temporal mediante segundos desde el origen
`1970-01-01T00:00:00Z` y una fracción de nanosegundo. La `Z` del texto ISO indica UTC.
No almacena la zona de una ciudad ni una presentación local del evento.

`Instant.now()` consulta el reloj del sistema. `LocalDate.now()` consulta además la zona
predeterminada para decidir qué día es. Ninguna de esas llamadas tiene una salida fija.
Si ejecutas una prueba cerca de medianoche, el día puede cambiar entre dos llamadas.

## Un reloj explícito para probar

Pasa un `Clock` a tu código cuando necesites «ahora». En producción puedes proporcionar
`Clock.systemUTC()` o `Clock.system(zone)`; en una prueba, `Clock.fixed`.
La zona del reloj se usa al pedir una fecha local; no cambia el instante fijado.

```java
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

public class FixedClock {
    public static void main(String[] args) {
        Instant event = Instant.parse("2024-01-01T00:30:00Z");
        Clock utc = Clock.fixed(event, ZoneOffset.UTC);
        Clock west = utc.withZone(ZoneOffset.ofHours(-1));

        System.out.println(Instant.now(utc));
        System.out.println(LocalDate.now(utc));
        System.out.println(LocalDate.now(west));
        System.out.println(Instant.now(utc).equals(Instant.now(west)));
    }
}
```

Salida:

```text
2024-01-01T00:30:00Z
2024-01-01
2023-12-31
true
```

Aquí el resultado es estable porque has fijado tanto el instante como los offsets.
Un `Instant` no garantiza que el reloj físico tenga precisión de nanosegundos, y el reloj
civil del sistema puede corregirse. Para medir rendimiento, usa `System.nanoTime()` y
resta dos lecturas; no lo conviertas en una fecha.

## Elegir en una aplicación real

Guarda una fecha de nacimiento como `LocalDate`: inventarle medianoche y UTC cambia el modelo.
Para una recepción de mensaje, guarda un `Instant`. Para una cita futura ligada a un lugar,
conserva también la zona y la intención local: sus reglas pueden cambiar por decisiones legales.

Evita empezar código nuevo con `Date` y `Calendar` si puedes usar `java.time`.
Si integras una API antigua, `Date.toInstant()` y `Date.from(instant)` sirven de puente;
`Date` trabaja con milisegundos, por lo que la conversión puede perder precisión.

## Qué te llevas

- Elige el tipo según el significado: día, hora, fecha y hora local o instante.
- `Local` no añade la zona del equipo ni identifica por sí solo un momento universal.
- Las transformaciones devuelven valores; conserva el resultado y compara con `equals`.
- `of` rechaza campos inválidos; el reloj y la zona predeterminados no dan salidas fijas.
- Inyecta un `Clock` para probar «ahora» y separa fechas civiles de mediciones de rendimiento.
