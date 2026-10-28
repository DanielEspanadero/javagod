---
title: 'Zonas horarias, offsets y cambios de hora'
description: 'Distingue una zona de un offset y resuelve horas inexistentes o repetidas al convertir una cita local en un instante.'
section: biblioteca
order: 2
since: 8
---

## Una zona no es un número de horas

Si organizas una reunión a las 09:00 en Madrid, necesitas las reglas de Madrid para esa fecha.
No basta con restar una hora siempre. En invierno y en verano, el desplazamiento respecto a UTC
puede ser distinto. Tampoco toda España comparte zona: Canarias tiene sus propias reglas.

| Tipo | Qué conserva | Cuándo encaja |
| --- | --- | --- |
| `ZoneId` | Identificador de una zona y acceso a sus reglas | `Europe/Madrid` |
| `ZoneOffset` | Desplazamiento fijo respecto a UTC | `+01:00` |
| `OffsetDateTime` | Fecha, hora y desplazamiento | Un sello temporal recibido por una API |
| `ZonedDateTime` | Fecha, hora, zona y offset resuelto | Una cita situada en una zona |

Un offset permite convertir una fecha y hora local en un instante, pero no te dice las
reglas futuras de una ciudad. `Europe/Madrid` no es un sinónimo permanente de `+01:00`.
Usa identificadores regionales, no abreviaturas ambiguas como `CST`.

## Del instante a lo que marca el reloj

Un instante y una zona determinan una única fecha y hora local. El camino inverso puede tener
cero, una o dos respuestas por los cambios de hora. Todos los ejemplos usan Java 8.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Un evento, dos relojes</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Evento recibido</span>
      <code class="diagram__value">2024-07-01T12:00Z</code>
      <span class="diagram__hint">El instante no depende del lugar desde el que lo mires.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Madrid</span>
      <code class="diagram__value">14:00 +02:00</code>
      <span class="diagram__hint">Las reglas de esa fecha dan el horario de verano.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Canarias</span>
      <code class="diagram__value">13:00 +01:00</code>
      <span class="diagram__hint">Otra presentación del mismo instante, no un evento posterior.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Los dos relojes se calculan desde el nodo inicial. La secuencia compara representaciones, no suma horas al evento.</figcaption>
</figure>

Guarda este programa como `SameInstant.java`:

```java
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public class SameInstant {
    public static void main(String[] args) {
        Instant event = Instant.parse("2024-07-01T12:00:00Z");
        ZonedDateTime madrid = event.atZone(ZoneId.of("Europe/Madrid"));
        ZonedDateTime canary = madrid.withZoneSameInstant(
                ZoneId.of("Atlantic/Canary"));

        System.out.println(madrid);
        System.out.println(canary);
        System.out.println(madrid.toInstant().equals(canary.toInstant()));
    }
}
```

Salida con las reglas de zonas incluidas en el JDK 21 usado aquí:

```text
2024-07-01T14:00+02:00[Europe/Madrid]
2024-07-01T13:00+01:00[Atlantic/Canary]
true
```

`withZoneSameInstant` conserva el momento. `withZoneSameLocal` intenta conservar los campos
locales al cambiar de zona y puede cambiar el instante; además debe resolver posibles transiciones.
No lo uses para mostrar el mismo evento en otro país.

## Primavera: la hora que no existe

En Madrid, el 31 de marzo de 2024 el reloj saltó de las 02:00 a las 03:00.
La hora local 02:30 no ocurrió. Esto es un hueco, o *gap*.
Un `LocalDateTime` permite construirla porque no conoce ninguna zona.

Al llamar a `atZone`, Java aplica una política por defecto: desplaza la hora local hacia delante
la duración del hueco. En este caso, 02:30 pasa a 03:30, no a 03:00.
Puedes consultar los offsets válidos antes de aceptar esa decisión.

```java
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public class SpringGap {
    public static void main(String[] args) {
        ZoneId zone = ZoneId.of("Europe/Madrid");
        LocalDateTime requested = LocalDateTime.of(2024, 3, 31, 2, 30);
        System.out.println(zone.getRules().getValidOffsets(requested).size());

        ZonedDateTime resolved = requested.atZone(zone);
        System.out.println(resolved);
        System.out.println(resolved.toInstant());
    }
}
```

