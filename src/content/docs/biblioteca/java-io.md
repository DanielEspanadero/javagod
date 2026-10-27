---
title: 'Entrada y salida con java.io'
description: 'Distingue bytes de texto, fija UTF-8 y combina streams, buffers y cierre automático con las fábricas de Files.'
section: biblioteca
order: 7
since: 8
---

## IO sigue siendo una interfaz actual

Si una biblioteca recibe un `InputStream`, no necesita saber si los datos vienen de
un archivo, una conexión o memoria. Ese contrato sigue siendo útil: `java.io` no
está obsoleto por existir NIO. Encontrarás streams en APIs de compresión, carga de
recursos y bibliotecas que procesan documentos sin exigir una ruta del disco.

NIO aporta rutas, operaciones de archivos, canales y otras abstracciones; no obliga
a abandonar IO. Puedes abrir un `Path` mediante `Files` y entregar el stream a una
API que no conoce NIO. Primero decide si trabajas con bytes o con texto.

| Abstracción | Qué transporta | Ejemplo de uso |
| --- | --- | --- |
| `InputStream` | Bytes de entrada | Leer un ZIP sin interpretar su contenido como texto |
| `OutputStream` | Bytes de salida | Escribir una imagen o enviar un documento |
| `Reader` | Unidades de texto UTF-16 | Leer texto después de decodificar sus bytes |
| `Writer` | Unidades de texto UTF-16 | Escribir texto que después se codificará |

Un `char` no siempre es un carácter visible completo: un emoji puede ocupar dos
unidades UTF-16. Tampoco hay equivalencia entre un byte y un carácter en UTF-8.
No conviertas un archivo binario a `String` para copiarlo.

## Leer bytes: comprueba el final y la cantidad

`InputStream.read()` devuelve un `int`: un byte entre 0 y 255, o `-1` al terminar.
La variante `read(byte[])` devuelve cuántos bytes ha leído, que pueden ser menos
que la capacidad del array. Escribe solo esa porción, nunca todo el buffer.
`available()` no indica el tamaño total ni es una condición válida de fin de archivo.

Guarda este programa como `ByteCopy.java`. Funciona desde Java 8 y no toca el disco:

```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;

public class ByteCopy {
    static void copy(InputStream input, OutputStream output) throws IOException {
        byte[] buffer = new byte[2];
        int count;
        while ((count = input.read(buffer)) != -1) {
            output.write(buffer, 0, count);
        }
    }

    public static void main(String[] args) throws IOException {
        byte[] source = {0, 127, (byte) 255, 10, 42};
        try (InputStream input = new ByteArrayInputStream(source);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            copy(input, output);
            System.out.println(Arrays.equals(source, output.toByteArray()));
            System.out.println(output.size());
        }
    }
}
```

Salida: `true` y, en la siguiente línea, `5`. El último bloque tiene un solo byte;
por eso importa pasar `count`. El método `copy` no cierra ninguno de sus parámetros:
quien abre los recursos conserva aquí la responsabilidad de cerrarlos.

Los streams en memoria sirven para adaptar y probar APIs. El cierre de estos dos
streams concretos no tiene efecto, pero no extrapoles esa propiedad a los archivos.

## De bytes a texto: el puente lleva codificación

`InputStreamReader` decodifica bytes como texto. `OutputStreamWriter` realiza la
operación inversa. Usa una codificación explícita, por ejemplo
`StandardCharsets.UTF_8`, para que el contrato no dependa del equipo.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Lectura de texto sobre una fuente de bytes</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Origen binario</span>
      <code class="diagram__value">InputStream</code>
      <span class="diagram__hint">Entrega bytes, sin decidir qué texto representan.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Decodificación</span>
      <code class="diagram__value">InputStreamReader</code>
      <span class="diagram__hint">UTF-8 convierte los bytes en unidades de texto.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Lectura por líneas</span>
      <code class="diagram__value">BufferedReader</code>
      <span class="diagram__hint">Añade un buffer y readLine sobre el lector.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Para escribir recorres el proceso inverso: Writer, codificación y OutputStream. El buffer no elige la codificación.</figcaption>
</figure>

Este ejemplo completo, `Utf8Bridge.java`, funciona desde Java 8:

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;

