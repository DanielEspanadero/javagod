---
title: 'Genéricos'
description: 'Parámetros de tipo, límites y comodines para reutilizar código sin perder seguridad de tipos.'
section: objetos
order: 7
since: 8
---

## El tipo también puede ser un parámetro

Un genérico permite escribir una clase o un método que funciona con distintos
tipos sin convertirlo todo a `Object`. El compilador comprueba qué guardas y qué
recuperas. Si una caja es de `String`, meter un `Integer` es un error al compilar,
no una sorpresa cuando ya está ejecutándose el programa.

Los genéricos existen desde Java 5. Este capítulo usa Java 8 como mínimo del
modo de lectura; sus ejemplos completos también funcionan en Java 21.

## Tu primera clase genérica

Guarda este programa en `BoxExample.java`:

```java
public class BoxExample {
    static final class Box<T> {
        private final T value;

        Box(T value) {
            this.value = value;
        }

        T get() {
            return value;
        }
    }

    public static void main(String[] args) {
        Box<String> message = new Box<>("Hola");
        String text = message.get();
        Box<Integer> count = new Box<>(3);
        System.out.println(text);
        System.out.println(count.get() + 1);
    }
}
```

Salida: `Hola` y, en otra línea, `4`. No hay ningún cast al recuperar el valor.
`T` es el parámetro de tipo de la clase y `String` es un argumento de tipo.
El diamante `<>` deja que el compilador infiera el argumento del constructor.

Las letras son una convención, no palabras reservadas: `T` para un tipo,
`E` para un elemento, `K` y `V` para clave y valor. Si varias letras vuelven
ilegible una API, usa nombres descriptivos como `Source` y `Target`.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Un contrato comprobado antes de ejecutar</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Plantilla</span>
      <code class="diagram__value">Box&lt;T&gt;</code>
      <span class="diagram__hint">El constructor recibe T y get devuelve T.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Uso concreto</span>
      <code class="diagram__value">Box&lt;String&gt;</code>
      <span class="diagram__hint">El compilador comprueba el contrato usando String.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Lectura segura</span>
      <code class="diagram__value">String text = box.get()</code>
      <span class="diagram__hint">No necesitas convertir desde Object a mano.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">El parámetro de tipo conecta la entrada y la salida. No se crea una clase distinta en ejecución para cada argumento de tipo.</figcaption>
</figure>

## Un método puede declarar su propio tipo

El parámetro de un método genérico se escribe antes de su tipo de retorno.
No necesitas que la clase sea genérica, y un método `static` no puede usar el
`T` de una instancia de su clase: declara el suyo si lo necesita.

En `MethodExample.java`, el mismo método conserva el tipo de cada llamada:

```java
public class MethodExample {
    static <T> T first(T[] values) {
        if (values.length == 0) {
            throw new IllegalArgumentException("Array vacío");
        }
        return values[0];
    }

    public static void main(String[] args) {
        String word = first(new String[] {"Java", "JVM"});
        Integer number = first(new Integer[] {8, 21});
        System.out.println(word);
        System.out.println(number);
    }
}
```

Imprime `Java` y `8` en líneas separadas. El compilador infiere `T` a partir de
los argumentos y del contexto de la llamada; no tienes que escribirlo siempre.
Aquí el contrato exige un array no vacío y rechaza el caso vacío explícitamente.

## Límites: no todos los tipos valen

`<T extends Number>` restringe `T` a `Number` o una subclase. Dentro del método
puedes llamar a `doubleValue()`, porque todos los tipos admitidos lo tienen.
`extends` sirve también para límites de interfaz, no solo para clases.

Un límite múltiple puede ser `<T extends Number & Comparable<T>>`. Si hay una
clase, debe ir primero; después pueden ir interfaces. No puedes exigir que `T`
extienda dos clases distintas.

Para sumar números, sin embargo, no necesitas conservar un `T` concreto en la
salida. Un comodín expresa mejor que solo vas a leer de la lista.

## Invariancia: una lista de enteros no es una de números

Aunque `Integer` sea un `Number`, `List<Integer>` no es subtipo de
`List<Number>`. Si lo fuera, podrías introducir un `Double` en una lista de
enteros a través de la referencia más general.

| Tipo recibido | Qué puedes leer | Qué puedes añadir con seguridad |
| --- | --- | --- |
| `List<Number>` | `Number` | `Integer`, `Double` y otros `Number` |
| `List<? extends Number>` | `Number` | Ningún valor no nulo |
| `List<? super Integer>` | `Object` | `Integer` |
| `List<?>` | `Object` | Ningún valor no nulo |

