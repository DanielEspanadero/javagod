---
title: 'Collectors, Optional y agregación'
description: 'Cómo convertir un stream en una colección y agrupar sus datos con Collectors, y cómo devolver un Optional en vez de un null.'
section: colecciones
order: 6
since: 8
---

## De un flujo a un valor

El capítulo anterior dejó el pipeline: una fuente, unas operaciones intermedias y una terminal que lo
dispara. `collect` es la terminal que convierte el flujo en un valor: una lista, un conjunto, un mapa,
un número o un texto. Le pasas un `Collector`, la receta que dice cómo acumular los elementos.

La receta tiene cuatro piezas: crear la caja vacía, meter un elemento, juntar dos cajas cuando el
trabajo se reparte y convertir la caja en el resultado. `Collectors` trae las recetas montadas.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Un collector por dentro</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">Crear la caja</span>
      <code class="diagram__value">Supplier&lt;A&gt;</code>
      <span class="diagram__hint">Devuelve el contenedor vacío donde se acumula.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">Meter un elemento</span>
      <code class="diagram__value">BiConsumer&lt;A, T&gt;</code>
      <span class="diagram__hint">Añade un elemento del stream a la caja.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Juntar dos cajas</span>
      <code class="diagram__value">BinaryOperator&lt;A&gt;</code>
      <span class="diagram__hint">Une dos cajas cuando el stream reparte el trabajo.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">04</span><span class="diagram__title">Cerrar el resultado</span>
      <code class="diagram__value">Function&lt;A, R&gt;</code>
      <span class="diagram__hint">Convierte la caja en lo que devuelve <code>collect</code>.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Cuatro piezas: crear la caja, llenarla, juntar dos cajas y cerrar el resultado. <code>Collectors</code> trae las recetas montadas para no escribirlas a mano.</figcaption>
</figure>

## Los collectors de cada día

`toList` recoge en una lista, `toSet` descarta duplicados, `joining` pega textos y `counting` cuenta.

```java
import java.util.*;
import java.util.stream.*;

record Libro(String titulo, String autor, int paginas) {} // Java 16

List<String> nombres = List.of("Ada", "Grace", "Alan", "Ada"); // Java 9
List<Libro> libros = List.of(
        new Libro("El nombre del viento", "Rothfuss", 662),
        new Libro("El juego de Ender", "Card", 352),
        new Libro("La música del silencio", "Rothfuss", 304));

List<String> lista = nombres.stream().collect(Collectors.toList());
Set<String> conjunto = nombres.stream().collect(Collectors.toSet());
String texto = nombres.stream().collect(Collectors.joining(", ", "Nombres: ", "."));

int total = libros.stream().collect(Collectors.summingInt(Libro::paginas));
double media = libros.stream().collect(Collectors.averagingDouble(Libro::paginas));
Optional<Libro> corto = libros.stream()
        .collect(Collectors.minBy(Comparator.comparingInt(Libro::paginas)));
Optional<Libro> largo = libros.stream()
        .collect(Collectors.maxBy(Comparator.comparingInt(Libro::paginas)));

System.out.println(lista);                     // [Ada, Grace, Alan, Ada]
System.out.println(conjunto.size());           // 3: el duplicado se fue
System.out.println(texto);                     // Nombres: Ada, Grace, Alan, Ada.
System.out.println(nombres.stream().collect(Collectors.counting()));  // 4
System.out.println(total);                     // 1318
System.out.println(media);                     // 439.3333333333333
System.out.println(corto.map(Libro::titulo).orElse("ninguno"));  // La música del silencio
System.out.println(largo.map(Libro::titulo).orElse("ninguno"));  // El nombre del viento
```

`Collectors.toList()` no promete el tipo ni que la lista se pueda modificar; en OpenJDK devuelve un
`ArrayList`. `joining` pega con separador, prefijo y sufijo; `summingInt` devuelve un `Integer` y
`averagingDouble` un `Double`. `minBy` y `maxBy` piden un `Comparator` y devuelven un `Optional`.

## `toMap` y las claves repetidas

`toMap` recibe dos funciones: una saca la clave y otra el valor. El mapa se construye recorriendo el
stream, y una clave repetida es un problema, no una sustitución silenciosa.

```java
List<String> palabras = List.of("ala", "beta", "alba", "baúl", "auge", "aire"); // Java 9

Map<String, Integer> longitud = palabras.stream()
        .collect(Collectors.toMap(p -> p, String::length));
System.out.println(longitud.get("beta"));            // 4

try {
    palabras.stream().collect(Collectors.toMap(p -> p.substring(0, 1), String::length));
} catch (IllegalStateException e) {
    System.out.println(e.getMessage());              // nombra a y los dos valores
}

Map<String, Integer> cuentaPorLetra = palabras.stream()
        .collect(Collectors.toMap(p -> p.substring(0, 1), p -> 1, Integer::sum));
System.out.println(cuentaPorLetra.get("a"));         // 4
```

