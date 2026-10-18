---
title: 'Operadores y expresiones'
description: 'Aritmética, comparación y lógica, con la precedencia y el desbordamiento a la vista.'
section: fundamentos
order: 4
since: 17
---

## Una expresión devuelve un valor

Un operador combina valores y produce otro valor. Casi todo lo que escribes en Java es una
expresión: `2 + 3`, `edad >= 18`, `nombre.equals("Ada")`. La excepción son las sentencias,
que hacen algo y no devuelven nada (`if`, `for`, una asignación como sentencia).

Dos reglas gobiernan el resto de este capítulo:

- El tipo del resultado no siempre es el tipo de los operandos, y Java lo decide con
  conversión numérica: `byte` y `short` se promocionan a `int` antes de operar.
- La evaluación va de izquierda a derecha dentro de una misma precedencia, y un operando
  se evalúa antes que el operador que lo usa.

## Aritmética entera: dos trampas propias

La división entre enteros trunca hacia cero, no hacia abajo:

```java
System.out.println(7 / 2);    // 3
System.out.println(-7 / 2);   // -3
System.out.println(7 % 2);    // 1
System.out.println(-7 % 2);   // -1
```

El resto tiene el signo del dividendo, no el del divisor. La especificación lo dice así: el
resultado de `%` puede ser negativo solo si el dividendo lo es, y su magnitud siempre es
menor que la del divisor. Si vienes de Python, donde `-7 % 2` da `1`, esto te muerde la
primera vez que calculas una vuelta de array.

Para el resto con signo del divisor está `Math.floorMod`:

```java
System.out.println(-7 % 2);            // -1
System.out.println(Math.floorMod(-7, 2)); // 1
```

La segunda trampa es el desbordamiento. Los enteros no avisan: dan la vuelta.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Desbordamiento de int</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Techo</span>
      <code class="diagram__value">2_147_483_647</code>
      <span class="diagram__hint">Integer.MAX_VALUE.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Sumas uno</span>
      <code class="diagram__value">+ 1</code>
      <span class="diagram__hint">No hay sitio para el bit de signo.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Suelo</span>
      <code class="diagram__value">-2_147_483_648</code>
      <span class="diagram__hint">Integer.MIN_VALUE, sin excepción.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">La suma se queda con los 32 bits bajos del resultado matemático, así que el signo cambia sin ningún aviso.</figcaption>
</figure>

```java
int techo = Integer.MAX_VALUE;
System.out.println(techo + 1);              // -2147483648
System.out.println(Math.addExact(techo, 1)); // ArithmeticException
```

`Math.addExact`, `subtractExact` y `multiplyExact` existen justo para esto: si el resultado
no cabe, lanzan `ArithmeticException` en vez de mentir. Un contador de dinero, de
identificadores o de tiempo va con `long` o con estas variantes, nunca con `int` a secas.

> [!OJO]
> `Integer.MAX_VALUE + 1 == Integer.MIN_VALUE` es cierto y compila sin una sola advertencia.
> El desbordamiento no es un error detectable en tiempo de ejecución: es aritmética modular
> de complemento a dos, y solo lo ves cuando el número sale raro.

## Cast: bajar de tamaño se avisa, subir no

Pasar de un tipo menor a uno mayor es automático. Al contrario hay que decirlo:

```java
int grande = 300;
byte pequeno = (byte) grande;   // casting explícito: 44
long ancho = grande;            // conversión automática
```

`300` en binario ocupa nueve bits; `byte` guarda ocho, así que se queda con los bits bajos y
el valor se convierte en `44`. Con `double` a `int` la regla es otra: se trunca hacia cero.

```java
System.out.println((int) 3.9);    // 3
System.out.println((int) -3.9);   // -3
System.out.println(Math.round(3.9)); // 4
```

`char` es un caso aparte: es numérico, y promociona a `int` en cualquier cuenta.

```java
char letra = 'a';
System.out.println(letra + 1);          // 98, un int
System.out.println((char) (letra + 1)); // b
```

## Asignación compuesta: el cast que va escondido

`x += 1` no es lo mismo que `x = x + 1`. La forma compuesta equivale a un cast al tipo de la
izquierda, y por eso compila donde la otra falla:

```java
short contador = 0;
contador += 1;      // bien: equivale a contador = (short) (contador + 1)
contador = contador + 1; // no compila: el resultado de la suma es int
```

Es la razón de que `byte b = 0; b++;` funcione y `b = b + 1` no. Útil para acumuladores
pequeños, peligroso cuando el cast silencioso tapa un desbordamiento.

## Incremento: prefijo y sufijo no son lo mismo

```java
int i = 0;
int a = i++;   // a vale 0, i vale 1
int b = ++i;   // b vale 2, i vale 2
```

En una sentencia suelta da igual cuál uses. Dentro de una expresión, el sufijo devuelve el
valor viejo y el prefijo el nuevo, y ahí nacen los bugs de un solo carácter. Ni una de las
dos formas es atómica entre hilos: para concurrencia, `AtomicInteger`.

## Comparar: `==` es identidad

Con primitivos, `==` compara valores. Con referencias, compara direcciones.

```java
int x = 5, y = 5;
System.out.println(x == y);                 // true

String saludo = new String("hola");
System.out.println(saludo == "hola");       // false
System.out.println(saludo.equals("hola"));  // true
```

El capítulo de Strings entra en el pool de literales y en por qué `"hola" == "hola"` sí da
`true`. La regla práctica no cambia: `==` para saber si es el mismo objeto, `equals` para
saber si valen lo mismo.

Con coma flotante hay dos rarezas más, herencia de IEEE 754:

```java
System.out.println(0.1 + 0.2 == 0.3);   // false
System.out.println(Double.NaN == Double.NaN); // false
System.out.println(Double.compare(Double.NaN, Double.NaN)); // 0
```

Ningún `NaN` es igual a sí mismo, ni siquiera consigo mismo, así que `x == Double.NaN`
siempre es `false`. Para comprobar si un `double` es `NaN` se usa `Double.isNaN(x)`, y para
comparar números de coma flotante con orden total, `Double.compare`.

## `&&` y `||` se saltan la mitad

`&&` y `||` son de cortocircuito: si el resultado ya se sabe con el operando izquierdo, el
derecho no se evalúa. `&` y `|` sobre booleanos evalúan siempre los dos.

```java
String texto = null;
if (texto != null && texto.isEmpty()) {  // seguro: isEmpty no se llama
    System.out.println("vacío");
}
```

Ese patrón es la guarda más común de Java. Con `&` en lugar de `&&` sería un
`NullPointerException` garantizado.

> [!TRUCO]
> Pon primero la comprobación barata y la que protege: `if (lista != null && !lista.isEmpty())`.
> El orden de los operandos es una decisión de corrección, no de estilo.

## Bits y desplazamientos

`&`, `|`, `^` y `~` operan bit a bit sobre enteros; con `boolean` hacen lo mismo pero sin
cortocircuito. Los desplazamientos mueven los bits:

```java
int mascara = 0b1010;
System.out.println(mascara & 0b0010);  // 2
System.out.println(mascara | 0b0001);  // 11
System.out.println(mascara ^ 0b1111);  // 5
System.out.println(1 << 10);           // 1024
System.out.println(-1 >> 28);          // -1, conserva el signo
System.out.println(-1 >>> 28);         // 15, rellena con ceros
```

`>>` es desplazamiento aritmético (copia el bit de signo), `>>>` es lógico (mete ceros).

La trampa: la distancia de desplazamiento se enmascara. Para `int` se usan solo los cinco
bits más bajos, y para `long` los seis, así que `1 << 32` no es cero ni un error: es `1`,
porque la distancia efectiva es `32 & 0x1f`, es decir `0`.

```java
System.out.println(1 << 32);   // 1
System.out.println(1L << 64);  // 1
```

## Ternario: una expresión con dos ramas

```java
int edad = 20;
String tipo = edad >= 18 ? "adulto" : "menor";
```

Exige que las dos ramas produzcan un tipo compatible. Y cuidado con las cajas: si una rama es
`Integer` y la otra `int`, el resultado es `int` y la caja se desboxa, con
`NullPointerException` si venía `null`.

```java
Integer cantidad = null;
int total = cantidad != null ? cantidad : 0; // correcto, pero solo porque compruebas antes
int malo = true ? cantidad : 0;              // NullPointerException
```

Para elegir entre dos valores es perfecto. Para tres o más, un `switch` o un `if` se lee
mejor: el ternario anidado es siempre peor de lo que parece.

## `instanceof` con patrón (Java 16)

Desde Java 16, `instanceof` puede declarar la variable que ya sabe que es de ese tipo:

```java
Object dato = "hola";
if (dato instanceof String texto && texto.length() > 3) {
    System.out.println(texto.toUpperCase()); // HOLA
}
```

Sin patrón harías un cast a mano justo después de la comprobación, que es donde se cuelan
los `ClassCastException`. El patrón es definitivo desde Java 21, y en 17 ya estaba.

Dos detalles: `null instanceof String` es `false` sin excepción, y el patrón solo funciona con
tipos referencia, nunca con primitivos.

## Precedencia: el orden que sí importa

La tabla completa tiene una docena de niveles, pero en la práctica solo discuten cuatro.

| Nivel | Operadores | Ejemplo |
| --- | --- | --- |
| Más fuerte | `()` `.` `[]` `++` `--` postfijos | `lista.get(0)` |
| Unarios y cast | `!` `~` `++` `--` prefijos, `(tipo)` | `(int) x` |
| Multiplicativo | `*` `/` `%` | `a * b` |
| Aditivo | `+` `-` | `a + b` |
| Desplazamiento | `<<` `>>` `>>>` | `a << 2` |
| Relacional | `<` `>` `<=` `>=` `instanceof` | `a < b` |
| Igualdad | `==` `!=` | `a == b` |
| AND, XOR, OR de bits | `&` `^` `|` | `a & b` |
| AND, OR lógicos | `&&` `||` | `a && b` |
| Ternario | `?:` | `a ? b : c` |
| Más débil | `=` `+=` `-=` y el resto de asignaciones | `a = b` |

Los dos errores que la tabla evita: `&` tiene más precedencia que `|` (no es lo que la
mayoría supone) y `&&` va por debajo de los operadores de bits, así que
`a & b == 0` se lee como `a & (b == 0)`. Ante la duda, paréntesis.

> [!NOTA]
> El `+` es además el operador de concatenación cuando un operando es `String`. En
> `"total: " + 1 + 2` se concatena de izquierda a derecha y sale `total: 12`, no `total: 3`.
> Si quieres la suma, `"total: " + (1 + 2)`.

## Qué te llevas

- La división entera trunca hacia cero y el resto lleva el signo del dividendo.
- El desbordamiento da la vuelta en silencio; usa `Math.addExact` o `long`.
- Bajar de tamaño exige cast, y la asignación compuesta lo esconde dentro.
- `==` compara identidad: valores en primitivos, referencias en objetos.
- `&&` y `||` protegen del `null`; `&` y `|` no.
- La distancia de un desplazamiento se enmascara a 5 o 6 bits.
- El patrón de `instanceof` elimina el cast manual posterior.
- Ante precedencia dudosa, paréntesis: cuestan menos que un bug.
