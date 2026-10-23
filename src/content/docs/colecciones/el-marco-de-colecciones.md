---
title: 'El marco de colecciones'
description: 'Por qué un array no basta, qué interfaz elegir para cada necesidad y cómo se recorren, se tipan y se congelan las colecciones.'
section: colecciones
order: 1
since: 8
---

## Tres tareas que un array no resuelve

El capítulo de [Arrays](/docs/fundamentos/arrays/) dejó tres tareas fuera: crecer, meter algo en
medio y buscar por clave. Para crecer había un remedio casero, copiar el array entero a uno más
grande. Insertar en medio era peor, porque hay que desplazar todo lo que viene detrás. Y buscar
por clave no tenía arreglo: un array se indexa por posición, y la posición no dice dónde está.

Java responde con un marco entero en `java.util`: unas cuantas interfaces, varias implementaciones
de cada una y una clase de utilidades, `Collections`, para lo que no encaja en ninguna. Describes
lo que necesitas con una interfaz y eliges la clase que lo cumple. Un array sigue siendo lo
correcto cuando el tamaño se decide una vez y no cambia; lo que cambia es que ya no es la única.

## La jerarquía: tres ramas y un intruso

`Iterable<E>` es la raíz, y vive en `java.lang`, no en `java.util`. Declara un solo método
abstracto, `iterator()`, y basta con implementarlo para aparecer a la derecha de un `for`
mejorado. Los arrays también se recorren así, pero no son `Iterable`: el compilador los trata
aparte y genera un bucle por índice.

`Collection<E>` extiende `Iterable<E>` y añade lo que comparten los tres grupos: `add`, `remove`,
`contains`, `size`, `isEmpty` y `clear`. De ella cuelgan `List`, `Set` y `Queue`, y de `Queue`
cuelga `Deque`. `Map<K, V>` se queda fuera: no extiende `Collection`, no tiene `add` ni `iterator`,
porque no guarda elementos sueltos sino parejas de clave y valor.

```java
import java.util.*;

List<String> lista = new ArrayList<>();
Set<String> conjunto = new HashSet<>();
Map<String, Integer> edades = new HashMap<>();

lista.add("uno");
conjunto.add("uno");
edades.put("uno", 1);

System.out.println(lista.get(0));       // uno
System.out.println(edades.get("uno"));  // 1
// System.out.println(conjunto.get(0)); // no existe: un Set no tiene índices
```

<figure class="diagram diagram--framed">
  <p class="diagram__label">El árbol de interfaces</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">Iterable</span>
      <code class="diagram__value">iterator()</code>
      <span class="diagram__hint">Lo mínimo para recorrerlo con un for-each.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">Collection</span>
      <code class="diagram__value">add, size, remove</code>
      <span class="diagram__hint">Lo común a listas, conjuntos y colas.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">List</span>
      <code class="diagram__value">get(int)</code>
      <span class="diagram__hint">Orden de llegada, índice y duplicados.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">04</span><span class="diagram__title">Set</span>
      <code class="diagram__value">add sin índice</code>
      <span class="diagram__hint">Sin duplicados: no hay <code>get</code>.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">05</span><span class="diagram__title">Queue y Deque</span>
      <code class="diagram__value">poll()</code>
      <span class="diagram__hint">Sale por un extremo; <code>Deque</code>, por los dos.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">06</span><span class="diagram__title">Map</span>
      <code class="diagram__value">put(k, v)</code>
      <span class="diagram__hint">Fuera del árbol: parejas de clave y valor.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">En orden, <code>Collection</code> añade operaciones a <code>Iterable</code> y las tres ramas añaden lo suyo. <code>Map</code> no está en el árbol porque no extiende <code>Collection</code>: se recorre por sus vistas, <code>keySet</code>, <code>values</code> o <code>entrySet</code>.</figcaption>
</figure>

El tipo de la variable decide qué puedes hacer; la clase decide cómo. Declara con la interfaz y
elige la implementación al construir: cambiar `ArrayList` por otra es cambiar esa línea.

## Cómo elegir sin pensarlo dos veces

Casi todas las decisiones se resuelven con estas preguntas: ¿puede repetirse el mismo valor?
¿importa el orden en que llegan? ¿buscas por posición o por clave? ¿sacas por los extremos?

