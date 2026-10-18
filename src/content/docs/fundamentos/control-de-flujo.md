---
title: 'Control de flujo'
description: 'if, el switch moderno y los tres bucles, con las reglas que exige el compilador.'
section: fundamentos
order: 5
---

## El flujo es una decisión, no un adorno

Un programa deja de ser una lista de instrucciones cuando puede elegir. Java tiene dos
familias: condicionales (`if`, `switch`) y bucles (`while`, `do while`, `for`). Todo lo demás
es azúcar sobre esas dos, incluidas las etiquetas.

La buena noticia: el compilador comprueba el flujo antes de ejecutar nada. Código que no se
puede alcanzar es un error de compilación, no un aviso. Este capítulo también trata eso,
porque explica la mitad de las rarezas del lenguaje.

## `if`: siempre con llaves

```java
if (temperatura > 30) {
    System.out.println("Hace calor");
} else if (temperatura > 20) {
    System.out.println("Se está bien");
} else {
    System.out.println("Hace frío");
}
```

La condición tiene que ser un `boolean`. Java no acepta números como condición, ni la
asignación como condición, así que el clásico `if (x = 3)` de C no compila aquí. Esa es la
razón por la que Java casi no tiene el bug de comparar donde querías asignar.

Las llaves son opcionales cuando el cuerpo es una sola sentencia, y aun así van. La excepción
que las exige es cuando la rama declara una variable que quieres usar fuera, y esa variable
no existiría de todos modos.

> [!TRUCO]
> Si una rama necesita comentario para entenderse, extrae la condición a un método con nombre
> propio: `if (esMayorDeEdad(persona))` se lee mejor que `if (persona.edad() >= 18)`.

## `switch` de toda la vida: el `break` es obligatorio

El `switch` clásico compara, entra en la etiqueta que coincide y sigue hacia abajo hasta que
algo lo pare. Si falta el `break`, se ejecuta el siguiente caso:

```java
int dia = 2;
switch (dia) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
        System.out.println("Laborable");
        break;
    case 6:
    case 7:
        System.out.println("Fin de semana");
        break;
    default:
        System.out.println("Día fuera de rango");
}
```

Agrupar etiquetas sin cuerpo es el caso honesto del fallthrough. El resto, olvidarse del
`break`, es el bug clásico. Desde Java 14 ese agrupamiento se escribe `case 1, 2, 3, 4, 5 ->`.

Dos reglas más del `switch` clásico: solo puede haber un `default`, y las etiquetas tienen que
ser constantes de compilación (o `String` y enums, que se comparan con `equals`).

## `switch` moderno: flechas y `yield` (Java 14)

La forma con flecha no cae al siguiente caso. Es lo que casi siempre quieres:

```java
switch (dia) {
    case 1, 2, 3, 4, 5 -> System.out.println("Laborable");
    case 6, 7 -> System.out.println("Fin de semana");
    default -> System.out.println("Día fuera de rango");
}
```

Si el cuerpo es un bloque con varias sentencias, la rama devuelve su valor con `yield`:

```java
String tipo = switch (dia) {
    case 6, 7 -> "Fin de semana";
    case 1, 2, 3, 4, 5 -> {
        int mitad = 3;
        yield dia <= mitad ? "Principios de semana" : "Finales de semana";
    }
    default -> throw new IllegalArgumentException("Día: " + dia);
};
```

`yield` no es `return`: no sale del método, solo entrega el valor de la rama. Y `break` no
tiene sentido dentro de una rama con flecha.

## Switch como expresión: tiene que ser exhaustivo

Cuando un `switch` devuelve un valor, el compilador exige que cubra todos los casos posibles:

```java
enum Estado { ACTIVO, PAUSADO }

// compila: los dos valores del enum están cubiertos, sin default
String etiqueta = switch (estado) {
    case ACTIVO -> "En marcha";
    case PAUSADO -> "Detenido";
};
```

Esa exhaustividad es una red de seguridad de verdad: el día que añadas un valor al enum, el
build falla en cada `switch` que no lo trate. Con un `default` de relleno, el fallo no
aparece nunca y el caso nuevo se cuela como si fuera el de siempre. La recomendación oficial
es preferir el `switch` exhaustivo sin `default` cuando se pueda.

En un `switch` sentencia las reglas se relajan: sin `default` compila, porque el resultado no
se usa. Pero en cuanto la sentencia usa las mejoras de patrones, también se le exige
exhaustividad.

> [!NOTA]
> Un `switch` sobre `String` con el selector a `null` lanza `NullPointerException`. Y
> `default` no captura `null`: para eso está `case null`, que se explica más abajo.

## Bucles: tres formas y cuándo cada una

```java
// while: no sabes cuántas veces
while (hayLineas()) {
    procesar(linea());
}

// do while: al menos una vez, siempre
String entrada;
do {
    entrada = leer();
} while (!entrada.equals("salir"));

// for clásico: sabes cuántas veces, o necesitas el índice
for (int i = 0; i < nombres.size(); i++) {
    System.out.println(i + ": " + nombres.get(i));
}

// for mejorado: recorrer, y nada más
for (String nombre : nombres) {
    System.out.println(nombre);
}
```

