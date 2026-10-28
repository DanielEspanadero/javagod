---
title: 'Archivos con Path y Files'
description: 'Trabaja con rutas, texto UTF-8 y recorridos de directorios con NIO.2, cerrando recursos y aislando tus pruebas.'
section: biblioteca
order: 6
since: 8
---

## Una ruta no es un archivo abierto

`Path` representa una ruta de un sistema de archivos. `Files` reúne operaciones sobre esas rutas:
crear, leer, escribir, copiar o recorrer. Construir un `Path` no crea nada ni comprueba que exista.
Esta separación te permite preparar una ruta antes de decidir qué operación vas a ejecutar.

NIO.2 existe desde Java 7; aquí usamos su forma disponible en Java 8, la primera versión de lectura
del curso. Los programas completos compilan con `javac --release 8` desde el JDK 21.
Las alternativas que requieren Java 11 se indican por separado.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Ruta, operación y recurso</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">Describir</span>
      <code class="diagram__value">Path</code>
      <span class="diagram__hint">Una ubicación; puede que todavía no exista.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">Operar</span>
      <code class="diagram__value">Files</code>
      <span class="diagram__hint">Accede al sistema de archivos y puede fallar.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Cerrar</span>
      <code class="diagram__value">try-with-resources</code>
      <span class="diagram__hint">Libera lectores y recorridos aunque haya una excepción.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Una ruta es un valor; un lector o un recorrido abierto tiene un ciclo de vida.</figcaption>
</figure>

## Construir y combinar rutas

En Java 8 construyes rutas con `Paths.get`. No unas carpetas concatenando barras:
`resolve` deja que el proveedor de archivos interprete el separador.

Guarda como `PathsDemo.java`:

```java
import java.nio.file.Path;
import java.nio.file.Paths;

public class PathsDemo {
    public static void main(String[] args) {
        Path root = Paths.get("workspace");
        Path report = root.resolve("drafts").resolve("..")
                .resolve("report.txt").normalize();
        System.out.println(report.getFileName());
        System.out.println(report.getNameCount());
        System.out.println(report.startsWith(root));
    }
}
```

Ejecuta `javac --release 8 PathsDemo.java` y `java PathsDemo`. Salida:

```text
report.txt
2
true
```

El programa no toca el disco. `normalize()` elimina segmentos redundantes de forma léxica;
no sigue enlaces simbólicos ni comprueba permisos. `toAbsolutePath()` sitúa una ruta relativa
respecto al directorio de trabajo, pero tampoco prueba que exista. `toRealPath()` sí consulta
el sistema y normalmente resuelve enlaces simbólicos; puede lanzar `IOException`.

Si pasas una ruta absoluta a `resolve`, el resultado es esa ruta absoluta, no una hija de la base.
No uses un nombre recibido de la red como argumento sin validarlo.

## Un laboratorio que no toca tus documentos

Para los siguientes programas crea una carpeta nueva de prácticas. En un terminal de macOS o Linux,
`mktemp -d` genera un directorio aislado; no sustituyas ese destino por tu carpeta personal.
Guarda allí los archivos `.java` y ejecuta allí los comandos:

```bash
lab=$(mktemp -d)
cd "$lab"
```

Cada programa de E/S crea además su propio subdirectorio temporal y elimina únicamente los archivos
que acaba de crear. No hay un borrado recursivo de una ruta elegida por el usuario.
El directorio del laboratorio conserva tus fuentes y clases hasta que tú decidas retirarlo.

## Texto con codificación explícita

Un archivo contiene bytes. Para convertirlos a texto necesitas una codificación: elige UTF-8
explícitamente en vez de depender de la configuración de la máquina.

Guarda como `Utf8Files.java`:

```java
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.List;

public class Utf8Files {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("nio-text-");
        Path file = directory.resolve("notes.txt");
        try {
            Files.write(file, Arrays.asList("café", "acción"),
                    StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW);
            List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
            System.out.println(lines.size());
            System.out.println(lines.get(0));
            System.out.println(lines.get(1));
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
    }
}
```

Ejecuta `javac --release 8 Utf8Files.java` y `java Utf8Files`. Salida:

```text
2
café
acción
```

`CREATE_NEW` falla si ya existe el destino: evita sobrescribirlo por accidente. Sin opciones,
`Files.write` crea el archivo o trunca el existente. Para añadir contenido, selecciona `APPEND`
y, si quieres crearlo cuando falte, también `CREATE`.

`readAllLines` carga todo en memoria y devuelve las líneas sin sus terminadores. `Files.write`
con una lista escribe cada elemento seguido del separador de línea de la plataforma;
no presupongas que los bytes serán idénticos entre Windows y Unix.
Para datos binarios pequeños tienes `readAllBytes` y `write(Path, byte[], ...)`, sin codificación.