| La pregunta | Si la respuesta es sí | Clase de partida |
| --- | --- | --- |
| ¿Buscas el valor por una clave que eliges tú? | `Map` | `HashMap` |
| ¿El orden de llegada importa y hay duplicados? | `List` | `ArrayList` |
| ¿Hay que descartar duplicados? | `Set` | `HashSet` |
| ¿Entra y sale por los extremos? | `Queue` o `Deque` | `ArrayDeque` |

`List` y `Set` se distinguen por una sola cosa: si el mismo valor puede aparecer dos veces. La
posición es un extra de `List`, no un requisito. `Map` contesta la pregunta que un array nunca
supo: dado este nombre, ¿qué valor le toca?

El capítulo siguiente entra en el orden y el índice; el tercero, en el contrato de `equals` que
hace que un `HashSet` no repita; y el cuarto, en las claves de un mapa.

## Genéricos: el tipo dentro del tipo

Un `List<String>` lleva el tipo dentro del tipo. El parámetro no es decoración: el compilador lo
usa para comprobar lo que entra en `add` y lo que sale de `get`, que ya no pide un cast. Sin él,
un `List` acepta cualquier `Object` y cada lectura hay que convertirla a mano.

```java
List<String> nombres = new ArrayList<>();
nombres.add("Ada");
nombres.add("Grace");

// List<Object> objetos = new ArrayList<String>(); // no compila: no hay covarianza
// nombres.add(42);                               // no compila: el parámetro es String

List<Integer> numeros = new ArrayList<>();       // el envoltorio, nunca int
numeros.add(42);                                 // autoboxing: Integer.valueOf(42)

System.out.println(nombres.get(0));       // Ada, sin cast
System.out.println(numeros.get(0) + 1);   // 43, unboxing y suma
```

Y tres cosas que el parámetro no te da:

- Covarianza: un `List<String>` no es un `List<Object>`, aunque `String` sea un `Object`. Los
  arrays sí lo permiten y comprueban el tipo al guardar; los genéricos lo prohíben porque
  romperían la comprobación del `add`.
- Primitivos: `List<int>` no compila. Se usa el envoltorio, `List<Integer>`, y el compilador pone
  y quita la caja por ti.
- Nada en ejecución: el parámetro se borra al compilar, así que `instanceof List<String>` no
  compila y en la máquina virtual solo hay un `List`.

Cuando necesitas aceptar listas de subtipos, el comodín lo permite para leer: un
`List<? extends Number>` acepta un `List<Integer>` y devuelve `Number`; escribir en ella no se
puede.

## Recorrer y modificar sin romper nada

El `for` mejorado funciona con cualquier `Iterable` y no tiene magia: por debajo hay un
`Iterator`, con `hasNext()` y `next()`, aunque no lo escribas. Ese iterador lleva la cuenta de los
cambios estructurales, y si detecta uno que no hizo él, lanza `ConcurrentModificationException` en
la siguiente llamada a `next()`:

```java
List<String> nombres = new ArrayList<>(Arrays.asList("Ada", "Grace", "Alan"));

try {
    for (String nombre : nombres) {
        if (nombre.startsWith("A")) {
            nombres.remove(nombre);
        }
    }
} catch (ConcurrentModificationException e) {
    System.out.println(nombres); // [Grace, Alan]: borró Ada y se rompió a mitad
}
```

Se borró `Ada` y la lista quedó a medias. La excepción no es un mecanismo de seguridad: salta
cuando el iterador lo detecta, así que el punto exacto depende de la colección y de lo que hayas
borrado; a veces el bucle termina sin excepción y deja un resultado incompleto.

> [!OJO]
> El nombre engaña. `ConcurrentModificationException` casi nunca tiene que ver con varios hilos:
> salta en un solo hilo cuando modificas la colección mientras la recorres, que es este caso.

La salida es borrar con el iterador: `remove()` elimina el último elemento que devolvió `next()` y
ajusta la cuenta para que la siguiente vuelta no se queje.

```java
List<String> nombres = new ArrayList<>(Arrays.asList("Ada", "Grace", "Alan", "Barbara"));

Iterator<String> it = nombres.iterator();
while (it.hasNext()) {
    if (it.next().startsWith("A")) {
        it.remove();                  // borra el último devuelto por next()
    }
}
System.out.println(nombres);          // [Grace, Barbara]

nombres.removeIf(n -> n.length() > 5); // la misma idea, sin escribir el bucle
System.out.println(nombres);           // [Grace]
```

## Autoboxing: Integer no es int

