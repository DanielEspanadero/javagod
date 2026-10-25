---
title: 'Java 25'
description: 'Archivos fuente compactos, cuerpos de constructor flexibles y AOT.'
section: novedades
order: 5
since: 25
---

## Qué fue

Java 25 llegó el 16 de septiembre de 2025 (JSR 400) y es la LTS más reciente. Cierra varias
cosas que llevaban versiones en preview: los archivos fuente compactos, los valores con ámbito
y las importaciones de módulos. Y en la máquina virtual, el trabajo se nota donde importa:
arranque y memoria.

## Archivos fuente compactos

La JEP 512 permite un archivo `.java` sin clase declarada y con un `main` de instancia:

```java
void main() {
    System.out.println("Hola, mundo");
}
```

Se compila y se ejecuta igual que cualquier otra cosa, con `java Hola.java`. Un archivo fuente
compacto declara la clase de forma implícita: el compilador sigue generando una, solo que no
hace falta escribirla, y puede llevar `main` de instancia o estático, con `String[]` o sin
parámetros. Además importa `java.base` solo, como si tuviera delante `import module java.base;`.
No es un dialecto nuevo: es la misma clase, con menos ceremonia.

## Cuerpos de constructor flexibles

Antes, la primera sentencia de un constructor tenía que ser `super(...)` o `this(...)`. La
JEP 513 lo relaja: puedes validar los argumentos antes de llamar al padre.

```java
class Cuenta extends CuentaBase {
    Cuenta(String titular, double saldo) {
        if (saldo < 0) {
            throw new IllegalArgumentException("Saldo negativo");
        }
        super(titular, saldo);
    }
}
```

Suena menor y evita el truco de siempre: un método estático privado que valida y devuelve el
valor, solo para poder pasarlo a `super`.

## Valores con ámbito, definitivos

La JEP 506 cierra los valores con ámbito: una alternativa inmutable a `ThreadLocal`, pensada
para pasar contexto a través de llamadas sin convertirlo en parámetro de todo.

```java
static final ScopedValue<String> USUARIO = ScopedValue.newInstance();

void atender() {
    ScopedValue.where(USUARIO, "ada").run(() -> procesar());
}
```

La diferencia con `ThreadLocal` es que el valor lo pone quien llama, no quien lo lee, y no se
puede modificar a mitad del camino. Con hilos virtuales, es lo que reemplaza al `ThreadLocal`
que se heredaba entre hilos.

> [!OJO]
> Si probaste la preview, hay un cambio: `ScopedValue.orElse` ya no acepta `null`. Lo que en
> preview pasaba como valor por defecto ahora falla.

## Importaciones de módulos

La JEP 511 permite importar los paquetes exportados por un módulo con una línea:

```java
import module java.base;
```

Equivale a cincuenta y cuatro importaciones de paquete bajo demanda, una por cada paquete que
exporta `java.base`, más las de los módulos que ese módulo lee. El objetivo es no obligar a un
proyecto pequeño a escribir veinte `import` ni a declarar un `module-info.java` solo para
agrupar: la importación se puede usar aunque el archivo no forme parte de un módulo. Toma un
nombre de módulo, no un paquete, así que no alcanza a lo que venga del classpath.

## Arranque: AOT y vuelo grabado

- JEP 514 y 515: el almacenamiento en caché AOT de clases y el perfilado de métodos dejan de
  requerir un flujo comercial. El objetivo es que una aplicación arranque y se caliente antes,
  sin cambiar el código.
- JEP 518, 520 y 509: el registro de vuelo gana muestreo cooperativo, medida de tiempos por
  método y perfilado de tiempo de CPU, este último experimental.

## Memoria y recolectores

- JEP 519: cabeceras de objeto compactas pasan a característica de producto. No son el
  formato por defecto (la JEP lo dice explícitamente), pero se pueden activar y reducen el
  tamaño de cada objeto.
- JEP 521: Shenandoah generacional también pasa a producto, y por defecto Shenandoah sigue
  usando una sola generación.

## Lo que se quedó por el camino

La JEP 503 retira el puerto de 32 bits para x86. Ya estaba marcado para retirar en Java 24 y
aquí desaparecen los binarios y el soporte: si compilas para esa arquitectura, te quedas en una
versión anterior.

## Lo que sigue en preview

- JEP 505: concurrencia estructurada, en su quinta preview. Lleva tiempo sin cerrarse, y es la
  señal de que el diseño todavía se está moviendo.
- JEP 507: tipos primitivos en patrones, `instanceof` y `switch`.
- JEP 502: valores estables, que permiten inicializar algo una vez y leerlo como si fuera una
  constante, dentro del modelo de valores.
- JEP 470: codificación PEM de objetos criptográficos, desactivada por defecto.
- JEP 508: la API vectorial, en su décimo incubador.

## El mapa de la versión

| Área | JEP | Qué trajo |
| --- | --- | --- |
| Lenguaje | 512 | Archivos fuente compactos y `main` de instancia |
| Lenguaje | 513 | Cuerpos de constructor flexibles |
| Lenguaje | 511 | Importaciones de módulos |
| Biblioteca | 506 | Valores con ámbito, definitivos |
| Biblioteca | 510 | API de funciones de derivación de claves |
| Biblioteca | 505, 507, 502, 470 | Concurrencia estructurada, patrones primitivos, valores estables y PEM, en preview |
| JVM | 519, 521 | Cabeceras compactas y Shenandoah generacional, de producto |
| JVM | 514, 515 | Caché AOT y perfilado de métodos en la línea de comandos |
| JVM | 518, 520, 509 | Registro de vuelo: muestreo, tiempos por método y CPU |
| Retiradas | 503 | Fuera el puerto de x86 de 32 bits |

## Qué te llevas

- Un archivo `.java` con `void main()` ya es un programa completo, sin clase alrededor.
- Los constructores pueden validar antes de llamar a `super`.
- Los valores con ámbito son el reemplazo inmutable de `ThreadLocal` para hilos virtuales.
- `import module java.base;` agrupa paquetes sin escribir un `module-info.java`.
- Las cabeceras compactas y Shenandoah generacional son de producto, pero no el valor por
  defecto.
- El puerto de 32 bits para x86 ya no existe.
