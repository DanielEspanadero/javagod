---
title: 'Object y sus contratos'
description: 'Los métodos que toda clase hereda, las reglas que prometen y lo que se rompe al no cumplirlas.'
section: objetos
order: 5
since: 8
---

## Lo que cualquier clase ya trae

El capítulo de herencia cerró en la raíz: toda clase acaba en `Object`, así que `Articulo`, `Punto`
y la que escribas mañana traen cuatro métodos desde el primer `new`:

| Método | Qué hace la versión de `Object` | ¿Se sobrescribe? |
| --- | --- | --- |
| `equals(Object otro)` | `true` solo si es el mismo objeto | Sí |
| `hashCode()` | Un entero que reparte; lo decide la implementación | Sí |
| `toString()` | `NombreClase@hexadecimal` | Sí |
| `getClass()` | La clase real del objeto, un `Class<?>` | No: es `final` |

`getClass()` es la pregunta por el tipo en ejecución, y no se puede sobrescribir porque es la única
respuesta que da la máquina virtual sin pasar por tu código: es la misma información que usan
`instanceof` y los `cast`. `Object` trae más miembros (`clone`, el obsoleto `finalize`, los `wait` y
`notify`).

## `equals` por defecto es la identidad

```java
Punto a = new Punto(3, 4);
Punto b = new Punto(3, 4);
System.out.println(a == b);      // false: dos objetos distintos
System.out.println(a.equals(b)); // false: sin sobrescribir, equals es ==
```

`==` pregunta si las dos referencias apuntan al mismo objeto. `equals` pregunta lo que decida la
clase: `String`, `Integer` o el `Punto` de este capítulo consideran iguales dos objetos distintos
cuando coincide su contenido. `==` no se cambia nunca; `equals`, sí.

La trampa con el texto es que `==` a veces acierte:

```java
String parte = "Ja";
System.out.println(("Ja" + "va") == "Java");         // true: plegado al compilar
System.out.println((parte + "va") == "Java");          // false: String nuevo
System.out.println((parte + "va").equals("Java"));   // true: mismo contenido
```

`"Ja" + "va"` son constantes y el compilador las une en el literal `Java`; `parte + "va"` se
calcula en ejecución y crea un objeto: por eso `==` acierta con un texto y falla con otro.

## El contrato de `equals`

Cinco reglas que no comprueba el compilador:

| Regla | Qué exige |
| --- | --- |
| Reflexiva | `x.equals(x)` es `true` |
| Simétrica | Si `x.equals(y)`, entonces `y.equals(x)` |
| Transitiva | Si `x.equals(y)` y `y.equals(z)`, entonces `x.equals(z)` |
| Consistente | Sin cambios en los objetos, dos llamadas dan lo mismo |
| Con `null` | `x.equals(null)` es `false` |

`equals` no puede depender de la hora ni del azar, y `x.equals(null)` devuelve `false` sin lanzar:
si `x` es `null`, la llamada ni empieza.

La simetría es la que más se rompe, casi siempre por una subclase. Con `Articulo` comparando nombre
y precio base, y `ArticuloRebajado` exigiendo además el porcentaje:

```java
// Articulo
@Override
public boolean equals(Object otro) {
    if (!(otro instanceof Articulo)) return false;
    Articulo that = (Articulo) otro;
    return nombre.equals(that.nombre) && precioBaseEnCentimos == that.precioBaseEnCentimos;
}

// ArticuloRebajado
@Override
public boolean equals(Object otro) {
    if (!(otro instanceof ArticuloRebajado)) return false;
    ArticuloRebajado that = (ArticuloRebajado) otro;
    return super.equals(otro) && porcentaje == that.porcentaje;
}
```

```java
Articulo teclado = new Articulo("Teclado", 5000);
Articulo rebajado = new ArticuloRebajado("Teclado", 5000, 20);
System.out.println(teclado.equals(rebajado)); // true
System.out.println(rebajado.equals(teclado)); // false
```

