---
title: 'Memoria compartida y sincronización'
description: 'Por qué dos hilos pierden actualizaciones, qué garantiza el monitor de synchronized y por qué volatile no basta.'
section: concurrencia
order: 2
since: 8
---

## Dos hilos, una variable

El capítulo anterior dejó el ciclo de vida y dos primitivas: `start` para arrancar un hilo y `join` para esperar a que termine. Mientras cada hilo toca sus propias variables no hay nada que discutir. El problema empieza cuando dos hilos comparten un campo y los dos lo modifican.

`contador++` parece una sola operación, pero son tres: leer el valor, sumarle uno y escribirlo. Si dos hilos leen el mismo valor antes de que ninguno escriba, los dos suman sobre el mismo número y la segunda escritura borra el trabajo de la primera.

```java
public class Carrera {
    static int contador = 0;

    static void sumar() {
        for (int i = 0; i < 100_000; i++) {
            contador++;   // leer, sumar y escribir: tres pasos, no uno
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread a = new Thread(Carrera::sumar);
        Thread b = new Thread(Carrera::sumar);
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println(contador + " de 200000");   // puede ser menos
    }
}
```

El resultado puede quedarse corto: en 32 ejecuciones de prueba salió entre 104725 y 147112, siempre por debajo del total y sin que se repita ningún valor. No hay un número que aprender: el planificador decide qué hilo corre en cada momento, así que la cifra cambia entre ejecuciones y entre máquinas.

<figure class="diagram diagram--framed">
  <p class="diagram__label">La actualización perdida</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span><span class="diagram__title">Los dos leen</span>
      <code class="diagram__value">5</code>
      <span class="diagram__hint">Cada hilo copia el mismo 5 antes de que nadie escriba.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span><span class="diagram__title">Los dos suman</span>
      <code class="diagram__value">5 + 1</code>
      <span class="diagram__hint">Cada uno calcula 6 por su cuenta, con el mismo punto de partida.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span><span class="diagram__title">Los dos escriben</span>
      <code class="diagram__value">6</code>
      <span class="diagram__hint">La segunda escritura tapa la primera: una suma se perdió.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Dos incrementos y un solo resultado: el valor final es 6 y no 7 porque los dos hilos leyeron el mismo 5.</figcaption>
</figure>

## Lo que un hilo ve del otro

El entrelazado no es el único problema. La JVM puede tener el valor en un registro o en la caché de un núcleo y no volver a leerlo, así que un hilo puede trabajar un buen rato con una copia vieja. El modelo de memoria de Java no prohíbe esa copia: sin una regla que obligue a sincronizar, no hay garantía de que un hilo vea lo que escribió otro.

Esa regla es la relación happens-before (ocurre antes que). Si una acción A ocurre antes que una acción B, todo lo que hizo A es visible para B, y en ese orden. No significa que A termine primero en el reloj: significa que B no puede ver el estado a medias que dejó A. Las fuentes de esa relación son cuatro:

- El orden del programa: cada sentencia de un hilo ocurre antes que la siguiente del mismo hilo.
- El monitor: liberar un monitor ocurre antes que el siguiente bloqueo de ese mismo monitor.
- `volatile`: escribir un campo `volatile` ocurre antes que la siguiente lectura de ese mismo campo.
- Los extremos de un hilo: `start` ocurre antes que cualquier acción del hilo nuevo, y todas las acciones de un hilo ocurren antes de que `join` regrese.

Fuera de ahí no hay promesa. Dos hilos que solo leen y escriben un campo normal pueden ver valores distintos del mismo campo, y el compilador puede reordenar lo que no cambie el resultado de un solo hilo.

## `synchronized`: un monitor por objeto

Cada objeto de Java lleva un monitor, que aquí llamamos cerrojo. `synchronized` lo toma antes de entrar y lo suelta al salir. Mientras un hilo lo tiene, ningún otro puede entrar en un bloque protegido por ese mismo objeto: eso es la exclusión mutua. Y al soltarlo deja un rastro visible: todo lo que ese hilo hizo antes de soltarlo es visible para el siguiente que lo tome, porque la liberación ocurre antes del siguiente bloqueo. Con las dos cosas, el contador deja de perder sumas.

```java
public class Seguro {
    private int valor = 0;

    synchronized void incrementar() {   // el monitor es este objeto: this
        valor++;
    }

    public static void main(String[] args) throws InterruptedException {
        Seguro contador = new Seguro();
        Thread a = new Thread(() -> {
            for (int i = 0; i < 100_000; i++) {
                contador.incrementar();
            }
        });
        Thread b = new Thread(() -> {
            for (int i = 0; i < 100_000; i++) {
                contador.incrementar();
            }
        });
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println(contador.valor);   // 200000, siempre
    }
}
```

`join` sigue siendo necesario: sin él, `main` imprimiría antes de que los dos hilos terminen. Con `join` y con el monitor, el programa es determinista y siempre imprime 200000.

