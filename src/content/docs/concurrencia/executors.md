---
title: 'Executors y tareas'
description: 'Reparte tareas entre hilos con ExecutorService, recoge resultados con Future y apaga el pool sin dejar la JVM colgada.'
section: concurrencia
order: 3
since: 8
---

## Un hilo por tarea no escala

Crear un `Thread` por tarea funciona en una prueba y se rompe en producción: cada hilo de plataforma es
un hilo del sistema operativo con su pila, y el capítulo 1 ya contó lo que cuesta. Con cien tareas, cien
hilos, y el planificador repartiendo turnos entre todos.

Y hay tres huecos más: no hay cola, así que o lanzas todo de golpe o te montas tú el tope; no hay ciclo
de vida, así que para saber cuándo acabó todo guardas los `Thread` y haces `join` uno a uno; y no hay
resultado, así que el valor va a un campo compartido y vuelves a los problemas del capítulo 2.

## La tarea va por un lado y el hilo por otro

Un `ExecutorService` separa la tarea del hilo: entregas la tarea y el pool decide en qué hilo corre,
cuántas a la vez y con qué cola esperan las demás. Tú no creas hilos: pides trabajo.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Una tarea, una cola y los hilos del pool</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">Envías</span>
      <code class="diagram__value">pool.submit(tarea)</code><span class="diagram__hint">El hilo que llama deja la tarea y sigue.</span></li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">Cola</span>
      <code class="diagram__value">LinkedBlockingQueue</code><span class="diagram__hint">Esperan turno, sin límite en un pool fijo.</span></li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Workers</span>
      <code class="diagram__value">pool-1-thread-1</code><span class="diagram__hint">Sacan una tarea y vuelven a por otra.</span></li>
  </ol>
  <figcaption class="diagram__caption">El hilo que envía no ejecuta nada: el pool fija cuántos workers tiene, no cuántas tareas entran.</figcaption>
</figure>

Los hilos se reutilizan: el pool los crea una vez y cada worker saca tareas de la cola hasta que lo
apagas. `Executors` es la fábrica que monta pools ya hechos; `ExecutorService`, el contrato que usas.

## Tres fábricas, tres políticas

`Executors` tiene tres métodos que devuelven un pool listo; cambian cuántos hilos hay y qué cola llevan.

| Fábrica | Hilos | Cola | Cuándo es mala idea |
| --- | --- | --- | --- |
| `newFixedThreadPool(n)` | n fijos, nunca mueren | `LinkedBlockingQueue` sin límite | Con picos: la cola engorda y la latencia sube |
| `newCachedThreadPool()` | de 0 a `Integer.MAX_VALUE`, 60 s de vida | `SynchronousQueue`, sin capacidad | Con una ráfaga de tareas lentas: un hilo por tarea |
| `newSingleThreadExecutor()` | 1 | `LinkedBlockingQueue` sin límite | Si quieres rendimiento: pasa todo por un hilo |

El pool fijo es el que quieres por defecto: los hilos son una decisión tuya y no crecen con la carga. Su
trampa es la cola: lo acepta todo, así que una avalancha se convierte en memoria y espera en vez de en un
error visible.

El cacheado va bien para muchas tareas cortas separadas por pausas: reutiliza un hilo libre o crea uno
nuevo, y a los sesenta segundos sin uso los hilos mueren. Su cola no guarda nada, así que cada tarea
necesita un hilo libre en ese instante: dos mil tareas bloqueadas son dos mil hilos.

El de un solo hilo serializa las tareas: nunca hay dos a la vez, así que no se pisan entre ellas.
Perfecto si el recurso de detrás no aguanta concurrencia, malo si buscas rendimiento. Si necesitas cola
con tope, monta un `ThreadPoolExecutor` con una `ArrayBlockingQueue` fija y una política de rechazo.

## `execute` o `submit`

Hay dos formas de entregar trabajo. `execute` recibe un `Runnable` y no devuelve nada. `submit` admite un
`Callable<V>`, que devuelve un valor y puede lanzar excepciones comprobadas, y devuelve un `Future<V>`,
el vale por un resultado que todavía no existe.

La diferencia que muerde es qué pasa si la tarea falla. Con `execute`, la excepción escapa del `run()`: el
hilo muere, el manejador por defecto imprime la traza y el pool crea otro. Con `submit`, la excepción se
guarda en el `Future` y no se entera nadie hasta que alguien llama a `get()`.

```java
import java.util.concurrent.*;

public class Envio {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch permiso = new CountDownLatch(1);
        try {
            Future<Integer> futuro = pool.submit(() -> {
                permiso.await();          // la tarea no puede terminar todavia
                return 6 * 7;
            });
            System.out.println("isDone antes: " + futuro.isDone());    // false
            permiso.countDown();
            System.out.println("resultado: " + futuro.get());          // 42
            System.out.println("isDone despues: " + futuro.isDone());  // true
        } finally {
            pool.shutdown();
        }
    }
}
```

