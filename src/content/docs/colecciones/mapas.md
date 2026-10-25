---
title: 'Mapas: claves y valores'
description: 'Claves únicas, valores que se sustituyen y una tabla que encuentra la pareja sin recorrerla: HashMap, LinkedHashMap y TreeMap.'
section: colecciones
order: 4
since: 8
---

## Parejas, no elementos

El primer capítulo dejó `Map` fuera de `Collection` por un motivo que aquí se desarrolla: no guarda
elementos sueltos, guarda parejas. La clave es la identidad, así que `put` no añade una segunda pareja
cuando ya existe: sustituye su valor. El valor es la carga: viaja con la clave, se lee, se cambia y no
participa en la búsqueda. Un mapa con un millón de parejas tiene un millón de claves distintas, porque
repetir una no hace crecer el tamaño, y encontrar la clave es todo su trabajo.

```java
import java.util.*;

Map<String, Integer> stock = new HashMap<>();
stock.put("teclado", 3);
stock.put("ratón", 5);

System.out.println(stock.put("teclado", 4));      // 3, el valor que había
System.out.println(stock.get("teclado"));         // 4
System.out.println(stock.get("monitor"));         // null, esa clave no está
System.out.println(stock.remove("ratón"));        // 5: devuelve el valor borrado
System.out.println(stock.size());                 // 1

stock.put("webcam", null);                        // valor null, la clave existe
System.out.println(stock.get("webcam"));          // null, igual que una clave ausente
System.out.println(stock.containsKey("webcam"));  // true: la pregunta correcta
System.out.println(stock.getOrDefault("webcam", -1));  // null, el guardado, no el -1
stock.put(null, 0);                               // HashMap admite una clave null
System.out.println(stock.get(null));              // 0
```

`put` devuelve el valor anterior, y con esa firma empieza la única pregunta incómoda del capítulo: `get`
devuelve `null` en dos casos que no son el mismo, cuando la clave no está y cuando apunta a un valor
`null`. `HashMap` admite las dos cosas, así que `null` no es una respuesta, es la ausencia de respuesta.
`containsKey` sí contesta, y `getOrDefault` tampoco distingue: devuelve el `null` guardado.

## Tres vistas, una recorrida

`Map` no tiene `iterator()` y no lo necesita: se recorre por sus vistas. `entrySet()` devuelve las
parejas como objetos `Map.Entry`, `keySet()` las claves y `values()` los valores. No son copias, son
colecciones vivas: quitar de una vista quita del mapa.

`entrySet` es el camino rápido, porque cada `Map.Entry` llega con la clave y el valor ya resueltos;
`keySet` combinado con un `get` paga una búsqueda por clave. El orden de un `HashMap` no está
especificado: no promete ni el de inserción y cambia cuando la tabla crece, así que no lo uses.

```java
Map<String, Integer> stock = new HashMap<>();
stock.put("teclado", 3);
stock.put("ratón", 0);
stock.put("monitor", 2);

for (Map.Entry<String, Integer> entrada : stock.entrySet()) {
    System.out.println(entrada.getKey() + " = " + entrada.getValue());
}   // una línea por pareja, en el orden que decida el mapa

int total = 0;
for (int unidades : stock.values()) {
    total += unidades;
}
System.out.println(total);                                // 5
System.out.println(stock.keySet().contains("teclado"));   // true

stock.entrySet().removeIf(entrada -> entrada.getValue() == 0);
System.out.println(stock.size());                         // 2: el ratón se fue
```

Para borrar mientras recorres, las vistas aceptan `removeIf` (Java 8) y su iterador `remove()`, igual que
en las listas; el primer capítulo contó por qué un `put` dentro del bucle lanza
`ConcurrentModificationException`.

## Los cinco atajos de Java 8

Antes de Java 8, "pon esto si falta" eran tres llamadas; los `default` de `Map` lo dejan en una sola.

| Método | Qué pregunta | Qué hace |
| --- | --- | --- |
| `getOrDefault(clave, otro)` | ¿Hay valor para la clave? | Devuelve el guardado o `otro` si no hay pareja |
| `putIfAbsent(clave, valor)` | ¿Falta la clave? | Escribe solo si no hay valor guardado |
| `compute(clave, f)` | Nada, siempre | Recalcula con `f` y guarda el resultado |
| `computeIfPresent(clave, f)` | ¿Hay valor para la clave? | Recalcula solo si la clave tiene valor |
| `merge(clave, valor, f)` | ¿Hay valor para la clave? | Escribe `valor` si falta y lo combina con `f` si está |

Dos matices. `putIfAbsent` no es `put`: no pisa un valor existente, pero trata como ausente una clave
que apunta a `null`. Y en `compute`, `computeIfPresent` y `merge`, si la función devuelve `null`, la
pareja desaparece del mapa: es la forma corta de borrar.

