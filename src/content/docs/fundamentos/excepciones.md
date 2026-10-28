---
title: 'Excepciones'
description: 'Cómo lanzar, capturar y propagar fallos sin perder su causa ni dejar recursos abiertos.'
section: fundamentos
order: 9
since: 8
---

## Cuando un método no puede cumplir su contrato

Una excepción interrumpe el camino normal de un método. En lugar de devolver un
resultado inventado, comunica que no ha podido completar la operación.
Puedes capturarla donde sepas resolver el problema o dejar que suba al llamador.

No es lo mismo un dato ausente que una operación fallida. Si buscar algo puede
no encontrarlo, ese resultado puede formar parte del contrato. Si leerlo falla
porque no tienes permisos, necesitas conservar la información del fallo.

## `try` y `catch`: dos caminos, no dos resultados

Guarda este ejemplo en `ParseExample.java`. Funciona desde Java 8:

```java
public class ParseExample {
    public static void main(String[] args) {
        printDouble("21");
        printDouble("hola");
    }

    static void printDouble(String text) {
        try {
            int value = Integer.parseInt(text);
            System.out.println(value * 2);
        } catch (NumberFormatException error) {
            System.out.println("No es un entero: " + text);
        }
    }
}
```

Salida:

```text
42
No es un entero: hola
```

Si `parseInt` lanza una excepción, no se ejecuta la multiplicación. Java busca
un `catch` compatible con el tipo del objeto lanzado. Tras ejecutar ese bloque,
continúa después del `try` completo: no vuelve a la instrucción que falló.

<figure class="diagram diagram--framed">
  <p class="diagram__label">El camino de un fallo de conversión</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Intento</span>
      <code class="diagram__value">parseInt("hola")</code>
      <span class="diagram__hint">No hay un entero que devolver. La llamada lanza una excepción.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Búsqueda</span>
      <code class="diagram__value">NumberFormatException</code>
      <span class="diagram__hint">Se busca un catch compatible, empezando por el try más cercano.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Recuperación</span>
      <code class="diagram__value">catch</code>
      <span class="diagram__hint">Este ejemplo informa del dato inválido. El cálculo no se reanuda.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Sin un catch compatible en el método, la excepción sube por las llamadas. Si nadie la captura, termina el hilo afectado.</figcaption>
</figure>

## Tres ramas bajo `Throwable`

`Throwable` es la raíz de los objetos que puedes lanzar. Sus ramas principales
son `Exception` y `Error`; dentro de `Exception` está `RuntimeException`.

| Familia | ¿El compilador exige capturar o declarar? | Ejemplo |
| --- | --- | --- |
| `Exception`, excepto `RuntimeException` y sus subclases | Sí, son comprobadas | `IOException` |
| `RuntimeException` y sus subclases | No | `IllegalArgumentException` |
| `Error` y sus subclases | No | `OutOfMemoryError` |

Una excepción comprobada obliga a decidir qué hace el llamador. No significa
que la excepción ocurra al compilar: todas se lanzan durante la ejecución.
Una no comprobada tampoco significa que sea irrelevante ni irrecuperable.

Normalmente no captures `Error`: suele indicar problemas de la máquina virtual
o del entorno que tu operación no puede reparar. Capturar `Throwable` también
atraparía esos errores, un alcance demasiado amplio para una validación.

## `throw` lanza; `throws` declara

`throw` interrumpe la ejecución lanzando un objeto. `throws` aparece en la firma
y anuncia qué excepciones pueden salir, pero no lanza nada por sí mismo.

En `ValidationExample.java`, el método rechaza una cantidad inválida:

```java
public class ValidationExample {
    static int requirePositive(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity debe ser positiva");
        }
        return quantity;
    }

    public static void main(String[] args) {
        try {
            requirePositive(0);
        } catch (IllegalArgumentException error) {
            System.out.println(error.getMessage());
        }
    }
}
```

Imprime `quantity debe ser positiva`. No necesitas declarar esa excepción con
`throws` porque deriva de `RuntimeException`. Aun así, documenta la restricción
en el contrato del método para que quien lo use pueda respetarla.