public class Utf8Bridge {
    public static void main(String[] args) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (BufferedWriter writer = new BufferedWriter(
                new OutputStreamWriter(bytes, StandardCharsets.UTF_8))) {
            writer.write("España\ncafé\n");
        }
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ByteArrayInputStream(bytes.toByteArray()),
                StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        }
    }
}
```

Salida: `España` y `café`, cada palabra en su línea. `readLine()` devuelve `null` al
terminar; una línea vacía devuelve `""`. No conserva el separador de línea, así que
leer por líneas y volver a escribir no garantiza una copia idéntica de los bytes.

> [!OJO]
> Antes de Java 18 la codificación predeterminada dependía del entorno; desde Java 18
> UTF-8 es la predeterminada de las APIs estándar que usan ese valor, con excepciones
> como la consola. Declárala igualmente: un archivo recibido puede usar otra codificación.

Los puentes construidos con un `Charset` sustituyen por defecto las secuencias
inválidas o los caracteres no representables. Si necesitas rechazarlos, configura un
`CharsetDecoder` o `CharsetEncoder` con `CodingErrorAction.REPORT` y pásalo al puente.
No confundas «he obtenido texto» con «el archivo era válido».

## Buffer, flush y cierre: tres responsabilidades

Un `BufferedInputStream` o `BufferedOutputStream` agrupa operaciones de bytes.
Un `BufferedReader` o `BufferedWriter` hace lo equivalente para texto. Reducen las
llamadas pequeñas al recurso subyacente; no cargan necesariamente todo el archivo.
No necesitas añadir otro `BufferedReader` al que ya devuelve `Files.newBufferedReader`.

`flush()` empuja la salida pendiente hacia la capa siguiente sin cerrar el recurso.
No garantiza que los datos hayan llegado al almacenamiento físico. Al cerrar un
`Writer` se vacía su salida pendiente; aun así, el cierre puede fallar y debes tratarlo.
En el ejemplo anterior se cierra el writer antes de pedir los bytes, no después.

Usa `try-with-resources` para recursos que posees. Cerrar el envoltorio exterior,
como `BufferedReader`, cierra también el lector y el stream que envuelve. Si declaras
varios recursos en el `try`, Java los cierra en orden inverso a la declaración.
Si una cadena de construcción puede fallar tras abrir un archivo, declara primero
el stream en el `try` y después los envoltorios para no dejarlo abierto.

No cierres por costumbre un stream recibido como parámetro: consulta su contrato.
Cerrar un wrapper de `System.in` también cierra la entrada estándar del proceso.
Y no añadas un `catch` vacío alrededor del cierre: perderías un fallo real.

## Files abre el recurso; IO lo consume

`Path` describe una ruta y `Files` ofrece fábricas que devuelven tipos de IO.
Estas operaciones están disponibles en Java 8:

| Necesitas | Fábrica de NIO |
| --- | --- |
| Bytes de entrada | `Files.newInputStream(path)` |
| Bytes de salida | `Files.newOutputStream(path)` |
| Texto con buffer | `Files.newBufferedReader(path, charset)` |
| Escribir texto con buffer | `Files.newBufferedWriter(path, charset)` |

Guarda `FileInterop.java`. Recibe una carpeta temporal vacía que tú controlas;
`CREATE_NEW` impide sobrescribir un archivo que ya exista. No lo apuntes a tus documentos.

```java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

public class FileInterop {
    static int firstByte(InputStream input) throws IOException {
        return input.read(); // La API acepta IO, no necesita conocer Path.
    }

    public static void main(String[] args) throws IOException {
        Path file = Paths.get(args[0]).resolve("message.txt");
        try (BufferedWriter writer = Files.newBufferedWriter(file,
                StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW,
                StandardOpenOption.WRITE)) {
            writer.write("Hola, café\n");
        }
        try (InputStream input = Files.newInputStream(file)) {
            System.out.println(firstByte(input));
        }
        try (BufferedReader reader = Files.newBufferedReader(file,
                StandardCharsets.UTF_8)) {
            System.out.println(reader.readLine());
            System.out.println(reader.readLine() == null);
        }
    }
}
```

Salida: `72`, `Hola, café` y `true`, en ese orden y en líneas separadas.
`72` es el byte de la `H` en UTF-8; no hemos intentado decodificar el texto byte a byte.
Sin opciones, `newOutputStream` y `newBufferedWriter` crean el archivo o truncan uno
existente. Para añadir, usa `CREATE` y `APPEND` cuando ese sea el contrato deseado.

Si una API exige `File`, `path.toFile()` sirve para rutas del sistema de archivos
predeterminado. No funciona para cualquier proveedor, como las rutas dentro de un ZIP.
Si exige un stream, suele ser más general abrirlo con `Files` y pasar ese recurso.

## IOException: propagar no significa ignorar

Abrir, leer, escribir y cerrar pueden lanzar `IOException`, una excepción comprobada.
Los programas anteriores la declaran con `throws` para dejar visible el fallo.
En una aplicación, captúrala donde puedas informar, reintentar con criterio o abortar
la operación; conserva la causa si la traduces a una excepción del dominio.

Un fallo de escritura puede dejar un archivo parcial: el cierre automático no deshace
lo escrito ni convierte la operación en una transacción. Si fallan el cuerpo y el
cierre del `try`, la excepción del cierre queda en `getSuppressed()` de la principal.
Repasa estos mecanismos en [Excepciones](/docs/fundamentos/excepciones/).

## Copia abreviada desde Java 9

`InputStream.transferTo(OutputStream)` copia hasta el final y devuelve el número de
bytes transferidos. No cierra ninguno de los dos streams. Este programa,
`TransferCopy.java`, requiere Java 9 o posterior; el bucle inicial sirve en Java 8:

```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

public class TransferCopy {
    public static void main(String[] args) throws IOException {
        try (ByteArrayInputStream input = new ByteArrayInputStream(new byte[]{1, 2, 3});
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            System.out.println(input.transferTo(output));
            System.out.println(output.size());
        }
    }
}
```

Salida: `3` y `3`, cada número en su línea. No uses `readAllBytes()` para archivos de
tamaño desconocido solo por ahorrar un bucle: también es de Java 9 y acumula todo en memoria.

## Qué te llevas

- Bytes para binarios; readers y writers para texto, con codificación explícita.
- Lee hasta `-1` o `null`, según la API, y respeta la cantidad realmente leída.
- Los buffers agrupan operaciones; `flush` no equivale a persistencia física.
- Cierra los recursos que posees y deja visibles los fallos, incluidos los de cierre.
- Usa `Files` para abrir rutas y tipos de IO para integrar APIs que trabajan con streams.
