---
title: 'Hilos virtuales'
description: 'Qué cambian los hilos virtuales de Java 21: cómo se crean, cuánto cuestan, por qué no se agrupan y cuándo no aceleran nada.'
section: concurrencia
order: 6
since: 21
---

## Un hilo que ya no es un hilo del sistema

Hasta Java 21, `Thread` era un envoltorio fino de un hilo del sistema operativo: pedías uno, la JVM lo creaba y la pila se
reservaba entera aunque la tarea pasara el día esperando. Bloquear era caro porque detrás había un recurso escaso. El
capítulo 1 contó ese coste y el capítulo 3 lo esquivó con pools que reutilizan hilos.

Un hilo virtual cambia la pieza que se bloquea. La JVM lo crea, lo guarda en el heap y lo monta en un hilo de plataforma,
el *carrier*, mientras ejecuta. Si la tarea se duerme, espera una cola o espera un `ReentrantLock`, normalmente el
hilo virtual se desmonta y deja el carrier libre para otro. No todo bloqueo lo permite: algunas operaciones de archivos
retienen el carrier, y el planificador puede compensarlo con más carriers. Su pila crece en el heap, sin reservar un
bloque fijo por adelantado.

El sistema operativo sigue viendo pocos hilos: los carriers. Los virtuales existen dentro de la JVM, que es quien los
planifica. Es el mismo `Thread` de siempre, con el mismo `join` y el mismo modelo de memoria del capítulo 2, y con otra
política de bloqueo.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Muchas tareas, pocos carriers</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">Hilos virtuales</span>
      <code class="diagram__value">100000 tareas</code>
      <span class="diagram__hint">Cada uno con su pila en el heap; esperan sin ocupar un hilo del sistema.</span></li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">Planificador</span>
      <code class="diagram__value">ForkJoinPool</code>
      <span class="diagram__hint">Monta un hilo virtual en un carrier y lo descoloca al bloquearse.</span></li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Carriers</span>
      <code class="diagram__value">hilos de plataforma</code>
      <span class="diagram__hint">Uno por procesador, por defecto; solo estos son hilos del sistema operativo.</span></li>
    <li class="diagram__node"><span class="diagram__index">04</span><span class="diagram__title">Sistema operativo</span>
      <code class="diagram__value">núcleos</code>
      <span class="diagram__hint">Ve los carriers, no las tareas que esperan dentro de la JVM.</span></li>
  </ol>
  <figcaption class="diagram__caption">El sistema operativo no cambia: la JVM multiplexa miles de tareas sobre unos pocos hilos suyos.</figcaption>
</figure>

## Cómo se crea un hilo virtual

`Thread.ofVirtual()` devuelve un constructor, no un hilo: con él pones nombre, eliges si arrancado o parado y obtienes una
fábrica reutilizable. Las formas que vas a ver:

| Forma | Qué te da |
| --- | --- |
| `Thread.ofVirtual().start(tarea)` | Arranca ya y devuelve el `Thread` |
| `Thread.ofVirtual().name("cobro-1").start(tarea)` | Lo mismo, con el nombre puesto antes de arrancar |
| `Thread.ofVirtual().name("cobro-", 1).factory()` | Un `ThreadFactory` que numera: `cobro-1`, `cobro-2` |
| `Thread.startVirtualThread(tarea)` | Atajo de una línea para arrancar y seguir |
| `Executors.newVirtualThreadPerTaskExecutor()` | Un `ExecutorService` con un hilo virtual por tarea |

`Thread.isVirtual()` contesta si un hilo es virtual; en `main` devuelve `false`. Un hilo virtual se arranca una sola vez,
igual que uno de plataforma: el segundo `start()` lanza `IllegalThreadStateException`.

```java
public class PrimerosVirtuales {
    public static void main(String[] args) throws InterruptedException {
        int[] partes = new int[4];
        Thread[] hilos = new Thread[partes.length];
        for (int i = 0; i < hilos.length; i++) {
            int turno = i;
            hilos[i] = Thread.ofVirtual().name("suma-" + i).start(() -> {
                partes[turno] = (turno + 1) * 10;
                System.out.println(Thread.currentThread().getName() + " listo");
            });
        }
        for (Thread hilo : hilos) {
            hilo.join();
        }
        int total = 0;
        for (int parte : partes) {
            total += parte;
        }
        System.out.println("total: " + total);   // 100, siempre
    }
}
```

Cuatro hilos virtuales con nombre escriben cada uno su parte de una suma. Las cuatro líneas de `listo` pueden salir en
cualquier orden, porque el planificador decide cuándo monta cada uno; `total: 100` sale siempre, porque los cuatro `join`
han vuelto y hacen visibles las escrituras.

## Un hilo por tarea, no un pool

Un pool existe para amortizar hilos caros: crear uno de plataforma cuesta una pila y una llamada al sistema operativo, así
que se reutiliza. Un hilo virtual no tiene nada que amortizar. La regla es una tarea, un hilo, y
`newVirtualThreadPerTaskExecutor` es el patrón. Un `Executors.newFixedThreadPool(4, Thread.ofVirtual().factory())` no
ahorra memoria: crea cuatro hilos virtuales, los mantiene y encola el resto, con lo que pierdes la escala y escondes la
sobrecarga en la cola, como el capítulo 3 explicaba para los pools de plataforma.

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;

