---
title: 'Listas: orden e índice'
description: 'Qué promete una lista, por qué ArrayList es el valor por defecto, cuándo LinkedList y cómo ordenar, copiar y borrar sin romperla.'
section: colecciones
order: 2
since: 8
---

## Una secuencia con índice

El capítulo anterior dejó `Collection` como la interfaz común del marco: un contenedor de elementos
que se puede recorrer. `List` es la interfaz de las secuencias, y su contrato fija tres cosas:

- **Posición.** Cada elemento tiene un índice, de `0` a `size() - 1`: `get`, `set`, `add(int, E)`,
  `remove(int)`, `indexOf`, `lastIndexOf` y `subList` hablan de esa posición.
- **Orden.** La iteración devuelve los elementos en un orden concreto, el de inserción o el que dejó
  la última ordenación. Ese orden es parte del contrato, no un detalle de la implementación.
- **Duplicados.** Dos elementos iguales conviven sin problema; `indexOf` devuelve el primero y
  `lastIndexOf` el último.

Si un método solo recorre y cuenta, pide `Collection`; si necesita índice u orden, pide `List`. En los
dos casos la firma usa la interfaz y no la clase: el coste lo decide la implementación que esté detrás.

## `ArrayList`: el valor por defecto

`ArrayList` guarda los elementos en un array de `Object` y lleva un contador aparte con cuántos hay. El
array es la **capacidad**; el contador es el **tamaño**, lo que devuelve `size()`. La capacidad no se
puede consultar, pero manda en el coste: si el array está lleno y añades un elemento, la lista reserva
uno más grande y copia todo lo que había.

En OpenJDK, la implementación de referencia, el array arranca vacío y el primer `add` reserva diez
celdas; cuando se llena, crece alrededor de un 50 por ciento: de 10 a 15, a 22 y a 33. Copiar es O(n),
pero pasa cada vez menos a menudo, así que añadir al final cuesta O(1) amortizado. La política exacta
de crecimiento no está en la documentación de `ArrayList`; el coste amortizado constante, sí.

```java
ArrayList<String> previsto = new ArrayList<>(1_000);  // capacidad inicial, no tamaño
previsto.ensureCapacity(4_000);                       // una reserva de golpe
System.out.println(previsto.size());                  // 0: capacidad no es tamaño
```

Si sabes cuántos elementos vas a meter, `new ArrayList<>(n)` evita los crecimientos, y
`ensureCapacity`, que solo existe en `ArrayList`, empuja la capacidad sin añadir nada. Ninguna de las
dos cambia el tamaño: `size()` sigue contando elementos. Por eso el ejemplo declara `ArrayList` y no
`List`: `ensureCapacity` no está en la interfaz.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Dentro de un ArrayList</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">El array</span>
      <code class="diagram__value">new Object[10]</code>
      <span class="diagram__hint">La capacidad: cuántas celdas caben, no cuántas se usan.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">El contador</span>
      <code class="diagram__value">size</code>
      <span class="diagram__hint">Las celdas ocupadas. Es lo que devuelve <code>size()</code>.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">Insertar en medio</span>
      <code class="diagram__value">System.arraycopy</code>
      <span class="diagram__hint">Todo lo que queda a la derecha se desplaza una celda: O(n).</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">La lista es un array, un contador y un desplazamiento cada vez que mueves algo que no está al final.</figcaption>
</figure>

Insertar o borrar fuera del final obliga a mover los elementos que quedan a la derecha del hueco.
`ArrayList` lo hace con `System.arraycopy`, rápido, pero el número de elementos movidos crece con la
lista: insertar al principio de un millón mueve un millón. `add(0, x)` y `remove(0)` son O(n).

## `LinkedList`: dos extremos y poco más

`LinkedList` no guarda un array, sino nodos enlazados: cada elemento es un objeto `Node` con el valor,
la referencia al siguiente y la referencia al anterior. Eso le da lo que `ArrayList` no tiene: añadir o
quitar por los dos extremos en O(1).

Lo malo es todo lo demás. `get(i)` recorre los nodos desde el extremo más cercano, así que es O(n) y
con saltos de memoria que el procesador no puede predecir. Cada elemento paga un objeto de más, y
recorrerla entera es más lento que recorrer un array aunque la notación diga lo mismo.

Como `List` casi nunca es la elección correcta pero como `Deque` sí tiene su hueco, `LinkedList` sigue
existiendo. Para los extremos, empieza por `ArrayDeque`: su documentación dice que es probablemente más
rápida que `Stack` como pila y que `LinkedList` como cola. Frente a `ArrayDeque`, `LinkedList` solo
mantiene una ventaja: admite `null`, que `ArrayDeque` rechaza.

