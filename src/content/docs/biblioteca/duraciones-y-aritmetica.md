---
title: 'Duraciones, periodos y aritmética de fechas'
description: 'Separa tiempo transcurrido de calendario, entiende los ajustes de fin de mes y calcula diferencias sin inventar días de 24 horas.'
section: biblioteca
order: 3
since: 8
---

## «Un día» necesita contexto

Una sesión que caduca dentro de 24 horas y una cita mañana a la misma hora no tienen la misma
regla. El cambio de hora puede hacer que entre dos mediodías consecutivos transcurran 23 o 25 horas.
`java.time` separa las cantidades de tiempo de las cantidades de calendario.

| Tipo | Qué representa | Ejemplo |
| --- | --- | --- |
| `Duration` | Cantidad basada en segundos y nanosegundos | Una espera de 90 minutos |
| `Period` | Cantidad de años, meses y días del calendario ISO | Una renovación cada mes |

`Duration.ofDays(1)` significa exactamente 24 horas. `Period.ofDays(1)` significa avanzar
un día de calendario cuando lo aplicas a un tipo que lo admite. Un mes no tiene un número fijo
de segundos, así que no hay una conversión universal de `Period.ofMonths(1)` a `Duration`.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Dos maneras de avanzar desde el mismo origen</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Origen en Madrid</span>
      <code class="diagram__value">30 marzo 2024, 12:00</code>
      <span class="diagram__hint">El offset inicial es +01:00, antes del salto de primavera.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Un día de calendario</span>
      <code class="diagram__value">31 marzo, 12:00 +02:00</code>
      <span class="diagram__hint">Con Period conservas la hora local: han pasado 23 horas.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Veinticuatro horas</span>
      <code class="diagram__value">31 marzo, 13:00 +02:00</code>
      <span class="diagram__hint">Con Duration conservas el tiempo transcurrido desde el origen.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Los dos resultados parten del primer nodo. No son dos sumas consecutivas: comparas intención de calendario y tiempo transcurrido.</figcaption>
</figure>

## Sumar con una intención explícita

Todos los programas del capítulo son compatibles con Java 8. Guarda este como `DayOrHours.java`.
Las salidas con `Europe/Madrid` usan las reglas históricas incluidas en el JDK 21 de la prueba.

```java
import java.time.Duration;
import java.time.Period;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public class DayOrHours {
    public static void main(String[] args) {
        ZonedDateTime start = ZonedDateTime.of(
                2024, 3, 30, 12, 0, 0, 0, ZoneId.of("Europe/Madrid"));
        ZonedDateTime nextDay = start.plus(Period.ofDays(1));
        ZonedDateTime after24Hours = start.plus(Duration.ofDays(1));

        System.out.println(nextDay);
        System.out.println(after24Hours);
        System.out.println(Duration.between(start, nextDay).toHours());
        System.out.println(Duration.between(start, after24Hours).toHours());
    }
}
```

Salida:

```text
2024-03-31T12:00+02:00[Europe/Madrid]
2024-03-31T13:00+02:00[Europe/Madrid]
23
24
```

En `ZonedDateTime`, `plusDays(1)` opera sobre el calendario local y `plusHours(24)` sobre
la línea temporal. Si el resultado local cae en un hueco o un solapamiento, también se aplican
las reglas de resolución de la zona. No todas las horas locales se pueden conservar siempre.

## Fin de mes: ajustar no es recordar

Sumar un mes al 31 de enero no puede producir un 31 de febrero. `plusMonths` ajusta el día
al último válido del mes de destino. Lo mismo puede pasar al cambiar el año de un 29 de febrero.
No conserva por dentro una intención oculta de «último día del mes».

```java
import java.time.LocalDate;

public class MonthEnd {
    public static void main(String[] args) {
        LocalDate start = LocalDate.of(2024, 1, 31);
        LocalDate february = start.plusMonths(1);

        System.out.println(february);
        System.out.println(february.plusMonths(1));
        System.out.println(start.plusMonths(2));
        System.out.println(february.minusMonths(1));
        System.out.println(LocalDate.of(2024, 2, 29).plusYears(1));
    }
}
```

Salida:

```text
2024-02-29
2024-03-29
2024-03-31
2024-01-29
2025-02-28
```

