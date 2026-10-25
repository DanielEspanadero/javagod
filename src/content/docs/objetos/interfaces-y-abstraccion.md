---
title: 'Interfaces y abstracción'
description: 'Un contrato de métodos, las clases que lo cumplen y cuándo conviene una clase abstracta.'
section: objetos
order: 4
since: 8
---

## El contrato antes que la receta

Una interfaz declara qué métodos existen y qué promete cada uno, sin decir cómo se resuelven.

```java
public interface RepositorioCuentas {
    long VERSION = 1;                        // public static final
    void guardar(Cuenta cuenta);             // public abstract
    Optional<Cuenta> buscar(String titular); // public abstract
}
```

La firma no lo es todo: `guardar` promete que la cuenta se podrá recuperar, y `buscar` promete un
`Optional` vacío, nunca un `null`. El compilador comprueba nombres y tipos, no promesas.

De entrada, una interfaz no guarda estado ni trae el código que resuelve los métodos; desde Java 8
puede llevar `default` y `static`, que llegan más abajo. Lo que no tiene en ninguna versión es
estado de instancia.

## Lo que el compilador ya escribió

Los comentarios del bloque anterior no son adorno: un método sin cuerpo es `public abstract` y un
campo es `public static final`, lo digas o no. Ese campo no es estado del objeto, es una constante
compartida, y sin inicializador no compila.

Una clase cumple el contrato con `implements` y debe escribir todos los métodos abstractos, o
declararse abstracta. Puede implementar tantas interfaces como quiera; con las clases, `extends`
solo admite una: la interfaz vale para capacidades sueltas y la clase para una base compartida.

```java
public final class RepositorioEnMemoria implements RepositorioCuentas {
    private final Map<String, Cuenta> cuentas = new HashMap<>();

    @Override
    public void guardar(Cuenta cuenta) { cuentas.put(cuenta.titular(), cuenta); }

    @Override
    public Optional<Cuenta> buscar(String titular) { return Optional.ofNullable(cuentas.get(titular)); }
}
```

Una interfaz también puede extender varias interfaces. Lo que no puede es aportar estado para
compartirlo.

> [!NOTA]
> `@Override` es opcional, pero no es decoración: si escribes mal la firma, el compilador te lo
> dice en vez de crear un método nuevo que nadie llama.

## Abstracción: el cliente depende del contrato

El cliente no declara un campo del tipo de la clase concreta, sino del tipo de la interfaz:

```java
public final class ServicioCuentas {
    private final RepositorioCuentas repositorio; // el contrato, no la implementación
    public ServicioCuentas(RepositorioCuentas repositorio) { this.repositorio = repositorio; }

    public boolean existe(String titular) { return repositorio.buscar(titular).isPresent(); }
}
```

`ServicioCuentas` compila contra dos firmas, no contra un `HashMap` ni una conexión. Quien lo usa
decide qué implementación le pasa:

```java
ServicioCuentas pruebas = new ServicioCuentas(new RepositorioEnMemoria());
ServicioCuentas produccion = new ServicioCuentas(new RepositorioEnBaseDeDatos());
```

`RepositorioEnBaseDeDatos` es otra clase, con los mismos métodos y JDBC dentro: un archivo nuevo,
no una edición al servicio. En una prueba se pasa una implementación falsa, sin red.

<figure class="diagram diagram--framed">
  <p class="diagram__label">El cliente depende del contrato</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">Cliente</span>
      <code class="diagram__value">ServicioCuentas</code>
      <span class="diagram__hint">Guarda una referencia al contrato y llama a sus dos métodos.</span></li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">Contrato</span>
      <code class="diagram__value">RepositorioCuentas</code>
      <span class="diagram__hint">Dos firmas y ninguna línea de estado. Es todo lo que el cliente conoce.</span></li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">Implementaciones</span>
      <code class="diagram__value">EnMemoria / EnBaseDeDatos</code>
      <span class="diagram__hint">Clases distintas, el mismo contrato. Cambiar de una a otra no toca al cliente.</span></li>
  </ol>
  <figcaption class="diagram__caption">El cliente compila contra la interfaz. La implementación se elige al construir y se puede sustituir sin tocar el código que la usa.</figcaption>
</figure>

Abstraer es elegir el tipo más pequeño que basta: si el cliente solo llama a `buscar`, no necesita
saber si hay caché, índice o conexión.

## Una clase abstracta: media implementación con estado

Una interfaz no puede guardar la caché que compartirían sus implementaciones, porque no tiene
estado. Cuando varias clases comparten estado y parte del algoritmo, la herramienta es una clase
abstracta: no se puede instanciar y mezcla métodos abstractos con métodos con cuerpo.

```java
public abstract class RepositorioConCache implements RepositorioCuentas {
    private final Map<String, Cuenta> cache = new HashMap<>();
    @Override
    public final Optional<Cuenta> buscar(String titular) {
        Cuenta enCache = cache.get(titular);
        if (enCache != null) {
            return Optional.of(enCache);
        }
        Optional<Cuenta> encontrada = leerDeOrigen(titular);
        encontrada.ifPresent(cuenta -> cache.put(cuenta.titular(), cuenta));
        return encontrada;
    }
    protected abstract Optional<Cuenta> leerDeOrigen(String titular);
}
```

