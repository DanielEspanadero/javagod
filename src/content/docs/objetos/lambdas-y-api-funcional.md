---
title: 'Lambdas y API funcional'
description: 'Comportamiento como valor: interfaces funcionales, referencias a métodos, capturas y composición sin depender de Stream.'
section: objetos
order: 9
since: 8
---

## Pasar lo que haces, no solo los datos

Una lambda te permite pasar comportamiento como argumento, guardarlo en una
variable o devolverlo desde un método. No ejecuta su cuerpo al declararla:
preparas una operación que otro código podrá invocar cuando la necesite.
No necesitas un stream para usarla: sirve para validar, transformar u ordenar.
Las lambdas y el paquete `java.util.function`, con buena parte de las interfaces
funcionales de uso habitual, llegaron en Java 8. Todo este capítulo, incluidos
los ejemplos completos, es compatible con Java 8 y funciona en Java 21.

## Una interfaz funcional le da un tipo

Java no tiene un tipo universal llamado «lambda». El contexto debe aportar una
interfaz funcional: un contrato con un único método abstracto que implementar.
Puedes declarar tu propia interfaz, como en `BehaviorExample.java`:

```java
public class BehaviorExample {
    @FunctionalInterface
    interface TextRule {
        boolean accepts(String text);
    }

    static void check(String text, TextRule rule) {
        System.out.println(rule.accepts(text));
    }

    public static void main(String[] args) {
        TextRule longEnough = text -> text.length() >= 4;
        check("Java", longEnough);
        check("JVM", longEnough);
    }
}
```

Salida: `true` y `false`, en líneas separadas. `check` recibe la regla, pero
no decide cómo validar: llama a `accepts`. La lambda aporta esa implementación.
`TextRule` fija que la entrada es `String` y la salida es `boolean`.

`@FunctionalInterface` es opcional, pero pide al compilador que compruebe el
contrato. Los métodos `default` y `static` no cuentan como abstractos. Tampoco
cuentan las declaraciones que coinciden con métodos públicos de `Object`, como
`equals(Object)`. Los métodos abstractos heredados compatibles pueden representar
un mismo contrato; no basta con contar las líneas de la interfaz.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Una regla viaja como argumento</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Contrato</span>
      <code class="diagram__value">TextRule</code>
      <span class="diagram__hint">Declara qué recibe la operación y qué devuelve.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Comportamiento</span>
      <code class="diagram__value">text -&gt; text.length() &gt;= 4</code>
      <span class="diagram__hint">Describe la regla sin ejecutarla todavía.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Invocación</span>
      <code class="diagram__value">rule.accepts(text)</code>
      <span class="diagram__hint">El código receptor decide cuándo aplicar la regla.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Pasar comportamiento no implica ejecución diferida en otro hilo: aquí la llamada es inmediata y síncrona.</figcaption>
</figure>

## Sintaxis y límites de una lambda

La forma es `parámetros -> cuerpo`. Con un parámetro de tipo inferido puedes
omitir los paréntesis: `text -> text.length()`. Sin parámetros escribes
`() -> 42`; con varios, `(left, right) -> left + right`.

Un cuerpo de expresión devuelve su resultado si el contrato lo exige. Un bloque
usa llaves y necesita `return` en sus caminos de retorno cuando devuelve un valor:
`text -> { String clean = text.trim(); return clean.length(); }`.
Puedes declarar el tipo, como en `(String text) -> text.length()`, pero no mezclar
parámetros con tipo explícito y otros sin él en la misma lista.

- Necesitas un tipo destino: `Object value = () -> 42` no compila.
- No puedes implementar una clase abstracta ni varios métodos abstractos distintos.
- Las excepciones comprobadas deben caber en el `throws` del método del contrato,
  o debes capturarlas dentro; `Function.apply` no declara excepciones comprobadas.
- `return` sale de la lambda, no del método que la contiene. Un `break` tampoco
  permite salir de un bucle exterior desde su cuerpo.