Un `List<Integer>` guarda objetos `Integer`, no `int`, porque no hay `List<int>`. El compilador
mete y saca la caja por ti y el código se lee como si fueran números, pero eso esconde dos
detalles que se llevan mal con las colecciones: `==` compara referencias y `Integer` guarda una
caché.

```java
Integer pequenoA = 127, pequenoB = 127;
Integer grandeA = 128, grandeB = 128;

System.out.println(pequenoA == pequenoB);     // true, la misma instancia cacheada
System.out.println(grandeA == grandeB);       // false, dos objetos distintos
System.out.println(grandeA.equals(grandeB));  // true, equals mira el valor

List<Integer> lista = new ArrayList<>(Arrays.asList(10, 20, 30));
System.out.println(lista.remove(1));                   // 20, borra la posición 1
System.out.println(lista);                             // [10, 30]
System.out.println(lista.remove(Integer.valueOf(1)));  // false, no hay ningún 1
```

`Integer.valueOf` reutiliza las instancias de -128 a 127, así que dos `Integer` de ese rango
pueden ser el mismo objeto y `==` devuelve `true`. Fuera del rango no promete nada y en la
práctica crea objetos nuevos, así que dos `Integer` con 128 no son iguales con `==` aunque valgan
lo mismo. Para comparar valores está `equals`; para operar, el `int` de dentro.

El autoboxing también decide qué sobrecarga se ejecuta. En un `List<Integer>` conviven dos
`remove`, y el argumento elige: `remove(1)` no pregunta por el valor 1, borra la posición 1, porque
`remove(int)` encaja sin conversión y el compilador prefiere la coincidencia exacta a la que necesita
autoboxing. Para borrar el valor hay que envolverlo a mano. La trampa y su salida están en el capítulo
siguiente.

## Colecciones inmutables: `List.of`, `Set.of` y `Map.of`

Desde Java 9, las tres interfaces tienen fábricas estáticas para crear una colección de una vez:

```java
List<String> dias = List.of("lunes", "martes");                // Java 9
Set<Integer> tallas = Set.of(38, 40, 42);                      // Java 9
Map<String, Integer> stock = Map.of("teclado", 3, "ratón", 5); // Java 9

System.out.println(dias);                 // [lunes, martes]
System.out.println(stock.get("ratón"));   // 5
System.out.println(tallas.contains(40));  // true

dias.add("miércoles");                    // UnsupportedOperationException
```

Lo que devuelven es inmutable: cualquier método que la modifique, como `add`, `set` o `put`, lanza
`UnsupportedOperationException`, así que la colección no cambia después de crearse y se puede
compartir sin miedo. También rechazan `null` con `NullPointerException`, y `Set.of` y `Map.of`
rechazan los duplicados con `IllegalArgumentException` al construirse: `Set.of("a", "b", "a")`
falla nada más crearse.

Sirven para constantes, para valores por defecto y para devolver de un método una colección que
nadie deba tocar. Para convertir una colección que ya tienes hay copias: `List.copyOf`,
`Set.copyOf` y `Map.copyOf`, desde Java 10.

## Lo que viene

Con el vocabulario fijado, el capítulo siguiente entra en la lista: el orden, el índice y las
trampas de `remove`. Después llegan los conjuntos y el contrato de `equals`, los mapas y sus
claves, y al final Stream, collectors y Optional, donde las colecciones dejan de recorrerse a mano.
Todo se apoya en lo de aquí: las interfaces, el tipo dentro del tipo y el iterador que no ves.

## Qué te llevas

- `Iterable` es la raíz; `Collection` añade lo común y de ella cuelgan `List`, `Set`, `Queue` y
  `Deque`. `Map` va aparte porque no es una `Collection`.
- Declara con la interfaz y elige la clase al construir: el tipo decide qué puedes hacer.
- La elección se reduce a duplicados, orden, posición y clave.
- Un genérico comprueba el tipo al compilar: no hay covarianza, no admite primitivos y el
  parámetro se borra en ejecución.
- El for-each es un `Iterator` por debajo; modificar dentro del bucle lanza
  `ConcurrentModificationException`, y se sale con `iterator.remove()` o con `removeIf`.
- `List<Integer>` guarda `Integer`: cuidado con `==` y con la caché de -128 a 127, y ojo con
  `remove(1)`, que borra por posición.
- `List.of`, `Set.of` y `Map.of` (Java 9) crean colecciones inmutables que rechazan `null` y, en
  los dos últimos, los duplicados.