La caché, el orden de las comprobaciones y el `final` viven una sola vez; una subclase solo aporta
el origen. La clase abstracta puede tener constructor, pero no se instancia con `new`.

No siempre es la herramienta: si solo tiene una subclase, sospecha, y consume el único `extends`.

## Clase abstracta o interfaz

| Pregunta | Clase abstracta | Interfaz |
| --- | --- | --- |
| ¿Tiene estado de instancia? | Sí, campos normales | No, solo constantes |
| ¿Trae implementación? | Métodos con cuerpo | `default` y `static` desde Java 8 |
| ¿Cuántas admite una clase? | Una, con `extends` | Todas, con `implements` |
| ¿Tiene constructor? | Sí | No |
| ¿Visibilidad de sus métodos? | Las cuatro | `public`, o `private` desde Java 9 |
| ¿Para qué sirve? | Compartir estado y algoritmo | Declarar una capacidad |

El criterio: si hay estado compartido y una implementación parcial que quieres escribir una vez,
va en la clase abstracta; si es una capacidad de clases sin parentesco, va en la interfaz. Un
repositorio con caché común es lo primero; "se puede guardar", lo segundo.

## `default`: añadir sin romper (Java 8)

Una interfaz publicada es un contrato con clientes compilados: añadirle un método abstracto rompe
todas las implementaciones. `default` trae implementación y las existentes lo heredan sin escribir.

```java
// añadido a la interfaz publicada, sin romper a nadie
default boolean existe(String titular) {
    return buscar(titular).isPresent();
}
```

Un `default` puede llamar a los otros métodos de la interfaz, pero no leer campos de instancia,
porque no los hay. Una clase puede sobrescribirlo cuando la versión genérica no sirve.

Con dos interfaces que declaran el mismo `default`, el compilador aplica este orden:

1. Gana la clase: si ella o una superclase traen ese método con cuerpo, ese se queda.
2. Gana la interfaz más específica: si una extiende a la otra, su `default` manda.
3. Si ninguna es más específica, no compila; la clase debe sobrescribir y elegir.

Para elegir se llama a la implementación concreta con `Interfaz.super.metodo()`, también desde
Java 8:

```java
interface Saludable { default String saludo() { return "Hola"; } }
interface Formal { default String saludo() { return "Buenos días"; } }

class Carta implements Saludable, Formal {
    @Override
    public String saludo() { return Formal.super.saludo() + ". " + Saludable.super.saludo(); }
}
```

Solo vale con una interfaz que la clase declare directamente, y la sobrescritura tiene que ser
`public`: no se puede reducir la visibilidad de un método heredado.

## `static`, `private` y la interfaz funcional

Desde Java 8, una interfaz admite métodos `static` con cuerpo. No se heredan y se llaman por el
nombre de la interfaz; sirven para fábricas y ayudas que pertenecen al contrato.

```java
static RepositorioCuentas enMemoria() { return new RepositorioEnMemoria(); }
```

Se usa `RepositorioCuentas.enMemoria()`, no `RepositorioEnMemoria.enMemoria()`.

Desde Java 9 hay además métodos `private` con cuerpo. No forman parte del contrato y existen para
que dos `default` no repitan el mismo código:

```java
default Optional<Cuenta> buscarPorTitular(String titular) { return buscar(normalizar(titular)); }

private static String normalizar(String titular) { // desde Java 9
    return titular == null ? "" : titular.trim();
}
```

La otra pieza de Java 8 es `@FunctionalInterface`: una interfaz con exactamente un método abstracto.
Los `default` y los `static` no cuentan, y los métodos públicos de `Object` tampoco: una interfaz
que redeclara `equals` o `hashCode` no deja de ser funcional. La anotación hace que el compilador
lo compruebe.

```java
@FunctionalInterface
interface Validador { boolean valida(String texto); }

Validador noVacio = texto -> !texto.isEmpty();
```

Esa lambda implementa `Validador` sin declarar una clase: el único método abstracto va a la derecha
de la flecha. La sintaxis de las lambdas no es el tema de este capítulo; aquí basta con el tipo.

## El aviso honesto

Una interfaz con diez métodos no es un contrato: es una carga. Cada implementación nueva escribe
los diez aunque solo use dos, y el cliente que necesita uno depende de todos. Divide por capacidad.

`default` es compatibilidad, no un sitio donde esconder una jerarquía: si se encadenan y parecen
una plantilla, tienes una clase abstracta disfrazada y sin estado.

## Qué te llevas

- Una interfaz declara métodos y sus promesas; no guarda estado de instancia.
- Los métodos sin cuerpo son implícitamente `public abstract` y los campos `public static final`.
- Una clase implementa todas las interfaces que quiera; solo puede extender una clase.
- El cliente compila contra la interfaz: una implementación nueva es una clase nueva, no una
  edición al llamador.
- La clase abstracta aporta estado y media implementación, y no se puede instanciar. El criterio:
  estado y algoritmo compartidos a la clase; una capacidad suelta, a la interfaz.
- `default` (Java 8) añade métodos sin romper implementaciones; gana la clase, después la
  interfaz más específica, y si no hay ganador hay que sobrescribir con
  `Interfaz.super.metodo()`.
- `static` (Java 8) y `private` (Java 9) viven en la interfaz y no forman parte del contrato.
- `@FunctionalInterface` y las lambdas (Java 8) van juntos: un método abstracto, una implementación.