El mismo par, dos respuestas: con eso, `contains` puede decir `false` para un objeto que está
dentro, y el resultado depende de por cuál preguntes. O el subtipo no añade nada a la igualdad, o
no puede ser igual al padre.

## El contrato de `hashCode`

`hashCode()` devuelve un `int` que resume el objeto para las colecciones que buscan por hash:
`HashMap`, `HashSet`, `ConcurrentHashMap`. Tiene tres reglas:

| Regla | Qué exige |
| --- | --- |
| Iguales, mismo hash | Si `x.equals(y)`, entonces `x.hashCode() == y.hashCode()` |
| Consistente | El mismo entero mientras no cambie lo que `equals` mira |
| Los distintos pueden coincidir | Hashes iguales no implican `equals`: la colisión es legal |

La tercera se malinterpreta: `hashCode` no identifica, solo reparte. El valor puede cambiar entre
ejecuciones, y el de `Object` no es una dirección de memoria: lo deja la implementación.

Escribir `equals` y olvidar `hashCode` es el fallo clásico, y en un mapa se ve entero:

```java
Map<Punto, String> etiquetas = new HashMap<>();
etiquetas.put(new Punto(3, 4), "origen");
System.out.println(etiquetas.get(new Punto(3, 4))); // null
System.out.println(etiquetas.size());               // 1: la clave sí está dentro
```

La clave está dentro y no se puede sacar. Los dos `Punto` son iguales, pero `equals` no llega a
ejecutarse: cada objeto conserva el hash de `Object`, que no mira el contenido, y si el segundo cae
en otro cubo ya no hay nada que comparar. Un `HashSet` hace lo mismo: pueden entrar los dos.

El mapa pasa el hash por una función que da un índice de cubo, va a ese cubo y compara con `equals`
solo las claves de dentro; si dos caen en el mismo, hay una colisión y se guardan las dos.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Cómo encuentra el mapa una clave</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">Hash</span>
      <code class="diagram__value">clave.hashCode()</code><span class="diagram__hint">Si cambió, la búsqueda ya va a otro sitio.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">Cubo</span>
      <code class="diagram__value">índice del cubo</code><span class="diagram__hint">Un hueco compartido por las claves que colisionan.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">Comparación</span>
      <code class="diagram__value">equals</code><span class="diagram__hint">Solo dentro del cubo, una por una: importa que reparta.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Hash para elegir el cubo, cubo para no mirar la tabla entera, <code>equals</code> para distinguir las claves que comparten hueco.</figcaption>
</figure>

## Van juntos o no van

`equals` sin `hashCode` esconde la clave en otro cubo: se duplica y `get` devuelve `null`. `hashCode`
sin `equals` deja la identidad de `Object` en la comparación y amontona las colisiones en un cubo
que el mapa recorre una a una. La regla: los dos leen **los mismos campos**.

## Un `equals` correcto, paso a paso

Sobre el `Punto` del capítulo de encapsulamiento, con sus campos `x` e `y`, el orden no es casual:
cada comprobación descarta un caso y la siguiente trabaja con menos dudas.

```java
@Override
public boolean equals(Object otro) {
    if (this == otro) return true;                    // 1. misma referencia
    if (otro == null) return false;                   // 2. contra null
    if (getClass() != otro.getClass()) return false;   // 3. la clase exacta
    Punto that = (Punto) otro;                         // 4. el cast ya es seguro
    return x == that.x && y == that.y;                 // 5. los campos
}

@Override
public int hashCode() {
    return Objects.hash(x, y);
}
```

El primer paso ahorra el resto en el caso frecuente; el segundo evita el `NullPointerException` del
tercero, y el cuarto `cast` ya no puede fallar. El quinto compara datos con `==` porque los campos
son `int`: con `double` o `float` se usan `Double.compare` y `Float.compare`, y con un array,
`Arrays.equals`.