public class Fabricas {
    public static void main(String[] args) throws Exception {
        Thread suelto = Thread.startVirtualThread(
                () -> System.out.println("suelto, virtual: "
                        + Thread.currentThread().isVirtual()));
        suelto.join();

        ThreadFactory fabrica = Thread.ofVirtual().name("cobro-", 1).factory();
        Thread nombrado = fabrica.newThread(() -> System.out.println(
                "fabrica " + Thread.currentThread().getName()));
        nombrado.start();
        nombrado.join();

        try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {
            pool.execute(() -> System.out.println(
                    "pool, virtual: " + Thread.currentThread().isVirtual()));
            pool.execute(() -> System.out.println(
                    "pool, virtual: " + Thread.currentThread().isVirtual()));
        }
        System.out.println("cerrado");
    }
}
```

La salida fija `suelto, virtual: true`, `fabrica cobro-1` y las dos líneas de `pool, virtual: true`, que pueden salir en
cualquier orden; `cerrado` es siempre la última, porque `close()` espera a que terminen las tareas. `ExecutorService` es
`AutoCloseable` desde Java 19, así que el `try` con recursos apaga y espera sin que lo pidas. La fábrica con contador da
nombres legibles en un log, como en el capítulo 3.

## Cien mil no son un millón

Cada hilo virtual ocupa un objeto `Thread` y su pila, que vive en el heap y crece con lo que la tarea necesita. El coste
es de kilobytes, no del bloque fijo que reserva un hilo de plataforma, pero no es cero. Cien mil es una cifra razonable
de probar en una máquina normal. Un millón es una cuenta de memoria: unos pocos kilobytes por hilo son varios gigabytes, y
el límite lo pone el heap, no el sistema operativo. Crear un millón para sumar dos números es un ejercicio, no un diseño.

```java
import java.util.concurrent.atomic.AtomicInteger;

public class Escala {
    public static void main(String[] args) throws InterruptedException {
        int total = 100_000;
        AtomicInteger contador = new AtomicInteger();
        Thread[] hilos = new Thread[total];
        for (int i = 0; i < total; i++) {
            hilos[i] = Thread.ofVirtual().start(contador::incrementAndGet);
        }
        for (Thread hilo : hilos) {
            hilo.join();
        }
        System.out.println(contador.get() + " hilos virtuales");   // 100000
    }
}
```

Cien mil hilos virtuales incrementan un contador atómico del capítulo 4 y los `join` fijan la lectura: `100000` en todas
las pasadas. En las pruebas de este capítulo arrancaron y terminaron en una décima de segundo. Los virtuales no son
gratis, solo baratos: la cifra depende de la memoria y de cuánto guarde cada tarea.

## Lo que no hace rápido: la CPU

Un hilo virtual no ejecuta código más deprisa. El planificador monta tantos a la vez como carriers haya y el resto espera
turno. Los carriers son hilos de plataforma y, por defecto, hay tantos como procesadores disponibles: la propiedad
`jdk.virtualThreadScheduler.parallelism` lo cambia, pero no crea núcleos. Si la tarea quema CPU, un hilo virtual compite
por un núcleo igual que uno de plataforma, con el coste extra de montarse y descolgarse. Para trabajo de cálculo sigue
valiendo el capítulo 3: un pool del tamaño de los procesadores. Los hilos virtuales compran escala para lo que espera, no
rendimiento para lo que calcula.

## Pinning: cuando el hilo no puede soltar el carrier

En Java 21, un hilo virtual se descuelga al bloquearse, salvo que no pueda. Eso se llama *pinning*: el hilo queda fijado a
su carrier y el carrier sigue ocupado mientras el hilo espera. Pasa en dos casos:

- Bloquearse dentro de un `synchronized`. La JVM no puede desmontar un hilo virtual que tiene monitores tomados, así que
  el carrier se queda esperando con él.
- Llamar a código nativo. El código nativo corre sobre la pila del carrier, así que el hilo virtual no se puede descolgar
  hasta que vuelva.

Con pocos carriers, unos cuantos hilos fijados dejan a los demás esperando. No es un deadlock: es paralelismo perdido. Se
ve con `-Djdk.virtualThreadScheduler.parallelism=1`: mientras un hilo virtual duerme dentro de un `synchronized`, el
siguiente no arranca, y con un `ReentrantLock` arranca enseguida porque la espera suelta el carrier. En las pruebas de
este capítulo, Java 21 mostró esa diferencia y Java 25, ninguna.

El `ReentrantLock` es del capítulo 5; aquí solo importa que su espera sabe descolgar el hilo virtual. Java 24 cambió la
otra mitad: JEP 491 eliminó el pinning de `synchronized`, así que Java 25 no tiene esa limitación. Las llamadas nativas
siguen fijando, porque el frame nativo vive en la pila del carrier.

```java
import java.util.concurrent.locks.ReentrantLock;