`get()` bloquea hasta que hay valor: hace el papel de `join` para una tarea, y es lo que fija la salida
del ejemplo, `false` antes y `true` después. Y da una garantía de memoria: lo que escribiste antes de
`submit` lo ve la tarea, y su resultado lo ves tú.

## Esperar, rendirse, cancelar

`get()` sin plazo espera para siempre. `get(timeout, unit)` lanza `TimeoutException` si vence el plazo,
que es tu paciencia, no un botón de parada: la tarea sigue corriendo y la cancelas tú. `isDone()` dice si
ya terminó y `cancel(true)` interrumpe si está en marcha o devuelve `false` si ya acabó.

Y cuando la tarea falla, `get()` no lanza la excepción original: lanza `ExecutionException`, que envuelve
la de verdad. Sin `getCause()` te quedas con el envoltorio y pierdes el mensaje.

```java
import java.util.concurrent.*;

public class Fallos {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newSingleThreadExecutor();
        try {
            Future<Integer> roto = pool.submit(() -> {
                throw new IllegalStateException("sin conexion");
            });
            try {
                roto.get();
            } catch (ExecutionException e) {
                System.out.println("causa: " + e.getCause());
            }
            Future<Integer> lento = pool.submit(() -> {
                Thread.sleep(5_000);
                return 1;
            });
            try {
                lento.get(200, TimeUnit.MILLISECONDS);
            } catch (TimeoutException e) {
                System.out.println("cancelada: " + lento.cancel(true));
            }
        } finally {
            pool.shutdownNow();
        }
    }
}
```

El ejemplo imprime la causa real y `cancelada: true`. Después de `cancel(true)` el `Future` está terminado
aunque la tarea siga viva un rato: `isDone()` pasa a `true` y un `get()` posterior lanza
`CancellationException`. Cancelar es una petición, como `interrupt()` en el capítulo 1.

## `invokeAll` e `invokeAny`

`invokeAll(tareas)` bloquea hasta que todas terminan y devuelve los futuros en el orden de la lista, aunque
hayan acabado en otro; con plazo, las que no llegaron se cancelan. `invokeAny(tareas)` devuelve el
resultado de la primera que termina bien y cancela las demás, y lanza `ExecutionException` si fallan todas.

## Apagar el pool

Un pool que no cierras mantiene la JVM viva. Sus hilos no son daemon y un pool fijo los conserva dormidos
para siempre: `main` termina, la JVM no, y el programa se queda colgado sin imprimir nada más.

`shutdown()` es el apagado ordenado: no acepta tareas nuevas (un `submit` posterior lanza
`RejectedExecutionException`), las de la cola se ejecutan y los hilos mueren cuando se quedan sin trabajo.
`shutdownNow()` interrumpe lo que está en curso y devuelve una `List<Runnable>` con lo que nunca arrancó;
lo que corre solo se para si atiende la interrupción. Sin `shutdown` antes, `awaitTermination` espera en
vano; después, bloquea hasta que el pool termina y contesta con un `boolean`.

```java
import java.util.List;
import java.util.concurrent.*;

public class Apagado {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newSingleThreadExecutor();
        pool.execute(() -> System.out.println("primera tarea"));
        pool.execute(() -> System.out.println("segunda tarea"));
        pool.shutdown();                                    // la cola se ejecuta igual
        System.out.println("terminadas: " + pool.awaitTermination(5, TimeUnit.SECONDS));

        ExecutorService otro = Executors.newSingleThreadExecutor();
        CountDownLatch arrancada = new CountDownLatch(1);
        otro.execute(() -> {
            arrancada.countDown();
            try {
                Thread.sleep(60_000);          // shutdownNow la interrumpe
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        arrancada.await();                 // la tarea larga ya esta en marcha
        otro.execute(() -> System.out.println("esta nunca arranca"));
        List<Runnable> pendientes = otro.shutdownNow();      // interrumpe y vacia la cola
        System.out.println("pendientes: " + pendientes.size());   // 1
    }
}
```

El primer pool imprime sus dos tareas y `terminadas: true`: `awaitTermination` espera a que la cola se
vacíe. En el segundo, `shutdownNow` interrumpe la tarea larga y `pendientes` vale 1.

Desde Java 19, `ExecutorService` es `AutoCloseable` y `try (ExecutorService pool = ...)` cierra solo con
`close()`, que hace `shutdown()` y espera. En Java 8, el patrón es el `finally`.

## Poner nombre a los hilos

Sin fábrica, los hilos se llaman `pool-1-thread-1` y en un log o en un thread dump no sabes qué pool es
cuál. `Executors` acepta un `ThreadFactory` en todas sus fábricas: una función que recibe la `Runnable` y
devuelve el `Thread` montado. En Java 8 se escribe con un contador atómico,
`r -> new Thread(r, "cobros-" + contador.incrementAndGet())`; en Java 21, con
`Thread.ofPlatform().name("cobros-", 1).factory()`. El premio: `jstack` dice `cobros-1`, no `pool-1-thread-1`.

