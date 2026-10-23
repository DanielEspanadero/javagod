---
title: 'Conjuntos y el contrato de equals'
description: 'Qué promete un Set, cómo deciden HashSet, LinkedHashSet y TreeSet si un valor es duplicado, y por qué un elemento mutable desaparece.'
section: colecciones
order: 3
since: 8
---

## Pertenecer es la única pregunta

El capítulo anterior buscaba por posición: un `List` tiene índice y admite duplicados. Un `Set`
cambia la pregunta. No tiene índice, no tiene `get` y no admite dos valores iguales; solo contesta
sí o no a la pertenencia. Su contrato cabe en tres reglas:

- **No hay duplicados ni índice.** `add` devuelve `false` si el elemento ya estaba y `true` si
  entra; `size` cuenta valores distintos y no existe `get` ni `set`: se pregunta con `contains`.
- **La igualdad es la de `equals`.** No pregunta si es el mismo objeto, sino si es el mismo valor.
  `hashCode` decide dónde buscarlo y `equals` confirma el hallazgo.
- **El orden no es parte del contrato.** Cada implementación de este capítulo ofrece uno distinto, y
  esa es la diferencia real entre las tres.

El contrato completo está en [Object y sus contratos](/docs/objetos/object-y-contratos/); aquí solo
hace falta la consecuencia: lo que `equals` considera igual no entra dos veces, y lo que cambia
después puede desaparecer del conjunto sin haber salido.

## `HashSet`: el hash elige el cubo

`HashSet` es el valor por defecto, como `ArrayList` para `List`: una tabla de cubos donde cada cubo
guarda las entradas que caen en él. Añadir calcula `hashCode()`, lo traduce en un índice de cubo y
compara con `equals` dentro del cubo. Si alguna entrada es igual, `add` devuelve `false`; si no,
entra. Buscar repite el camino.

De ahí sale el coste: con un hash que reparta bien, `add`, `remove` y `contains` son O(1) de media.
Una colisión no pierde nada: las dos entradas conviven en el mismo cubo y solo cuesta tiempo
compararlas. En OpenJDK, cuando la tabla tiene al menos 64 cubos y uno de ellos llega a ocho
entradas, ese cubo pasa a árbol rojo-negro y buscar dentro baja de O(n) a O(log n).

La tabla no tiene tamaño fijo: el constructor sin argumentos usa 16 cubos y factor de carga 0,75, así
que caben 12 entradas. Al meter la decimotercera, OpenJDK dobla a 32 cubos y recoloca todo, porque el
índice depende del tamaño. Ese `rehash` es O(n) y cada vez más raro, así que añadir sigue siendo O(1)
amortizado; `new HashSet<>(n)` evita los primeros rehashes.

El orden de iteración no es un contrato: depende del hash y del número de cubos, y cambia al añadir.
Si la salida tiene que ser siempre la misma, este no es el conjunto.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Añadir a un HashSet</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">El hash</span>
      <code class="diagram__value">hashCode()</code><span class="diagram__hint">Se traduce en un índice de cubo. Si cambia, la entrada se queda donde estaba.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">El cubo</span>
      <code class="diagram__value">equals</code><span class="diagram__hint">Si alguna entrada es igual, <code>add</code> devuelve <code>false</code> y no entra.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">La tabla</span>
      <code class="diagram__value">12 de 16</code><span class="diagram__hint">Con 0,75 de carga, la decimotercera entrada obliga a doblar y recolocar.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Tres pasos y un umbral: el hash elige el cubo, <code>equals</code> decide el duplicado y la carga decide cuándo se rehace la tabla.</figcaption>
</figure>

## La trampa: el elemento que se muda

Todo lo anterior se apoya en una promesa silenciosa: el hash de un elemento no cambia mientras está
dentro. Si cambia, la entrada se queda en un cubo al que ya nadie va a buscar, sin aviso ni excepción.

