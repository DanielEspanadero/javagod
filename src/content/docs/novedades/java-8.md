---
title: 'Java 8'
description: 'Lambdas, Streams y java.time: la versión que cambió cómo se escribe Java.'
section: novedades
order: 1
since: 8
---

## Qué fue

Java 8 apareció el 18 de marzo de 2014 (JSR 337) y es la versión que cambió la forma de
escribir Java. Hasta ese momento, pasar una operación a un método exigía una clase anónima de
cinco líneas. Desde entonces, se pasa una función.

Es también la LTS a la que medio mundo se quedó anclado durante años, y no por comodidad: la
siguiente llegó en 2018.

## Lambdas y métodos con cuerpo por defecto

Una lambda es una función sin nombre que se puede pasar como valor:

```java
List<String> nombres = Arrays.asList("Ada", "Alan", "Grace");
nombres.forEach(nombre -> System.out.println(nombre));

nombres.sort((a, b) -> a.length() - b.length());
```

Para que eso fuera posible sin romper la biblioteca, las interfaces ganaron métodos por
defecto: una interfaz puede traer implementación y las clases existentes no se enteran.

```java
interface Formateador {
    String formatear(String valor);

    default String formatearDosVeces(String valor) {
        return formatear(formatear(valor));
    }
}
```

Esa es la pieza que hizo evolucionar `Collection` sin tener que tocar un millón de
implementaciones: `forEach`, `stream()` y `removeIf` llegaron de esta forma.

También llegaron las referencias a métodos (`String::length`), las anotaciones en los tipos,
las anotaciones repetidas y los nombres de los parámetros en tiempo de ejecución con
`-parameters`.

## Streams: la otra mitad

Una lambda sin biblioteca que la use no sirve de mucho. La JEP 107 trajo las operaciones en
bloque sobre colecciones, con la misma idea en serie o en paralelo:

```java
List<String> largos = nombres.stream()
    .filter(nombre -> nombre.length() > 3)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());
```

`stream()` describe, no ejecuta hasta que algo lo consume. Esa pereza es lo que permite
optimizar el recorrido y lo que explica que una tubería sin operación final no haga nada.

> [!NOTA]
> Desde Java 16, `Stream` tiene `toList()`, que hace lo mismo sin pasar por `Collectors`. En
> Java 8 se escribe como en el ejemplo.

## java.time reemplaza a Date

`Date` y `Calendar` eran mutables, no eran seguros entre hilos y llevaban dos decisiones
discutibles: el mes empieza en cero y los años en 1900. `java.time` (JEP 150) trae valores
inmutables con nombres que se leen:

```java
LocalDate hoy = LocalDate.now();
LocalDate dentroDeUnaSemana = hoy.plusWeeks(1);
Duration pausa = Duration.ofMillis(250);
```

`Instant` es el instante en la línea de tiempo, `LocalDate` y `LocalTime` no llevan zona,
`ZonedDateTime` sí, y `Period` cuenta fechas. Todo inmutable: sumar devuelve otro valor.

## La JVM: se va PermGen

La JEP 122 retiró la generación permanente. Los metadatos de clase pasan a la memoria nativa
(Metaspace), así que `-XX:MaxPermSize` deja de existir y el clásico
`java.lang.OutOfMemoryError: PermGen space` pasa a ser un `Metaspace`.

La misma versión retiró tres combinaciones de recolector que casi nadie usaba (JEP 173) y
metió árboles en los cubos de `HashMap` cuando hay muchas colisiones (JEP 180): el peor caso
pasa de O(n) a O(log n).

## Lo que se quedó por el camino

- PermGen (JEP 122), junto con sus banderas de línea de comandos.
- Tres combinaciones de GC y la bandera `-Xincgc` (JEP 173).
- La herramienta `apt` y su API, sustituidas por el procesador de anotaciones de `javac`
  (JEP 117).
- Nada más se retiró. Nashorn, el motor de JavaScript para la JVM, llegó en esta versión
  (JEP 174) y ya está fuera del JDK actual.

## El mapa de la versión

| Área | JEP | Qué trajo |
| --- | --- | --- |
| Lenguaje | 126 | Lambdas y métodos por defecto en interfaces |
| Lenguaje | 104, 120 | Anotaciones en tipos y anotaciones repetidas |
| Lenguaje | 118, 101 | Nombres de parámetros en ejecución e inferencia de tipo objetivo |
| Biblioteca | 107 | Streams, en serie y en paralelo |
| Biblioteca | 109 | `forEach`, `removeIf` y compañía en las colecciones |
| Biblioteca | 150 | `java.time` |
| Biblioteca | 135 | Base64 en la biblioteca estándar |
| Biblioteca | 155 | Mejoras de concurrencia |
| Biblioteca | 103, 180 | Orden en paralelo y árboles en `HashMap` |
| JVM | 122 | Fuera PermGen, entra Metaspace |
| JVM | 173 | Se retiran tres combinaciones de GC |
| Herramientas | 117, 139 | Se retira `apt` y `javac` compila más rápido |

## Qué te llevas

- Las lambdas cambiaron la unidad de composición: ahora se pasan funciones, no objetos.
- Los métodos por defecto permitieron evolucionar interfaces sin romper a nadie.
- Un `Stream` es una descripción perezosa que solo se ejecuta con una operación final.
- `java.time` es inmutable y sustituye a `Date` y `Calendar` en código nuevo.
- PermGen desapareció: los metadatos viven en memoria nativa.
- Es la LTS que más años se usó, y por eso el salto a 11 o 17 sigue siendo el salto grande.