## Cuántos hilos poner

Para trabajo que gasta CPU, el número ronda `Runtime.getRuntime().availableProcessors()`: un hilo por
núcleo. Para trabajo que espera la cuenta es otra: si las tareas pasan la mayor parte del tiempo
esperando, necesitas más hilos que núcleos para tenerlos ocupados. La regla de tres habitual es
núcleos x (1 + espera / cálculo), pero es una estimación: se mide. Y la cola es la otra mitad: sin límite
esconde la sobrecarga y la convierte en latencia; con tope, el rechazo aparece cuando no hay capacidad.

## `CompletableFuture`: componer sin bloquear

Un `Future` solo permite esperar el resultado; `CompletableFuture` (Java 8) compone etapas: cada una
transforma el valor de la anterior. `supplyAsync` arranca una tarea que devuelve algo, `thenApply`
transforma ese valor, `thenCompose` encadena una función que ya devuelve otro futuro, `thenCombine`
junta dos futuros independientes, y `exceptionally` y `handle` recogen el fallo: uno da un valor de
repuesto y el otro recibe valor o error.

```java
import java.util.concurrent.*;

public class Pedidos {
    static CompletableFuture<Integer> total(String id, Executor ejecutor) {
        return CompletableFuture.supplyAsync(() -> id.length() * 10, ejecutor)
                .thenApply(p -> p + p / 10);
    }

    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            CompletableFuture<Integer> base = total("pedido", pool);         // 66
            CompletableFuture<String> etiqueta = base.thenCompose(
                    t -> CompletableFuture.supplyAsync(() -> "total " + t, pool));
            CompletableFuture<Integer> otro = total("otro", pool);           // 44
            System.out.println(etiqueta.get());                              // total 66
            System.out.println(base.thenCombine(otro, Integer::sum).get());  // 110
            CompletableFuture<Integer> roto = CompletableFuture
                    .<Integer>supplyAsync(() -> {
                        throw new IllegalStateException("sin stock");
                    }, pool);
            System.out.println(roto.exceptionally(e -> -1).get());           // -1
            String texto = roto.handle((valor, error) ->
                    "valor=" + valor + ", causa=" + error.getCause().getMessage()).get();
            System.out.println(texto);      // valor=null, causa=sin stock
        } finally {
            pool.shutdown();
        }
    }
}
```

Cuando no pasas executor, `supplyAsync` y las variantes `Async` usan el `ForkJoinPool.commonPool()`,
compartido por toda la JVM y con un hilo menos que núcleos, mínimo uno. Por eso conviene pasar el tuyo:
decides tamaño, nombres y apagado. Las variantes sin `Async` corren en el hilo que completa la etapa
anterior, y el error llega envuelto: dentro de `handle`, `getCause()` es la excepción de verdad.

> [!OJO]
> No metas entrada o salida que bloquee en el `commonPool`: tiene pocos hilos, lo comparte toda la JVM
> (también `parallelStream`) y cada tarea bloqueada le quita un hilo a los demás. Y cierra siempre el
> pool que crees: un `newCachedThreadPool()` con una carga alta crea un hilo por tarea, porque su cola no
> guarda nada, así que puede llegar a miles.

## Lo que viene

El capítulo 4 entra en las piezas que ya vienen resueltas: colas, mapas y contadores concurrentes, y las
utilidades de sincronización que evitan escribir a mano media docena de las cosas de este capítulo.

## Qué te llevas

- Un `ExecutorService` separa la tarea del hilo: tú envías, el pool reparte, la cola guarda y los workers
  reutilizan. `newFixedThreadPool` acota los hilos con una cola infinita, `newCachedThreadPool` no tiene
  tope y `newSingleThreadExecutor` serializa todo en un hilo.
- `execute` no devuelve nada y una excepción mata el hilo; `submit` devuelve un `Future` y guarda el fallo
  para que aparezca en `get()` envuelto en `ExecutionException`, con la causa en `getCause()`.
- `get()` bloquea, `get(timeout, unit)` se rinde con `TimeoutException` sin parar la tarea y `cancel(true)`
  pide detenerla; cancelar no es una orden, es una interrupción.
- Sin `shutdown` la JVM no se cierra: `shutdown()` deja terminar la cola, `shutdownNow()` interrumpe y
  devuelve lo pendiente, y `awaitTermination` espera y contesta con un `boolean`.
- Para CPU, cerca de `availableProcessors()`; para IO, más. Nombra los hilos y no dejes que una cola sin
  límite te oculte la sobrecarga.
- `CompletableFuture` compone etapas sin bloquear, usa el `commonPool` si no le pasas executor y conviene
  pasarle uno propio.