El `for` mejorado funciona con arrays y con cualquier cosa que implemente `Iterable`, y no
permite modificar la colección mientras la recorres (`ConcurrentModificationException`). Si
necesitas borrar elementos, elige el iterador explícito o `removeIf`.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Un bucle, cuatro decisiones</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Condición</span>
      <code class="diagram__value">i &lt; nombres.size()</code>
      <span class="diagram__hint">Se evalúa antes de cada vuelta.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Cuerpo</span>
      <code class="diagram__value">System.out.println(nombres.get(i))</code>
      <span class="diagram__hint">Aquí ocurre el trabajo.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Paso</span>
      <code class="diagram__value">i++</code>
      <span class="diagram__hint">Si no avanza, el bucle no termina.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">El <code>for</code> clásico junta las tres piezas en una línea, que es toda su ventaja y todo su riesgo.</figcaption>
</figure>

Las tres variables del `for` son opcionales: `for (;;)` es válido y equivale a un bucle
infinito. Casi nunca es lo que quieres escribir.

## `break`, `continue` y etiquetas

`break` sale del bucle, `continue` salta a la vuelta siguiente. Con etiqueta, apuntan al bucle
que nombres, no al más cercano:

```java
buscar:
for (int fila = 0; fila < tablero.length; fila++) {
    for (int columna = 0; columna < tablero[fila].length; columna++) {
        if (tablero[fila][columna] == objetivo) {
            System.out.println("En " + fila + "," + columna);
            break buscar;
        }
    }
}
```

Sin la etiqueta, ese `break` solo saldría del bucle interno. Las etiquetas existen para este
caso concreto: salir de dos bucles anidados de una vez. Y hay un límite que el compilador
aplica: no hay saltos no locales, así que un `break` con etiqueta no puede cruzar una lambda,
un método o un inicializador.

> [!AVISO]
> Un `break` que sale de un `switch` y un `break` que sale de un bucle se leen igual y hacen
> cosas distintas según dónde estén. Con `switch` de flechas el problema desaparece.

## Lo que el compilador sabe del flujo

Java analiza la alcanzabilidad con reglas fijas. La más citada: `while (true) {}` compila y
el código que va detrás no:

```java
while (true) {
    System.out.println("para siempre");
}
System.out.println("inalcanzable"); // error de compilación
```

La condición es una expresión constante `true`, así que el bucle no puede completarse
normalmente y todo lo que sigue es inalcanzable. La misma regla hace que `if (false) { x = 3; }`
compile sin queja: en un `if` los valores no se tienen en cuenta, en un `while` sí. La
especificación lo justifica como una forma de compilación condicional.

Consecuencia práctica: `if (true) { return; }` seguido de más código compila. No cuentes con el
compilador para detectar condiciones imposibles; para eso están las aserciones y los tests.

## `case null` y guardas (Java 21)

El `switch` con patrones se cerró en Java 21 (fue preview en 17, 18, 19 y 20). Añade dos cosas
que antes obligaban a un `if` antes del `switch`:

```java
String describir(Object valor) {
    return switch (valor) {
        case null -> "nada";
        case Integer n when n < 0 -> "entero negativo: " + n;
        case Integer n -> "entero: " + n;
        case String s when s.isBlank() -> "texto en blanco";
        case String s -> "texto de " + s.length() + " caracteres";
        default -> "otro tipo";
    };
}
```

- `case null` captura el `null`. Sin él, un selector `null` sigue lanzando
  `NullPointerException`. `case null, default ->` combina las dos, y entonces no puede haber
  otro `default`.
- `when` añade una guarda a una etiqueta con patrón. Solo lleva guarda una etiqueta con
  patrón: `case "hola" when ...` no es legal.
- El orden importa: si una etiqueta anterior ya cubre un valor, la siguiente no puede
  aparecer. `case CharSequence cs` antes de `case String s` es un error de compilación, porque
  la primera domina a la segunda. Pon las constantes primero, luego las guardas y al final los
  patrones abiertos.

## Qué te llevas

- La condición de un `if` es un `boolean`: no hay conversiones implícitas ni asignaciones.
- El `switch` clásico cae al siguiente caso sin `break`; el de flechas no.
- Un `switch` expresión tiene que ser exhaustivo, y eso convierte el enum en un contrato.
- `while` para lo incierto, `do while` para ejecutar al menos una vez, `for` para contar,
  `for` mejorado para recorrer.
- Las etiquetas existen para salir de bucles anidados, y no cruzan lambdas ni métodos.
- La alcanzabilidad es un error de compilación, y los valores solo cuentan en `while`, `do` y
  `for`.
- Java 21 permite `case null`, guardas con `when` y patrones en el `switch`.
