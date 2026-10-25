---
title: 'Records y clases de datos'
description: 'El contenedor de valores en una línea: qué escribe el compilador, dónde vive el invariante y cuándo sigue haciendo falta una clase.'
section: objetos
order: 6
since: 17
---

## El contenedor de valores, escrito a mano

El capítulo de encapsulamiento dejó una excepción honesta: un campo público en un contenedor de
valores pequeño. La alternativa sin trampa, con los campos privados y el contrato completo, pide
cinco piezas para poder usar el objeto como clave de un mapa, y cuatro no dicen nada del problema:

```java
import java.util.Objects; // Java 7

public final class Punto {
    private final int x;
    private final int y;

    public Punto(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int x() { return x; }
    public int y() { return y; }

    @Override
    public boolean equals(Object otro) {
        return otro instanceof Punto p && p.x == x && p.y == y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }

    @Override
    public String toString() {
        return "Punto[x=" + x + ", y=" + y + "]";
    }
}
```

Más de veinte líneas para guardar dos enteros, y la mitad son mecánicas: el compilador las escribe
igual de bien, sin olvidar el `hashCode` cuando alguien toca el `equals`. Los records existen para eso.

## La cabecera ya es el contrato

Un record declara sus componentes en la cabecera y nada más:

```java
public record Punto(int x, int y) {}

Punto p = new Punto(1, 2);
System.out.println(p.x() + ", " + p.y());        // 1, 2
System.out.println(p);                           // Punto[x=1, y=2]
System.out.println(p.equals(new Punto(1, 2)));   // true
```

Esa línea es una clase, no un atajo: tiene sus campos, sus métodos y su contrato. Lo que el
compilador escribe por ti:

| Pieza | Lo que declara |
| --- | --- |
| Campos | Uno `private final` por componente, con su nombre y su tipo |
| Accesores | `x()` e `y()`, con el nombre exacto del componente, no `getX()` |
| `equals` y `hashCode` | Sobre los componentes, en el orden de la cabecera |
| `toString` | `Punto[x=1, y=2]`, la clase y cada componente |
| La clase | `final`, y extiende `java.lang.Record` |

El accesor se llama como el componente porque el componente es la propiedad pública del dato, y
`equals` y `hashCode` salen del mismo sitio: dos `Punto` iguales comparten hash y no se contradicen.

<figure class="diagram diagram--framed">
  <p class="diagram__label">De la clase escrita a mano al record</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">Antes</span>
      <code class="diagram__value">Punto.java</code>
      <span class="diagram__hint">Campos, constructor, accesores, <code>equals</code>, <code>hashCode</code> y <code>toString</code> a mano.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">La cabecera</span>
      <code class="diagram__value">record Punto(int x, int y) {}</code>
      <span class="diagram__hint">Los componentes se declaran una vez y el resto lo escribe el compilador.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">Lo que añades tú</span>
      <code class="diagram__value">public Punto { ... }</code>
      <span class="diagram__hint">El invariante y los métodos que el dato necesita de verdad.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">El record no es otra cosa: es el contenedor de valores del capítulo 2 con el trabajo mecánico hecho; el resto lo pone el lenguaje.</figcaption>
</figure>

No son un quinto pilar, como avisaba el primer capítulo de la sección: son la forma corta de escribir
una clase de datos, y `==` sigue preguntando por la identidad. Llegaron en vista previa con Java 14 y
15, son estándar desde Java 16 y esta página se lee desde Java 17, la primera LTS que los incluye.

## El constructor compacto y su invariante

El invariante del capítulo 2 no desaparece: cambia de sitio. El constructor canónico recibe todos los
componentes en orden, y escribirlo entero no aporta nada, porque es lo que el compilador ya hacía. La
forma útil es el constructor compacto: sin lista de parámetros y sin asignaciones, solo la validación.

```java
public record Rango(int min, int max) {
    public Rango {
        if (min > max) {
            throw new IllegalArgumentException("El mínimo no puede superar el máximo");
        }
    }
}
```

El cuerpo corre antes de que los campos reciban su valor, y dentro `min` y `max` son los parámetros.
Como no son `final`, puedes corregirlos antes de la asignación: intercambiarlos ahí dentro deja el
`Rango` ordenado. Asignar el campo a mano no se puede: `this.min = min` no compila, es `final`.

Un record no tiene constructor sin argumentos: el canónico pide todos los componentes, y si quieres
uno vacío lo escribes tú delegando en él, `public Punto() { this(0, 0); }`.

## Un record como clave de mapa

El capítulo anterior dejó la pregunta a medias: una clave inmutable no cambia de hash dentro del mapa.
Un record la contesta sin escribir nada, porque `equals` y `hashCode` salen de los mismos componentes.

```java
Map<Punto, Articulo> catalogo = new HashMap<>();
catalogo.put(new Punto(1, 2), new Articulo("Teclado", 3));

System.out.println(catalogo.get(new Punto(1, 2)).nombre()); // Teclado
System.out.println(catalogo.get(new Punto(2, 1)));          // null
```