La suma encadenada perdió el día 31 al pasar por febrero. Restar después no recupera
necesariamente la fecha inicial. Para un vencimiento mensual, define si quieres mantener
el día original, ajustar cada resultado o usar siempre el último día del mes.
No dejes que una cadena de llamadas decida esa política por accidente.

## Ajustadores para reglas de calendario

`TemporalAdjusters` expresa reglas como el último día del mes o el siguiente lunes.
`next` siempre avanza; `nextOrSame` puede devolver la misma fecha si ya cumple la condición.
Estos métodos no conocen festivos ni jornadas laborables: esas reglas son de tu aplicación.

```java
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

public class CalendarRules {
    public static void main(String[] args) {
        LocalDate monday = LocalDate.of(2024, 4, 1);
        LocalDate january = LocalDate.of(2024, 1, 31);

        System.out.println(monday.with(
                TemporalAdjusters.next(DayOfWeek.MONDAY)));
        System.out.println(monday.with(
                TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY)));
        System.out.println(january.plusMonths(1).with(
                TemporalAdjusters.lastDayOfMonth()));
        System.out.println(january.plusMonths(2).with(
                TemporalAdjusters.lastDayOfMonth()));
    }
}
```

Salida:

```text
2024-04-08
2024-04-01
2024-02-29
2024-03-31
```

Para una serie mensual, calcula cada vencimiento desde la fecha base y su índice de mes.
Después aplica el ajuste acordado. Así no acumulas las pérdidas de día de resultados intermedios.
En cualquier caso, conserva el resultado: fechas, duraciones y periodos son inmutables.

## Diferencias: componentes o unidades completas

`Period.between` descompone una diferencia entre fechas en años, meses y días.
`getDays()` devuelve solo el componente de días, no el total del intervalo.
Para contar días completos entre fechas, usa `ChronoUnit.DAYS.between`.

```java
import java.time.Duration;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;

public class Differences {
    public static void main(String[] args) {
        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end = LocalDate.of(2024, 3, 2);
        Period calendar = Period.between(start, end);

        System.out.println(calendar);
        System.out.println(calendar.getDays());
        System.out.println(ChronoUnit.DAYS.between(start, end));
        System.out.println(ChronoUnit.DAYS.between(end, start));
        System.out.println(Duration.ofMinutes(90).toHours());
        System.out.println(Duration.ofHours(49).toDays());
    }
}
```

Salida:

```text
P2M1D
1
61
-61
1
2
```

`P2M1D` expresa dos meses y un día. `Duration.toHours()` y `toDays()` devuelven unidades
completas, descartando la fracción hacia cero, no redondeando al entero más cercano.
En una `Duration`, un día usado por `toDays()` son 24 horas, no un cambio de fecha local.
Invierte los extremos de `between` y obtendrás una cantidad negativa.

## Tipos que no admiten la operación

No puedes aplicar una `Duration` a un `LocalDate`: la fecha no tiene segundos ni hora.
Tampoco puedes pedir `Duration.between` de dos fechas sin hora. Esas operaciones lanzan
`UnsupportedTemporalTypeException`. Decide si necesitas días de calendario o si debes
incorporar una hora y una zona para medir tiempo transcurrido.

Un `LocalTime` vuelve a empezar al pasar medianoche. Si restas 23:00 a 01:00 sin fechas,
no has dicho que 01:00 sea «mañana». Para turnos nocturnos, conserva las fechas en el modelo.
Un `LocalDateTime` tampoco conoce cambios de offset: para medir tiempo real entre eventos,
trabaja con `Instant` o con valores que incluyan zona u offset.

> [!TRUCO]
> Escribe primero la regla en palabras: «cada día a las nueve», «dentro de 90 minutos» o
> «el último día del mes». Después elige `Period`, `Duration` o un ajustador.
> El nombre del método no sustituye esa decisión.

## Qué te llevas

- `Duration` mide segundos y nanosegundos; `Period` expresa años, meses y días.
- Un día de calendario no garantiza 24 horas en una zona con transiciones.
- Ajustar fin de mes puede perder el día original: sumar y restar no siempre se deshacen.
- `TemporalAdjusters` expresa reglas de calendario, pero no conoce tus festivos.
- Un componente de `Period` no es un total; elige la unidad y los extremos de la diferencia.
