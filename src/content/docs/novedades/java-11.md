---
title: 'Java 11'
description: 'El cliente HTTP moderno, el lanzador de archivo único y la salida de Java EE.'
section: novedades
order: 2
since: 11
---

## Qué fue

Java 11 llegó el 25 de septiembre de 2018 (JSR 384). Es la LTS que siguió a Java 8 y la que
mucha gente adoptó para salir de él, porque trae dos cosas que se usan todos los días: un
cliente HTTP que no da vergüenza y la posibilidad de ejecutar un archivo suelto.

## `var` también en las lambdas

Java 10 introdujo `var` para variables locales. Java 11 lo extendió a los parámetros de una
lambda, y el motivo no es la brevedad: es poder anotarlos.

```java
list.forEach((@NonNull var nombre) -> System.out.println(nombre));
```

Con `var` el parámetro recibe la anotación, que es lo único que una lambda no podía hacer. La
anotación del ejemplo viene de una librería de nulabilidad, no del JDK; lo que trajo Java 11 es
el hueco donde escribirla.

## Un cliente HTTP de verdad

`HttpURLConnection` viene de los noventa y se nota. La JEP 321 estandariza lo que se incubó en Java
9 y deja una API fluida, con HTTP/2 y sin `InputStream` a mano:

```java
HttpClient cliente = HttpClient.newHttpClient();
HttpRequest peticion = HttpRequest.newBuilder(URI.create("https://example.com"))
    .header("Accept", "application/json")
    .GET()
    .build();

HttpResponse<String> respuesta = cliente.send(peticion, HttpResponse.BodyHandlers.ofString());
System.out.println(respuesta.statusCode());
```

Para llamadas asíncronas, `sendAsync` devuelve un `CompletableFuture`.

## Lanzar un archivo suelto

La JEP 330 permite `java Hola.java` sin compilar antes, e incluso con `#!` en la primera línea.
Es la razón por la que Java sirve hoy para escribir un script de veinte líneas:

```bash
java Hola.java
```

El lanzador compila en memoria y ejecuta. Sirve para probar y para enseñar, no para sustituir
a `javac` cuando quieres entender el ciclo completo.

## TLS 1.3 y las curvas nuevas

La JEP 332 añade TLS 1.3, con un saludo más corto y menos idas y vueltas, y las JEP 324 y 329
traen Curve25519, Curve448, ChaCha20 y Poly1305. El resultado práctico es que el JDK negocia
con la policía criptográfica actual sin que toques nada.

## Dos recolectores experimentales

- ZGC (JEP 333), pensado para pausas de menos de un milisegundo con montones enormes.
- Epsilon (JEP 318), un recolector que no recoge nada: reserva memoria y nada más. Suena a
  broma y es una herramienta de medida y de pruebas de rendimiento.

Los dos entran como experimentales: hay que activarlos con bandera y no son la opción por
defecto.

## Lo que se quedó por el camino

La JEP 320 retiró los módulos de Java EE y CORBA: `java.xml.ws`, `java.xml.bind`,
`javax.activation`, `javax.corba` y el agregador `java.se.ee`. Es el cambio que rompe código
de Java 8 en la práctica: un proyecto con JAXB compila en 8 y falla en 11 hasta que añades la
dependencia al gestor de construcción.

Además, Nashorn (JEP 335) y Pack200 (JEP 336) quedaron marcados para retirarse. Nashorn ya no
está.

## El mapa de la versión

| Área | JEP | Qué trajo |
| --- | --- | --- |
| Lenguaje | 323 | `var` en los parámetros de una lambda |
| Lenguaje | 181, 309 | Control de acceso por nidos y constantes dinámicas en el classfile |
| Biblioteca | 321 | `java.net.http.HttpClient` |
| Biblioteca | 327 | Unicode 10 |
| Seguridad | 332, 324, 329 | TLS 1.3, Curve25519 y Curve448, ChaCha20 y Poly1305 |
| JVM | 333, 318 | ZGC y Epsilon, los dos experimentales |
| Herramientas | 330 | `java Archivo.java` |
| Herramientas | 328 | Flight Recorder en el JDK |
| Retiradas | 320 | Fuera Java EE y CORBA |
| Deprecaciones | 335, 336 | Nashorn y Pack200, marcados para retirar |

## Qué te llevas

- Es la LTS que saca a un proyecto de Java 8 sin cambiar de modelo mental.
- `HttpClient` es el cliente que hay que usar: HTTP/2, asíncrono y sin sorpresas.
- `java Archivo.java` convierte a Java en un lenguaje de scripts para pruebas y ejemplos.
- Java EE y CORBA ya no vienen en el JDK: si compilabas en 8, aquí necesitas dependencias.
- ZGC y Epsilon son experimentales en 11: no son la opción por defecto.
- TLS 1.3 llega sin configuración extra.
