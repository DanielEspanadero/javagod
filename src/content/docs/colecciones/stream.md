---
title: 'Stream: el pipeline perezoso'
description: 'Qué es un stream, por qué no ejecuta nada hasta la operación final y por qué solo se puede recorrer una vez.'
section: colecciones
order: 5
since: 8
---

## Una tubería, no un contenedor

El capítulo anterior cerró la búsqueda por clave. Un `Map` guarda parejas, un `List` guarda una secuencia
y un `Set` guarda valores únicos: los tres almacenan. Un stream no almacena nada. Es la descripción de un
recorrido sobre una fuente que vive en otro sitio, y de ahí salen las tres reglas del capítulo: no copia el
origen, no lo cambia y se recorre una sola vez.

La fuente puede ser una colección, un array, un rango de números o un generador. `lista.stream()` no copia
la lista, y `filter` o `map` no tocan sus elementos: devuelven un stream nuevo que describe qué hacer con
ellos. Si al final nadie pide un resultado, no se hizo nada. Tampoco es un `Iterable`: no vale en un `for`
mejorado, porque se recorre con una operación final, que pide el resultado y consume el stream.

## Fuente, pasos y final

Todo stream se arma en los mismos tres tramos. Los dos primeros solo describen el trabajo; el tercero lo
pide y lo ejecuta.

<figure class="diagram diagram--framed">
  <p class="diagram__label">El pipeline de un stream</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">La fuente</span>
      <code class="diagram__value">lista.stream()</code>
      <span class="diagram__hint">De dónde salen los elementos: una colección, un array o un rango.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">Los pasos</span>
      <code class="diagram__value">filter(...).map(...)</code>
      <span class="diagram__hint">Intermedios: devuelven otro stream y no ejecutan nada.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">El final</span>
      <code class="diagram__value">count()</code>
      <span class="diagram__hint">Terminal: pide el resultado una vez y cierra el stream.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Sin el tercer tramo no hay resultado: los dos primeros solo describen el trabajo que se hará cuando alguien lo pida.</figcaption>
</figure>

El tipo lo delata: una operación intermedia devuelve `Stream` y la cadena continúa; la final devuelve un
`long`, un `boolean`, un `Optional` o `void`, nunca un stream. Cuando escribes
`Stream<String> s = lista.stream().filter(n -> !n.isEmpty())`, en `s` no hay elementos: hay la receta.

## De dónde sale un stream

```java
import java.util.*;
import java.util.stream.*;

List<String> nombres = new ArrayList<>(Arrays.asList("Ada", "Grace", "Alan"));

Stream<String> desdeLista = nombres.stream();
Stream<String> desdeValores = Stream.of("uno", "dos", "tres");
Stream<String> desdeArray = Arrays.stream(new String[] {"a", "b"});
IntStream rango = IntStream.range(1, 5);          // 1, 2, 3 y 4: el 5 queda fuera

System.out.println(desdeLista.count());           // 3
System.out.println(desdeValores.count());         // 3
System.out.println(desdeArray.count());           // 2
System.out.println(rango.sum());                  // 10
```

`Collection` trae `stream()` desde Java 8, así que listas, conjuntos y colas lo tienen; `Map` no, porque no
es una `Collection`, y en su lugar se usan sus vistas, `keySet().stream()` o `entrySet().stream()`.
`Stream.of` recibe los valores y `Arrays.stream` un array. `IntStream.range(a, b)` es el bucle
`for (int i = a; i < b; i++)` sin índice y sin caja, con el final fuera, como el límite de un `subList`;
`rangeClosed` incluye ese final. Ninguna de las cuatro recorre nada al construir el stream: eso pasa con la
operación final.

## La pereza es la idea central

Sin operación final no hay resultado y no hay efecto. Un stream sin terminal no recorre nada, no imprime
nada y no lanza nada: es una receta guardada. La pereza no es un detalle de implementación, es la
propiedad que permite encadenar pasos sin calcular de más.

```java
List<String> nombres = new ArrayList<>(Arrays.asList("Ada", "Grace", "Alan"));

nombres.stream()
        .filter(nombre -> nombre.length() > 3)
        .peek(nombre -> System.out.println("pasa " + nombre));   // nada: falta el final

System.out.println(nombres.stream()
        .filter(nombre -> nombre.length() > 3)
        .peek(nombre -> System.out.println("pasa " + nombre))
        .count());                                // 2, tras imprimir Grace y Alan

Stream<Integer> naturales = Stream.iterate(1, n -> n + 1);   // infinito
naturales.limit(4).forEach(System.out::println);  // 1, 2, 3 y 4, uno por línea
```

El primer `nombres.stream()` se queda en un stream y no imprime nada; el segundo añade `count()` y entonces
se ejecuta el pipeline: `peek` imprime cada nombre que pasa el filtro y después sale el 2. `peek` es para
mirar, nunca para producción: no es una operación final, no cambia el resultado y no hay contrato que
garantice que se ejecute por cada elemento.

