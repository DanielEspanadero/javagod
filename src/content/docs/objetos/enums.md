---
title: 'Enums'
description: 'Conjuntos cerrados de valores con identidad, datos y comportamiento, sin cadenas mágicas.'
section: objetos
order: 8
since: 8
---

## Cuando solo existen unas pocas opciones

Un `enum` define un conjunto cerrado de constantes con nombre. Si un pedido solo
puede estar pendiente, enviado o entregado, puedes expresarlo en su tipo en lugar
de confiar en que todo el mundo escriba bien una cadena.

Los enums existen desde Java 5. La versión mínima del modo de lectura es Java 8;
los ejemplos de este capítulo funcionan en ella salvo el `switch` moderno,
que se señala expresamente.

## Declarar y usar un conjunto cerrado

Guarda este programa en `StatusExample.java`:

```java
public class StatusExample {
    enum Status {
        PENDING, SHIPPED, DELIVERED
    }

    public static void main(String[] args) {
        Status current = Status.PENDING;
        System.out.println(current == Status.PENDING);
        System.out.println(current.name());
        for (Status status : Status.values()) {
            System.out.println(status);
        }
    }
}
```

Salida:

```text
true
PENDING
PENDING
SHIPPED
DELIVERED
```

Cada constante es una instancia única de ese enum. No la creas con `new`.
`values()` devuelve un array con todas las constantes en orden de declaración;
puedes recorrerlo sin mantener una segunda lista a mano.

`Status` es un tipo distinto de cualquier otro enum, aunque compartan nombres.
No puedes asignarle una cadena ni una constante de otro tipo. Sí puedes
asignarle `null`: el tipo no elimina por sí solo la ausencia de valor.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Tres valores, un único tipo</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Pendiente</span>
      <code class="diagram__value">Status.PENDING</code>
      <span class="diagram__hint">El pedido está registrado y aún no se ha enviado.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Enviado</span>
      <code class="diagram__value">Status.SHIPPED</code>
      <span class="diagram__hint">El transporte ya tiene el pedido.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Entregado</span>
      <code class="diagram__value">Status.DELIVERED</code>
      <span class="diagram__hint">El destinatario lo ha recibido.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">El recorrido muestra una posible secuencia de negocio. Declarar el enum no impone las transiciones: debes validarlas en el código que cambia el estado.</figcaption>
</figure>

## Identidad y comparación

Para comparar constantes del mismo enum, usa `==`. Compara su identidad y no
lanza una excepción si una referencia es `null`. En cambio, llamar a
`current.equals(...)` falla si `current` es `null`.

Todos los enums heredan de `java.lang.Enum`. No pueden extender otra clase ni
puedes extenderlos tú para añadir constantes. Sí pueden implementar interfaces,
y cada constante puede aportar su propia implementación de un método.

Un enum encaja cuando el conjunto se conoce al compilar. Si las opciones las
crea una persona desde una base de datos, necesitas otro modelo: no puedes
convertir cada fila nueva en una constante sin recompilar.

## Constantes con datos y comportamiento

Un enum no es solo una lista de etiquetas. Puede tener campos, constructor y
métodos. El constructor no puede ser `public` ni `protected`: solo se invoca al
crear sus constantes. Mantén los campos de cada constante inmutables.

En `PriorityExample.java`, cada prioridad tiene un código público estable:

```java
public class PriorityExample {
    enum Priority {
        LOW("L", 72), NORMAL("N", 24), HIGH("H", 4);

        private final String code;
        private final int responseHours;

        Priority(String code, int responseHours) {
            this.code = code;
            this.responseHours = responseHours;
        }

        String code() {
            return code;
        }

        int responseHours() {
            return responseHours;
        }

        static Priority fromCode(String code) {
            for (Priority priority : values()) {
                if (priority.code.equals(code)) {
                    return priority;
                }
            }
            throw new IllegalArgumentException("Código de prioridad desconocido");
        }
    }

    public static void main(String[] args) {
        Priority priority = Priority.fromCode("H");
        System.out.println(priority.name());
        System.out.println(priority.code());
        System.out.println(priority.responseHours());
    }
}
```

Salida: `HIGH`, `H` y `4`, en líneas separadas. El punto y coma después de las
constantes separa la lista de los campos y métodos.

El código `H` pertenece al contrato externo; el nombre `HIGH` pertenece al
código Java. Si decides renombrar la constante, puedes mantener ese código.
En este ejemplo, `null` y cualquier código desconocido se rechazan con la misma
excepción. Decide y documenta esa política antes de aceptar datos externos.

