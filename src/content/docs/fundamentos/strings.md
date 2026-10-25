---
title: 'Strings'
description: 'Inmutabilidad, pool y los métodos que de verdad usas cada día.'
section: fundamentos
order: 6
since: 8
---

## Un objeto que se comporta casi como un primitivo

`String` es una clase, `final` desde siempre, pero el lenguaje la trata con privilegios:
tiene literales propios, el `+` la concatena y `switch` la acepta. Ningún otro objeto de la
biblioteca tiene ese estatus.

Lo que la define es la inmutabilidad. Un `String` no cambia nunca: cada método que parece
modificarlo devuelve uno nuevo.

```java
String saludo = "hola";
String mayusculas = saludo.toUpperCase();
System.out.println(saludo);      // hola
System.out.println(mayusculas);  // HOLA
```

Eso permite compartirla sin defensas: pasarla a un método no puede alterarla, se puede usar
como clave de un mapa sin miedo a que cambie, y su `hashCode` se calcula una vez y se guarda.
El precio es que cada operación de "modificación" crea basura que el recolector tiene que
llevarse.

## Literales y el pool

Los literales `String` viven en una zona compartida, el pool de cadenas, y dos literales
iguales son el mismo objeto:

```java
String a = "hola";
String b = "hola";
String c = new String("hola");

System.out.println(a == b);      // true, es el mismo objeto del pool
System.out.println(a == c);      // false, new crea otra instancia
System.out.println(a == c.intern()); // true, intern devuelve la del pool
```

La especificación lo garantiza así: los literales, y en general las cadenas que son valores de
expresiones constantes, están internadas, de modo que un literal siempre se refiere a la misma
instancia. `intern()` devuelve la instancia canónica y cumple que `s.intern() == t.intern()`
si y solo si `s.equals(t)`.

Lo que no es constante no se interna:

```java
String parte = "ho";
String armada = parte + "la";
System.out.println(armada == "hola");          // false
System.out.println(armada.intern() == "hola"); // true
```

`parte + "la"` se calcula en ejecución, así que no es una expresión constante. Si en cambio
escribes `"ho" + "la"`, el compilador lo pliega y queda `"hola"`, un literal.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Dónde vive cada cadena</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Literal</span>
      <code class="diagram__value">String a = "hola";</code>
      <span class="diagram__hint">Se guarda una vez en el pool.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Pool</span>
      <code class="diagram__value">"hola"</code>
      <span class="diagram__hint">Compartido: b apunta al mismo objeto.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Explícito</span>
      <code class="diagram__value">new String("hola")</code>
      <span class="diagram__hint">Objeto nuevo, contenido igual.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption"><code>new String(...)</code> casi nunca es lo que quieres: crea una copia que no aporta nada.</figcaption>
</figure>

> [!OJO]
> El pool no es un truco de optimización que puedas usar como contrato. `==` entre cadenas
> compara referencias, así que sirve para preguntar "¿es el mismo objeto?", no "¿dicen lo
> mismo?". La respuesta correcta a la segunda pregunta es `equals`.

## `equals`, y el orden de los operandos

```java
if ("hola".equals(entrada)) { ... }        // seguro con entrada null
if (entrada.equals("hola")) { ... }        // NullPointerException si entrada es null
```

Poner la constante delante es el patrón de siempre en Java, y hoy hay alternativas:
`Objects.equals(entrada, "hola")` o `"hola".equalsIgnoreCase(entrada)`. Lo que no cambia es
que `equals` distingue mayúsculas: para ignorarlas hace falta el método explícito.

## Concatenar: `+` está bien hasta que deja de estarlo

Dentro de una línea, `+` es cómodo y el compilador lo resuelve bien. Dentro de un bucle es
cuadrático: cada vuelta copia todo lo anterior.

```java
// mal: crea una cadena nueva por iteración
String resultado = "";
for (String palabra : palabras) {
    resultado += palabra + " ";
}

// bien: un solo búfer
StringBuilder constructor = new StringBuilder();
for (String palabra : palabras) {
    constructor.append(palabra).append(' ');
}
String bueno = constructor.toString();
```

`StringBuilder` es mutable y no está sincronizado; `StringBuffer` es lo mismo con `synchronized`
en cada método y casi nunca merece la pena (si compartes el búfer entre hilos, el problema es
otro). Para unir una lista con separador existe `String.join(", ", palabras)`, que ya lo hace
bien y sin bucle.

## Text blocks: texto largo sin escapar (Java 15)

Un bloque de texto empieza con tres comillas y una línea nueva. El contenido se escribe tal
cual, sin `\n` y sin escapar comillas:

```java
String json = """
        {
          "nombre": "Ada",
          "lenguaje": "Java"
        }
        """;
```

La indentación incidental se recorta: se toma el mínimo de espacios de las líneas no vacías y
de la línea de cierre, y ese prefijo se quita de todas. Por eso la línea de cierre decide el
margen. Para meter un salto al final, deja la línea de cierre en su propia línea. Para
conservar indentación extra, `indent` lo hace sobre una cadena ya construida.