```java
final class Etiqueta {
    String texto;                                  // mutable a propósito
    Etiqueta(String texto) { this.texto = texto; }

    @Override
    public boolean equals(Object otro) {
        return otro instanceof Etiqueta && ((Etiqueta) otro).texto.equals(texto);
    }

    @Override
    public int hashCode() { return texto.hashCode(); }
}

Set<Etiqueta> etiquetas = new HashSet<>();
Etiqueta vieja = new Etiqueta("borrador");
etiquetas.add(vieja);                             // cubo de "borrador"
vieja.texto = "final";                            // el hash cambia dentro
System.out.println(etiquetas.size());             // 1: sigue dentro
System.out.println(etiquetas.contains(vieja));    // false: otro cubo
Etiqueta nueva = new Etiqueta("final");
System.out.println(vieja.equals(nueva));          // true: son iguales
System.out.println(etiquetas.add(nueva));         // true: entra otra vez
System.out.println(etiquetas.size());             // 2: dos iguales dentro
```

La etiqueta sigue dentro, pero `contains` la busca en el cubo de `"final"` y no encuentra nada: se
quedó en el de `"borrador"`. `remove` tampoco la encuentra. Y `"final"` es nuevo para la tabla, así
que entra otra vez: el conjunto acaba con dos iguales, justo lo que promete no tener.

La regla es la del capítulo de Object, aplicada al elemento: los campos que leen `equals` y `hashCode`
no cambian mientras el objeto esté dentro. Si tiene que cambiar, sácalo con `remove` y vuelve a
meterlo, o hazlo inmutable; una `String` inmutable no te dará este problema.

## `LinkedHashSet`: el orden en que llegaron

`LinkedHashSet` es un `HashSet` con una lista doblemente enlazada que recorre las entradas en orden de
inserción. Añade la promesa que `HashSet` no da y paga algo más de memoria por entrada; `add` y
`contains` siguen en O(1) de media, con algo más de coste por mantener la lista.

Esa promesa resuelve el caso más común, quitar repetidos sin perder el orden de llegada:

```java
List<String> etiquetas = Arrays.asList("java", "colecciones", "java", "set", "colecciones");

Set<String> sinRepes = new LinkedHashSet<>(etiquetas);
System.out.println(sinRepes);                  // [java, colecciones, set]
System.out.println(sinRepes.add("java"));      // false: ya estaba
System.out.println(new ArrayList<>(sinRepes)); // [java, colecciones, set]
```

`new LinkedHashSet<>(coleccion)` recorre la original, descarta lo que ya está y conserva la primera
aparición; volver a añadir un elemento que ya está devuelve `false` y no lo mueve de sitio. Si el
orden da igual, `HashSet` gasta menos; si la iteración tiene que seguir el orden de llegada, este es
el conjunto.

## `TreeSet`: ordenado, no solo sin repetidos

`TreeSet` mantiene los elementos ordenados y, en OpenJDK, lo hace sobre un árbol rojo-negro.
`add`, `remove` y `contains` son O(log n), porque cada operación baja por el árbol comparando.

El orden sale de `Comparable`, el `compareTo` de los elementos, o del `Comparator` que pases al
constructor. Con él llegan `first`, `last`, `headSet`, `tailSet`, `ceiling`, `floor`, `higher` y
`lower`, que están en `NavigableSet` (Java 6) y no en `Set`.

```java
NavigableSet<Integer> notas = new TreeSet<>(Arrays.asList(7, 2, 9, 4, 6, 2));
System.out.println(notas);              // [2, 4, 6, 7, 9]

System.out.println(notas.first());      // 2
System.out.println(notas.last());       // 9
System.out.println(notas.headSet(6));   // [2, 4]: el 6 queda fuera
System.out.println(notas.tailSet(6));   // [6, 7, 9]: el 6 entra
System.out.println(notas.ceiling(5));   // 6: el menor que es mayor o igual que 5
System.out.println(notas.floor(5));     // 4: el mayor que es menor o igual que 5
System.out.println(notas.higher(7));    // 9: estrictamente mayor que 7
```