## `name`, `valueOf`, `toString` y la trampa de `ordinal`

| Método | Para qué sirve | Precaución |
| --- | --- | --- |
| `name()` | Nombre exacto declarado | Renombrar la constante cambia el texto |
| `valueOf(String)` | Buscar por ese nombre exacto | Distingue mayúsculas y minúsculas |
| `toString()` | Representación textual | Por defecto usa el nombre, pero puedes sobrescribirlo |
| `ordinal()` | Posición desde cero | Cambia si reordenas o insertas constantes |

`Priority.valueOf("HIGH")` encuentra la constante; `Priority.valueOf("H")`
lanza `IllegalArgumentException`. No busca en tu campo `code`.
Si pasas `null` a `valueOf`, lanza `NullPointerException`.

> [!OJO]
> No guardes `ordinal()` como identificador en una base de datos ni lo envíes en
> un protocolo. Insertar una constante al principio cambiaría el significado de
> los números existentes. Usa un código explícito y estable como en el ejemplo.

Sobrescribir `toString()` puede servir para mostrar texto, pero no cambia lo
que acepta `valueOf`. Para textos traducidos, separa las etiquetas de la
identidad: una frase visible no debería ser el identificador de tu dato.

## Elegir con `switch`: antes y desde Java 14

En Java 8 puedes usar un `switch` con `case PENDING:` y `break` o `return`.
Un `switch` clásico no exige cubrir todas las constantes. Si olvidas `break`,
puede continuar en el siguiente caso cuando no hayas salido con `return`.

Desde Java 14 puedes usar una expresión `switch`. Este programa funciona en
Java 17, 21 y 25; guárdalo en `SwitchExample.java`:

```java
public class SwitchExample {
    enum Status { PENDING, SHIPPED, DELIVERED }

    static String label(Status status) {
        return switch (status) {
            case PENDING -> "Pendiente";
            case SHIPPED -> "Enviado";
            case DELIVERED -> "Entregado";
        };
    }

    public static void main(String[] args) {
        System.out.println(label(Status.SHIPPED));
    }
}
```

Imprime `Enviado`. Las flechas no continúan en el caso siguiente. Como cubres
todas las constantes, no hace falta `default`: al recompilar tras añadir otra,
el compilador te obliga a revisar esta expresión.

En Java 8 el cuerpo equivalente de `label` es:

```java
switch (status) {
    case PENDING: return "Pendiente";
    case SHIPPED: return "Enviado";
    case DELIVERED: return "Entregado";
    default: throw new AssertionError("Estado no previsto: " + status);
}
```

En ambos ejemplos, un estado `null` lanza `NullPointerException`, no entra en
`default`. Desde Java 21 puedes tratarlo con `case null` explícito, aunque
rechazarlo antes puede expresar mejor el contrato de tu método.

## Colecciones especializadas: `EnumSet` y `EnumMap`

Para un conjunto de constantes, `EnumSet` evita usar cadenas o números como
banderas. `EnumMap` asocia valores a claves de un único tipo enum.
Este ejemplo es compatible con Java 8; guárdalo en `EnumCollectionsExample.java`:

```java
import java.util.EnumMap;
import java.util.EnumSet;

public class EnumCollectionsExample {
    enum Permission { READ, WRITE, DELETE }

    public static void main(String[] args) {
        EnumSet<Permission> permissions = EnumSet.of(Permission.READ, Permission.WRITE);
        EnumMap<Permission, String> labels = new EnumMap<>(Permission.class);
        labels.put(Permission.READ, "Leer");
        System.out.println(permissions.contains(Permission.DELETE));
        System.out.println(labels.get(Permission.READ));
    }
}
```

Imprime `false` y `Leer` en líneas separadas. Ambas colecciones recorren las
claves o elementos siguiendo el orden de declaración. `EnumSet` no admite
`null`; `EnumMap` no lo admite como clave, aunque sí como valor.

## Qué te llevas

- Un enum limita los valores posibles y permite compararlos con `==`.
- Los campos y métodos expresan datos y reglas comunes a sus constantes.
- Usa códigos estables para persistir y no posiciones de `ordinal()`.
- Una expresión `switch` exhaustiva ayuda a detectar constantes nuevas al recompilar.
- `EnumSet` y `EnumMap` modelan conjuntos y mapas con claves de tipo enum.

Si necesitas opciones abiertas, repasa [clases y objetos](/docs/objetos/clases-y-objetos/).