## Longitud: un `char` no es un carácter

`String` guarda UTF-16. `length()` cuenta unidades de código, no caracteres visibles:

```java
String emoji = "😀";
System.out.println(emoji.length());                        // 2
System.out.println(emoji.codePointCount(0, emoji.length())); // 1
```

Un emoji fuera del plano básico ocupa dos `char` (un par sustituto). Si cuentas posiciones
para mostrar o truncar texto de usuario, `codePointCount` y `offsetByCodePoints` son las
herramientas correctas; `substring(0, 1)` sobre ese emoji parte el par y deja un carácter
inválido.

`chars()` devuelve un `IntStream` con las unidades de código, y `codePoints()` con los puntos,
que es lo que casi siempre buscas al filtrar texto.

## Los métodos que de verdad usas

| Necesitas | Método | Detalle |
| --- | --- | --- |
| Longitud | `length()` | En unidades UTF-16 |
| Carácter en posición | `charAt(i)` | Lanza `IndexOutOfBoundsException` |
| Trozo | `substring(inicio, fin)` | `fin` exclusivo |
| Buscar | `indexOf`, `lastIndexOf` | Devuelven `-1` si no está |
| Reemplazar | `replace`, `replaceAll` | `replaceAll` toma una regex |
| Partir | `split(regex)` | Quita las cadenas vacías del final |
| Unir | `String.join(sep, ...)` | Acepta varargs o `Iterable` |
| Formatear | `formatted(...)` | Desde Java 15, equivale a `String.format` |
| Recortar | `strip()` | Espacios Unicode; `trim()` solo quita `<= U+0020` |
| Comprobar vacío | `isEmpty()`, `isBlank()` | `isBlank` desde Java 11, y acepta solo espacios |
| Repetir | `repeat(n)` | Desde Java 11, negativo lanza excepción |
| Recorrer líneas | `lines()` | `Stream<String>` sin terminadores; desde Java 11 |

Dos trampas de esta tabla. `split` toma una expresión regular, así que `"a.b".split(".")`
devuelve un array vacío: el punto coincide con todo. Hay que escribir `split("\\.")`. Y
`split` descarta las cadenas vacías del final, de modo que `"a,b,,".split(",")` da dos
elementos; si las necesitas, pasa un límite negativo.

Para recortar, `strip` desde Java 11 es lo que quieres: usa `Character.isWhitespace`, que
incluye el espacio duro y otros. `trim` es anterior y solo quita caracteres con código menor o
igual a `U+0020`, que en la práctica acierta casi siempre y falla en el espacio de no
separación.

## Comparar: `compareTo` no ordena como un humano

`compareTo` compara por valor Unicode, carácter a carácter:

```java
System.out.println("Zaragoza".compareTo("álbum")); // negativo, 'Z' < 'á'
```

Ese orden no es el alfabético de ningún idioma: pone las mayúsculas antes que las minúsculas y
no sabe nada de tildes. Para ordenar texto que va a leer una persona se usa `Collator`:

```java
Collator collator = Collator.getInstance(Locale.forLanguageTag("es-ES"));
int orden = collator.compare("Zaragoza", "álbum"); // en español, Zaragoza va después
```

`compareTo` sigue siendo el correcto para claves técnicas, identificadores y orden estable
entre máquinas.

## De texto a número y vuelta

```java
int numero = Integer.parseInt("42");
double decimal = Double.parseDouble("3.5");
String texto = Integer.toString(numero);
String tambien = String.valueOf(42);
String desdeCero = String.format("%,d", 1_234_567);
```

`parseInt` no admite espacios ni separadores de miles y lanza `NumberFormatException` si el
texto no es un número. Para entrada de usuario, `Integer.parseInt(entrada.strip())` dentro de
un `try` es el patrón; antes de Java 11, `entrada.trim()`.

> [!AVISO]
> `String.format` y `formatted` usan el `Locale` por defecto. `String.format("%.1f", 3.14)` da
> `3.1` en un sistema inglés y `3,1` en uno español. Si el texto va a una API, a un archivo o a
> una base de datos, pasa el `Locale` explícito: `String.format(Locale.ROOT, "%.1f", 3.14)`.

## Qué te llevas

- `String` es inmutable: cada cambio apunta a un objeto nuevo, y eso es lo que lo hace seguro
  de compartir.
- Los literales viven en el pool; `new String` no, e `intern()` recupera la instancia canónica.
- `==` compara referencias, `equals` compara contenido. Con `null` en juego, pon la constante
  delante.
- `+` en un bucle es cuadrático: `StringBuilder`, `String.join` o `formatted`.
- `length()` cuenta unidades UTF-16: para caracteres visibles, `codePointCount`.
- `split` toma una regex y se come las cadenas vacías del final.
- `strip` desde Java 11 es el recorte correcto; `trim` es el heredado.
- `compareTo` ordena por Unicode; `Collator` ordena como una persona.
- Formatea con `Locale` explícito cuando el texto sale del programa.