El monitor es el objeto, no el método. Cada forma de escribir `synchronized` toma uno distinto:

| Dónde escribes `synchronized` | Monitor que toma |
| --- | --- |
| Método de instancia | `this`, el objeto sobre el que llamas |
| Método `static` | la `Class` de la clase, por ejemplo `Seguro.class` |
| Bloque `synchronized (x)` | el objeto `x` |

Dos bloques `synchronized` sobre objetos distintos no se excluyen aunque estén en la misma clase: para que haya exclusión, los dos hilos tienen que tomar el mismo objeto. Y el monitor se cuenta por hilo, así que un método `synchronized` puede llamar a otro `synchronized` del mismo objeto sin quedarse esperando para siempre. Eso es la reentrada.

```java
public class Monitores {
    private final Object cerrojoA = new Object();
    private final Object cerrojoB = new Object();

    synchronized void conThis() {
        System.out.println(Thread.holdsLock(this));            // true
    }

    static synchronized void conClase() {
        System.out.println(Thread.holdsLock(Monitores.class)); // true
    }

    void conBloque() {
        synchronized (cerrojoA) {
            System.out.println(Thread.holdsLock(cerrojoA));    // true
            System.out.println(Thread.holdsLock(cerrojoB));    // false
        }
    }

    synchronized void exterior() {
        interior();   // este hilo ya tiene this: entra sin bloquearse
        System.out.println("exterior termina");
    }

    synchronized void interior() {
        System.out.println("interior entra");
    }

    public static void main(String[] args) {
        Monitores m = new Monitores();
        m.conThis();
        Monitores.conClase();
        m.conBloque();
        m.exterior();
    }
}
```

`holdsLock` contesta si el hilo actual tiene ese monitor, y con él se ve qué objeto toma cada forma. En `conBloque`, el hilo tiene `cerrojoA` y no `cerrojoB`, así que otro hilo podría entrar en un bloque protegido por `cerrojoB` al mismo tiempo. El ejemplo no demuestra una carrera: demuestra que son dos monitores distintos.

> [!OJO]
> El objeto que usas como cerrojo tiene que ser `private final` y no uno que otros puedan tomar. `synchronized (this)` deja el cerrojo a la vista de cualquiera que tenga la referencia. Y hay objetos que se comparten solos: los literales de `String` se internan, así que el `"lock"` de dos clases distintas es el mismo objeto, e `Integer` reutiliza las cajas de -128 a 127, así que dos `Integer` con el mismo valor pequeño pueden ser el mismo objeto. Dos cerrojos que creías separados acaban acoplados y aparecen esperas que no habías previsto.

## `volatile`: ver el cambio, no hacerlo atómico

`volatile` arregla la visibilidad de un solo campo. Una escritura en un campo `volatile` ocurre antes que la siguiente lectura de ese campo, así que quien lee ve el último valor escrito y no una copia guardada. Lo que no arregla es la atomicidad: `contador++` sigue siendo leer, sumar y escribir, y `volatile` no convierte los tres pasos en uno.

```java
public class Volatil {
    static volatile int contador = 0;

    static void sumar() {
        for (int i = 0; i < 100_000; i++) {
            contador++;   // sigue siendo leer, sumar y escribir
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread a = new Thread(Volatil::sumar);
        Thread b = new Thread(Volatil::sumar);
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println(contador + " de 200000");   // también puede faltar
    }
}
```

En 32 ejecuciones salió entre 162025 y 194881, otra vez por debajo de 200000. `volatile` garantiza que cada lectura vea una escritura completa, no que el par leer y escribir sea indivisible: los dos hilos siguen pisando sus lecturas.

Donde sí es la herramienta correcta es en una bandera de parada: un hilo escribe `parar = true` y el que gira en un `while (!parar)` la ve en su siguiente lectura. Sin `volatile` no hay garantía de que la vea, y el bucle puede no terminar nunca.

`volatile` en una referencia publica la referencia, no su contenido: si el objeto es mutable, quien lo lee puede ver campos viejos. Y en un `long` o un `double` sin `volatile`, la especificación permite que la lectura y la escritura se hagan en dos mitades y que una lectura mezcle dos escrituras; `volatile` lo impide.

## `wait` y `notify`: esperar sin gastar la CPU

A veces la exclusión no basta. Un consumidor no puede sacar de una cola vacía y tampoco quiere girar en un bucle mirando si llegó algo. Para eso está la pareja `wait` y `notify`, que trabajan sobre el monitor del objeto.

