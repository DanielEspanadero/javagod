---
title: 'Herencia y polimorfismo'
description: 'Una superclase, muchas subclases: qué se hereda, quién decide qué método corre y por qué un campo no es polimórfico.'
section: objetos
order: 3
since: 8
---

## Una superclase, muchas subclases

Al `Articulo` del capítulo anterior le cambiamos el stock por un precio; el invariante sigue dentro.

```java
public class Articulo {
    private final String nombre;
    private final long precioBaseEnCentimos;

    public Articulo(String nombre, long precioBaseEnCentimos) {
        this.nombre = nombre;
        this.precioBaseEnCentimos = precioBaseEnCentimos;
    }

    public long precioFinalEnCentimos() { return precioBaseEnCentimos; }
}
```

Un artículo rebajado es un artículo: tiene nombre, tiene precio y sabe calcular su precio final. Lo
único que añade es un porcentaje y lo único que cambia es la fórmula.

```java
public class ArticuloRebajado extends Articulo {
    private final int porcentaje;

    public ArticuloRebajado(String nombre, long precioBase, int porcentaje) {
        super(nombre, precioBase);   // el constructor del padre, primero
        this.porcentaje = porcentaje;
    }

    public int porcentaje() { return porcentaje; }

    @Override
    public long precioFinalEnCentimos() {
        return super.precioFinalEnCentimos() * (100 - porcentaje) / 100;
    }
}
```

`extends` va en una sola dirección: un `ArticuloRebajado` es un `Articulo`, y un `Articulo` no es un
`ArticuloRebajado`. La jerarquía crece hacia abajo, con una superclase y las subclases que quieras.

Java solo permite heredar de una clase. Dos superclases con el mismo método y cuerpos distintos le
darían dos implementaciones a la subclase y haría falta una regla para elegir; dos copias del estado,
peor. Las interfaces del capítulo 4 cubren esa otra mitad: varios contratos, un solo estado.

## Qué se hereda y qué no

La subclase hereda los miembros visibles del padre: los `public`, los `protected` y los que no llevan
modificador si vive en el mismo paquete. Lo `private` no se hereda: existe en el objeto, pero la
subclase no puede nombrarlo.

| Miembro del padre | ¿Lo hereda la subclase? |
| --- | --- |
| `public` | Sí |
| `protected` | Sí |
| Sin modificador | Solo si la subclase está en el mismo paquete |
| `private` | No: está en el objeto, pero no se puede nombrar |
| Constructor | No: se llama con `super(...)` |

Un constructor no es un miembro y no se hereda: cada clase construye lo suyo. Lo que sí se hereda es
la obligación de construir la parte del padre con `super(...)`, que tiene que ser la primera
instrucción del constructor de la subclase. Si no la escribes, el compilador inserta `super()`, la
llamada sin argumentos, y el código no compila si el padre no tiene uno así.

Para usar la versión del padre de un método sobrescrito está `super.metodo()`: en el ejemplo de
arriba, `super.precioFinalEnCentimos()` es el precio base, y el descuento se aplica encima.

> [!NOTA]
> Si el constructor del padre llama a un método que la subclase sobrescribe, se ejecuta el de la
> subclase antes de que sus campos estén inicializados: los inicializadores de la subclase corren
> después de que `super(...)` devuelva, así que ahí verá `0`, `false` o `null`.

## `@Override`: la firma comprobada

La anotación `@Override` no cambia lo que hace el programa: se lo dice al compilador. Si el método
sobrescribe de verdad a uno del padre, compila; si no, da error. Ese error es lo que compras: sin la
anotación, `precioFinalEnCentimos(int)` compila y crea un método nuevo que nadie llama.

El caso clásico es `equals`: `equals(Articulo)` no sobrescribe `equals(Object)`, y sin la anotación
nada avisa. Al sobrescribir, la firma coincide en nombre y parámetros, no puedes reducir la
visibilidad (un `public` del padre no se vuelve `protected`) y el retorno puede estrecharse a un
subtipo. Lo que no se sobrescribe nunca son tres cosas:

