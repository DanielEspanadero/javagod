---
title: 'Métodos'
description: 'Firmas, sobrecarga, paso por valor y métodos que hacen una sola cosa.'
section: fundamentos
order: 8
since: 8
---

## Un método es un contrato con nombre

```java
public static int maximo(int a, int b) {
    return a >= b ? a : b;
}
```

Cuatro piezas: modificadores (`public static`), tipo de retorno (`int`), nombre (`maximo`) y
parámetros (`int a, int b`). Si no devuelve nada, el tipo es `void`.

La firma de un método es el nombre más los tipos de sus parámetros, y nada más. El tipo de
retorno no forma parte de la firma, los nombres de los parámetros tampoco, y `throws` no
cuenta. Esa definición es la que decide qué es una sobrecarga y qué es un choque:

```java
int calcular(int x) { return x; }
long calcular(int x) { return x; } // no compila: misma firma, distinto retorno
```

## Paso por valor, siempre

Java pasa siempre por valor. Lo que pasa es que el valor de un objeto es su referencia:

```java
static void cambiar(int numero) {
    numero = 99; // cambia la copia local
}

static void anadir(StringBuilder texto) {
    texto.append(" mundo"); // cambia el objeto al que apunta la referencia
}

static void reemplazar(StringBuilder texto) {
    texto = new StringBuilder("otro"); // cambia la copia de la referencia
}
```

```java
int n = 1;
cambiar(n);              // n sigue valiendo 1

StringBuilder texto = new StringBuilder("hola");
anadir(texto);           // "hola mundo"
reemplazar(texto);       // sigue siendo "hola mundo": solo se movió la copia
```

<figure class="diagram diagram--framed">
  <p class="diagram__label">Qué viaja en la llamada</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Llamador</span>
      <code class="diagram__value">StringBuilder texto</code>
      <span class="diagram__hint">Su variable no se toca nunca.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Copia</span>
      <code class="diagram__value">la referencia</code>
      <span class="diagram__hint">Se inicializa el parámetro con el valor recibido.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Objeto</span>
      <code class="diagram__value">"hola"</code>
      <span class="diagram__hint">Compartido: si lo mutan, lo ves.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Dos copias de la referencia apuntando al mismo objeto: por eso se puede modificar el contenido y no se puede cambiar a qué apunta la variable del llamador.</figcaption>
</figure>

`final` en un parámetro impide reasignarlo dentro del método y no cambia nada para quien llama.
Es documentación para el que lee, no un mecanismo de protección.

## Sobrecarga: tres pasadas del compilador

Cuando hay varios métodos con el mismo nombre, el compilador elige en tres fases y se queda
con la primera que encuentre candidatos:

1. Coincidencia estricta, sin boxing: solo cuentan la identidad y el ensanchamiento de tipos.
2. Coincidencia laxa: ya se permite boxing y unboxing.
3. Métodos de aridad variable (`varargs`).

```java
static void f(long valor) { System.out.println("long"); }
static void f(Integer valor) { System.out.println("Integer"); }
static void f(int... valores) { System.out.println("varargs"); }

f(1); // long
```

`1` es un `int`, que puede ir a `long` sin boxing, así que gana la primera fase. Si solo
existieran `f(Integer)` y `f(int...)`, ganaría `f(Integer)` por la fase 2, y los `varargs`
quedarían de último recurso. Ese orden es la razón de que añadir una sobrecarga con `varargs`
nunca rompa las llamadas existentes.

Cuando dos candidatos empatan en la fase ganadora, no hay preferencia: es un error de
compilación. El caso clásico es `f(null)`, que encaja en cualquier tipo referencia:

```java
static void g(String s) { }
static void g(Integer i) { }

g(null); // no compila: referencia ambigua
```

> [!TRUCO]
> Una sobrecarga con dos parámetros del mismo tipo y orden distinto (`buscar(String, int)` y
> `buscar(int, String)`) compila, y es una trampa para quien llama. Si el orden importa, mejor
> dos nombres distintos.