El paso 3 se escribe `getClass() != otro.getClass()` o `!(otro instanceof Punto)`, y son decisiones
distintas. Con `getClass()` un subtipo nunca es igual al padre: la simetría sale gratis y el precio
es cerrar la igualdad a las subclases, y por eso las clases de valor suelen ser `final`. Con
`instanceof` un `PuntoDeColor` puede ser igual a un `Punto`, lo cual vale si la igualdad solo mira
`x` e `y`, pero el subtipo no puede añadir campos a la comparación sin romper la simetría. Ninguna
gana siempre: `getClass()` protege el contrato e `instanceof` da flexibilidad que hay que vigilar.

## Los ayudantes: `Objects`

Desde Java 7, `java.util.Objects` quita de en medio el `null` y la combinación a mano: el `hashCode`
de `Articulo` se reduce a `Objects.hash(nombre, precioBaseEnCentimos)`. `Objects.equals(a, b)` da
`true` si las dos referencias son `null` y no lanza nada si solo una lo es: es lo que va dentro del
`equals` para cada campo que puede ser `null`. Dos avisos honestos: `Objects.hash` hace autoboxing
y crea un array por llamada, así que en un bucle muy caliente se escribe a mano; y con arrays
`Objects.equals` compara referencias, así que ahí toca `Arrays.equals`.

## `toString`: lo que ves en la consola

Sin sobrescribir, imprimir un `Punto` da `Punto@1b6d3586`: el nombre de la clase y el hash en
hexadecimal, sin nada del estado. Con `return "Punto{x=" + x + ", y=" + y + "}";` ves los valores
sin abrir el depurador: el formato que el lector espera es la clase y los campos con su nombre, que
es lo que generan los records del capítulo 6. Y `toString` se llama en más sitios de los que
parece: en `println`, al concatenar con `+`, en una aserción y en casi cualquier log.

> [!AVISO]
> Un `toString` no es un volcado. No metas contraseñas, tokens ni datos personales: ese texto acaba
> en un log que lee gente que no debería verlos. Y no imprimas entera una colección de cien mil
> elementos: el log se llena y el fallo se esconde. Si es grande, imprime su tamaño.

## Campos mutables: la clave que se pierde

```java
Map<Articulo, Integer> reservas = new HashMap<>();
Articulo teclado = new Articulo("Teclado", 10); // el Articulo con stock del capítulo 2
reservas.put(teclado, 3);

teclado.reponer(5);                         // con stock en hashCode, el hash cambia
System.out.println(reservas.get(teclado));  // null, y la entrada sigue dentro
```

Si `equals` y `hashCode` incluyen `stock`, la clave se queda en su cubo viejo mientras la búsqueda
mira en otro: hay una entrada que ya nadie encuentra, y ni `remove` puede sacarla. No hay aviso ni
excepción.

La respuesta es que los campos de los dos métodos sean inmutables, o que lo sea el objeto entero,
como el `Punto` con sus campos `final`. Una clave inmutable no cambia de hash dentro del mapa: por
eso los records del capítulo 6 son buenos candidatos, y `String` e `Integer` lo son desde siempre.

## Qué te llevas

- `Object` es la raíz y aporta `equals`, `hashCode`, `toString` y `getClass()` a toda clase.
- `getClass()` es `final`: devuelve la clase real y no se puede sobrescribir.
- Sin sobrescribir, `equals` es identidad, o sea `==`; `==` compara referencias y no se cambia.
- Con texto, `==` acierta a veces por el plegado de literales: nunca compares contenido con `==`.
- `equals` es reflexivo, simétrico, transitivo y consistente, y `x.equals(null)` es `false`.
- La simetría se rompe con una subclase que añade campos: elige `getClass()` o `instanceof`.
- `hashCode` coincide en los iguales, no cambia mientras el objeto no cambie, y las colisiones
  solo cuestan comparaciones.
- `equals` y `hashCode` se cambian juntos y leen los mismos campos; uno sin el otro rompe mapas.
- Los campos que leen los dos métodos deben ser inmutables, o el objeto deja de servir de clave.
- `Objects.equals` y `Objects.hash` (Java 7) quitan el `null` y la combinación a mano.
- `toString` acaba en los logs: dale formato con la clase y los campos, sin secretos.