- `this` conserva el significado del contexto exterior, no representa una nueva
  instancia anónima. En un contexto estático no aparece un `this` por usar lambdas.

Dos interfaces con la misma firma siguen siendo tipos distintos. Una sobrecarga
que admite ambas puede resultar ambigua al recibir una lambda: usa una variable
con tipo explícito para aclarar el destino. No intentes resolverlo con `Object`.

## El vocabulario de `java.util.function`

Antes de inventar una interfaz, busca una que exprese el papel de la operación.
Estas interfaces y los métodos de composición que usamos existen en Java 8:

| Contrato | Método abstracto | Papel |
| --- | --- | --- |
| `Predicate<T>` | `boolean test(T value)` | Decidir si cumple una condición |
| `Function<T, R>` | `R apply(T value)` | Transformar una entrada en una salida |
| `Consumer<T>` | `void accept(T value)` | Consumir un valor mediante un efecto |
| `Supplier<T>` | `T get()` | Producir un valor sin recibir argumentos |
| `UnaryOperator<T>` | `T apply(T value)` | Transformar sin cambiar de tipo |
| `BinaryOperator<T>` | `T apply(T left, T right)` | Combinar dos valores del mismo tipo |

También tienes `BiFunction<T, U, R>` para dos entradas y una salida. Las variantes
como `IntPredicate` o `ToIntFunction<T>` trabajan con primitivos para evitar
boxing en esas posiciones. `Runnable`, en `java.lang`, también es funcional:
su `run()` no recibe argumentos ni devuelve un resultado, y es anterior a Java 8.

## Cuatro clases de referencias a métodos

Si tu lambda solo llama a un método compatible, una referencia puede decir lo
mismo con menos ruido. No llama al método al escribirla: adapta una operación a
una interfaz funcional. Prueba las cuatro formas en `ReferencesExample.java`:

```java
import java.util.function.BiPredicate;
import java.util.function.Function;
import java.util.function.Supplier;

public class ReferencesExample {
    public static void main(String[] args) {
        Function<String, Integer> parse = Integer::parseInt;
        String prefix = "pre";
        Function<String, String> attach = prefix::concat;
        BiPredicate<String, String> starts = String::startsWith;
        Supplier<StringBuilder> create = StringBuilder::new;
        System.out.println(parse.apply("21"));
        System.out.println(attach.apply("vista"));
        System.out.println(starts.test("Java", "Ja"));
        System.out.println(create.get().append("nuevo"));
    }
}
```

Salida: `21`, `prevista`, `true` y `nuevo`, cada uno en una línea.

| Forma | Ejemplo | Lambda equivalente |
| --- | --- | --- |
| Método estático | `Integer::parseInt` | `text -> Integer.parseInt(text)` |
| Instancia ya elegida | `prefix::concat` | `text -> prefix.concat(text)` |
| Instancia recibida como primer argumento | `String::startsWith` | `(text, start) -> text.startsWith(start)` |
| Constructor | `StringBuilder::new` | `() -> new StringBuilder()` |

En la tercera forma el primer argumento es el receptor, no un parámetro del
método `startsWith`. El tipo destino resuelve también las sobrecargas.
En la segunda, la expresión receptora se evalúa al crear la referencia y queda
ligada a ese objeto; si es `null`, falla entonces con `NullPointerException`.
Por eso la equivalencia de la tabla supone un receptor no nulo y estable.

## Capturar una variable no congela su objeto

Una lambda puede usar variables locales y parámetros exteriores si son `final`
o efectivamente finales: una vez asignados, no vuelves a asignarlos. No hace
falta escribir `final`. Compruébalo con `CaptureExample.java`:

```java
import java.util.ArrayList;
import java.util.List;
import java.util.function.IntPredicate;

public class CaptureExample {
    public static void main(String[] args) {
        int minimum = 4;
        List<String> events = new ArrayList<>();
        IntPredicate accepted = length -> length >= minimum;
        Runnable log = () -> events.add("revisado");
        log.run();
        System.out.println(accepted.test(4));
        System.out.println(events);
    }
}
```

