---
title: 'Anotaciones y reflexión'
description: 'Declara metadatos y descubre clases, campos, métodos y records en ejecución sin confundir flexibilidad con acceso ilimitado.'
section: objetos
order: 10
since: 8
---

## Metadatos que otro código interpreta

Una anotación añade información a una declaración o a un uso de tipo. No ejecuta
por sí sola una validación, una consulta ni una prueba. Necesitas un consumidor:
el compilador, un procesador de anotaciones o una biblioteca en ejecución.
La reflexión permite a ese consumidor inspeccionar tipos y operar sobre objetos
sin conocer todas sus clases al escribir el programa.

Ambos mecanismos existen desde antes de Java 8, mínimo de este capítulo.
Los ejemplos clásicos funcionan en Java 8 y Java 21; el de records exige Java 16.
Úsalos para integrar código que no controlas, no para sustituir llamadas normales.

## Declara una anotación y léela

Guarda este programa completo en `AnnotationExample.java`:

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

public class AnnotationExample {
    @Inherited
    @Retention(RetentionPolicy.RUNTIME)
    @Target(ElementType.TYPE)
    public @interface Label {
        String value();
        int priority() default 1;
    }

    @Label("service")
    static class Service {}

    static class Child extends Service {}

    public static void main(String[] args) {
        Label label = Service.class.getAnnotation(Label.class);
        System.out.println(label.value() + ":" + label.priority());
        System.out.println(Child.class.getAnnotation(Label.class).value());
        System.out.println(Child.class.getDeclaredAnnotation(Label.class));
    }
}
```

Salida exacta:

```text
service:1
service
null
```

`@interface` declara el tipo de anotación. Sus elementos parecen métodos sin
parámetros: `value` es obligatorio y `priority` tiene un valor predeterminado.
`@Label("service")` abrevia `@Label(value = "service")`; si cambias la prioridad,
escribe `@Label(value = "service", priority = 3)`.

Los elementos admiten primitivos, `String`, `Class`, enums, otras anotaciones y
arrays de esos tipos. No admiten `null` ni cualquier objeto arbitrario. No puedes
calcular un texto con una llamada a un método para pasarlo como valor.

| Retención | Qué conserva | Quién puede leerla |
| --- | --- | --- |
| `SOURCE` | Solo el código fuente | Compilador y procesadores de anotaciones |
| `CLASS` | El archivo `.class` | Herramientas que analizan bytecode |
| `RUNTIME` | También la información en ejecución | API de reflexión |

Sin `@Retention`, la política es `CLASS`, no `RUNTIME`. `@Target(TYPE)` limita
`Label` a declaraciones de tipos; puedes combinar destinos con un array, como
`{ElementType.FIELD, ElementType.METHOD}`. `TYPE_USE` permite anotar usos de tipos
desde Java 8. El destino no decide cuánto tiempo se conserva la anotación.

`getAnnotation` devuelve `null` si no encuentra la anotación. Compruébalo antes
de leer sus elementos cuando el contrato no te garantice su presencia.
`isAnnotationPresent` sirve si solo necesitas saber si está.

## La herencia tiene un alcance muy concreto

`@Inherited` permite encontrar una anotación de clase buscando en su superclase.
Por eso `Child` encuentra `Label`, pero `getDeclaredAnnotation` devuelve `null`:
no está escrita directamente sobre `Child`.

No transmite anotaciones de métodos sobrescritos ni de campos. Tampoco busca
en interfaces implementadas. Sin `@Inherited`, `getAnnotation` no hereda esa
anotación de clase. Un framework puede establecer otras reglas de búsqueda;
no confundas su comportamiento con el contrato de la API de Java.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Del metadato al comportamiento</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Declaración</span>
      <code class="diagram__value">@Label("service")</code>
      <span class="diagram__hint">Describe una clase, no ejecuta una acción.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Descubrimiento</span>
      <code class="diagram__value">getAnnotation</code>
      <span class="diagram__hint">Lee el metadato conservado en ejecución.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Interpretación</span>
      <code class="diagram__value">label.value()</code>
      <span class="diagram__hint">El consumidor decide qué hacer con él.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">La anotación describe; el código consumidor aporta el comportamiento.</figcaption>
</figure>

## Class, Field y Method: descubrir no es poder acceder

Obtienes un `Class<?>` con `Type.class`, `object.getClass()` o
`Class.forName("package.Type")`. Esta última forma puede inicializar la clase;
no cargues nombres arbitrarios procedentes de una entrada sin validar.

En `ReflectionExample.java`, busca miembros concretos antes de usarlos:

```java
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Arrays;

public class ReflectionExample {
    public static class Base {
        public String inherited() { return "base"; }
    }

    public static class User extends Base {
        private String name = "Ada";
        public String greet(String prefix) { return prefix + name; }
        private void reset() { name = "unknown"; }
    }

