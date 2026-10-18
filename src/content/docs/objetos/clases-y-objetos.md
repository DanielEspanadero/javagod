---
title: 'Clases y objetos'
description: 'La plantilla, la instancia y la referencia: qué hace new, dónde vive el objeto y por qué dos nombres pueden mirar al mismo.'
section: objetos
order: 1
since: 8
---

## De valores sueltos a un objeto

El capítulo de variables acabó con las cajas: un `Integer` que puede ser `null` porque una caja ya
no es un número, es una referencia a un objeto. Aquí se ve qué hay al otro lado, con la memoria a la
vista.

Una clase agrupa los datos con las operaciones que los mantienen coherentes, y cada objeto es una
copia con su propio estado: el saldo y el titular dejan de vivir sueltos.

```java
public class Cuenta {
    String titular;
    long saldoEnCentimos;

    Cuenta(String titular) {
        this.titular = titular;
    }

    void ingresar(long centimos) { saldoEnCentimos += centimos; }
}
```

La clase es la plantilla: no guarda ningún saldo, solo declara qué campos y qué métodos tendrá cada
cuenta. El objeto es la instancia, la que sí tiene titular y saldo. El saldo no aparece en el
constructor porque un campo nace con su valor por defecto, y el `long` por defecto es `0`.

```java
Cuenta primera = new Cuenta("Nuria");
Cuenta segunda = new Cuenta("Iker");
primera.ingresar(2500);
System.out.println(primera.saldoEnCentimos); // 2500
System.out.println(segunda.saldoEnCentimos); // 0
```

Dos objetos, dos estados. Nada de lo que le pasa a uno se contagia al otro.

Los campos de esta primera versión no llevan modificador, así que cualquiera puede tocarlos
desde fuera. En los ejemplos siguientes aparecen ya `private`: el capítulo de encapsulamiento
explica por qué y qué se gana con ello.

## `new`: reservar, rellenar, construir

La expresión `new Cuenta("Nuria")` hace tres cosas y devuelve una cuarta:

1. Reserva en el montón (`heap`) memoria para un objeto nuevo de esa clase.
2. Deja todos los campos con su valor por defecto: `0`, `false` o `null`.
3. Ejecuta el constructor con los argumentos que le has pasado.
4. Devuelve una referencia al objeto, y ese es el resultado de la expresión.

La variable no guarda el objeto: guarda la referencia. Dos variables pueden guardar la misma, y
`null` es la que no apunta a ninguno.

> [!NOTA]
> Un constructor no tiene tipo de retorno, ni siquiera `void`. Si le pones uno, deja de ser un
> constructor y pasa a ser un método más, y `new` deja de llamarlo.

## La variable guarda la referencia

```java
Cuenta a = new Cuenta("Nuria");
Cuenta b = a;              // no copia la cuenta: copia la referencia
a.ingresar(2500);
System.out.println(b.saldoEnCentimos); // 2500, es la misma cuenta

Cuenta c = new Cuenta("Nuria");
System.out.println(a == b); // true, mismo objeto
System.out.println(a == c); // false, mismo titular, otra cuenta
```

`==` pregunta si las dos referencias apuntan al mismo objeto; para el contenido está `equals`.

`null` es la referencia que no apunta a nada. Cualquier acceso a través de ella falla en ejecución.

```java
Cuenta cuenta = null;
cuenta.ingresar(100); // NullPointerException
```

El compilador no lo impide: `null` es legal en cualquier tipo referencia.

> [!OJO]
> `NullPointerException` no dice "la cuenta no existe": dice que se usó una referencia que valía
> `null`. Desde Java 14 el mensaje suele nombrar el acceso exacto; antes solo daba la línea.

## Pasar la referencia no mueve el objeto

Un método recibe una copia de la referencia. Con esa copia llega al mismo objeto, así que lo que
mutas se ve fuera; reasignar el parámetro solo cambia la copia local.

```java
static void ingresarMil(Cuenta cuenta) { cuenta.ingresar(1000); }
static void sustituir(Cuenta cuenta) { cuenta = new Cuenta("Otra"); }

Cuenta cuenta = new Cuenta("Nuria");
ingresarMil(cuenta);
System.out.println(cuenta.saldoEnCentimos); // 1000, la mutación viaja
sustituir(cuenta);
System.out.println(cuenta.titular); // Nuria, la reasignación no
```

<figure class="diagram diagram--framed">
  <p class="diagram__label">Dos referencias, un objeto</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Pila</span>
      <code class="diagram__value">cuenta</code>
      <span class="diagram__hint">La variable del llamador guarda una referencia.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Parámetro</span>
      <code class="diagram__value">cuenta</code>
      <span class="diagram__hint">Otra copia de la misma referencia, en el marco del método.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Montón</span>
      <code class="diagram__value">Cuenta("Nuria")</code>
      <span class="diagram__hint">Un único objeto, con su saldo dentro. Los dos llegan aquí.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Las dos variables guardan el mismo valor, una referencia al mismo objeto, y el objeto es uno solo. Por eso <code>ingresar</code> se ve fuera y <code>cuenta = new Cuenta(...)</code> no.</figcaption>
