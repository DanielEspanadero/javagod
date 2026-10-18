---
title: 'Arrays'
description: 'Tamaño fijo, arrays de arrays y las utilidades de java.util.Arrays.'
section: fundamentos
order: 7
---

## Un array es un objeto de tamaño fijo

```java
int[] notas = new int[5];
String[] nombres = new String[3];

System.out.println(notas.length); // 5
System.out.println(notas[0]);     // 0
System.out.println(nombres[0]);   // null
```

El tamaño se decide al crearlo y no cambia nunca. `length` es un campo `final`, no un
método: `notas.length`, sin paréntesis. Y como todo lo demás, los huecos llegan con su valor
por defecto: `0` en los numéricos, `false` en los `boolean`, `null` en las referencias.

Un índice fuera del rango lanza `ArrayIndexOutOfBoundsException`, que es una excepción en
ejecución, no un error de compilación: el array podría venir de cualquier sitio.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Las reglas del array</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Casilla</span>
      <code class="diagram__value">notas[i]</code>
      <span class="diagram__hint">Cada hueco guarda un valor del tipo, desde el principio.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Último índice</span>
      <code class="diagram__value">length - 1</code>
      <span class="diagram__hint">El índice final, que no es <code>length</code>.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Fuera de rango</span>
      <code class="diagram__value">ArrayIndexOutOfBoundsException</code>
      <span class="diagram__hint">Salta en ejecución, no en compilación.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Un array no arranca vacío: arranca con todos sus huecos creados y rellenos con el valor por defecto del tipo, y el índice válido más alto siempre es <code>length - 1</code>.</figcaption>
</figure>

## Crear, rellenar y redimensionar

```java
int[] primos = {2, 3, 5, 7};          // solo en la declaración
int[] otros = new int[] {11, 13, 17}; // en cualquier expresión

int[] ceros = new int[4];
Arrays.fill(ceros, -1);               // [-1, -1, -1, -1]

int[] masGrande = Arrays.copyOf(primos, 8); // [2, 3, 5, 7, 0, 0, 0, 0]
int[] cola = Arrays.copyOfRange(primos, 1, 3); // [3, 5]
```

"Ampliar un array" no existe: `Arrays.copyOf` crea uno nuevo con el tamaño pedido y copia. Lo
que no cabe se pierde y lo que sobra se rellena con el valor por defecto. Para colecciones que
crecen se usa una `ArrayList`, no un array.

## Arrays de arrays, no matrices

Un `int[][]` es un array de referencias a arrays. Cada fila es un objeto aparte, y por eso
puede tener un tamaño distinto:

```java
int[][] tabla = new int[3][4];  // 3 filas de 4 columnas, todas del mismo largo
int[][] irregular = new int[3][]; // tres huecos, cada fila se crea aparte

irregular[0] = new int[] {1, 2};
irregular[1] = new int[] {3, 4, 5, 6};
irregular[2] = new int[] {7};

System.out.println(tabla.length);      // 3 filas
System.out.println(tabla[0].length);   // 4 columnas
System.out.println(irregular[1].length); // 4, esta fila es más larga
```

Con esa forma, `irregular[2]` empieza siendo `null` si no la creas: `new int[3][]` solo crea
los tres huecos del primer nivel. Acceder a `irregular[2][0]` ahí es un
`NullPointerException`, no un índice fuera de rango.

## Recorrer

```java
int[] notas = {7, 4, 9, 6};

for (int i = 0; i < notas.length; i++) {
    System.out.println(i + ": " + notas[i]);
}

int suma = 0;
for (int nota : notas) {
    suma += nota;
}
```

El `for` mejorado no da el índice, y por eso no sirve para escribir en una posición: asigna a
una copia del valor. Para modificar el array necesitas el índice.

```java
for (int nota : notas) {
    nota = 10; // no cambia el array, cambia la copia local
}
```

## Copiar: `=` duplica la referencia, no el contenido

```java
int[] a = {1, 2, 3};
int[] b = a;          // mismo array, dos nombres
b[0] = 99;
System.out.println(a[0]); // 99

int[] c = Arrays.copyOf(a, a.length); // copia de verdad
c[0] = 1;
System.out.println(a[0]); // 99, a no se enteró
```

Lo mismo pasa al pasar un array a un método: el método recibe una copia de la referencia y
puede cambiar el contenido del array del llamador. `clone()` también copia, y
`System.arraycopy` copia entre arrays ya creados, con rangos que pueden solaparse.

## Comparar: `==` pregunta por identidad