    public static void main(String[] args) throws ReflectiveOperationException {
        Class<?> type = User.class;
        Object user = type.getDeclaredConstructor().newInstance();
        Field name = type.getDeclaredField("name");
        name.setAccessible(true);
        System.out.println(name.get(user));
        name.set(user, "Luz");
        Method greet = type.getMethod("greet", String.class);
        System.out.println(greet.invoke(user, "Hola, "));
        String[] declared = Arrays.stream(type.getDeclaredMethods())
                .map(Method::getName).sorted().toArray(String[]::new);
        System.out.println(Arrays.toString(declared));
        boolean inherited = Arrays.stream(type.getMethods())
                .anyMatch(method -> method.getName().equals("inherited"));
        System.out.println(inherited);
    }
}
```

Salida exacta:

```text
Ada
Hola, Luz
[greet, reset]
true
```

`Field.get` lee y `Field.set` escribe sobre la instancia indicada. `Method.invoke`
recibe el receptor y los argumentos; para un método estático el receptor puede
ser `null`. Los primitivos se envuelven al devolverlos como `Object`.

| Búsqueda | Qué incluye | Qué no garantiza |
| --- | --- | --- |
| `getDeclaredMethods()` | Métodos declarados en esa clase, privados incluidos | Acceso permitido u orden de declaración |
| `getMethods()` | Métodos públicos, también heredados de clases e interfaces | Un orden estable entre ejecuciones |
| `getDeclaredField(name)` | Campo declarado ahí, aunque sea privado | Búsqueda en superclases |
| `getField(name)` | Campo público, también heredado | Acceso a campos privados |

La JVM no garantiza el orden de los arrays de métodos ni de campos. Aquí ordenas
los nombres declarados y solo compruebas la presencia del método heredado: no
imprimas un listado sin ordenar y lo presentes como salida fija. Pueden aparecer
métodos sintéticos o puente generados por el compilador; filtra con
`isSynthetic()` o `isBridge()` si tu herramienta no debe tratarlos como negocio.

`getMethod` busca por nombre y tipos exactos de parámetros, no realiza la
resolución de sobrecargas del compilador. Un nombre inexistente provoca
`NoSuchMethodException`; un argumento incompatible puede provocar
`IllegalArgumentException`. Si el método invocado lanza una excepción,
`invoke` la envuelve en `InvocationTargetException`: inspecciona su causa.

## Acceso privado y módulos: una frontera real

`setAccessible(true)` solicita omitir las comprobaciones de acceso de Java;
no convierte un miembro privado en parte de una API pública. El ejemplo actúa
sobre una clase propia en el classpath. Cambiar campos privados ajenos rompe
encapsulamiento y puede dejar objetos en estados inválidos. No intentes modificar
campos `final` para saltarte el contrato de inmutabilidad.

> [!OJO]
> **Desde Java 9, con módulos:** acceder profundamente a miembros privados de
> otro módulo requiere que el paquete esté abierto al módulo que los inspecciona.
> `exports` no sustituye a `opens`. Sin ese permiso, `setAccessible(true)` puede
> lanzar `InaccessibleObjectException`. `trySetAccessible()`, también desde Java 9,
> devuelve `false` cuando no puede habilitar el acceso por estas restricciones.

Si controlas un módulo, puedes declarar `opens com.example.model to framework.core;`
en `module-info.java`. Una alternativa de despliegue es
`--add-opens app.core/com.example.model=ALL-UNNAMED` para consumidores del classpath.
Son permisos concretos, no una receta para abrir todo el JDK. En entornos antiguos
con un gestor de seguridad, las comprobaciones de permisos también pueden impedir
el acceso reflectivo.

## Componentes de records: desde Java 16

`Class.isRecord()`, `getRecordComponents()` y `RecordComponent` son APIs definitivas
desde Java 16. Guarda este ejemplo en `RecordReflectionExample.java` y usa Java 21:

```java
import java.lang.reflect.RecordComponent;

public class RecordReflectionExample {
    public record Point(int x, int y) {}

    public static void main(String[] args) throws ReflectiveOperationException {
        Point point = new Point(2, 5);
        System.out.println(Point.class.isRecord());
        for (RecordComponent component : Point.class.getRecordComponents()) {
            System.out.println(component.getName() + ":"
                    + component.getType().getSimpleName() + "="
                    + component.getAccessor().invoke(point));
        }
    }
}
```

Salida: `true`, `x:int=2` y `y:int=5`, cada valor en una línea. A diferencia de
los métodos, los componentes se devuelven en el orden de la cabecera del record.
En una clase que no sea un record, `getRecordComponents()` devuelve `null`.
`ElementType.RECORD_COMPONENT` existe desde Java 16; las anotaciones de un
componente pueden propagarse al campo, al accesor y al parámetro del constructor
según sus destinos aplicables. No todas aparecen en todos esos lugares.

## Por qué lo usan los frameworks y cuándo evitarlo

Un serializador descubre propiedades; un contenedor localiza constructores e
inyecta dependencias; una herramienta de pruebas busca métodos anotados. La
reflexión permite trabajar con clases que la biblioteca no conocía al compilarse.
No es la única vía: procesadores de anotaciones pueden generar código al compilar.

No hay un multiplicador universal de coste. Buscar miembros cuesta trabajo;
`invoke` puede añadir comprobaciones, adaptación de argumentos y boxing. El JIT
y la versión del JDK influyen. Guarda descriptores ya resueltos cuando proceda,
pero no confundas evitar búsquedas con eliminar el coste de cada invocación.
Mide con un benchmark adecuado antes de optimizar una ruta caliente; considera
`MethodHandle` o código generado solo si los datos y el diseño lo justifican.

## Qué te llevas

- `RUNTIME` hace visible una anotación a reflexión; el consumidor le da significado.
- `@Inherited` afecta a anotaciones de clase, no a toda la jerarquía de miembros.
- Descubrir un miembro no garantiza poder acceder a él ni un orden de enumeración.
- Prefiere interfaces y llamadas directas cuando conoces el contrato al compilar.
- Reserva la reflexión para integración y herramientas, con permisos y errores explícitos.

Repasa [el contrato de los records](/docs/objetos/records/) y
[el encapsulamiento](/docs/objetos/encapsulamiento/) antes de abrir acceso privado.