El segundo `toMap` lanza `IllegalStateException`: dos palabras con la misma inicial pelean por la
clave. La función de mezcla de la tercera sobrecarga decide qué hacer con los dos valores.

## Agrupar: `groupingBy` y `partitioningBy`

`groupingBy` recibe una función que saca la clave del grupo y, si quieres, un collector que decide qué
se guarda dentro. Sin el segundo, cada grupo es una `List`.

```java
List<String> palabras = List.of("ala", "beta", "alba", "baúl", "auge"); // Java 9

Map<Character, Long> cuenta = palabras.stream()
        .collect(Collectors.groupingBy(p -> p.charAt(0), Collectors.counting()));
System.out.println(cuenta.get('a'));                    // 3
System.out.println(cuenta.get('b'));                    // 2

Map<Character, List<String>> porLetra = palabras.stream()
        .collect(Collectors.groupingBy(p -> p.charAt(0),
                Collectors.mapping(String::toUpperCase, Collectors.toList())));
System.out.println(porLetra.get('a'));                  // [ALA, ALBA, AUGE]

Map<Character, Double> mediaLongitud = palabras.stream()
        .collect(Collectors.groupingBy(p -> p.charAt(0),
                Collectors.averagingDouble(String::length)));
System.out.println(mediaLongitud.get('a'));             // 3.6666666666666665

Map<Boolean, List<String>> largas = palabras.stream()
        .collect(Collectors.partitioningBy(p -> p.length() > 10));
System.out.println(largas.get(true));                   // []
System.out.println(largas.size());                      // 2: las dos claves existen siempre
```

`counting` devuelve un `Long`, no un `long`, por la misma razón que `summingInt`. `mapping` transforma
cada elemento antes de que lo guarde el collector de dentro y `averagingDouble` calcula la media de cada
grupo.

`partitioningBy` solo puede partir por un `Predicate`, así que devuelve un `Map<Boolean, ...>` con las
claves `true` y `false` aunque un grupo quede vacío: `largas.get(true)` es una lista vacía, no `null`.
`groupingBy` no crea grupos vacíos: sin palabras que empiecen por `c`, la clave `'c'` no existe.

## Resultados que no se pueden tocar

Desde Java 10, `Collectors.toUnmodifiableList` recoge en una lista que nadie modifica. Desde Java 16,
`Stream.toList()` hace lo mismo sin pasar por un collector.

| Llamada | Desde | ¿Se puede modificar? | ¿Acepta `null`? |
| --- | --- | --- | --- |
| `Collectors.toList()` | Java 8 | No lo promete; en OpenJDK, sí | Sí |
| `Collectors.toUnmodifiableList()` | Java 10 | No | No |
| `Stream.toList()` | Java 16 | No | Sí |

```java
List<String> conNulo = Arrays.asList("a", null, "b");

List<String> conToList = conNulo.stream().toList();       // Java 16, admite el null
System.out.println(conToList);                            // [a, null, b]

try {
    conToList.add("c");
} catch (UnsupportedOperationException e) {
    System.out.println("toList no deja modificar");       // se imprime
}

try {
    conNulo.stream().collect(Collectors.toUnmodifiableList()); // Java 10
} catch (NullPointerException e) {
    System.out.println("el collector rechaza el null");   // se imprime
}
```

La diferencia que muerde es el `null`: el collector lo rechaza con `NullPointerException` y
`Stream.toList()` lo deja pasar; las dos son instantáneas.

## `reduce` o `collect`

`reduce` combina los elementos en un valor sin caja intermedia, con un acumulador inmutable. `collect`
construye un contenedor mutable, como una lista o un mapa, y lo llena.

## `Optional`: el valor que puede faltar

Un método que puede no tener nada que devolver puede devolver `null` o un `Optional`: `null` no dice
nada en la firma y `Optional` obliga a decidir qué hacer. Se construye con `Optional.of` (no admite
`null`), `Optional.empty()` u `Optional.ofNullable`, que convierte un `null` en vacío.

```java
import java.util.*;
import java.util.function.Supplier;

record Articulo(String nombre, int stock) {} // Java 16

Map<String, Articulo> catalogo = Map.of("teclado", new Articulo("teclado", 3)); // Java 9

Optional<Articulo> encontrado = Optional.ofNullable(catalogo.get("monitor"));
Optional<Articulo> teclado = Optional.of(catalogo.get("teclado"));

System.out.println(encontrado);                              // Optional.empty
System.out.println(teclado.map(Articulo::stock).orElse(0));  // 3
System.out.println(encontrado.filter(a -> a.stock() > 0).isPresent()); // false

List<String> registro = new ArrayList<>();
Supplier<String> porDefecto = () -> {
    registro.add("llamada");
    return "sin stock";
};
System.out.println(Optional.of("teclado").orElse(porDefecto.get()));  // teclado
System.out.println(registro.size());                         // 1: orElse evaluó el argumento
System.out.println(Optional.of("teclado").orElseGet(porDefecto));     // teclado
System.out.println(registro.size());                         // 1: orElseGet no lo evaluó

teclado.ifPresent(a -> System.out.println(a.stock()));       // 3
encontrado.ifPresentOrElse(                                  // Java 9
        a -> System.out.println(a.nombre()),
        () -> System.out.println("no está"));                // no está
```