## `varargs`: azúcar sobre un array

```java
static int suma(int... valores) {
    int total = 0;
    for (int valor : valores) {
        total += valor;
    }
    return total;
}

System.out.println(suma());              // 0
System.out.println(suma(1, 2, 3));       // 6
System.out.println(suma(new int[] {4, 5})); // 9
```

Dentro del método, `valores` es un `int[]` normal. Tres consecuencias prácticas: el parámetro
`varargs` va siempre al final, solo puede haber uno, y no se puede declarar junto a otra
sobrecarga que reciba el array equivalente, porque tienen la misma firma:

```java
static void h(int... valores) { }
static void h(int[] valores) { } // no compila: firma repetida
```

`main(String[] args)` es exactamente ese caso escrito a mano.

## `static` o de instancia

Un método `static` pertenece a la clase y no tiene `this`: no puede leer campos de instancia ni
llamar a métodos de instancia sin un objeto.

```java
class Contador {
    private int total;

    void sumar(int cantidad) {
        total += cantidad;      // campo de instancia
    }

    static int doble(int valor) {
        return valor * 2;       // no toca estado
    }
}
```

La regla práctica: si el método no necesita el estado del objeto, que sea `static`. Y si el
estado cambia, el método de instancia es el que tiene que existir.

> [!NOTA]
> La sobrecarga se resuelve en compilación, con el tipo declarado del argumento. Si la variable
> es `Object` y el objeto es un `String`, se llama a la versión de `Object`. La elección que
> ocurre en ejecución es la sobrescritura, que es otra cosa y vive en el capítulo de objetos.

## Guardas antes que anidamiento

Un método se lee de arriba abajo. Las comprobaciones van primero y salen pronto:

```java
static double promedio(List<Integer> notas) {
    Objects.requireNonNull(notas, "notas");
    if (notas.isEmpty()) {
        return 0;
    }

    int suma = 0;
    for (int nota : notas) {
        suma += nota;
    }
    return (double) suma / notas.size();
}
```

La alternativa con `if` anidados obliga a leer hasta el final para descubrir los casos
especiales. `Objects.requireNonNull` lanza `NullPointerException` con tu mensaje y sirve de
contrato explícito en la primera línea del método.

## Recursión: cuando el problema se contiene a sí mismo

```java
static long factorial(int n) {
    if (n <= 1) {
        return 1;          // caso base: sin él, no termina
    }
    return n * factorial(n - 1);
}
```

Todo método recursivo necesita dos cosas: un caso base y un argumento que se acerque a él. Cada
llamada ocupa un marco en la pila, así que una recursión de un millón de niveles termina en
`StackOverflowError` antes que en resultado. Para recorrer estructuras de datos profundas,
iteración o una pila explícita.

## Nombres y tamaño

- Un método hace una cosa, y su nombre la dice: `calcularTotal`, no `procesar`.
- El nombre empieza por verbo; si empieza por sustantivo, probablemente debería ser un getter o
  un campo.
- Los parámetros se leen en la llamada: `enviar(factura, true)` no dice nada,
  `enviar(factura, URGENTE)` sí.
- Si un método necesita seis parámetros, casi siempre hay un objeto escondido ahí dentro.
- Un método de treinta líneas se lee; uno de doscientas pantallas no.

## Qué te llevas

- La firma es el nombre más los tipos de los parámetros: el retorno no cuenta.
- Java pasa siempre por valor; en los objetos, el valor es la referencia.
- La sobrecarga se resuelve en tres fases: estricta, con boxing, y al final `varargs`.
- Dos candidatos empatados son un error de compilación, como en `g(null)`.
- `varargs` es un array con azúcar, va al final y choca con la firma del array equivalente.
- `static` cuando no hay estado; de instancia cuando lo hay.
- Las guardas al principio dejan el camino feliz sin anidamiento.
- La recursión necesita caso base y avance hacia él, y consume pila.