public class CerrojosVirtuales {
    private static final Object MONITOR = new Object();
    private static final ReentrantLock CERROJO = new ReentrantLock();

    static void conMonitor() {
        synchronized (MONITOR) {
            dormir();          // Java 21: el hilo se queda fijado al carrier
        }
    }

    static void conCerrojo() {
        CERROJO.lock();
        try {
            dormir();          // la espera suelta el carrier
        } finally {
            CERROJO.unlock();
        }
    }

    static void dormir() {
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread a = Thread.ofVirtual().start(CerrojosVirtuales::conMonitor);
        Thread b = Thread.ofVirtual().start(CerrojosVirtuales::conCerrojo);
        a.join();
        b.join();
        System.out.println("monitor y cerrojo terminan");   // siempre
    }
}
```

El ejemplo no mide nada: muestra las dos formas y fija el final con los `join`. En Java 21, el `sleep` de dentro del
`synchronized` deja el hilo fijado; el del `ReentrantLock`, no. Si lo lees con Java 25, la primera forma ya no fija, y el
comentario de la primera línea se refiere al Java 21 que declara el capítulo.

## `ThreadLocal` y el estado por hilo

Un hilo virtual es un `Thread`, así que tiene su propio mapa de `ThreadLocal`. El aislamiento es el de siempre: cada tarea
ve su valor, no el de la vecina. El problema es la escala: con cien mil hilos usando `ThreadLocal` hay cien mil mapas, y
si cada uno guarda un objeto grande, la memoria se va. La ventaja es que el hilo no se reutiliza: el mapa muere con él y
no queda un valor viejo esperando a la siguiente tarea, como en un pool.

Para eso está `ScopedValue`, vista previa en Java 21 y API estándar en Java 25: en vez de pegar el valor al hilo, se
comparte un valor inmutable dentro de un bloque acotado. En Java 21 no compila sin `--enable-preview`, así que queda la
idea y no el código.

## Concurrencia estructurada, en vista previa

`StructuredTaskScope`, en `java.util.concurrent`, agrupa subtareas para que terminen o fallen juntas: el bloque no sale
hasta que todas acaban y, si una falla, puedes cancelar el resto. En Java 21 es vista previa y exige `--enable-preview`;
en Java 25 sigue en vista previa, así que aquí no hay código.

## Plataforma o virtual

| | Hilo de plataforma | Hilo virtual |
| --- | --- | --- |
| Coste | Pila reservada y llamada al sistema operativo | Objeto en el heap y pila que crece |
| Al bloquearse | Ocupa su hilo del sistema hasta que vuelve | Suelta el carrier mientras espera |
| Quién lo planifica | El sistema operativo | La JVM, sobre unos pocos carriers |
| Cuántos tienen sentido | Cientos o miles | Cientos de miles |
| Para qué | Trabajo de CPU y código que fija | Tareas que esperan: IO, colas, sleeps |

Si el código que llamas hace `synchronized` alrededor de esperas largas, mide antes de confiar en la escala: en Java 21
eso fija hilos, y en Java 25 ya no.

> [!OJO]
> Un hilo virtual no arregla una carrera, ni un deadlock, ni un pool mal dimensionado: cambia el precio de
> bloquear, nada más. `total++` sigue perdiendo sumas aunque sus hilos sean virtuales, un monitor sigue siendo un
> monitor y una cola sin tope sigue escondiendo la sobrecarga. Las reglas del capítulo 2 y los cerrojos del capítulo 5
> no cambian porque el hilo sea barato.

## Qué te llevas

- Un hilo virtual lo planifica la JVM y se monta en un carrier de plataforma; al bloquearse se descuelga y deja el carrier
  libre. El sistema operativo solo ve los carriers, uno por procesador por defecto.
- Se crean con `Thread.ofVirtual().start(...)`, con nombre, con `Thread.ofVirtual().factory()` o con
  `Thread.startVirtualThread(...)`; `Thread.isVirtual()` los distingue y `join` funciona igual.
- Una tarea por hilo, con `newVirtualThreadPerTaskExecutor`: un pool fijo de virtuales no ahorra nada y añade una cola que
  no necesitas.
- Cien mil son razonables y un millón es una cuenta de memoria: la pila vive en el heap y el límite es la memoria que
  tengas, no el número de hilos del sistema.
- No aceleran la CPU: los carriers son hilos de plataforma, y el cálculo sigue compitiendo por núcleos. Solo cambian el
  precio de esperar.
- En Java 21, bloquear dentro de un `synchronized` o llamar a código nativo fija el hilo al carrier; un `ReentrantLock`
  no. JEP 491 quitó el pinning de `synchronized` en Java 24, así que Java 25 ya no lo tiene; el código nativo sigue
  fijando.
- Cada hilo virtual tiene su `ThreadLocal`, y con muchos hilos el coste se nota. `ScopedValue` es la alternativa: vista
  previa en Java 21 y estándar en Java 25.
- Ni las carreras, ni los deadlocks, ni un pool mal montado desaparecen por usar hilos virtuales.