`map` transforma el valor si está y devuelve vacío si no, `filter` lo descarta cuando no cumple y
`flatMap` es el que usas cuando la función ya devuelve un `Optional`, para no acabar con un
`Optional<Optional<T>>`. `orElse` evalúa siempre su argumento; `orElseGet` recibe un `Supplier` y solo
lo llama si está vacío: constante con `orElse`, llamada que cuesta con `orElseGet`.

`orElseThrow` es para cuando la ausencia es un error; `ifPresent` y, desde Java 9, `ifPresentOrElse`
ejecutan código si hay valor, sin devolver nada. Y `get()` es la excepción esperando a ocurrir: si el
`Optional` está vacío lanza `NoSuchElementException`, que es el `null` disfrazado.

Un `Optional` es un tipo de retorno y nada más: no es un campo (puede ser `null` él mismo), no es un
parámetro (obliga a envolver lo que ya tienes) y no es un elemento de colección (una
`List<Optional<T>>` es una lista de envoltorios). Para los primitivos están `OptionalInt`,
`OptionalLong` y `OptionalDouble`: `IntStream.max()` devuelve un `OptionalInt` y `average()` un
`OptionalDouble`, también en `LongStream`.

## `parallelStream` no es gratis

Un stream en paralelo usa el `ForkJoinPool.commonPool()`, que comparte con el resto de la aplicación, y
solo compensa con bastantes datos y trabajo independiente.

> [!AVISO]
> Antes de añadir `.parallel()` o `parallelStream()`, comprueba tres cosas. El orden de `forEach` deja
> de estar garantizado (para conservarlo está `forEachOrdered`), un acumulador compartido como un
> `ArrayList` puede perder actualizaciones o lanzar una excepción, y con pocos elementos el coste de
> repartir supera al de hacerlo en un hilo. No es una opción por defecto.

```java
int suma = IntStream.rangeClosed(1, 10_000)
        .parallel()
        .filter(n -> n % 2 == 0)
        .sum();
System.out.println(suma);   // 25005000
```

El ejemplo no comparte estado, el orden da igual y hay diez mil elementos, pero que sea más rápido no
está garantizado: sin un benchmark, `.parallel()` es una apuesta.

## Quiero esto, uso esto

| Quiero | Uso |
| --- | --- |
| Quitar repetidos y conservar el orden | `stream.distinct().toList()` (Java 16) |
| Agrupar y contar | `collect(groupingBy(clave, counting()))` |
| Unir textos con separador | `collect(joining(", "))` |
| Sumar un campo | `collect(summingInt(C::campo))` |
| El primero que cumpla algo | `stream.filter(...).findFirst()` |
| Un valor que puede faltar | `Optional.ofNullable(...)`, con `orElse` u `orElseGet` |

## Qué te llevas

- `collect` es terminal y recibe un `Collector`; `Collectors` trae `toList`, `toSet`, `joining`,
  `counting`, `summingInt`, `averagingDouble`, `minBy` y `maxBy`.
- `toMap` pide clave y valor; una clave repetida lanza `IllegalStateException`, y la función de mezcla
  decide qué hacer con los dos valores.
- `groupingBy` agrupa con una clave y un collector por grupo; `mapping` transforma antes de guardar y
  `partitioningBy` devuelve siempre dos grupos, aunque uno quede vacío.
- `Collectors.toUnmodifiableList` (Java 10) y `Stream.toList()` (Java 16) no se modifican; el collector
  rechaza `null` y `Stream.toList()` lo acepta. `reduce` combina valores y `collect` llena un contenedor.
- `Optional` es el tipo de retorno de lo que puede faltar: `of`, `empty`, `ofNullable`, `map`,
  `flatMap`, `filter`, `orElse`, `orElseGet`, `orElseThrow`, `ifPresent` e `ifPresentOrElse` (esta
  desde Java 9); `get()` es la excepción esperando a ocurrir. No va en campos, parámetros ni
  colecciones. Para primitivos están `OptionalInt`, `OptionalLong` y `OptionalDouble`, y `average()` da
  un `OptionalDouble`.
- `parallelStream` comparte el pool común y solo compensa con datos suficientes y trabajo independiente;
  el orden y el estado compartido son lo primero que se rompe.