Salida: `true` y `[revisado]`, en líneas separadas. Si añades `minimum++`, la
captura deja de compilar, aunque el incremento esté después de la invocación.
Reasignar `events` también impediría capturarlo, pero `events.add(...)` no:
la referencia sigue igual y el objeto cambia. Los campos de una instancia no
están sujetos a la regla de variable local efectivamente final.

> [!OJO]
> Capturar una referencia no hace inmutable el objeto ni sincroniza sus accesos.
> Un array de una casilla para saltarte la restricción del contador solo esconde
> estado mutable. Prefiere devolver resultados; compartir ese estado entre hilos
> exige un diseño de concurrencia, no una lambda más corta.

## Componer condiciones y transformaciones

Componer construye otra operación; todavía no la aplica. En
`CompositionExample.java`, cada contrato tiene su propio orden de ejecución:

```java
import java.util.function.Function;
import java.util.function.Predicate;

public class CompositionExample {
    public static void main(String[] args) {
        Predicate<String> present = text -> text != null;
        Predicate<String> empty = String::isEmpty;
        Predicate<String> usable = present.and(empty.negate());
        Function<String, String> trim = String::trim;
        Function<String, Integer> length = String::length;
        System.out.println(usable.test(null));
        System.out.println(usable.test("Java"));
        System.out.println(trim.andThen(length).apply(" Java "));
        System.out.println(length.compose(trim).apply(" Java "));
    }
}
```

Salida: `false`, `true`, `4` y `4`, uno por línea. `and` cortocircuita: si el
primer predicado devuelve `false`, no llama al segundo. Así se evita invocar
`isEmpty` sobre `null`. `negate()` invierte el resultado del predicado.

`f.andThen(g)` aplica primero `f` y después `g`; `f.compose(g)` aplica primero
`g` y después `f`. Los tipos deben encajar: la salida del primer paso alimenta
la entrada del siguiente. Ninguna composición captura las excepciones por ti.

## Componer criterios de ordenación

`Comparator` vive en `java.util` y también es funcional. `comparing` construye
un comparador desde una clave; `thenComparing` consulta el siguiente criterio
solo cuando el anterior empata. Guarda esto como `OrderingExample.java`:

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public class OrderingExample {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(Arrays.asList("Eva", "Ana", "Luis"));
        Comparator<String> byLength = Comparator.comparing(String::length);
        names.sort(byLength.thenComparing(Comparator.naturalOrder()));
        System.out.println(names);
    }
}
```

Salida: `[Ana, Eva, Luis]`. La longitud decide primero y el orden natural de
`String` deshace el empate entre Ana y Eva; no es ordenación lingüística española.
`comparing` admite claves comparables; `comparingInt(String::length)` evita el
boxing de esa clave entera. `List.sort` modifica la lista, no crea otra.

## Qué existe en ejecución

Con `javac`, una lambda suele traducirse a un método sintético y una instrucción
`invokedynamic` en el bytecode del código que la crea. La JVM enlaza ese punto
con ayuda de `LambdaMetafactory` para obtener una instancia del contrato funcional.
`javac` no genera un archivo `.class` independiente por cada punto de lambda,
como sí suele hacer para una clase anónima.

Eso no significa que no haya objetos o clases de soporte en ejecución: la JVM
puede crearlos y reutilizarlos. No dependas de la identidad con `==`, del nombre
de su clase ni de una instancia nueva por evaluación. Invocar `test` o `apply`
ejecuta el comportamiento; crear la lambda no ejecuta su cuerpo.

## Qué te llevas

- Una interfaz funcional da tipo al comportamiento que pasas como valor.
- Las referencias a métodos adaptan operaciones existentes al mismo contrato.
- Efectivamente final limita la reasignación local, no la mutación del objeto.
- Componer encadena reglas; aplicarlas es un paso distinto y explícito.

Ya puedes leer [Stream: el pipeline perezoso](/docs/colecciones/stream/):
`filter` recibe un `Predicate`, `map` una `Function` y `sorted` un `Comparator`.
