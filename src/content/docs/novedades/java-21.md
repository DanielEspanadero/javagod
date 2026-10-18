---
title: 'Java 21'
description: 'Hilos virtuales, patrones en switch y record patterns.'
section: novedades
order: 4
since: 21
---

## Qué fue

Java 21 llegó el 19 de septiembre de 2023 (JSR 396) y es la LTS que cambió el modelo de
concurrencia sin obligarte a reescribir nada. También es la versión en la que el `switch` con
patrones deja de ser una vista previa.

## Hilos virtuales

Un hilo de plataforma es un hilo del sistema operativo. Son caros: miles cuestan memoria y
miles de cambios de contexto cuestan tiempo. Un hilo virtual lo gestiona la máquina virtual y
solo ocupa un hilo del sistema mientras de verdad ejecuta. Se pueden tener cientos de miles.

```java
try (var ejecutor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var tarea : tareas) {
        ejecutor.submit(tarea);
    }
}
```

La consecuencia es de diseño, no de rendimiento: el código bloqueante vuelve a escalar. Puedes
escribir una petición por hilo, con su `try`, su `catch` y su `sleep`, y atender diez mil
conexiones. No hace falta reescribir nada en estilo reactivo.

> [!OJO]
> Un hilo virtual no acelera lo que ya era rápido, y no arregla un `synchronized` que retiene
> el hilo del sistema. Lo que cambia es cuántos caben esperando.

## Patrones en `switch` y `record patterns`

La JEP 441 cierra el `switch` con patrones y la JEP 440 añade la deconstrucción de registros:

```java
sealed interface Forma permits Circulo, Rectangulo {}
record Circulo(double radio) implements Forma {}
record Rectangulo(double ancho, double alto) implements Forma {}

double area(Forma forma) {
    return switch (forma) {
        case Circulo(double radio) -> Math.PI * radio * radio;
        case Rectangulo(double ancho, double alto) -> ancho * alto;
    };
}
```

Sin patrón harías `instanceof`, un cast y una cadena de `if`. Además el `switch` es una
expresión exhaustiva: si añades una forma al `sealed`, el build falla hasta que la atiendas.

## Colecciones secuenciadas

La JEP 431 unifica el acceso por los extremos, que hasta ahora cada tipo resolvía a su manera:
`list.get(0)`, `deque.getFirst()`, `map` sin orden. Ahora `List`, `Deque` y `LinkedHashSet`
comparten `getFirst`, `getLast`, `addFirst`, `addLast` y `reversed()`.

```java
List<String> pasos = new ArrayList<>(List.of("instalar", "configurar", "probar"));
System.out.println(pasos.getFirst());   // instalar
System.out.println(pasos.getLast());    // probar
System.out.println(pasos.reversed());   // vista invertida, no una copia
```

## ZGC generacional, con bandera

La JEP 439 añade una ZGC por generaciones: los objetos jóvenes se recogen más a menudo y más
barato. Ojo con el detalle: en 21 hay que pedirla explícitamente.

```bash
java -XX:+UseZGC -XX:+ZGenerational Aplicacion
```

## El aviso de los agentes

La JEP 451 hace que la máquina virtual avise cuando un agente se carga de forma dinámica. No
rompe nada, pero ensucia la salida de error de herramientas que lo hacían en silencio, y es el
primer paso hacia un JDK que no permite modificar su propio código en caliente.

## Todavía en preview

- JEP 430: plantillas de cadena.
- JEP 443: patrones y variables sin nombre (`_`).
- JEP 445: clases sin nombre y `main` de instancia.
- JEP 446 y 453: valores con ámbito y concurrencia estructurada.
- JEP 442: la API de funciones externas y memoria, en su tercera preview.
- JEP 448: la API vectorial, en su sexto incubador.

## El mapa de la versión

| Área | JEP | Qué trajo |
| --- | --- | --- |
| Concurrencia | 444 | Hilos virtuales |
| Lenguaje | 441 | Patrones en `switch` |
| Lenguaje | 440 | Patrones de registro |
| Lenguaje | 430, 443, 445 | Plantillas, patrones sin nombre y clases sin nombre, en preview |
| Biblioteca | 431 | Colecciones secuenciadas |
| Biblioteca | 452 | API de encapsulación de claves |
| Biblioteca | 446, 453 | Valores con ámbito y concurrencia estructurada, en preview |
| Biblioteca | 442, 448 | Funciones externas y memoria, y API vectorial, sin cerrar |
| JVM | 439 | ZGC generacional, con bandera |
| JVM | 451 | Aviso al cargar agentes de forma dinámica |
| Deprecaciones | 449 | El puerto de Windows de 32 bits, marcado para retirar |

## Qué te llevas

- Los hilos virtuales devuelven el código bloqueante al centro: una petición, un hilo.
- El `switch` con patrones y deconstrucción sustituye cadenas de `instanceof` y cast.
- Un `switch` exhaustivo sobre un `sealed` convierte el olvido en un error de compilación.
- Las colecciones secuenciadas dan `getFirst`, `getLast` y `reversed` a todo lo que tiene orden.
- ZGC generacional existe en 21, pero hay que pedirla con bandera.
- Es la LTS de referencia para empezar un proyecto hoy: moderno y sin previews en el camino
  crítico.