`?` significa un tipo concreto pero desconocido. `List<?>` no es lo mismo que
`List<Object>`: la primera puede referirse a una lista de cadenas; la segunda
es una lista cuyo contrato permite añadir cualquier objeto.

## PECS: produce con `extends`, consume con `super`

Si tu método lee números de una lista, esa lista produce valores: usa
`? extends Number`. Si escribe enteros, la lista consume valores: usa
`? super Integer`. Es la regla PECS, vista desde el método que recibe la lista.

Prueba este programa completo como `BoundsExample.java`:

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class BoundsExample {
    static double sum(List<? extends Number> source) {
        double total = 0;
        for (Number value : source) {
            total += value.doubleValue();
        }
        return total;
    }

    static void addDefaults(List<? super Integer> destination) {
        destination.add(10);
        destination.add(20);
    }

    static <T> void copy(List<? extends T> source,
                         List<? super T> destination) {
        for (T value : source) {
            destination.add(value);
        }
    }

    public static void main(String[] args) {
        List<Integer> source = Arrays.asList(1, 2, 3);
        List<Number> destination = new ArrayList<>();
        copy(source, destination);
        addDefaults(destination);
        System.out.println(sum(source));
        System.out.println(destination);
    }
}
```

Salida:

```text
6.0
[1, 2, 3, 10, 20]
```

`copy` conecta origen y destino con el mismo `T`. Una lista produce valores
compatibles y la otra puede aceptarlos. Si necesitas leer y escribir exactamente
el mismo tipo, un `List<T>` puede ser más adecuado que un comodín.

> [!OJO]
> `extends` no convierte la lista en inmutable. Puedes quitar elementos o llamar
> a `clear()` si la implementación lo permite. Solo restringe qué puedes añadir
> a través de esa referencia. Incluso `null` es aceptable para el compilador,
> aunque la implementación de la lista puede rechazarlo.

## Borrado de tipos: qué queda en ejecución

Java implementa los genéricos mediante borrado de tipos. En términos generales,
`T` se borra a su primer límite, o a `Object` si no tiene límite, y el compilador
introduce las conversiones necesarias. No hay una clase de ejecución separada
para `ArrayList<String>` y otra para `ArrayList<Integer>`.

Eso explica varias restricciones que no se resuelven añadiendo casts:

- No puedes escribir `new T()` ni `T.class`: no hay una clase concreta que usar.
- No puedes crear `new T[10]` ni `new List<String>[10]`.
- No puedes comprobar `value instanceof List<String>`; usa `List<?>` para comprobar la forma.
- No puedes sobrecargar con `print(List<String>)` y `print(List<Integer>)`: se borran igual.
- Los argumentos de tipo deben ser referencias: `List<int>` no vale; usa `List<Integer>`.

Los arrays conservan su tipo de elemento en ejecución y los genéricos no
conservan sus argumentos de esa forma. Mezclarlos exige cuidado; una lista de
listas suele evitar la necesidad de crear un array de tipos parametrizados.

## Tipos crudos: salir de la protección

`List` sin argumento de tipo es un tipo crudo, pensado para interoperar con
código antiguo. No equivale a `List<?>`: permite operaciones sin la comprobación
genérica y puede provocar contaminación del montón.

Por ejemplo, si usas una referencia cruda para introducir un entero en una
`List<String>`, leerlo después como `String` puede lanzar `ClassCastException`.
El fallo aparece lejos de donde entró el dato incorrecto.

Compila con `javac -Xlint:unchecked` para localizar esas operaciones. No tapes
el aviso con `@SuppressWarnings` sin entender y acotar la conversión.
Los genéricos tampoco prometen que los valores no sean `null`: ese es otro contrato.

## Qué te llevas

- Un parámetro de tipo conserva relaciones entre entradas y salidas.
- Los genéricos son invariantes: una lista de subtipos no es una lista del tipo base.
- Usa `extends` si recibes un productor y `super` si recibes un consumidor.
- El borrado explica por qué no puedes instanciar `T` ni preguntar por `List<String>`.
- Evita tipos crudos: saltarse la comprobación traslada el fallo a la ejecución.

Puedes aplicar estas reglas a [las listas](/docs/colecciones/listas/) y a
[los contratos de interfaz](/docs/objetos/interfaces-y-abstraccion/).