- `wait` solo se puede llamar con el monitor tomado. Fuera de un bloque `synchronized`, tanto `wait` como `notify` lanzan `IllegalMonitorStateException`.
- `wait` suelta el monitor y deja el hilo dormido; al volver, lo vuelve a tomar. Eso es lo que permite que otro hilo entre y cambie la condición, y lo que lo distingue de `Thread.sleep`, que no suelta nada.
- `notify` despierta a uno de los que esperan, sin decir cuál; `notifyAll` los despierta a todos. Con más de una condición en el mismo monitor, `notify` puede despertar al que no toca y dejar el programa parado, así que lo normal es `notifyAll`.
- La condición se comprueba en un `while`, nunca en un `if`: un hilo puede despertar sin que la condición sea cierta, y con `notifyAll` se despiertan también los que no tienen la razón. El `while` vuelve a comprobar y, si no toca, vuelve a esperar.

```java
import java.util.ArrayDeque;

public class Cola {
    private static final int CAPACIDAD = 2;
    private final ArrayDeque<Integer> cola = new ArrayDeque<>();

    synchronized void poner(int valor) throws InterruptedException {
        while (cola.size() == CAPACIDAD) {
            wait();               // suelta el monitor mientras espera sitio
        }
        cola.addLast(valor);
        notifyAll();              // hay un elemento nuevo para quien consume
    }

    synchronized int quitar() throws InterruptedException {
        while (cola.isEmpty()) {
            wait();
        }
        int valor = cola.removeFirst();
        notifyAll();              // hay sitio nuevo para quien produce
        return valor;
    }

    public static void main(String[] args) throws InterruptedException {
        Cola cola = new Cola();
        Thread productor = new Thread(() -> {
            try {
                for (int i = 1; i <= 3; i++) {
                    cola.poner(i);
                    System.out.println("puesto " + i);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        productor.start();
        for (int i = 1; i <= 3; i++) {
            System.out.println("sacado " + cola.quitar());   // el consumidor es main
        }
        productor.join();
        System.out.println("fin");
    }
}
```

El orden de las líneas no está garantizado: el `println` queda fuera del monitor, así que una línea puede aparecer en un orden que no es el de las operaciones. Lo que sí se cumple en todas las ejecuciones es lo que importa: se ponen tres, se sacan tres, no se pierde ninguno y el programa termina con `fin`. Un `if` en lugar del `while` habría dado por buena la primera vuelta y habría seguido con la cola en el estado equivocado.

## Qué garantiza cada mecanismo

| Mecanismo | Qué garantiza | Qué no garantiza |
| --- | --- | --- |
| `synchronized` | Exclusión mutua entre bloques del mismo monitor, y visibilidad al soltarlo | Que entre el hilo que tú quieras: no hay turnos ni orden de llegada |
| `volatile` | Visibilidad y orden de un campo: cada lectura ve la última escritura | Atomicidad: `x++`, `x += 1` o `x = x * 2` siguen partidos |
| `wait` / `notifyAll` | Una espera que suelta el monitor y se despierta cuando cambia la condición | Que la condición sea cierta al despertar; hay que comprobarla en un `while` |
| `AtomicInteger` (capítulo 4) | Un incremento atómico sin tomar un monitor | Que varias variables cambien juntas: solo protege su propio valor |

## El precio de serializar

Un monitor convierte un trozo de código en una cola: los hilos entran de uno en uno. Es lo que quieres para el contador y lo que no quieres en todo lo demás, así que la sección crítica se escribe corta y se sale pronto.

- Cuanto más corta, menos se esperan los hilos. Dentro del `synchronized`, lo mínimo: leer, calcular y escribir.
- Nunca hagas entrada o salida con el monitor tomado, ni llames a código ajeno: un `println`, una consulta a la base de datos, una llamada HTTP o un listener dejan a todos los demás esperando.
- Si el estado no necesita compartirse, no lo compartas. Un objeto inmutable, una copia por hilo o el estado dentro de la tarea evitan el problema en vez de administrarlo.

## Lo que viene

El siguiente capítulo cambia la herramienta: en vez de crear un `Thread` por tarea, un executor recibe tareas y las reparte entre sus hilos, con su cola y su ciclo de vida. Ahí el reparto lo decide el pool, no tú, y las mismas reglas de memoria se aplican a lo que devuelve cada tarea.

## Qué te llevas

- `contador++` son tres pasos. Dos hilos que leen el mismo valor pierden una actualización, y la cifra cambia entre ejecuciones porque la decide el planificador.
- La relación happens-before es la que promete visibilidad. Nace del orden del programa, del monitor, de `volatile` y de `start`/`join`.
- `synchronized` toma el monitor de un objeto: exclusión mutua y visibilidad al soltarlo. Un método de instancia usa `this`, un método `static` usa la `Class` y un bloque usa el objeto que le des.
- El monitor se cuenta por hilo, así que la reentrada funciona, y dos monitores distintos no se excluyen.
- El cerrojo va en un objeto `private final` que nadie más pueda tomar: ni un `String`, ni un `Integer`, ni un objeto que otro código comparta.
- `volatile` da visibilidad y orden, no atomicidad. Para esperar una condición, `wait` dentro de un `while` y `notifyAll`.
- La sección crítica se escribe corta, sin entrada o salida y sin llamadas ajenas.
