---
title: 'Variables y constantes'
description: 'Declarar, nombrar y acotar valores: ámbito, final, var y la trampa de comparar cajas con dos iguales.'
section: fundamentos
order: 3
since: 8
---

## Un nombre con tipo

Una variable en Java siempre declara su tipo. Ese tipo no cambia después: si nace `int`,
muere `int`.

```java
int vida = 3;
double altura = 1.84;
String nombre = "Nuria";
boolean activo = true;
```

Una variable local tiene que estar inicializada antes de leerla, y el compilador lo
comprueba. Los campos de una clase no: esos arrancan con su valor por defecto (`0`,
`false`, `null`).

## El bloque manda

Una variable existe desde su declaración hasta el final del bloque donde nace. Fuera de
ahí no hay nada que leer.

```java
for (int i = 0; i < 3; i++) {
    System.out.println(i);
}
System.out.println(i); // no compila: i ya no existe
```

Dentro de un mismo método no puedes redeclarar un nombre que ya está en ámbito. El
compilador lo rechaza antes de ejecutar nada.

## final no congela el objeto

`final` impide reasignar la referencia. No impide modificar el objeto al que apunta:

```java
final List<String> nombres = new ArrayList<String>();
nombres.add("Ada");              // permitido
nombres = new ArrayList<>();     // no compila: la referencia es final
```

Con un primitivo, `final int LIMITE = 10;` sí es una constante de verdad: el valor no
puede cambiar.

> [!TRUCO]
> Declara `final` por defecto y quítalo solo cuando necesites reasignar. El compilador te
> avisa del día que te pasas, y quien lee sabe de un vistazo qué cambia y qué no.

## var: menos ruido, el mismo tipo (Java 10)

Desde Java 10 no hace falta repetir el tipo cuando el inicializador ya lo dice:

```java
var mensaje = "Hola";                    // String
var numeros = new ArrayList<Integer>();  // ArrayList<Integer>
var codigo = 200;                        // int
```

Con tres límites: solo variables locales, siempre con inicializador, y el tipo se fija en
compilación. No sirve para campos, parámetros ni valores de retorno.

`var` no es una palabra reservada: es un nombre de tipo reservado. Puedes llamar `var` a
una variable, pero no a una clase.

> [!NOTA]
> `var` no hace que Java sea dinámico. Es azúcar sintáctico: el tipo existe, escrito o no,
> y lo decide el compilador en ese punto del código.

## Primitivos y cajas

Cada primitivo tiene su clase envoltorio: `int` tiene `Integer`, `double` tiene `Double`.
Java convierte de uno a otro solo (autoboxing):

```java
Integer caja = 127;   // int a Integer
int valor = caja;     // Integer a int
```

Esa comodidad tiene dos trampas. La primera: una caja puede ser `null`.

```java
Integer caja = null;
int valor = caja; // NullPointerException al desboxar
```

La segunda: comparar cajas con `==` compara referencias. El lenguaje garantiza la misma
instancia para constantes entre `-128` y `127`, y no garantiza nada fuera de ese rango.
Para comparar valores, `equals`.

> [!OJO]
> `Integer a = 127, b = 127; a == b` da `true`. Con `128` puede dar `false`. No compares
> cajas con `==`: usa `equals`, o pasa a `int` antes de comparar.

## Nombres que no mienten

- Variables y métodos en `camelCase`: `totalPedido`, `calcularTotal`.
- Constantes en mayúsculas con guion bajo: `MAX_INTENTOS`, `IVA_GENERAL`.
- Un booleano se lee como una pregunta: `activo`, `esValido`, `tieneSaldo`.
- El nombre dice qué es, no cómo se calcula: `precioFinal`, no `precioMasIva`.

## Qué te llevas

- El tipo se declara una vez y no cambia.
- El ámbito es el bloque, y no puedes redeclarar un nombre vivo dentro del método.
- `final` protege la referencia, no el contenido.
- `var` ahorra ruido en locales con inicializador, y nada más.
- Las cajas pueden ser `null` y `==` entre cajas no compara valores.
