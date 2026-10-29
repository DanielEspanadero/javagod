---
title: 'JDK y herramientas'
description: 'Elige e instala un JDK, comprueba tu terminal y distingue las herramientas que compilan, ejecutan y empaquetan Java.'
section: entorno
order: 1
since: 8
---

## Antes de escribir código

Para seguir el curso necesitas un **JDK**, no solo una aplicación que ejecute
Java. Instálalo para tu sistema operativo y arquitectura, abre una terminal nueva
y comprueba que tanto el ejecutor como el compilador responden.
Los ejemplos de este capítulo se han ejecutado con un JDK 21.

## JVM, JRE y JDK: tres capas distintas

La **JVM**, Java Virtual Machine, es la máquina virtual que carga y ejecuta
bytecode. Gestiona memoria y puede transformar ese bytecode en instrucciones
nativas durante la ejecución. No traduce tus archivos fuente de Java.

El **JRE**, Java Runtime Environment, añade a la JVM las bibliotecas y los
recursos necesarios para ejecutar aplicaciones. Es el entorno de ejecución:
no incluye el compilador como herramienta de desarrollo.

El **JDK**, Java Development Kit, reúne el entorno de ejecución y las herramientas
para desarrollar. Es lo que instalas tú: sirve para compilar y también para
lanzar el programa, sin instalar un JRE aparte.

| Capa | Qué contiene | Para qué te sirve | ¿La instalas por separado? |
| --- | --- | --- | --- |
| JVM | Motor que ejecuta bytecode | Ejecutar instrucciones y gestionar memoria | Normalmente llega dentro del entorno de ejecución |
| JRE | JVM, bibliotecas y recursos de ejecución | Ejecutar una aplicación ya compilada | No lo necesitas aparte para este curso |
| JDK | Entorno de ejecución y herramientas como `javac` y `jar` | Crear, comprobar y ejecutar programas | Sí: esta es tu descarga |

<figure class="diagram diagram--framed">
  <p class="diagram__label">Del motor al equipo de desarrollo</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">JVM</span>
      <code class="diagram__value">Bytecode</code>
      <span class="diagram__hint">El motor que lo ejecuta.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">JRE</span>
      <code class="diagram__value">JVM + bibliotecas</code>
      <span class="diagram__hint">Lo necesario para ejecutar.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">JDK</span>
      <code class="diagram__value">Runtime + herramientas</code>
      <span class="diagram__hint">Lo necesario para desarrollar.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Son capas de capacidades, no tres descargas obligatorias ni tres pasos de compilación.</figcaption>
</figure>

### Por qué ya no buscas un JRE suelto

En Java 8 era habitual descargar un JRE para ejecutar y un JDK para desarrollar.
Desde Java 9, el sistema de módulos y `jlink` permiten construir una **imagen de
runtime** con los módulos que necesita una aplicación. Quien la distribuye puede
entregar esa imagen junto con su programa, sin pedirte una instalación global.

Muchos proveedores han dejado de ofrecer el JRE como descarga independiente en
sus versiones modernas: distribuyen el JDK o facilitan ese despliegue con runtimes
específicos. No es una prohibición de Java: algunos siguen publicando JRE.
La idea de entorno de ejecución permanece aunque no haya una carpeta `jre`
dentro del JDK. Aquí no necesitas crear imágenes ni utilizar `jlink`.

Encontrar `jar` indica que tienes una herramienta del JDK, no solo el ejecutor.
Encontrar `jshell`, disponible **desde Java 9**, apunta también a un JDK moderno.
Un JDK 8 no trae `jshell` y sigue siendo un JDK. Además, tu terminal puede mezclar
herramientas de varias instalaciones: su presencia no garantiza que todas
pertenezcan a la misma. Comprueba versiones y rutas si algo no encaja.

## Elegir una distribución sin elegir un bando

Una distribución es un JDK que un proveedor compila, empaqueta y mantiene.
Eclipse Temurin, Oracle JDK, Amazon Corretto y Azul Zulu son opciones reales;
no necesitas una marca concreta para aprender. Un JDK conforme con Java SE de
la versión adecuada ejecuta el código del curso, sin depender de ese proveedor.
Eso no elimina las diferencias de licencia, actualizaciones o soporte.

Antes de descargar, revisa estos criterios:

