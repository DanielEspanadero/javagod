---
title: 'Encapsulamiento y modificadores de acceso'
description: 'Campos privados, setters que validan y el contrato que firma cada método público.'
section: objetos
order: 2
since: 8
---

## El invariante vive en la clase

Cada objeto mantiene un estado que debe seguir siendo coherente mientras lo usan. En un
artículo, el stock nunca es negativo; en una fecha, el mes va de 1 a 12. Esa regla es el
invariante de la clase, y encapsular es darle un único sitio donde vivir: dentro de la clase.

Con todos los campos públicos el invariante no tiene dónde vivir: cada línea que escribe un
campo tiene que recordar la regla, y la clase se entera del desastre en otro método y en otro
archivo. Eso es acoplamiento: el cliente no solo usa tu clase, también la mantiene sana.

```java
public class Articulo {
    public String nombre;
    public int stock;
}

Articulo a = new Articulo();
a.stock = -3;         // compila: no hay nadie que diga que no
System.out.println(a.stock == 0); // false, y el stock es negativo
```

Ese `println` es el bug en su forma más silenciosa: la clase decidió que `stock == 0` significa
"agotado", pero nadie garantiza que el campo llegue a cero. Un stock negativo no falla: el
objeto miente.

## Cuatro niveles de acceso

Un miembro puede llevar tres modificadores, o ninguno. Quién lo ve depende de dónde se use:

| Modificador | Misma clase | Mismo paquete | Subclase en otro paquete | Cualquier clase |
| --- | --- | --- | --- | --- |
| `private` | Sí | No | No | No |
| Sin modificador | Sí | Sí | No | No |
| `protected` | Sí | Sí | Sí, con matices | No |
| `public` | Sí | Sí | Sí | Sí |

`private` solo lo ve el código de la clase; las subclases no son una excepción. Sin modificador
es acceso de paquete: vale para las clases del mismo paquete y para nadie más. `protected` es el
paquete más las subclases, no un escalón suelto. `public` no lo limita nada.

`protected` tiene un matiz: fuera del paquete, una subclase solo puede usar el miembro a través
de una referencia de su propio tipo, o de un subtipo. No vale cualquier objeto del padre.

```java
// tienda/Producto.java
package tienda;

public class Producto {
    protected int stock;
}

// cliente/ProductoRebajado.java
package cliente;

public class ProductoRebajado extends tienda.Producto {
    void probar(tienda.Producto otro, ProductoRebajado propio) {
        propio.stock = 10; // bien: la referencia es de la subclase
        this.stock = 10;   // bien: this es ProductoRebajado
        otro.stock = 10;   // no compila: la referencia es de tienda.Producto
    }
}
```

Si el parámetro fuera `ProductoRebajado otro`, la tercera línea compilaría. La regla evita que
una subclase de otro paquete manipule el estado de cualquier instancia del padre.

<figure class="diagram diagram--framed">
  <p class="diagram__label">La escala de visibilidad</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">Privado</span>
      <code class="diagram__value">private</code><span class="diagram__hint">Solo la clase.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">De paquete</span>
      <code class="diagram__value">sin modificador</code><span class="diagram__hint">Todo el paquete.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">Protegido</span>
      <code class="diagram__value">protected</code><span class="diagram__hint">El paquete y las subclases.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">04</span><span class="diagram__title">Público</span>
      <code class="diagram__value">public</code><span class="diagram__hint">Cualquier código.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Cada nivel incluye al anterior: <code>protected</code> es paquete más subclases, no un escalón suelto entre ambos.</figcaption>
</figure>

## El mismo artículo, con la regla dentro

Ahora el campo es privado y el único camino hasta él pasa por métodos que comprueban la regla:

```java
public class Articulo {
    private final String nombre;
    private int stock; // nunca negativo

    public Articulo(String nombre, int stockInicial) {
        if (stockInicial < 0) {
            throw new IllegalArgumentException("El stock inicial no puede ser negativo");
        }
        this.nombre = nombre;
        this.stock = stockInicial;
    }

    public String nombre() { return nombre; }
    public int stock() { return stock; }

    public void reponer(int unidades) {
        if (unidades <= 0) {
            throw new IllegalArgumentException("Hay que reponer al menos una unidad");
        }
        stock = Math.addExact(stock, unidades); // si desborda, excepción
    }

    public void vender(int unidades) {
        if (unidades <= 0) {
            throw new IllegalArgumentException("Hay que vender al menos una unidad");
        }
        if (unidades > stock) {
            throw new IllegalArgumentException("No hay stock suficiente");
        }
        stock -= unidades;
    }
}
```

El invariante tiene un solo dueño: el constructor, `reponer` y `vender` lo comprueban. Los dos
últimos son los setters de esta clase, con nombre de operación: no existe `setStock(int)`, porque
"poner el stock a un número" no es una operación del negocio. Un setter tendría que validar lo
mismo, y entonces ya no sería mecánico.