`headSet` y `tailSet` devuelven vistas, no copias: si modificas el árbol, la vista lo refleja. Por
defecto, `headSet` excluye el límite y `tailSet` lo incluye, como se ve arriba; las sobrecargas con un
booleano lo deciden: `headSet(6, true)` incluye el 6 y `tailSet(6, false)` lo deja fuera.

El orden natural pide elementos comparables, y `null` no se compara con nada: `add(null)` lanza
`NullPointerException`. Un `Comparator` que acepte `null` lo evita, pero el orden deja de ser natural.

## Cuando el comparador no concuerda con `equals`

`TreeSet` decide los duplicados con `compareTo` o con el comparador, no con `equals`; `SortedSet` pide
que concuerden: comparar dé 0 exactamente cuando `equals` da `true`. Si no, ordena, pero incumple el
trato.

```java
Set<String> nombres = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
nombres.add("Java");
nombres.add("java");
System.out.println(nombres.size());            // 1: para el comparador es el mismo
System.out.println(nombres.contains("java"));  // true: dentro solo está "Java"
System.out.println("Java".equals("java"));     // false: para equals no lo son

Set<String> vacio = new TreeSet<>();
vacio.add(null);                               // NullPointerException
```

Para el comparador, `"Java"` y `"java"` son el mismo: el segundo `add` devuelve `false` y solo se
guarda uno. `equals` dice que son distintos, así que `contains("java")` contesta `true` aunque esa
grafía no esté dentro. `String.CASE_INSENSITIVE_ORDER` es el ejemplo de manual de un comparador así.

> [!OJO]
> Un `TreeSet` así no lanza nada: responde con seguridad a preguntas cuya respuesta no encaja con
> `equals`. Si necesitas las dos grafías, ordena una lista al mostrarla en vez de usar `TreeSet`.

## Álgebra de conjuntos

Un conjunto sirve para combinar conjuntos. `Collection` ya trae los cuatro métodos, y con dos `Set`
hacen la unión, la intersección, la diferencia y la inclusión:

| Método | Qué calcula | Con `pares = {2, 4, 6, 8}` y `pequenos = {1, 2, 3, 4}` |
| --- | --- | --- |
| `addAll(otro)` | Unión | `{1, 2, 3, 4, 6, 8}` |
| `retainAll(otro)` | Intersección | `{2, 4}` |
| `removeAll(otro)` | Diferencia: lo que está en este y no en el otro | `{6, 8}` |
| `containsAll(otro)` | Si este contiene todos los del otro | `false` |

Los tres primeros modifican el conjunto sobre el que se llaman y devuelven un `boolean` que dice si
cambió algo, así que se opera sobre una copia: el original se guarda antes.

```java
Set<Integer> pares = new TreeSet<>(Arrays.asList(2, 4, 6, 8));
Set<Integer> pequenos = new TreeSet<>(Arrays.asList(1, 2, 3, 4));

Set<Integer> union = new TreeSet<>(pares);
union.addAll(pequenos);
System.out.println(union);                           // [1, 2, 3, 4, 6, 8]

Set<Integer> interseccion = new TreeSet<>(pares);
interseccion.retainAll(pequenos);
System.out.println(interseccion);                    // [2, 4]

Set<Integer> diferencia = new TreeSet<>(pares);
diferencia.removeAll(pequenos);
System.out.println(diferencia);                      // [6, 8]

System.out.println(pares.containsAll(pequenos));     // false: falta el 1 y el 3
System.out.println(union.containsAll(pequenos));     // true
System.out.println(pares);                           // [2, 4, 6, 8]: intacto
```

`new TreeSet<>(pares)` copia y conserva el orden, así que la salida se lee igual en cualquier
máquina. `containsAll` no modifica nada. Las tres operaciones recorren uno de los conjuntos y
preguntan por el otro, así que el coste crece con los dos: O(1) por elemento en `HashSet` y O(log n)
en `TreeSet`.

