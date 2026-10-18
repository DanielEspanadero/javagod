---
title: 'Java 17'
description: 'Sealed, encapsulación fuerte y el fin de la era del Security Manager.'
section: novedades
order: 3
since: 17
---

## Qué fue

Java 17 llegó el 14 de septiembre de 2021 (JSR 390). Es la LTS que la mayoría de proyectos
adoptó al salir de 8 u 11, y la que cambió dos cosas de fondo: las jerarquías de tipos se
pueden cerrar, y el código no puede hurgar en las tripas del JDK sin permiso explícito.

## Jerarquías cerradas con `sealed`

Antes, si querías que una interfaz tuviera exactamente tres implementaciones, lo escribías en
la documentación y confiabas. Ahora lo dice el compilador:

```java
public sealed interface Figura permits Circulo, Cuadrado, Triangulo {}
public record Circulo(double radio) implements Figura {}
public record Cuadrado(double lado) implements Figura {}
public record Triangulo(double base, double altura) implements Figura {}
```

La jerarquía queda cerrada y eso habilita lo que viene después: un `switch` puede comprobarse
como exhaustivo porque el compilador conoce todos los casos.

## Encapsulación fuerte: el cambio que rompe cosas en silencio

La JEP 403 hace que, a partir de Java 17, el acceso por reflexión a los elementos internos del
JDK esté cerrado por defecto. Lo que en las versiones 9 a 16 se arreglaba con
`--illegal-access=permit` ahora lanza `InaccessibleObjectException`.

```bash
# antes
java --illegal-access=permit Aplicacion
# desde 17, hay que abrir el paquete concreto
java --add-opens java.base/java.lang=ALL-UNNAMED Aplicacion
```

Ese es el cambio de esta versión que más horas ha costado en producción: la aplicación
arrancaba en 11 y falla en 17 al primer intento de reflexión sobre `sun.*` o
`jdk.internal.*`. Es habitual que la propia librería documente el `--add-opens` que necesita.

## Coma flotante siempre estricta

La JEP 306 devuelve la semántica estricta de coma flotante a todas las plataformas. La
palabra `strictfp` deja de tener efecto porque pasa a ser el comportamiento normal, y los
resultados dejan de depender de la máquina. Si tu código dependía de valores intermedios con
exponente extendido, los resultados cambian.

## Patrones en el `switch`, todavía en preview

La JEP 406 trae el `switch` con patrones como vista previa: la dirección en la que siguen
todas las versiones posteriores. En 17 no se puede usar sin `--enable-preview`.

## Biblioteca y JVM

- JEP 356: `RandomGenerator`, una interfaz común para los generadores pseudoaleatorios, con
  algoritmos intercambiables y corrientes que se pueden dividir.
- JEP 415: filtros de deserialización por contexto, la defensa contra el `readObject` que
  ejecuta lo que le manden.
- JEP 412 y 414: la API de funciones externas y memoria, y la API vectorial, las dos todavía
  incubando. Son la semilla de lo que hoy se llama Panama.
- JEP 382: el pipeline de dibujo de macOS pasa a Metal.
- JEP 391: soporte de macOS sobre Apple Silicon.

## Lo que se quedó por el camino

- La activación de RMI (JEP 407) se retiró.
- El compilador AOT experimental y el JIT de Graal, tal como se distribuían en el JDK, se
  retiraron (JEP 410).
- La API de applets quedó marcada para retirar (JEP 398).
- El `SecurityManager` quedó marcado para retirar (JEP 411). Es el final anunciado de un
  capítulo entero de la seguridad en Java: el modelo pasa a ser encapsulación y permisos del
  sistema operativo.

## El mapa de la versión

| Área | JEP | Qué trajo |
| --- | --- | --- |
| Lenguaje | 409 | Clases y interfaces `sealed` |
| Lenguaje | 406 | Patrones en `switch`, en preview |
| Lenguaje | 306 | Coma flotante siempre estricta |
| Biblioteca | 356 | `RandomGenerator` |
| Biblioteca | 415 | Filtros de deserialización por contexto |
| Biblioteca | 412, 414 | Funciones externas y memoria, y API vectorial, en incubación |
| Plataforma | 403 | Encapsulación fuerte del JDK por defecto |
| Plataforma | 391, 382 | Apple Silicon y el pipeline de Metal en macOS |
| Retiradas | 407, 410 | Fuera la activación de RMI y el AOT y Graal experimentales |
| Deprecaciones | 398, 411 | Applets y `SecurityManager`, marcados para retirar |

## Qué te llevas

- `sealed` cierra una jerarquía y el compilador lo usa para comprobar exhaustividad.
- En 17 la reflexión sobre el JDK necesita `--add-opens`; el aviso de las versiones
  anteriores ya no existe.
- `strictfp` desapareció como palabra útil: la semántica estricta es la única.
- `RandomGenerator` permite cambiar de algoritmo sin cambiar de API.
- Los applets y el `SecurityManager` son historia anunciada, no futuro.
- Es la LTS que conviene elegir si vienes de 8 u 11 y todavía no necesitas hilos virtuales.