Una fuente infinita lo enseña mejor: `Stream.iterate(1, n -> n + 1)` no termina nunca y `limit(4)` solo
produce los cuatro que necesita el terminal. La sobrecarga con condición es de Java 9; la de dos
argumentos, la del ejemplo, es de Java 8.

## Operaciones intermedias

Las operaciones intermedias devuelven otro stream y no ejecutan nada por sí solas: encadenan. Las de este
capítulo se dividen en dos grupos, las que miran cada elemento por separado y las que necesitan recordar lo
que ya pasó.

| Operación | Qué hace | Estado |
| --- | --- | --- |
| `filter` | Deja pasar lo que cumple el `Predicate` | Sin estado |
| `map` | Transforma cada elemento con una `Function` | Sin estado |
| `flatMap` | Convierte cada elemento en un stream y lo aplana | Sin estado |
| `distinct` | Quita los repetidos según `equals` | Con estado |
| `sorted` | Ordena y guarda todo antes de emitir | Con estado |
| `limit` | Corta al llegar al número pedido | Con estado |
| `skip` | Descarta los primeros | Con estado |

`filter` deja pasar lo que cumple el predicado, `map` transforma uno a uno y `flatMap` aplana, para
convertir un elemento en cero o en varios. `distinct` compara con `equals` y `hashCode`, así que hereda el
contrato del capítulo de conjuntos.

```java
List<String> frases = new ArrayList<>(Arrays.asList(
        "hola mundo", "hola java", "adios mundo"));

frases.stream()
        .filter(frase -> frase.startsWith("hola"))
        .flatMap(frase -> Arrays.stream(frase.split(" ")))
        .distinct()
        .sorted()
        .skip(1)
        .limit(2)
        .map(String::toUpperCase)
        .forEach(System.out::println);   // JAVA y MUNDO, uno por línea
```

`sorted` es el más caro: no puede emitir el primero hasta haber visto el último, así que guarda todo.
Ordena por el orden natural de `Comparable` o por el `Comparator` que le pases y, en un stream ordenado, es
estable, como `List.sort` del capítulo de listas: dos elementos iguales para el comparador conservan su
orden relativo. `skip` y `limit` cuentan, y se aplican en el orden en que se escriben.

## Operaciones finales

La operación final pide el resultado, ejecuta lo que estaba descrito y cierra el stream. Solo puede haber
una.

```java
List<Integer> notas = new ArrayList<>(Arrays.asList(4, 7, 2, 9, 6));

System.out.println(notas.stream().count());                       // 5
System.out.println(notas.stream().anyMatch(n -> n == 9));         // true
System.out.println(notas.stream().allMatch(n -> n >= 2));         // true
System.out.println(notas.stream().noneMatch(n -> n > 10));        // true
System.out.println(notas.stream().findFirst().get());             // 4
System.out.println(notas.stream().reduce(0, Integer::sum));       // 28
System.out.println(notas.stream().reduce(Integer::sum).get());    // 28
System.out.println(notas.stream().min(Integer::compare).get());   // 2
System.out.println(notas.stream().max(Integer::compare).get());   // 9
notas.stream().forEach(n -> System.out.println(n));               // 4, 7, 2, 9 y 6
```

`count` devuelve un `long`. `anyMatch`, `allMatch` y `noneMatch` devuelven `boolean`. `findFirst`, `min` y
`max` devuelven un `Optional`, porque puede no haber nada que devolver. `forEach` es la final de los
efectos: no devuelve nada y existe para tocar el mundo de fuera.

`reduce(0, Integer::sum)` empieza en cero y acumula; el primer argumento tiene que ser neutro, porque si
no, el resultado arrastra ese valor desde el principio. La forma sin identidad devuelve un `Optional`, ya
que un stream vacío no tiene con qué empezar. `collect` es la final más general: recibe un `Collector` y
construye una lista, un conjunto, un mapa o un texto; aquí solo se nombra, porque `Collectors` y `Optional`
tienen capítulo propio, el siguiente.

## Cortocircuito: parar antes de tiempo

A veces la respuesta llega antes de recorrer el stream entero. `anyMatch` para en el primer `true`,
`allMatch` en el primer `false`, `noneMatch` en el primer `true` y `findFirst` en el primer elemento que pase
el filtro. `limit` también corta hacia arriba: no pide más elementos de los que va a usar.

```java
Stream<Integer> naturales = Stream.iterate(1, n -> n + 1);

System.out.println(naturales.filter(n -> n % 7 == 0).findFirst().get());  // 7

List<String> nombres = new ArrayList<>(Arrays.asList("Ada", "Grace", "Alan"));

boolean encontrado = nombres.stream()
        .peek(nombre -> System.out.println("mira " + nombre))
        .anyMatch(nombre -> nombre.startsWith("A"));
System.out.println(encontrado);   // true, y solo se imprimió "mira Ada"
```