| Operación | `ArrayList` | `LinkedList` |
| --- | --- | --- |
| `get(i)` | O(1) | O(n) |
| `add` al final | O(1) amortizado | O(1) |
| `add` al principio | O(n) | O(1) |
| `remove` en medio | O(n) | O(n) para llegar, O(1) con el iterador |
| `contains` | O(n) | O(n) |

La tabla no dice que `LinkedList` sea rápida en medio: llegar al nodo ya cuesta O(n). Si el iterador
ya está en él, borrar es O(1): es la única fila de la tabla donde gana con datos en medio. En el
resto, elige `ArrayList` sin mirar atrás: cambiar de implementación es cambiar el `new`.

## La trampa: `remove(int)` o `remove(Object)`

`List` tiene dos `remove` sobrecargados: `remove(int index)` y `remove(Object o)`. La sobrecarga se
decide en compilación, con el tipo estático del argumento, y en un `List<Integer>` las dos versiones
están a tiro:

```java
List<Integer> notas = new ArrayList<>(Arrays.asList(10, 20, 30));

notas.remove(1);                                        // borra la posición 1: el 20
System.out.println(notas);                              // [10, 30]

System.out.println(notas.remove(Integer.valueOf(10)));  // true: borra el valor 10
System.out.println(notas);                              // [30]

System.out.println(notas.remove(Integer.valueOf(7)));   // false: el 7 no está

notas.remove(5);   // IndexOutOfBoundsException: Index 5 out of bounds for length 1
```

Un `int` literal encaja exactamente con `remove(int)`, así que `notas.remove(1)` nunca pregunta por el
valor 1. Para borrar por valor en una lista de enteros hay que envolverlo: `remove(Integer.valueOf(1))`
o `remove((Integer) 1)`. La versión de objeto devuelve un `boolean`; la de índice devuelve el elemento
y lanza `IndexOutOfBoundsException` si no existe.

> [!OJO]
> `remove(Object)` compara con `equals`, como `contains` y `indexOf`. Con `Integer` funciona; con un
> tipo tuyo sin `equals`, compara referencias y casi nunca encuentra el elemento.

## Ordenar una lista

`List.sort(Comparator)` (Java 8) ordena en el sitio. `Collections.sort(lista)` no está obsoleto, pero
desde Java 8 solo delega en `list.sort(null)`. Pasar `null` significa orden natural, el de
`Comparable`, y la lista tiene que ser modificable, aunque no haga falta que cambie de tamaño.

El orden es **estable**: dos elementos que el comparador considera iguales conservan su orden relativo.
Eso permite ordenar dos veces sin perder el primer criterio, y es la razón de que convenga componer con
`thenComparing` en vez de encadenar dos ordenaciones.

```java
record Libro(String titulo, String autor, int anio) {} // Java 16

List<Libro> libros = new ArrayList<>(Arrays.asList(
        new Libro("El nombre del viento", "Rothfuss", 2007),
        new Libro("La música del silencio", "Rothfuss", 2014),
        new Libro("El juego de Ender", "Card", 1985)));

libros.sort(Comparator.comparing(Libro::autor));
libros.forEach(libro -> System.out.println(libro.autor() + ": " + libro.titulo()));
// Card: El juego de Ender
// Rothfuss: El nombre del viento
// Rothfuss: La música del silencio

libros.sort(Comparator.comparing(Libro::autor).thenComparing(Libro::anio).reversed());
libros.forEach(libro -> System.out.println(libro.autor() + ": " + libro.anio()));
// Rothfuss: 2014
// Rothfuss: 2007
// Card: 1985

List<String> autores = new ArrayList<>(Arrays.asList("Rothfuss", null, "Card"));
autores.sort(Comparator.nullsFirst(Comparator.naturalOrder()));
System.out.println(autores);   // [null, Card, Rothfuss]
autores.sort(Comparator.nullsLast(Comparator.naturalOrder()));
System.out.println(autores);   // [Card, Rothfuss, null]
```

`Comparator.comparing` recibe una función que extrae la clave y la envuelve en un comparador.
`thenComparing` desempata con el criterio siguiente y `reversed` invierte el comparador que lo llama.
Al final de la cadena invierte todos los criterios; para invertir uno solo, va dentro de su comparador:
`thenComparing(Comparator.comparing(Libro::anio).reversed())`. `Comparator.naturalOrder()` es el
comparador de `Comparable` cuando lo necesitas como objeto, y `nullsFirst` y `nullsLast` lo envuelven
para que un `null` no lance `NullPointerException`; sin ellos, `compareTo` sobre un `null` revienta.

## Vistas y copias

