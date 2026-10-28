---
title: 'Formato y análisis de fechas'
description: 'Convierte fechas en texto y valida entradas con DateTimeFormatter, patrones explícitos y un locale elegido por ti.'
section: biblioteca
order: 4
since: 8
---

## Una fecha no tiene formato

Un `LocalDate` guarda una fecha, no una cadena con barras. El formato aparece en la frontera:
cuando muestras ese valor o cuando interpretas lo que ha escrito alguien. Mantén el objeto dentro
de tu programa y convierte a texto solo al entrar o salir.

`DateTimeFormatter` hace las dos operaciones: `format` produce texto y `parse` lo interpreta.
En este capítulo todos los ejemplos usan APIs y sintaxis disponibles en Java 8; también puedes
compilarlos y ejecutarlos con Java 21, la versión de referencia del curso.

<figure class="diagram diagram--framed">
  <p class="diagram__label">La frontera entre valor y representación</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">Valor</span>
      <code class="diagram__value">LocalDate</code>
      <span class="diagram__hint">Año, mes y día, sin barras ni idioma.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">Contrato</span>
      <code class="diagram__value">DateTimeFormatter</code>
      <span class="diagram__hint">Patrón, locale y reglas de resolución.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Texto</span>
      <code class="diagram__value">27/10/2026</code>
      <span class="diagram__hint">Una representación, no un tipo de fecha.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Al mostrar recorres el camino hacia el texto; al analizar, hacia el valor.</figcaption>
</figure>

## Primero, el formato ISO

Para intercambiar una fecha sin hora, ISO evita discutir si `03/04` es marzo o abril.
`LocalDate.toString()` y `LocalDate.parse(texto)` usan el formato ISO de fecha local.

Guarda este programa como `IsoDates.java`:

```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class IsoDates {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2026, 10, 27);
        String text = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
        System.out.println(text);
        System.out.println(LocalDate.parse(text).equals(date));
    }
}
```

Compílalo y ejecútalo, también si estás comprobando compatibilidad desde un JDK 21:

```bash
javac --release 8 IsoDates.java
java IsoDates
```

Salida:

```text
2026-10-27
true
```

ISO no añade una zona a un `LocalDate`. Tampoco convierte una fecha local en un instante:
para eso necesitas hora y zona, conceptos distintos del formato.

## Patrones: las mayúsculas importan

`ofPattern` construye un formateador a partir de símbolos. Repetir una letra cambia su anchura
o su representación; no es un reemplazo de letras hecho a mano.

| Patrón | Significado | Ejemplo |
| --- | --- | --- |
| `uuuu` | Año proléptico, incluida la referencia al año cero | `2026` |
| `yyyy` | Año dentro de una era | `2026` |
| `MM` | Mes numérico de dos cifras | `10` |
| `MMM` / `MMMM` | Nombre abreviado / completo del mes | Depende del locale |
| `dd` | Día del mes | `27` |
| `HH` | Hora de 0 a 23 | `18` |
| `mm` | Minutos | `05` |
| `ss` | Segundos | `09` |
| `EEE` | Día de la semana abreviado | Depende del locale |

No cambies `MM` por `mm`: acabarías pidiendo minutos en vez de meses. `YYYY` tampoco es otra
forma de escribir el año de una fecha: es el año basado en semanas, que puede diferir cerca
de enero. Para fechas civiles habituales, empieza por `dd/MM/uuuu`.

Los literales se escriben entre comillas simples dentro del patrón, por ejemplo
`"d 'de' MMMM 'de' uuuu"`. Las comillas simples son parte del patrón, no de la salida.

## El locale es parte de tu decisión

Un patrón con nombres necesita idioma. Si no pasas un `Locale`, `ofPattern` usa el locale de
formato por defecto de la máquina. Tu portátil y el servidor pueden producir textos distintos.
El locale elige convenciones lingüísticas; no elige una zona horaria.

Guarda como `SpanishDates.java`:

```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class SpanishDates {
    public static void main(String[] args) {
        Locale spanish = Locale.forLanguageTag("es-ES");
        DateTimeFormatter display = DateTimeFormatter.ofPattern(
                "d 'de' MMMM 'de' uuuu", spanish);
        LocalDate date = LocalDate.of(2026, 10, 27);
        System.out.println(date.format(display));
        System.out.println(LocalDate.parse("27 de octubre de 2026", display));
    }
}
```

Salida al ejecutar `javac --release 8 SpanishDates.java` y `java SpanishDates`:

```text
27 de octubre de 2026
2026-10-27
```

Para una pantalla puedes usar `DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG)` y después
`.withLocale(spanish)`, importando `java.time.format.FormatStyle`. Dejas la disposición en manos
del locale en vez de fijar el patrón. No uses esa presentación como contrato de un fichero:
los datos lingüísticos del JDK pueden cambiar entre versiones.

## Analizar no siempre significa validar estrictamente

Un formateador creado con `ofPattern` usa `ResolverStyle.SMART` por defecto. Tras leer los campos,
resuelve la fecha y puede ajustar un día imposible al último día de ese mes. Para validar una
entrada de usuario sin correcciones silenciosas, pide `STRICT`.

Guarda como `StrictDates.java`:

```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.Locale;

public class StrictDates {
    public static void main(String[] args) {
        DateTimeFormatter smart = DateTimeFormatter.ofPattern(
                "dd/MM/uuuu", Locale.ROOT);
        DateTimeFormatter strict = smart.withResolverStyle(ResolverStyle.STRICT);
        System.out.println(LocalDate.parse("31/02/2026", smart));
        System.out.println(LocalDate.parse("29/02/2024", strict));
        try {
            LocalDate.parse("31/02/2026", strict);
        } catch (DateTimeParseException e) {
            System.out.println("Fecha inválida");
        }
        DateTimeFormatter yearOfEra = DateTimeFormatter.ofPattern(
                "dd/MM/yyyy", Locale.ROOT).withResolverStyle(ResolverStyle.STRICT);
        try {
            LocalDate.parse("27/10/2026", yearOfEra);
        } catch (DateTimeParseException e) {
            System.out.println("Falta la era para yyyy");
        }
    }
}
```

Salida al ejecutar `javac --release 8 StrictDates.java` y `java StrictDates`:

```text
2026-02-28
2024-02-29
Fecha inválida
Falta la era para yyyy
```

`yyyy` produce un año de era. En resolución estricta, sin una era no basta para construir este
`LocalDate`. `uuuu` expresa directamente el año proléptico y evita esa ambigüedad. No significa
que `yyyy` esté roto: tiene sentido cuando tu contrato incluye la era, por ejemplo con `G`.

> [!OJO]
> `STRICT` no hace limpieza de texto por ti. Si el contrato exige exactamente `dd/MM/uuuu`,
> no elimines espacios ni aceptes formatos alternativos sin decidirlo explícitamente.

Captura `DateTimeParseException` en la frontera y presenta un error comprensible. No uses su
mensaje completo como salida estable de tu aplicación: incluye detalles técnicos del análisis.
`ResolverStyle.LENIENT` permite ajustes todavía más amplios; no es un validador de formularios.

## Compartir un formateador es seguro

`DateTimeFormatter` es inmutable y seguro entre hilos. Puedes guardarlo en un campo
`private static final` y reutilizarlo en peticiones concurrentes sin sincronización adicional.
`withLocale` y `withResolverStyle` devuelven otro formateador: no reconfiguran el original.

Esto lo diferencia de `java.text.SimpleDateFormat`, que es mutable y no es seguro entre hilos.
No compartas una instancia antigua como si tuviera el contrato de `DateTimeFormatter`.
Cuando mantengas código heredado, aísla ese estado o migra la frontera a `java.time`.

## El tipo limita lo que puedes mostrar

Un patrón con `HH:mm` necesita hora. Aplicarlo a un `LocalDate` no inventa medianoche:
lanza `UnsupportedTemporalTypeException`. Usa `LocalDateTime` si realmente tienes fecha y hora,
y un tipo con zona o desplazamiento si esos datos forman parte del contrato.

Para profundizar en el modelo de valores, repasa [fechas con java.time](/docs/biblioteca/fechas-java-time/).
Si lo que necesitas es transformar datos antes de mostrarlos, vuelve a
[Strings](/docs/fundamentos/strings/), pero no sustituyas el análisis de fechas por cortes de texto.

## Qué te llevas

- Guarda fechas como valores y usa texto en las fronteras del programa.
- Usa ISO para contratos técnicos y un locale explícito para presentación lingüística.
- Distingue `MM`, `mm`, `uuuu`, `yyyy` y el año de semanas `YYYY`.
- Para validar fechas civiles, combina `uuuu` con `ResolverStyle.STRICT`.
- Reutiliza `DateTimeFormatter`: es inmutable y seguro entre hilos.