```java
Map<String, Integer> stock = new HashMap<>();

System.out.println(stock.getOrDefault("teclado", 0));    // 0: la clave no está
stock.putIfAbsent("teclado", 10);                        // entra
stock.putIfAbsent("teclado", 99);                        // no pisa el 10
stock.computeIfPresent("teclado", (clave, valor) -> valor + 5);
System.out.println(stock.get("teclado"));                // 15
stock.compute("teclado", (clave, valor) -> valor * 2);   // recalcula siempre
System.out.println(stock.get("teclado"));                // 30
stock.computeIfPresent("monitor", (clave, valor) -> valor + 1);  // no está: nada

String texto = "uno dos uno tres uno";
Map<String, Integer> cuenta = new HashMap<>();
for (String palabra : texto.split(" ")) {
    cuenta.merge(palabra, 1, Integer::sum);              // si falta, 1; si está, suma
}
System.out.println(cuenta.get("uno"));                   // 3

Map<String, List<String>> porInicial = new HashMap<>();
for (String nombre : "Ada Alan Grace".split(" ")) {
    porInicial.computeIfAbsent(nombre.substring(0, 1), k -> new ArrayList<>()).add(nombre);
}
System.out.println(porInicial.get("A"));                 // [Ada, Alan]
System.out.println(porInicial.get("G"));                 // [Grace]
```

`merge(palabra, 1, Integer::sum)` es el contador de palabras en una línea: si la palabra no está,
escribe el `1`, y si está, suma. `computeIfAbsent(clave, k -> new ArrayList<>())` es el multimapa: crea la
lista solo la primera vez y la devuelve siempre, así que el `add` de detrás nunca ve un `null`. Las dos
devuelven el valor guardado, y por eso se pueden encadenar.

## Orden: `LinkedHashMap` y `TreeMap`

`LinkedHashMap` garantiza el orden de inserción: además de la tabla, engancha las parejas en una lista
doble y la iteración sigue esa lista. Su constructor de tres argumentos `(capacidad, factor, true)` cambia
a orden de acceso, que mueve al final la pareja que se usa; con `removeEldestEntry`, eso es una caché LRU.

`TreeMap` ordena por clave y no por hash: las claves tienen que ser `Comparable` o recibir un `Comparator`.
Implementa `NavigableMap`, con `firstKey`, `lastKey`, `headMap`, `tailMap` y los vecinos `floorKey` y
`ceilingKey`, todo en O(log n). Con orden natural no admite `null`, porque habría que compararla, y busca
con `compareTo`, no con `equals`: dos claves que comparan igual son la misma clave.

```java
Map<String, Integer> altas = new LinkedHashMap<>();
altas.put("zeta", 1);
altas.put("alfa", 2);
altas.put("media", 3);
System.out.println(altas.keySet());              // [zeta, alfa, media]

NavigableMap<String, Integer> ordenado = new TreeMap<>(altas);
System.out.println(ordenado.keySet());           // [alfa, media, zeta]
System.out.println(ordenado.firstKey());         // alfa
System.out.println(ordenado.headMap("media"));   // {alfa=2}: claves menores que media
System.out.println(ordenado.floorKey("beta"));   // alfa: la mayor que no supera beta
```

`headMap`, `tailMap` y `subMap` son vistas, no copias, y `new TreeMap<>(mapa)` ordena un mapa que ya tienes.

## Dentro de un `HashMap`

El contrato de `equals` y `hashCode` que hace que una clave se encuentre está en
[Object y sus contratos](/docs/objetos/object-y-contratos/). Aquí solo interesa lo que OpenJDK hace con
esos dos métodos: calcula `clave.hashCode()`, lo mezcla con `h ^ (h >>> 16)`, saca el índice con
`(capacidad - 1) & hash` y recorre el cubo comparando con `equals`.

Dos números mandan: la capacidad, que empieza en 16 cubos, y el factor de carga, 0,75. El umbral es su
producto, 12 parejas; al meter la decimotercera, el mapa no espera a llenarse: duplica la capacidad a 32
y recoloca todas las claves. Copiar es O(n), pero el hueco se dobla cada vez, así que el coste se
reparte y `get` y `put` salen O(1) de media. Son números de OpenJDK, no del contrato de `Map`.

<figure class="diagram diagram--framed">
  <p class="diagram__label">La tabla por dentro</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">Los cubos</span>
      <code class="diagram__value">Node[16]</code>
      <span class="diagram__hint">Cada clave cae en uno por su <code>hashCode()</code>; la capacidad inicial es 16.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">El umbral</span>
      <code class="diagram__value">16 × 0,75 = 12</code>
      <span class="diagram__hint">Al pasar de 12 parejas, la tabla no espera a llenarse.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">El redimensionado</span>
      <code class="diagram__value">32 cubos</code>
      <span class="diagram__hint">Duplica la capacidad y recoloca las claves: O(n), pero cada vez menos.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Tres números gobiernan un <code>HashMap</code> de OpenJDK: 16 cubos de capacidad, 0,75 de factor de carga y 12 como umbral antes de doblar la tabla.</figcaption>
</figure>

Y la media esconde el caso malo. Si todas las claves caen en el mismo cubo, la búsqueda lo recorre
entero y baja a O(n); OpenJDK lo mitiga convirtiendo en árbol rojo-negro un cubo que llega a ocho
entradas cuando la tabla ya tiene al menos 64, y entonces ese cubo baja a O(log n). Sigue siendo el caso
patológico, y el arreglo no es una tabla más grande sino un `hashCode` que reparta.