Una lista devuelta por un método puede ser la misma lista, una ventana a ella o una copia. Al leerlas
se parecen; al escribir se comportan distinto:

| Llamada | Qué devuelve | ¿Escribe sobre el original? | ¿Se puede modificar? |
| --- | --- | --- | --- |
| `subList(1, 3)` | Una vista del rango | Sí | Sí, y el cambio se ve en la original |
| `Arrays.asList(array)` | Una vista de tamaño fijo | Sí, escribe sobre el array | `set` sí; `add` y `remove` no |
| `List.of(...)` (Java 9) | Una lista inmutable | No | No |
| `List.copyOf(lista)` (Java 10) | Una copia inmutable | No | No |

```java
List<String> letras = new ArrayList<>(Arrays.asList("a", "b", "c", "d"));

List<String> vista = letras.subList(1, 3);   // posiciones 1 y 2, el 3 queda fuera
vista.set(0, "B");
System.out.println(letras);                  // [a, B, c, d]

String[] array = {"x", "y", "z"};
List<String> fija = Arrays.asList(array);    // tamaño fijo, escribe sobre el array
fija.set(0, "X");
System.out.println(array[0]);                // X

List<String> copia = List.copyOf(letras);    // Java 10: copia inmutable
letras.set(0, "A");
System.out.println(copia);                   // [a, B, c, d]

fija.add("w");      // UnsupportedOperationException
copia.set(0, "A");  // UnsupportedOperationException
```

`subList` no copia: devuelve una ventana a la lista original, con el índice final excluido. Escribir en
la ventana escribe en la original, y `vista.clear()` borra ese rango de la lista grande. Si la original
cambia de estructura mientras usas la vista, esta queda indefinida y lo normal es que lance
`ConcurrentModificationException`.

`Arrays.asList` ya apareció en el capítulo de arrays: es una vista de tamaño fijo sobre el array, así
que `set` funciona en los dos sentidos y `add` no. `List.of` (Java 9) crea una lista inmutable y
`List.copyOf` (Java 10) copia una colección a una lista inmutable; las dos rechazan `null` con
`NullPointerException`. Si lo que pasas a `List.copyOf` ya es inmutable, puede devolverte la misma
instancia, y no pasa nada: nadie la puede cambiar.

> [!TRUCO]
> Un constructor que reciba una lista y la guarde debe copiarla: `this.items = List.copyOf(items);`.
> Así el estado del objeto no depende de lo que haga quien lo creó, y de paso los `null` se rechazan
> en la frontera.

## Borrar mientras recorres

El capítulo anterior contó el mecanismo: el `for` mejorado es un `Iterator`, y modificar la colección
por detrás lanza `ConcurrentModificationException` en el siguiente `next()`. Para una lista hay dos
formas cortas de hacerlo bien: `removeIf` (Java 8), que recibe un `Predicate` y borra en una pasada
todo lo que lo cumpla, y el `Iterator` con `it.remove()`, cuando la condición necesita mirar más de un
elemento. El caso que más despista es el que no lanza nada.

> [!OJO]
> Borrar el penúltimo elemento con un `for` mejorado es el caso que más despista: el tamaño nuevo
> coincide con el cursor, así que el bucle termina antes del `next()` que habría lanzado la excepción.
> Puede no lanzar nada y aun así dejar sin revisar el último elemento.

## Lo que viene después

`List` conserva el orden por posición. Cuando lo que importa es la pertenencia y no quieres repetidos,
la interfaz es `Set`; cuando quieres buscar por una clave, es `Map`. Las dos dependen de `equals` y
`hashCode`, que ya presentó el capítulo de Object, y por eso el siguiente empieza por ese contrato.

## Qué te llevas

- `List` promete posición, orden y duplicados; `get` y `set` hablan de índices, y `indexOf` de igualdad.
- `ArrayList` es un array con un contador: diez celdas al primer `add`, crecimiento de alrededor de un
  50 por ciento en OpenJDK, O(1) amortizado al final y O(n) al insertar en medio.
- `new ArrayList<>(n)` y `ensureCapacity` evitan copias, pero no cambian el tamaño.
- `LinkedList` solo merece la pena como `Deque` en los extremos; como `List` casi nunca.
- `remove(1)` borra el índice 1; para el valor 1 de un `List<Integer>`, `remove(Integer.valueOf(1))`.
- `list.sort(...)` (Java 8) es estable, `thenComparing` desempata y `reversed` invierte la cadena entera.
- `subList` y `Arrays.asList` son vistas; `List.of` (Java 9) y `List.copyOf` (Java 10) son inmutables.
- `removeIf` (Java 8) o `Iterator.remove()` para borrar recorriendo; con la lista en un `for` mejorado,
  `ConcurrentModificationException`.