Para una operación de lectura, la firma podría ser
`static String readFirstLine(Path path) throws IOException`. Quien la invoque
debe capturar `IOException` o declararla a su vez. Declarar no es resolver:
solo mueve esa responsabilidad un nivel hacia arriba.

## Captura lo específico y conserva la causa

Los bloques `catch` se prueban en orden. Pon primero las subclases: un
`catch (Exception error)` anterior a otro para `IOException` lo hace inalcanzable
y no compila. Captura solo donde puedas aportar una respuesta útil.

Desde Java 7 puedes compartir tratamiento con un multicatch como
`catch (IOException | SecurityException error)`. Las alternativas no pueden
ser una subclase de la otra: `Exception | IOException` no compila.

Si traduces un fallo a una excepción de tu dominio, conserva el objeto original
como causa. En `CauseExample.java` tienes una excepción comprobada propia:

```java
public class CauseExample {
    static class InvalidQuantityException extends Exception {
        InvalidQuantityException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    static int parseQuantity(String text) throws InvalidQuantityException {
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException error) {
            throw new InvalidQuantityException("Cantidad ilegible", error);
        }
    }

    public static void main(String[] args) {
        try {
            parseQuantity("dos");
        } catch (InvalidQuantityException error) {
            System.out.println(error.getMessage());
            System.out.println(error.getCause().getClass().getSimpleName());
        }
    }
}
```

Salida: `Cantidad ilegible` y, en la siguiente línea, `NumberFormatException`.
El mensaje explica la operación; la causa conserva la información técnica.
Al leer una traza, localiza la excepción, la primera línea de tu código y la
cadena `Caused by`. No te quedes solo con el último mensaje impreso.

## Recursos: `try` con cierre automático

Un recurso `AutoCloseable` se puede declarar dentro del paréntesis del `try`.
Java llama a `close()` al salir, tanto si todo va bien como si se lanza una
excepción. Con varios recursos, los cierra en orden inverso al de declaración.

Este ejemplo no necesita archivos. Guárdalo en `ResourceExample.java`:

```java
public class ResourceExample {
    static class Resource implements AutoCloseable {
        @Override
        public void close() {
            System.out.println("Cierre");
            throw new IllegalStateException("Fallo al cerrar");
        }
    }

    public static void main(String[] args) {
        try (Resource resource = new Resource()) {
            throw new IllegalArgumentException("Fallo principal");
        } catch (IllegalArgumentException error) {
            System.out.println(error.getMessage());
            System.out.println(error.getSuppressed()[0].getMessage());
        }
    }
}
```

Salida, en orden: `Cierre`, `Fallo principal`, `Fallo al cerrar`.
Cuando fallan el cuerpo y el cierre, se propaga la excepción del cuerpo; la del
cierre queda suprimida, accesible con `getSuppressed()`. Si solo falla el cierre,
su excepción es la que se propaga.

Esta forma funciona en Java 8. Desde Java 9 también puedes escribir
`try (resource)` con una variable ya declarada que sea final o efectivamente
final, sin volver a declararla dentro del paréntesis.

## `finally` y las trampas habituales

`finally` sirve para una acción que deba ejecutarse al salir del `try`, también
con `return` o una excepción. No es una garantía frente a terminar el proceso,
por ejemplo con `System.exit`. Para cerrar recursos, prefiere el cierre automático.

- No devuelvas ni lances desde `finally`: puedes ocultar el resultado o fallo original.
- No dejes un `catch` vacío: convierte un fallo visible en un estado inexplicable.
- No registres y relances en todas las capas: acabarás con varias trazas del mismo fallo.
- No uses excepciones para un bucle normal ni captures `Exception` por comodidad.
- No incluyas contraseñas ni datos sensibles en mensajes o trazas.

## Qué te llevas

- `throw` lanza un fallo y `throws` declara que puede salir de un método.
- Las excepciones comprobadas obligan a capturar o declarar; las demás no.
- Un `catch` recupera el control, no reintenta la instrucción fallida.
- Conserva la causa al traducir excepciones y revisa las suprimidas al cerrar.
- Usa `try` con recursos para no escribir el cierre a mano.

Repasa las firmas y los contratos en [Métodos](/docs/fundamentos/metodos/).