## Un getter no es automático

La tentación, después de privatizar, es escribir `getStock()` y `setStock()` para cada campo. Un
setter que no valida es un campo público con más ceremonia, y un getter puede filtrar el estado
interno sin que lo parezca.

Un getter de un valor inmutable está bien: devolver el `String` del nombre no deja al cliente
cambiar el objeto. El problema llega con arrays y listas. Si el getter hace `return alumnos;`,
`curso.alumnos().clear()` vacía el curso sin pasar por ninguna validación. La solución no es
documentar "no modifiques la lista": es devolver una copia defensiva.

```java
public class Curso {
    private final List<String> alumnos = new ArrayList<>();

    public List<String> alumnos() {
        return List.copyOf(alumnos); // desde Java 10
    }
}
```

`List.copyOf` devuelve una lista inmutable y falla si algún elemento es `null`; en Java 8,
`Collections.unmodifiableList(new ArrayList<>(alumnos))` copia y envuelve. La copia es
superficial: los elementos son los mismos objetos, y si son mutables el cliente puede cambiarlos.
Para un array, `Arrays.copyOf(notas, notas.length)` o `notas.clone()`.

## Inmutabilidad: el objeto que no necesita defensa

Si un objeto no cambia nunca, no hay nada que defender: se comparte sin copias y no se altera
aunque lo uses como clave de un mapa. La receta: campos `final`, sin setters, ningún getter que
devuelva una referencia mutable y la clase `final` para que nadie añada estado en una subclase.

```java
public final class Punto {
    private final int x;
    private final int y;

    public Punto(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int x() { return x; }
    public int y() { return y; }
}
```

No hay setters: si quieres otro punto, construyes otro, y el `hashCode` del original no cambia
por debajo.

`final` congela la referencia, no el objeto: un `private final List<String> nombres` sigue
siendo una lista que se puede llenar. La diferencia ya la viste en
[variables y constantes](/docs/fundamentos/variables-y-constantes/); aquí importa la
consecuencia: solo el objeto inmutable se comparte sin defensas.

## Lo privado se cambia; lo público se negocia

Un campo privado es un detalle de implementación. Mañana `stock` puede llamarse `unidades` o
pasar de `int` a `long`; mientras el comportamiento no cambie, nadie se entera, porque nadie
compiló contra ese nombre.

Un campo público es lo contrario: el cliente lo lee por nombre y por tipo. Renombrarlo, retiparlo
o sustituirlo por un método rompe ese contrato: los clientes ya compilados fallan con un
`NoSuchFieldError`, y los que recompilan pueden dejar de compilar.

Con los métodos pasa lo mismo: cambiar el nombre o los parámetros rompe a quien llama, y el
tipo de retorno rompe a los ya compilados. Cambiar solo el cuerpo no rompe nada, y añadir un
método casi siempre es seguro. Encapsular es elegir qué parte se convierte en contrato.

## Lo de paquete es interno; lo público es una promesa

Sin modificador, el miembro es visible para todo el paquete. Es el nivel correcto para las
piezas que colaboran entre sí y no forman parte de la API: un validador, una clase auxiliar, un
método que solo usan las clases vecinas. Nada de eso lo puede usar alguien de fuera, y por eso
puedes cambiarlo o borrarlo sin miedo.

`public` es una promesa: cualquiera compila contra ello y espera que siga ahí. En una clase de
nivel superior solo hay dos opciones, `public` o sin modificador; los demás niveles son para
miembros y clases anidadas.

## La excepción honesta

Un campo público en un contenedor de valores pequeño no es un pecado, es una decisión. Si es
`final`, puedes validarlo en el constructor y no cambia; pierdes la libertad de cambiar la
representación. Si no es `final`, pierdes además la validación en cada escritura, que es el
problema del principio. Los records, en su propio capítulo, resuelven ese contenedor con menos
ceremonia.

## Qué te llevas

- Encapsular es darle al invariante un único dueño: la clase, no cada cliente.
- `private` es el punto de partida; `public` es una promesa que hay que mantener.
- `protected` incluye el paquete; fuera de él, solo se usa a través del tipo de la subclase.
- Un setter que no valida es un campo público con más ceremonia.
- Copia los arrays y las listas que devuelves: `Arrays.copyOf`, `List.copyOf` (desde Java 10) o
  `Collections.unmodifiableList(new ArrayList<>(...))` en Java 8.
- `final` congela la referencia, no el objeto; la inmutabilidad pide además campos inmutables y
  ningún setter.
- Un campo privado se puede renombrar o retipar sin romper clientes; uno público, no.
- Sin modificador, el miembro es del paquete; publica solo lo que prometes.