La primera búsqueda usa un `Punto` que nadie metió en el mapa y aun así lo encuentra, porque el
mapa pregunta por el valor. La segunda no: `(2, 1)` no es `(1, 2)`. Con el `Punto` del capítulo de
encapsulamiento, sin esos dos métodos, la primera línea devolvía `null`.

> [!OJO]
> La inmutabilidad de un record es superficial. Los campos son `final`, pero si un componente es una
> lista o un array, su contenido sigue siendo mutable y la clave se mueve, como en cualquier objeto
> del capítulo anterior. Un componente `int[]` ni siquiera se compara por contenido: `equals` usa la
> identidad del array. Copia en el constructor compacto, como el `List.copyOf` (Java 10) del capítulo 2.

## Lo que un record puede añadir

El record declara los datos; el comportamiento que necesites va dentro, sin pedir permiso:

```java
public record Punto(int x, int y) implements Comparable<Punto> {
    public static Punto origen() { return new Punto(0, 0); }

    public Punto conX(int nuevo) { return new Punto(nuevo, y); }

    @Override
    public int compareTo(Punto otro) {
        int porX = Integer.compare(x, otro.x);
        return porX != 0 ? porX : Integer.compare(y, otro.y);
    }
}

System.out.println(Punto.origen());          // Punto[x=0, y=0]
System.out.println(new Punto(1, 2).conX(9)); // Punto[x=9, y=2]
```

Una fábrica estática cubre los constructores alternativos, `conX` devuelve otro punto porque no hay
`setX`, y `Comparable` entra como en cualquier clase. También puedes sobrescribir un accesor o `toString`.

## Lo que un record no puede hacer

Los límites son la otra cara del trato: si el compilador escribe la mitad de la clase, no puedes
cambiar las piezas que escribió.

```java
record Malo(int x) {
    private int z;         // error: field declaration must be static
}
record Peor(int x) extends Base {} // la cabecera no admite extends
```

Un record solo tiene los campos de sus componentes y los `static` que declares: no hay sitio para un
contador de instancia ni para una caché interna. Como ya extiende `java.lang.Record` y es `final`, no
hereda de otra clase ni se deja heredar, y no hay setters: un cambio es un objeto nuevo.

## Cuándo sigue haciendo falta una clase

Un record es una decisión sobre la forma del dato: la cabecera es la API de la clase, con el orden
de los componentes, sus nombres y su constructor. Eso es una ventaja cuando la forma es el dato, y un
problema cuando la forma es un detalle que quieres poder cambiar. Si el objeto cambia con el tiempo, el
record estorba: el `Articulo` del capítulo 2 vende y repone, y su stock no se reconstruye en cada
venta. Si guarda estado que no cabe en sus componentes, como una conexión abierta, tampoco. En los
tres casos, la clase del capítulo 2 sigue siendo la herramienta.

## Clase inmutable o record

| Pregunta | Clase inmutable (capítulo 2) | Record |
| --- | --- | --- |
| `equals`, `hashCode`, `toString` | A mano, unas veinte líneas | Los escribe el compilador |
| Accesores | `x()`, `getX()` o lo que elijas | `x()`, el nombre del componente |
| Campos | `private final`, uno a uno | Los de la cabecera, sin escribirlos |
| Validación | En el constructor | En el constructor compacto |
| Herencia | Puede extender y ser extendida | `final`, y ya viene de `Record` |
| Campos extra | Los que necesite | Solo componentes y `static` |
| Mutabilidad | La que escribas | Superficial: un componente mutable manda |
| Cuándo | Identidad, cambio o estado oculto | El dato es exactamente sus componentes |

## Patrones de record (Java 21)

Desde Java 21, un `instanceof` puede desestructurar el record y darte los componentes ya extraídos,
`if (o instanceof Punto(int x, int y))`, y lo mismo dentro de un `switch`; este capítulo no enseña esa
sintaxis, que tiene su sitio en [Java 21](/docs/novedades/java-21/).

## Dónde encajan en el código real

Un record es el tipo del dato que viaja y no se edita: la pareja de mínimo y máximo que devuelve un
cálculo, el evento que ya ocurrió y solo se lee, el valor de configuración que se carga al arrancar,
la clave de un índice. En el momento en que el objeto tiene que cambiar, guardar algo que no está en
sus componentes o esconder su forma, vuelve a ser una clase.

## Qué te llevas

- Un record es una clase de datos cuyo contrato entero cabe en la cabecera: campos `private final`,
  accesores `x()`, `equals`, `hashCode` y `toString` sobre los componentes, clase `final` que extiende
  `java.lang.Record`.
- Los records son estándar desde Java 16, con vista previa en 14 y 15, y la página se lee desde
  Java 17, la primera LTS que los tiene.
- El constructor compacto valida y normaliza sin repetir asignaciones, y los campos los asigna el
  compilador al final.
- Un record es una clave de mapa fiable porque `equals` y `hashCode` salen de los mismos componentes.
- La inmutabilidad es superficial: un componente lista o array sigue siendo mutable y rompe la clave.
- Puede tener métodos, fábricas estáticas e interfaces; no puede tener campos de instancia extra,
  heredar de otra clase ni setters.
- Si el objeto cambia, esconde su forma o guarda estado que no son sus componentes, sigue siendo una
  clase.
