---
title: 'Tipos primitivos'
description: 'Los ocho tipos de Java, cuánto ocupan, hasta dónde llegan y por qué el dinero nunca va en un float.'
section: fundamentos
order: 2
---

## Ocho tipos, y solo ocho

Java es de tipos estáticos: cada variable declara qué guarda, y eso no cambia nunca. De
todo lo que existe en el lenguaje, solo ocho tipos no son objetos. Todo lo demás,
incluido `String`, es una referencia.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Las cuatro familias</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Enteros con signo</span>
      <code class="diagram__value">byte short int long</code>
      <span class="diagram__hint">Complemento a dos: hay negativos.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Carácter</span>
      <code class="diagram__value">char</code>
      <span class="diagram__hint">Entero sin signo, 16 bits.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Coma flotante</span>
      <code class="diagram__value">float double</code>
      <span class="diagram__hint">IEEE 754, con sus rarezas.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">04</span>
      <span class="diagram__title">Lógico</span>
      <code class="diagram__value">boolean</code>
      <span class="diagram__hint">Solo true o false.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Los tres primeros grupos son numéricos. <code>boolean</code> no lo es, y la especificación de la máquina virtual no le fija un tamaño.</figcaption>
</figure>

## Cuánto ocupa cada uno

| Tipo | Bits | Rango | Cuándo usarlo |
| --- | --- | --- | --- |
| `byte` | 8 | `-128` a `127` | Datos binarios y ahorro de memoria en arrays grandes |
| `short` | 16 | `-32_768` a `32_767` | Casi nunca: `int` es más simple |
| `int` | 32 | `-2_147_483_648` a `2_147_483_647` | El entero por defecto |
| `long` | 64 | `-9_223_372_036_854_775_808` a `9_223_372_036_854_775_807` | Tiempos en milisegundos, tamaños enormes |
| `float` | 32 | IEEE 754, precisión simple | Gráficos y cálculo aproximado |
| `double` | 64 | IEEE 754, precisión doble | Cálculo científico, no dinero |
| `char` | 16 | `0` a `65_535` | Un carácter Unicode en UTF-16 |
| `boolean` | sin definir | `true` o `false` | Cualquier condición |

El tamaño de `boolean` no está fijado porque la máquina virtual decide cómo lo representa:
la especificación habla de codificaciones, no de bits.

## Cómo se escriben los literales

Un número entero escrito en el código es un `int` por defecto. Para que sea `long` lleva
sufijo `L`. Desde Java 7 puedes agrupar dígitos con guiones bajos y escribir en binario:

```java
int millones = 1_000_000;
long distancia = 384_400_000L;
int binario = 0b1010_0001;
int hexadecimal = 0xFF_FF;
double precio = 19.99;
float presion = 1013.25f;
```

Los guiones bajos no cambian el valor: existen para que el ojo cuente cifras.

## Cuando el número se pasa de vuelta

Los enteros de Java dan la vuelta en silencio. No hay excepción, no hay aviso: sumar uno
al máximo de un `int` devuelve el mínimo.

```java
int maximo = Integer.MAX_VALUE;   // 2_147_483_647
int roto = maximo + 1;            // -2_147_483_648
int controlado = Math.addExact(maximo, 1); // ArithmeticException
```

Si el desbordamiento es un error de tu programa, `Math.addExact` y compañía convierten el
silencio en una excepción que puedes tratar.

## Dividir no siempre da lo que esperas

Con enteros, la división trunca hacia cero y el resto se descarta. Dividir un `int` entre
cero lanza `ArithmeticException`. Con `double`, dividir entre cero no falla: da infinito.

```java
System.out.println(7 / 2);        // 3
System.out.println(7 % 2);        // 1
System.out.println(7.0 / 0.0);    // Infinity
System.out.println(0.0 / 0.0);    // NaN
```

> [!OJO]
> `0.1 + 0.2` no da `0.3` en `double`. No es un fallo de Java: es cómo funciona IEEE 754.
> Para dinero usa `BigDecimal`, nunca `float` ni `double`.

## char es un número

`char` guarda una unidad de código UTF-16 y se escribe entre comillas simples. En una
operación aritmética se promociona a `int`:

```java
char letra = 'A';
int codigo = letra + 1;      // 66
char siguiente = (char) codigo; // 'B'
```

`String`, en cambio, va con comillas dobles y es un objeto: lo suyo es un capítulo aparte.

## Qué te llevas

- `int` es el entero por defecto; elige `long` cuando el rango de `int` no alcance.
- El desbordamiento es silencioso. Si importa, usa `Math.addExact` o `long`.
- La coma flotante es aproximada. El dinero no se representa con `float` ni con `double`.
- `char` es numérico, pero no es un entero cualquiera: se promociona a `int` y necesita
  conversión para volver.