- `final`: el padre cierra esa puerta a propósito.
- `static`: pertenece a la clase, no al objeto; la subclase puede declarar otro igual, pero lo oculta.
- `private`: no se hereda, así que no hay nada que sobrescribir; el de la subclase es un método nuevo.

## La variable y el objeto

Aquí está el centro del capítulo. Una variable de un supertipo puede guardar una instancia de
cualquier subtipo, y el método que corre lo decide el objeto que hay dentro:

```java
Articulo articulo = new ArticuloRebajado("Teclado", 5000, 20);

System.out.println(articulo.precioFinalEnCentimos()); // 4000
```

El compilador solo comprueba que `Articulo` declare `precioFinalEnCentimos`; la elección se hace en
ejecución. La variable promete lo que su tipo declara y el objeto ejecuta lo que su clase implementa.

```java
Articulo[] carrito = { new Articulo("Cuaderno", 350), new ArticuloRebajado("Teclado", 5000, 20) };

long total = 0;
for (Articulo cadaUno : carrito) {
    total += cadaUno.precioFinalEnCentimos();
}
System.out.println(total); // 350 + 4000
```

Un bucle, dos objetos de dos clases y ninguna pregunta por el tipo. Eso es el polimorfismo: el
mismo código sirve para los subtipos de hoy y para los que escribas mañana.

<figure class="diagram diagram--framed">
  <p class="diagram__label">De la llamada al método que corre</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">Llamada</span>
      <code class="diagram__value">articulo.precioFinalEnCentimos()</code>
      <span class="diagram__hint">El compilador solo mira el tipo declarado, <code>Articulo</code>.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">Tipo real</span>
      <code class="diagram__value">ArticuloRebajado</code>
      <span class="diagram__hint">Lo que hay en el montón, y lo que da <code>getClass()</code>.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">Método ejecutado</span>
      <code class="diagram__value">precioFinalEnCentimos()</code>
      <span class="diagram__hint">El de la clase del objeto: 4000, no 5000.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">La variable decide qué métodos puedes llamar; el objeto decide cuál se ejecuta. Esa separación es todo el polimorfismo.</figcaption>
</figure>

> [!OJO]
> Un campo no es polimórfico. Con `protected String etiqueta` declarado en las dos clases,
> `a.etiqueta` sobre un `Articulo a = new ArticuloRebajado()` devuelve la del padre: el campo se
> oculta, no se sobrescribe, y el acceso se resuelve por el tipo declarado, no por el objeto.

> [!AVISO]
> Un método `static` tampoco entra en el reparto. Con `resumen()` estático en las dos clases,
> `articulo.resumen()` ejecuta el de `Articulo`; llámalo por la clase: `Articulo.resumen()`.

## Subir y bajar el tipo

Un upcast es implícito porque siempre es seguro; bajar al subtipo pide un cast que puede fallar:

```java
Articulo articulo = new ArticuloRebajado("Teclado", 5000, 20);
ArticuloRebajado rebajado = (ArticuloRebajado) articulo; // el objeto lo es
System.out.println(rebajado.porcentaje());              // 20

Articulo otro = new Articulo("Cuaderno", 350);
ArticuloRebajado imposible = (ArticuloRebajado) otro;   // ClassCastException
```

El compilador acepta el segundo cast porque `ArticuloRebajado` es un subtipo de `Articulo`; lo que
no puede saber es qué objeto hay dentro, y eso se comprueba al ejecutar.

`instanceof` es la pregunta que evita el cast a ciegas:

```java
if (articulo instanceof ArticuloRebajado rebajado) {
    System.out.println(rebajado.porcentaje()); // desde Java 16: ya es de ese tipo
}
```