</figure>

## Campos con valor por defecto, locales no

Un campo no necesita inicializador: cuando el objeto nace ya tiene `0`, `false` o `null` según su
tipo. Una local no: el compilador comprueba que esté asignada en todos los caminos antes de leerla.

```java
class Ejemplo {
    int numero;      // 0
    boolean activo;  // false
    String texto;    // null

    void roto() {
        int total;
        total = total + 1; // no compila: no está inicializada
    }
}
```

El análisis es estático: el compilador mira el código, no lo ejecuta, y un `if` sin `else` que
asigna solo dentro deja el otro camino sin asignar. Inicializa las locales donde las declaras y
reserva el valor por defecto para los campos: uno de referencia que nadie asigna es un
`NullPointerException` esperando su turno.

## `this` y la cadena de constructores

Dentro de un método de instancia, `this` es el objeto sobre el que se llamó. Desambigua cuando el
parámetro se llama igual que el campo, como en `this.titular = titular`.

En un constructor, `this(...)` llama a otro constructor de la misma clase. Tiene que ser la primera
instrucción, y así no se repite la inicialización.

```java
public class Cuenta {
    private final String titular;
    private long saldoEnCentimos;

    public Cuenta(String titular) {
        this(titular, 0);           // delega en el de abajo
    }

    public Cuenta(String titular, long saldoInicial) {
        this.titular = titular;
        this.saldoEnCentimos = saldoInicial;
    }
}
```

Dos restricciones: `this(a); this(b);` no compila, y `this(...)` no puede ir dentro de un `if`, así
que la inicialización condicional va en el constructor de destino.

## `static`: de la clase, no del objeto

Un miembro `static` existe una sola vez, en la clase, y se comparte entre todas las instancias. Un
contexto estático no tiene `this` porque no hay un objeto concreto al que referirse.

```java
public class Cuenta {
    private static long totalCreadas;
    private static final long LIMITE_DIARIO;
    private final String titular;

    static {
        LIMITE_DIARIO = 1_000_000; // una vez, al inicializar la clase
    }

    Cuenta(String titular) {
        this.titular = titular;
        totalCreadas++;
    }

    static long cuentasCreadas() { return totalCreadas; }
}
```

El bloque `static { ... }` corre una sola vez, cuando la clase se usa por primera vez, y antes de
que nadie lea sus miembros. Si falla, el fallo sale en ese primer uso, envuelto en
`ExceptionInInitializerError` (o tal cual, si era un `Error`), y la clase queda marcada como
errónea: los usos siguientes fallan con `NoClassDefFoundError`.

Un método `static` no puede leer un campo de instancia: recibe el objeto como parámetro.

> [!AVISO]
> Un contador estático lo tocan todos los objetos, y todos los hilos en cuanto la aplicación es
> concurrente. `totalCreadas++` no es atómico: eso se resuelve en Concurrencia.

## Objetos que nadie apunta

Un objeto vive mientras haya una referencia alcanzable que llegue a él. Cuando se va la última,
queda candidato a recogerse: no se libera en ese instante y la JVM no promete cuándo lo hará.

`cuenta = null` deja la cuenta inalcanzable si no hay otra referencia. Y `System.gc()` no recoge
nada: le pide a la JVM una recolección. La especificación no la obliga y algunas configuraciones la
ignoran, así que un programa que depende de ella está mal diseñado.

> [!OJO]
> `finalize` está obsoleto desde Java 9 y no es un lugar donde cerrar ficheros ni conexiones. Para
> recursos hay `close()` y `try` con recursos; no existe un "cuando muera el objeto" fiable.

## Qué te llevas

- La clase es la plantilla; el objeto es la instancia, con su propio estado.
- `new` reserva memoria, inicializa los campos, ejecuta el constructor y devuelve una referencia.
- La variable guarda la referencia; `==` compara referencias y `null` no apunta a nada.
- Usar una referencia `null` lanza `NullPointerException` en ejecución, no en compilación.
- Al pasar un objeto se copia la referencia: la mutación se ve fuera y la reasignación no.
- Los campos llegan con valor por defecto; las locales deben estar asignadas antes de leerse.
- `this` es el objeto actual y `this(...)` encadena constructores en la primera línea.
- `static` pertenece a la clase, no usa `this` y su inicializador corre una vez.
- El recolector decide cuándo recoge lo inalcanzable; `System.gc()` solo sugiere.