## Conjuntos inmutables

El primer capítulo presentó `Set.of` (Java 9) y `Set.copyOf` (Java 10). En un conjunto añaden una
regla propia: `Set.of` rechaza el duplicado al construir y `Set.copyOf` lo descarta en silencio.

```java
Set<String> letras = Set.of("a", "b", "c");   // Java 9
System.out.println(letras.contains("b"));     // true
System.out.println(letras.size());            // 3

letras.add("d");                              // UnsupportedOperationException
Set.of("a", "b", "a");                        // IllegalArgumentException
Set.of("a", null);                            // NullPointerException
List<String> conRepes = Arrays.asList("uno", "dos", "uno");
Set<String> copia = Set.copyOf(conRepes);     // Java 10
System.out.println(copia.size());             // 2: el duplicado se descarta
Set.copyOf(Arrays.asList("uno", null));       // NullPointerException
```

`Set.of` es la fábrica de constantes: falla en la línea donde la escribes con `IllegalArgumentException`
si repites un elemento y con `NullPointerException` si cuelas un `null`. `Set.copyOf` es la frontera de
un método: acepta la colección que le pasen, quita los repetidos y devuelve algo que nadie puede
modificar. Ninguno promete orden: si lo necesitas, ordénalo al mostrarlo.

> [!TRUCO]
> Un método que devuelve un conjunto de solo lectura escribe `return Set.copyOf(interno);`, que copia.
> Si es grande, `Collections.unmodifiableSet(interno)` envuelve sin copiar, pero deja ver los cambios.

## Cuál elegir

| Clase | Orden de iteración | `add` y `contains` | Cuándo elegirla |
| --- | --- | --- | --- |
| `HashSet` | Ninguno garantizado | O(1) de media | Lo normal: solo importa la pertenencia |
| `LinkedHashSet` | El de inserción | O(1) de media, algo más de memoria | La salida tiene que ser siempre la misma |
| `TreeSet` | El natural o el del `Comparator` | O(log n) | Necesitas orden, rangos, `first` o `last` |

## Lo que viene

El capítulo siguiente cambia la pregunta a la clave. Un `Map` arrastra el mismo problema de igualdad
que un `Set`: una clave mutable se pierde, un `TreeMap` ordena y un comparador que no concuerda con
`equals` junta claves distintas.

## Qué te llevas

- `Set` no tiene índice ni duplicados; `add` devuelve `false` cuando el valor ya estaba y la
  pertenencia se decide con `equals` y `hashCode`.
- La interfaz no promete orden; `HashSet` no lo garantiza, `LinkedHashSet` da el de inserción y
  `TreeSet` el de `Comparable` o el `Comparator`; `new LinkedHashSet<>(coleccion)` quita repetidos
  conservando la primera aparición.
- `HashSet` busca en O(1) de media con 16 cubos y factor 0,75; al pasar de 12 entradas, OpenJDK
  dobla la tabla. Una colisión guarda las dos entradas y solo cuesta tiempo.
- Un elemento cuyo hash cambia dentro del conjunto se vuelve invisible: `contains` y `remove`
  devuelven `false` y el conjunto puede acabar con dos valores que `equals` considera iguales.
- `TreeSet` cuesta O(log n), ordena y ofrece `first`, `last`, `headSet`, `tailSet`, `ceiling` y
  `floor`; rechaza `null` con el orden natural, y si el comparador no concuerda con `equals`, guarda
  uno solo de dos valores que `equals` distingue.
- `addAll`, `retainAll`, `removeAll` y `containsAll` son la unión, la intersección, la diferencia y
  la inclusión; se llaman sobre una copia.
- `Set.of` (Java 9) rechaza duplicados y `null` al construir; `Set.copyOf` (Java 10) descarta los
  duplicados y rechaza `null`. Ninguno promete orden de iteración.