Antes de Java 16 eran dos pasos, `instanceof` y un cast en la línea siguiente, y ahí se cuela el error
cuando alguien cambia la condición y olvida una mitad. El patrón las une, y con `null` da `false` sin
excepción: está explicado en [`instanceof` con patrón](/docs/fundamentos/operadores-y-expresiones/).

## `final`: cerrar la puerta

`final` en un método impide que lo sobrescriban; en una clase, que la extiendan. No es desconfianza,
es una garantía para quien llama. En `String` y `Integer` protege algo más: un subtipo podría romper
la inmutabilidad y, con ella, el contrato de `equals` y `hashCode` de los mapas. El `Punto` inmutable
del capítulo anterior era `final` por lo mismo.

## Heredar es firmar un contrato

Un subtipo tiene que poder sustituir a su supertipo sin que el código que lo usa se entere. Es la
regla que hace útil el polimorfismo: si el bucle del carrito funciona con `Articulo`, tiene que
funcionar igual con cualquier subclase que alguien escriba mañana.

Lo que la base promete, la subclase lo mantiene: no pide más (condiciones de entrada más estrictas),
no devuelve menos (garantías más débiles) y no rompe el invariante. Una subclase que devuelva `-1`
desde `precioFinalEnCentimos`, con su `@Override` bien puesto, compila y rompe el contrato: quien
suma precios dando por hecho que ninguno es negativo produce totales que nadie esperaba. El
compilador comprueba firmas, no promesas.

Y heredar no es la forma de reutilizar código, aunque lo parezca: un `Carrito extends
ArrayList<Articulo>` hereda `add`, `remove` y `clear`, que dejan la lista como les da la gana, así
que la validación que añadas se salta con un `add` heredado. Con composición tienes la lista en un
campo privado y decides qué expones, como el `Curso` del capítulo anterior. `extends` solo cuando la
subclase **es** una versión del padre y cumple su contrato.

## `Object`: la raíz de todo

Toda clase sin `extends` hereda de `Object`, y toda clase con `extends` acaba en `Object` al subir la
cadena. `Object` es la única que no tiene superclase, así que `public class Articulo { }` y
`Object cualquierCosa = new ArticuloRebajado("Teclado", 5000, 20)` son legales: el segundo es un
upcast hasta la raíz.

De `Object` vienen métodos que ya has usado sin saberlo: `toString`, que es lo que imprime `println`;
`equals`, que es lo que compara; `hashCode`, que usan los mapas; y `getClass()`, que da la clase real
del objeto y no se puede sobrescribir: `articulo.getClass()` devuelve `ArticuloRebajado`.

Los tres primeros tienen contrato propio y se cuentan en el capítulo 5, `Object` y sus contratos.
Aquí basta con saber que existen, que se heredan y que sobrescribirlos sin respetar lo que prometen
rompe cualquier `HashMap` que use esos objetos como clave.

## Qué te llevas

- `extends` declara una superclase; Java solo admite una por clase, y las interfaces cubren el resto.
- Se heredan los miembros `public` y `protected`; los `private` no, y el constructor tampoco.
- `super(...)` va en la primera línea del constructor; sin ella, el compilador inserta `super()`.
- `@Override` convierte una firma mal escrita en un error de compilación en vez de un método muerto.
- No se sobrescriben los métodos `final`, ni los `static` ni los `private`.
- Una variable del supertipo guarda un subtipo y el método se elige por el objeto real.
- Un campo se oculta, no se sobrescribe: se lee por el tipo declarado. Un `static`, también.
- Subir el tipo es implícito; bajarlo es un cast explícito que puede dar `ClassCastException`, y
  `instanceof` lo protege (con variable declarada desde Java 16).
- `final` en un método o en una clase es una garantía para quien llama, no una manía.
- Ser subtipo es cumplir el contrato del supertipo, no solo reutilizar su código.
- Todo acaba en `Object`; sus métodos tienen su propio capítulo.