```java
int[] x = {1, 2, 3};
int[] y = {1, 2, 3};

System.out.println(x == y);                // false
System.out.println(Arrays.equals(x, y));   // true
System.out.println(Arrays.toString(x));    // [1, 2, 3]
```

`Arrays.toString` es la diferencia entre depurar en un minuto o en una hora: imprimir un array
con `println` da un `[I@1b6d3586` que no dice nada. `Arrays.hashCode` sigue la misma regla que
`equals`, así que un array como clave de un `HashMap` no funciona como esperas: la clave es el
objeto, no el contenido.

Con arrays anidados hay que cambiar de método:

```java
int[][] m = {{1, 2}, {3, 4}};
int[][] n = {{1, 2}, {3, 4}};

System.out.println(Arrays.equals(m, n));     // false, compara filas por identidad
System.out.println(Arrays.deepEquals(m, n)); // true
System.out.println(Arrays.deepToString(m));  // [[1, 2], [3, 4]]
```

## Ordenar y buscar

```java
int[] valores = {5, 2, 9, 1};
Arrays.sort(valores);                       // [1, 2, 5, 9]

int[] ordenados = {1, 2, 5, 9};
System.out.println(Arrays.binarySearch(ordenados, 5));  // 2
System.out.println(Arrays.binarySearch(ordenados, 4));  // -3
```

`binarySearch` exige el array ya ordenado; si no lo está, el resultado no está definido. Y
cuando no encuentra el valor devuelve `-(punto de inserción) - 1`, una fórmula fea pero útil:
te dice a la vez que no está y dónde iría. Por eso `-3` significa "no está, entraría en la
posición 2".

El algoritmo de `sort` depende del tipo. Con primitivos usa un quicksort de doble pivote y no
garantiza estabilidad. Con objetos usa un mergesort adaptativo (TimSort) y sí la garantiza: los
elementos iguales conservan su orden relativo, que es lo que necesitas cuando ordenas por un
campo y esperas mantener el orden del otro.

```java
record Persona(String nombre, int edad) {}
Persona[] gente = {
    new Persona("Ada", 36),
    new Persona("Alan", 36),
    new Persona("Grace", 45)
};
Arrays.sort(gente, Comparator.comparingInt(Persona::edad));
// Ada y Alan siguen en el orden en que estaban: el sort es estable
```

## Arrays y `List` comparten poco

```java
List<String> fija = Arrays.asList("uno", "dos");
fija.set(0, "UNO");            // permitido: es una vista del array
fija.add("tres");              // UnsupportedOperationException

List<String> inmutable = List.of("uno", "dos");
inmutable.set(0, "UNO");       // UnsupportedOperationException

String[] otraVez = inmutable.toArray(new String[0]);
```

`Arrays.asList` no copia: devuelve una lista de tamaño fijo apoyada en el array, así que los
cambios se ven en los dos sentidos. `List.of` (Java 9) devuelve una lista inmutable de verdad y
rechaza `null`. Para pasar de lista a array, `toArray(new String[0])` es la forma que funciona
también en versiones anteriores a Java 11; desde 11, `toArray(String[]::new)`.

## Covarianza: por qué existe `ArrayStoreException`

Un array de referencias es covariante: un `String[]` es un `Object[]`.

```java
Object[] cosas = new String[2];
cosas[0] = "hola";        // bien
cosas[1] = Integer.valueOf(1); // ArrayStoreException en ejecución
```

El compilador acepta la asignación porque el tipo declarado es `Object[]`; la máquina virtual
comprueba el tipo real del array al guardar y lo rechaza. Es el precio de la covarianza, y una
razón más por la que las colecciones con genéricos son más seguras que los arrays.

Y una advertencia que viene de la mano: `new List<String>[10]` no compila. Los arrays saben su
tipo en ejecución y los genéricos no existen en ejecución, así que esa combinación está
prohibida.

## Qué te llevas

- Un array tiene tamaño fijo y `length` es un campo, no un método.
- Los huecos existen desde el principio, con el valor por defecto del tipo.
- `int[][]` es un array de arrays: las filas pueden medir distinto.
- `=` y `==` hablan de referencias; para contenido, `Arrays.equals`, `deepEquals`, `toString`.
- Para crecer, `Arrays.copyOf` crea otro; las colecciones que crecen son otra cosa.
- `binarySearch` exige el array ordenado y devuelve `-(inserción) - 1` cuando no encuentra.
- `sort` con objetos es estable; con primitivos no lo garantiza.
- `Arrays.asList` es una vista de tamaño fijo, no una copia.
- Los arrays son covariantes y comprueban el tipo al guardar: de ahí `ArrayStoreException`.
