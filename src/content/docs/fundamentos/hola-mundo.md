---
title: 'Hola, mundo'
description: 'Tu primer programa: compilar con javac, ejecutar con java y seguir el rastro que deja en la máquina virtual.'
section: fundamentos
order: 1
since: 11
---

## Dos herramientas, no una

Un programa de tres líneas parece magia hasta que separas el viaje en sus dos
herramientas. `javac` traduce el texto que escribes a bytecode. `java` ejecuta ese
bytecode sobre la máquina virtual. Ninguna hace el trabajo de la otra, y casi
todos los errores de principiante salen de confundirlas.

<figure class="diagram diagram--framed">
  <p class="diagram__label">El viaje de un programa</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Fuente</span>
      <code class="diagram__value">HolaMundo.java</code>
      <span class="diagram__hint">Lo que escribes.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Compilador</span>
      <code class="diagram__value">javac</code>
      <span class="diagram__hint">Revisa tipos y traduce.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Bytecode</span>
      <code class="diagram__value">HolaMundo.class</code>
      <span class="diagram__hint">Portable, no es código máquina.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">04</span>
      <span class="diagram__title">Ejecución</span>
      <code class="diagram__value">java HolaMundo</code>
      <span class="diagram__hint">La JVM lo carga y lo ejecuta.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Cuatro pasos y dos herramientas: <code>javac</code> en el segundo, <code>java</code> en el cuarto.</figcaption>
</figure>

| Qué hace | `javac` | `java` |
| --- | --- | --- |
| Recibe | `HolaMundo.java` | `HolaMundo.class` |
| Produce | `HolaMundo.class` | lo que imprima tu programa |
| Cuándo falla | errores de compilación | excepciones en ejecución |

Ese archivo se llama `HolaMundo.java`. El nombre del archivo tiene que coincidir
con el de la clase pública, con la misma mayúscula y sin espacios.

> [!OJO]
> Si el archivo se llama `hola_mundo.java` y la clase `HolaMundo`, `javac` falla
> antes de compilar nada. El nombre no es decorativo: el compilador lo usa para
> encontrar la clase pública.

```java
public class HolaMundo {
    public static void main(String[] args) {
        System.out.println("Hola, mundo");
    }
}
```

Ese archivo se llama `HolaMundo.java`. El nombre del archivo tiene que coincidir
con el de la clase pública, con la misma mayúscula y sin espacios.

## Compilar: del fuente al bytecode

```bash
javac HolaMundo.java
```

Si todo va bien, `javac` no dice nada y escribe `HolaMundo.class` en la misma
carpeta. Ese archivo no es código máquina: es bytecode, un formato intermedio que
entiende la máquina virtual y no tu procesador.

Si `javac` falla, el mensaje llega con el número de línea y el símbolo exacto. Lee
la primera línea del error: las siguientes casi siempre son consecuencia de esa.

## Ejecutar: la JVM toma el control

```bash
java HolaMundo
```

Aquí va el nombre de la clase, sin extensión y sin ruta de archivo. `java` busca
`HolaMundo.class`, lo carga, encuentra el método `main` y empieza a ejecutar por
ahí.

### Por qué no se pasa el archivo

`java HolaMundo.class` no funciona porque la máquina virtual no recibe un archivo
suelto: recibe el nombre de una clase que tiene que localizar en el classpath. Ese
nombre es el que aparece en `public class`.

## Qué observar en el camino

- El `.class` es portable. Compilado en tu portátil, se ejecuta igual en un
  servidor con otro sistema operativo mientras la versión de la máquina virtual
  sea compatible.
- `main` es el punto de entrada que busca el lanzador. Su firma no es un
  capricho: `public static void main(String[] args)`.
- La primera vez que ejecutas `java` con un archivo `.java` suelto, el lanzador
  compila y ejecuta en un solo paso. Sirve para probar, no para entender el
  ciclo completo.

> [!NOTA]
> Compilar y ejecutar son dos pasos distintos. Tenlos separados en la cabeza y el
> resto de Java deja de ser una caja negra.