## La clave que se mueve

Un mapa no copia la clave: guarda la referencia y, en OpenJDK, el hash que tenía al entrar. Si un campo
que lee `hashCode` cambia después, la clave sigue dentro con su hash viejo y cada búsqueda calcula uno
nuevo. El resultado no es una excepción, es un `null`:

```java
class Articulo {
    String nombre;
    Articulo(String nombre) { this.nombre = nombre; }
    @Override public boolean equals(Object otro) {
        return otro instanceof Articulo a && nombre.equals(a.nombre);
    }
    @Override public int hashCode() { return nombre.hashCode(); }
}

Map<Articulo, Integer> reservas = new HashMap<>();
Articulo teclado = new Articulo("teclado");
reservas.put(teclado, 3);

teclado.nombre = "teclado mecánico";              // el campo que lee hashCode
System.out.println(reservas.get(teclado));        // null: busca en otro cubo
System.out.println(reservas.size());              // 1: la pareja sigue dentro
System.out.println(reservas.containsValue(3));    // true: el valor no se movió
```

La pareja está en el mapa, `size()` la cuenta, y nadie la encuentra: `get` mira en otro cubo y `remove`
tampoco la alcanza. `containsValue` sí la ve, porque los valores no se indexan. El capítulo de Object
explicó el contrato; desde el lado del mapa, la conclusión es una: una clave que cambia no es una clave,
así que conviene elegirla entre las que no se mueven, como un `String` o un `Integer`.

## Mapas inmutables

El primer capítulo presentó las fábricas de colecciones inmutables. Lo que cambia cuando el resultado es
un mapa: `Map.of` (Java 9) admite hasta diez parejas, `Map.ofEntries` (Java 9) no tiene tope y
`Map.copyOf` (Java 10) copia un mapa existente. No aceptan `null` en clave ni en valor, y una clave
repetida es un error: `Map.of("a", 1, "a", 2)` lanza `IllegalArgumentException` con `duplicate key: a`.

```java
Map<String, Integer> stock = Map.of("teclado", 3, "ratón", 5);   // Java 9, hasta 10 parejas
System.out.println(stock.get("ratón"));                          // 5

Map<String, Integer> catalogo = Map.ofEntries(                   // Java 9, sin tope
        Map.entry("monitor", 2),
        Map.entry("webcam", 7));
System.out.println(catalogo.get("monitor"));                     // 2

Map<String, Integer> copia = Map.copyOf(catalogo);               // Java 10
System.out.println(copia.size());                                // 2

catalogo.put("teclado", 1);   // UnsupportedOperationException
```

Tampoco prometen orden: como en `HashMap`, la posición no es parte del contrato. Sirven para una
constante, un valor por defecto y un resultado que no debe tocar quien lo recibe; en cuanto haya que
añadir una pareja, toca un `HashMap` o un `LinkedHashMap`.

## Cuál elegir

El orden y el coste se eligen juntos, así que conviene tener los dos a la vista.

| Clase | Orden | Coste | Cuándo |
| --- | --- | --- | --- |
| `HashMap` | Ninguno | O(1) de media en `get` y `put` | El valor por defecto: buscar por clave y nada más |
| `LinkedHashMap` | El de inserción, o el de acceso | Como `HashMap`, con dos enlaces más por pareja | Repetir el orden en que se llenó, o cachear con desalojo |
| `TreeMap` | El de las claves | O(log n) en `get` y `put` | Rangos, vecinos y recorrido ordenado por clave |

## Lo que viene

Este capítulo cierra la búsqueda por clave. El siguiente convierte las parejas en un flujo: Stream recorre,
filtra y transforma sin escribir el bucle, y `groupingBy` cierra la sección con el multimapa en una llamada.

## Qué te llevas

- `Map` guarda parejas: la clave identifica y el valor es la carga. Repetir una clave sustituye el
  valor, no añade una pareja.
- `put` devuelve el valor anterior; `remove` también. `get` devuelve `null` si la clave falta o si
  apunta a `null`: para distinguirlo está `containsKey`.
- `entrySet` es el recorrido rápido; `keySet` y `values` son vistas vivas, y el orden de `HashMap` no
  está especificado.
- `getOrDefault`, `putIfAbsent`, `compute`, `computeIfPresent` y `merge` (Java 8) quitan el `get` más
  la comprobación; con `merge` se cuenta y con `computeIfAbsent` se agrupa en listas.
- `LinkedHashMap` conserva el orden de inserción y, en modo acceso, sirve de caché LRU. `TreeMap` ordena
  por clave en O(log n), compara con `compareTo` y no admite `null` en orden natural.
- En OpenJDK, `HashMap` reparte por cubos con capacidad 16, factor 0,75 y redimensionado al doble;
  `get` y `put` son O(1) de media y O(n) si todas las claves colisionan.
- Una clave que cambia el campo que lee `hashCode` deja de encontrarse; y `Map.of`, `Map.ofEntries` y
  `Map.copyOf` crean mapas inmutables sin `null` ni claves repetidas.