- **Versión:** comprueba cuál es la LTS actual en la web del proveedor. Java 25
  es una LTS posterior a Java 21, la base de los ejemplos del curso.
- **Licencia:** lee las condiciones de esa distribución y versión, también
  para uso profesional y redistribución; no deduzcas el precio por el nombre.
- **Soporte:** mira hasta cuándo habrá actualizaciones y cuáles requieren un
  contrato. La etiqueta LTS no promete el mismo plazo en todos los proveedores.
- **Proveedor:** identifica quién publica las correcciones y de dónde descargas
  el paquete. Un anuncio de versión no equivale a una política de mantenimiento.
- **Plataforma:** elige tu sistema y arquitectura, por ejemplo ARM64 o x64.

Puedes instalar un JDK 21 actualizado. Si eliges otra LTS, revisa las anotaciones:
un ejecutor antiguo no entiende necesariamente el bytecode de un compilador nuevo.

## Tres rutas de instalación, tres compromisos

Elige **una** ruta: acumularlas sin controlar las rutas deja JDK compitiendo.
Sigue las instrucciones actuales del proveedor o gestor para tu sistema,
seleccionando el paquete JDK, no solo el runtime.

| Ruta | Cuándo te encaja | Qué debes vigilar |
| --- | --- | --- |
| Gestor de versiones, como SDKMAN | Alternas JDK por proyecto desde una terminal compatible | Su inicialización en la shell y la versión activa; consulta qué sistemas admite |
| Gestor de paquetes, como Homebrew o apt | Prefieres actualizar Java con el resto de paquetes | El nombre y la versión disponibles dependen del repositorio; puede requerir enlazar el JDK o ajustar rutas |
| Instalador oficial del proveedor | Quieres descargar un paquete para tu sistema sin otro gestor | Tú controlas las actualizaciones y compruebas si configura las variables |

Comprueba la versión activa y el directorio de destino. No copies instrucciones
de otro sistema a ciegas ni cambies tu perfil de shell sin identificar tu JDK.
Al terminar, abre una terminal nueva y pasa la misma comprobación.

## Verificar: ejecutor y compilador

Ejecuta estas dos órdenes por separado:

```bash
java -version
javac -version
```

En el JDK 21 comprobado, la primera orden escribe tres líneas en la salida de
error estándar y termina correctamente. Que use ese canal no significa que falle:

1. La primera identifica Java, con un número entre comillas, una fecha y, en esta
   distribución, la etiqueta LTS. El número empieza por `21`.
2. La segunda identifica el entorno de ejecución, el proveedor y su compilación.
3. La tercera identifica la JVM, su arquitectura y su compilación; puede incluir
   modos de ejecución como `mixed mode` y `sharing`.

La forma depende del proveedor; el número cambia con los parches de seguridad.
La segunda orden imprime `javac` seguido de su versión. Las dos versiones
principales deben coincidir con el JDK que has elegido.

> [!OJO]
> Que responda `java` no demuestra que puedas compilar. Si falta `javac`, puede
> haber solo un runtime accesible o una configuración de rutas incompleta.

## JAVA_HOME y PATH: ubicación frente a búsqueda

**`JAVA_HOME`** señala la carpeta raíz del JDK, la que contiene `bin`, no la
propia carpeta `bin` ni el archivo ejecutable. Algunas herramientas de desarrollo
usan esa variable para localizar Java. No es un requisito de todas las órdenes:
puedes ejecutar un JDK sin tenerla definida.

**`PATH`** es la lista de carpetas donde tu shell busca los ejecutables. Para
resolver las herramientas del JDK debe encontrar su carpeta `bin`; si hay varias
coincidencias, normalmente utiliza la primera. Por eso definir `JAVA_HOME` no
cambia por sí solo qué ejecutable encuentra tu terminal.

En Linux y macOS las rutas de `PATH` se separan con dos puntos; en Windows,
con punto y coma. Configúralas siguiendo la documentación de tu instalador o
gestor y comprueba que apuntan al mismo JDK. No borres las demás entradas de `PATH`.

Si ves **`command not found`**, la shell no ha encontrado la orden: todavía no
ha arrancado Java. Revisa la escritura, la instalación y su carpeta `bin` en
`PATH`; después abre otra terminal si has cambiado la configuración.
En PowerShell el mensaje es distinto, pero la causa puede ser la misma.
No lo confundas con el error de clase ausente que verás a continuación:
en ese caso sí ha arrancado el ejecutor.