Salida:

```text
0
2024-03-31T03:30+02:00[Europe/Madrid]
2024-03-31T01:30:00Z
```

> [!OJO]
> Que Java resuelva la hora no significa que tu negocio deba aceptarla. Para una reserva,
> puedes rechazar el hueco y pedir otra hora. No cambies una cita silenciosamente sin decidir
> esa política con quien utiliza la aplicación.

## Otoño: la hora que ocurre dos veces

El 27 de octubre de 2024 el reloj de Madrid volvió de las 03:00 a las 02:00.
Las 02:30 ocurrieron dos veces: una con `+02:00` y otra con `+01:00`.
Es un solapamiento, o *overlap*. Son dos instantes separados por una hora.

`atZone` elige por defecto el offset anterior a la transición, el de la primera aparición.
`withLaterOffsetAtOverlap` selecciona la segunda; `withEarlierOffsetAtOverlap` permite
volver a la primera. Fuera de un solapamiento, estos métodos no cambian el valor.

```java
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public class AutumnOverlap {
    public static void main(String[] args) {
        ZoneId zone = ZoneId.of("Europe/Madrid");
        LocalDateTime requested = LocalDateTime.of(2024, 10, 27, 2, 30);
        System.out.println(zone.getRules().getValidOffsets(requested));

        ZonedDateTime first = requested.atZone(zone);
        ZonedDateTime second = first.withLaterOffsetAtOverlap();
        System.out.println(first.toInstant());
        System.out.println(second.toInstant());
        System.out.println(first.toLocalDateTime().equals(second.toLocalDateTime()));
        System.out.println(first.toInstant().equals(second.toInstant()));
    }
}
```

Salida:

```text
[+02:00, +01:00]
2024-10-27T00:30:00Z
2024-10-27T01:30:00Z
true
false
```

## Validar sin ajuste automático

`getValidOffsets(local)` devuelve una lista vacía en un hueco, un offset en una hora normal
y dos en un solapamiento. Puedes usar esa información para pedir una elección explícita.
No supongas que todos los cambios de hora duran sesenta minutos en todas las zonas.

Si ya tienes un offset elegido, `ZonedDateTime.ofStrict` comprueba que sea válido para la
zona y la hora local. No desplaza el hueco ni acepta un offset incompatible.

```java
import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;

public class StrictZone {
    public static void main(String[] args) {
        ZoneId zone = ZoneId.of("Europe/Madrid");
        LocalDateTime gap = LocalDateTime.of(2024, 3, 31, 2, 30);
        try {
            ZonedDateTime.ofStrict(gap, ZoneOffset.ofHours(1), zone);
        } catch (DateTimeException ex) {
            System.out.println("Hora inexistente o desplazamiento inválido");
        }
        LocalDateTime overlap = LocalDateTime.of(2024, 10, 27, 2, 30);
        System.out.println(ZonedDateTime.ofStrict(
                overlap, ZoneOffset.ofHours(1), zone).toInstant());
    }
}
```

Salida:

```text
Hora inexistente o desplazamiento inválido
2024-10-27T01:30:00Z
```

## Qué guardar y qué no dar por fijo

Para un evento pasado, el instante conserva cuándo ocurrió. Guarda además la zona o el offset
si necesitas reconstruir el contexto que vio la persona. Para una cita futura recurrente,
conserva la hora local, la zona y la política de transición, no solo el instante de la primera cita.

`ZoneId.systemDefault()` depende de la configuración del entorno. Un servidor puede usar UTC
mientras tu portátil usa Madrid. Recibe la zona como dato o como configuración explícita.
El JDK incluye una base de reglas horarias que se actualiza: las leyes futuras no están congeladas.
Los ejemplos usan transiciones históricas concretas, no el reloj actual ni la zona del equipo.

## Qué te llevas

- Un offset es fijo; una zona regional aporta reglas que dependen de la fecha.
- Para mostrar un evento en otra zona, conserva el instante con `withZoneSameInstant`.
- De hora local a instante puede haber cero, una o dos respuestas.
- `atZone` resuelve por defecto; `getValidOffsets` y `ofStrict` permiten controlar la decisión.
- No confundas las reglas históricas del ejemplo con una promesa sobre calendarios futuros.