## Archivos grandes: consume y cierra

`Files.lines` devuelve un `Stream<String>` perezoso que mantiene un archivo abierto.
La operación terminal no sustituye a `close()`. Usa `try-with-resources`, incluso si solo vas
a contar o buscar una línea.

Guarda como `FileStreams.java`:

```java
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.stream.Stream;

public class FileStreams {
    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("nio-stream-");
        Path file = directory.resolve("tasks.txt");
        try {
            Files.write(file, Arrays.asList("pending", "done", "pending"),
                    StandardCharsets.UTF_8);
            try (Stream<String> lines = Files.lines(file, StandardCharsets.UTF_8)) {
                System.out.println(lines.filter("pending"::equals).count());
            }
            try (Stream<Path> entries = Files.list(directory)) {
                System.out.println(entries.filter(Files::isRegularFile).count());
            }
            try (Stream<Path> tree = Files.walk(directory)) {
                System.out.println(tree.count());
            }
        } finally {
            Files.deleteIfExists(file);
            Files.deleteIfExists(directory);
        }
    }
}
```

Ejecuta `javac --release 8 FileStreams.java` y `java FileStreams`. Salida:

```text
2
1
2
```

`list` visita solo los hijos directos. `walk` incluye la ruta inicial, por eso aquí cuenta dos:
el directorio y su archivo. Ambos streams deben cerrarse y su orden no está garantizado.
No enseñes una lista de nombres como si el sistema siempre los devolviera ordenados; usa `sorted`
si el orden forma parte de tu resultado.

Las operaciones que abren recursos pueden lanzar `IOException`; durante el consumo perezoso de
estos streams también puedes recibir `UncheckedIOException`. La cláusula `throws` de los ejemplos
simplifica el laboratorio, no sustituye el tratamiento de errores de una aplicación.
Consulta [Stream](/docs/colecciones/stream/) para las operaciones del pipeline.

## Lectores, escritores y alternativas de Java 11

Si procesas línea a línea con un bucle, `Files.newBufferedReader(path, UTF_8)` devuelve un
`BufferedReader`. Para generar texto progresivamente está `newBufferedWriter`.
Pon también estos recursos en `try-with-resources`; `Path` no necesita cerrarse, el lector sí.

Desde **Java 11**, `Path.of("notes.txt")` es una alternativa a `Paths.get`.
También existen `Files.readString(path, StandardCharsets.UTF_8)` y
`Files.writeString(path, text, StandardCharsets.UTF_8)`. Trabajan con un texto completo en memoria,
no son sustitutos del procesamiento progresivo de archivos grandes. Estas llamadas no compilan
con `--release 8`; no cambian la versión mínima del tema de este capítulo.

## Copiar, mover y comprobar sin engañarte

| Operación | Contrato que debes recordar |
| --- | --- |
| `Files.createDirectories(path)` | Crea padres que falten; no falla solo porque el directorio ya exista |
| `Files.copy(source, target)` | Por defecto no reemplaza un destino existente |
| `Files.move(source, target)` | Puede fallar por permisos, destino existente o límites del proveedor |
| `Files.delete(path)` | Borra una entrada; un directorio debe estar vacío |
| `Files.exists(path)` | Es una observación puntual, no una reserva ni una garantía para la siguiente llamada |

`StandardCopyOption.REPLACE_EXISTING` permite reemplazar deliberadamente. No lo añadas por costumbre.
`ATOMIC_MOVE` solicita un movimiento atómico, pero el proveedor puede rechazarlo con
`AtomicMoveNotSupportedException`; no prometas atomicidad sin tratar ese caso.

> [!OJO]
> Comprobar `exists` antes de escribir no evita carreras: otro proceso puede cambiar el archivo
> entre ambas llamadas. Ejecuta la operación con las opciones apropiadas y trata su excepción.

Para entradas no fiables, resolver y normalizar y después comprobar `startsWith(base)` ayuda a
rechazar escapes léxicos como `../`. No basta frente a enlaces simbólicos ni cambios concurrentes.
Un servicio que acepta rutas necesita una política de acceso y aislamiento real, no solo limpiar texto.

## Qué te llevas

- `Path` describe una ubicación y `Files` realiza E/S, que puede fallar.
- Declara UTF-8 para texto y distingue carga completa de procesamiento progresivo.
- Cierra `lines`, `list`, `walk`, lectores y escritores con `try-with-resources`.
- Practica en directorios temporales nuevos y limpia solo lo que tú has creado.
- No confundas normalización, comprobación de existencia y seguridad de acceso.