## javac y java: una prueba mínima

Guarda este texto en `Hello.java` dentro de una carpeta de pruebas:

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("JDK listo");
    }
}
```

Desde esa carpeta, compila y ejecuta:

```bash
javac -d out Hello.java
java -cp out Hello
```

`javac` no imprime nada si todo va bien; `-d out` crea el directorio de salida
si no existe y deja allí `Hello.class`. `java` imprime exactamente:

```text
JDK listo
```

### El classpath es una lista de lugares donde buscar

`-cp out` indica dónde buscar las clases de la aplicación: aquí, la carpeta
`out`. Pasas `Hello`, el nombre de la clase, no `Hello.class`. El classpath puede
contener carpetas y archivos JAR; no es la ruta de los ejecutables de `PATH`.
Si necesitas varias entradas, se separan con `:` en Linux y macOS y con `;`
en Windows. Sin una opción de classpath ni la variable `CLASSPATH`, se usa el
directorio actual. Con paquetes, la búsqueda parte de la raíz de sus carpetas.

Prueba una clase que no existe, desde la misma carpeta:

```bash
java -cp out Missing
```

Con el JDK 21 comprobado, termina con código 1 y escribe en error estándar:

```text
Error: Could not find or load main class Missing
Caused by: java.lang.ClassNotFoundException: Missing
```

No es un fallo de instalación: `java` se ha ejecutado, pero no encuentra esa
clase en el classpath. Comprueba el nombre, las mayúsculas y la carpeta de salida.

## jshell y jar: explorar y empaquetar

**Desde Java 9**, `jshell` evalúa expresiones y declaraciones sin escribir una
clase completa. Comprueba su versión sin abrir una sesión interactiva:

```bash
jshell --version
```

Imprime una línea con `jshell` y su versión, que empieza por `21` en la prueba.
En Java 8 omite esta comprobación: la herramienta aún no existía.

Un **JAR** es un archivo ZIP que agrupa clases y recursos y normalmente incluye
un manifiesto en `META-INF/MANIFEST.MF`. La herramienta `jar` lo crea; en esta
prueba incorpora ese manifiesto automáticamente. Reutiliza la compilación anterior:

```bash
jar cf hello.jar -C out .
jar tf hello.jar
java -cp hello.jar Hello
```

`c` crea el archivo, `f` indica su nombre y `-C out .` incorpora el contenido de
`out`, no la carpeta como nivel adicional. La creación no imprime nada.
`t` lista el contenido; en esta prueba la lista exacta es:

```text
META-INF/
META-INF/MANIFEST.MF
Hello.class
```

La última orden imprime `JDK listo`, igual que antes. Ese JAR no declara una
clase principal: lo has utilizado como entrada del classpath.
Para convertirlo en **JAR ejecutable**, añade la entrada `Main-Class` al manifiesto:

```bash
jar cfe hello-app.jar Hello -C out .
java -jar hello-app.jar
```

`e` fija el punto de entrada: el manifiesto contiene `Main-Class: Hello`.
La creación no imprime nada. `java -jar` lee ese manifiesto para elegir la clase
y vuelve a imprimir `JDK listo`. Un JAR ejecutable no incluye necesariamente
sus dependencias: un **fat JAR** o **uber JAR** reúne además las clases de sus
bibliotecas. Aquí no construyes uno: nuestro programa no necesita bibliotecas externas.

> [!NOTA]
> Más adelante encontrarás WAR: no es otra herramienta, sino un formato de
> aplicación web con estructura `WEB-INF`, que despliega un contenedor de
> servlets como Tomcat. Muchos proyectos web actuales entregan un JAR ejecutable
> en su lugar. El desarrollo web y su despliegue quedan para más adelante.

## Qué te llevas

- Instalas un JDK: contiene lo necesario para desarrollar y ejecutar.
- Eliges versión, licencia y mantenimiento, no una marca supuestamente mágica.
- Verificas ejecutor y compilador; `JAVA_HOME`, `PATH` y classpath no son lo mismo.
- `javac` compila, `java` ejecuta, `jshell` explora desde Java 9 y `jar` empaqueta.

Ya puedes seguir con [Hola, mundo](/docs/fundamentos/hola-mundo/) para entender
con más detalle el viaje del fuente a la máquina virtual.