La primera línea se apoya en el cortocircuito: de los infinitos naturales solo se generan hasta el 7, y
ahí para. En la segunda, `peek` imprime una sola vez porque `anyMatch` ya tiene su respuesta y no pide más
elementos. Sin cortocircuito, el `findFirst` de un stream infinito no terminaría nunca.

## Un stream se usa una vez

Un stream es un recorrido, no una colección: después de la operación final queda consumido. Una segunda
operación final no repite el trabajo ni devuelve un resultado vacío: lanza una excepción.

```java
List<String> nombres = new ArrayList<>(Arrays.asList("Ada", "Grace"));
Stream<String> stream = nombres.stream();
System.out.println(stream.count());   // 2

stream.forEach(System.out::println);
// IllegalStateException: stream has already been operated upon or closed
```

El mensaje es literal: `stream has already been operated upon or closed`. No hay `reset` ni forma de
reabrirlo, y no hace falta: la fuente sigue intacta, así que se pide otro con `nombres.stream()`. Un stream
no se guarda en un campo para usarlo dos veces; se guarda la colección y se construye en cada uso.

## Streams de primitivos

En un `Stream<Integer>` cada elemento es un `Integer`, no un `int`, así que paga una caja. Para los números
hay tres streams especializados, `IntStream`, `LongStream` y `DoubleStream`, que trabajan con primitivos y
traen `sum`, `average`, `min` y `max` sin pasar por un `Optional` de objeto.

```java
List<String> nombres = new ArrayList<>(Arrays.asList("Ada", "Grace", "Alan", "Barbara"));

System.out.println(nombres.stream().mapToInt(String::length).sum());  // 19

OptionalInt maxima = nombres.stream().mapToInt(String::length).max();
System.out.println(maxima.getAsInt());                                // 7

OptionalDouble media = nombres.stream().mapToInt(String::length).average();
System.out.println(media.getAsDouble());                              // 4.75

System.out.println(IntStream.range(1, 5).map(n -> n * n).sum());  // 30

IntStream.range(1, 4).boxed().forEach(System.out::println);   // 1, 2 y 3, uno por línea
```

`mapToInt` convierte un `Stream<String>` en un `IntStream`; `boxed` hace el camino contrario cuando hace
falta un `Integer`. `IntStream.range(1, 5)` es el bucle de siempre sin índice y sin caja, y
`map(n -> n * n).sum()` no crea un solo objeto. La caja no es gratis: cada `Integer` vive en el heap y un
millón de ellos pesa y da trabajo al recolector, aunque la caché de -128 a 127 del primer capítulo
ahorre los pequeños.

`sum` devuelve `int`; `average` devuelve `OptionalDouble` y `max`, `OptionalInt`: son los `Optional` de
primitivo, y el capítulo siguiente explica la familia entera.

## La trampa: el origen que se mueve

Un stream no copia la colección: lee de ella cuando corre la operación final. El origen tiene que quedarse
quieto mientras el pipeline lo recorre, y un `map` no es el sitio para cambiar nada de fuera: `map`
transforma, y si lo que quieres es un efecto, la operación final es `forEach`.

> [!OJO]
> Modificar la colección mientras el stream la recorre termina mal, y no siempre en
> `ConcurrentModificationException`: en una lista, un `add` dentro de `forEach` la lanza, y un `remove`
> puede fallar antes con un `NullPointerException`, porque el hueco que deja el borrado se lee como si
> fuera un elemento. La misma regla del primer capítulo: el origen no se toca mientras se recorre.

## Lo que viene

El siguiente capítulo cierra la sección con `Collectors`, para agrupar, contar y unir, y `Optional`, para
el resultado que puede faltar. Con ellos, `collect` deja de ser un nombre y el pipeline se lee entero.

## Qué te llevas

- Un stream no guarda elementos: describe un recorrido con fuente, cero o más pasos intermedios y una
  operación final; sin la final no se ejecuta nada.
- `filter`, `map`, `flatMap`, `distinct`, `sorted`, `limit` y `skip` devuelven otro stream; `distinct`,
  `sorted`, `limit` y `skip` recuerdan lo que ya vieron, y `sorted` guarda todo antes de emitir.
- `count`, `anyMatch`, `findFirst`, `reduce`, `min`, `max`, `forEach` y `collect` cierran el stream;
  `findFirst`, `min`, `max` y el `reduce` sin identidad devuelven un `Optional`.
- `anyMatch`, `allMatch`, `noneMatch` y `findFirst` cortan en cuanto tienen respuesta, y por eso
  `findFirst` y `anyMatch` pueden terminar sobre un stream infinito.
- Un stream se usa una vez: la segunda operación final lanza `IllegalStateException: stream has already
  been operated upon or closed`.
- `mapToInt` pasa a `IntStream`, con `sum`, `average` y `max` sin cajas; `boxed` vuelve a `Stream<Integer>`
  e `IntStream.range` sustituye al bucle por índice.
- En una lista, modificar el origen mientras el pipeline lo recorre termina en
  `ConcurrentModificationException` o en un fallo peor; para efectos está `forEach`, no `map`.
