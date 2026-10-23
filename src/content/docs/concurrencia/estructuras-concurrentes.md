---
title: 'Colecciones y utilidades concurrentes'
description: 'Por qué HashMap pierde entradas con dos hilos y qué dan ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue y los atómicos.'
section: concurrencia
order: 4
since: 8
---

## Un mapa que no aguanta dos escritores

`HashMap` y `ArrayList` no son seguros entre hilos, y no avisan. Los dos crecen cuando se quedan sin sitio: crecer es crear una tabla o un array nuevos y copiar lo que había. Si dos hilos disparan ese crecimiento a la vez, cada uno copia por su cuenta y el que publica su tabla al final pisa la del otro: las parejas o los elementos que el otro acababa de meter se pierden. En un `HashMap`, además, un `put` es leer el cubo, decidir y escribir, así que dos `put` simultáneos pueden pisarse y quedarse con una sola de las dos parejas.

A eso se suma el recorrido. El iterador de `HashMap` y el de `ArrayList` son *fail-fast*: si detectan un cambio estructural hecho por otro hilo, lanzan `ConcurrentModificationException`. La palabra que importa es "si": el aviso es lo mejor que pueden hacer, no la promesa de hacerlo siempre.

```java
import java.util.HashMap;
import java.util.Map;

public class MapaRoto {
    static void llenar(Map<Integer, Integer> mapa, int base) {
        for (int i = 0; i < 20_000; i++) {
            mapa.put(base + i, i);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Map<Integer, Integer> mapa = new HashMap<>();
        Thread a = new Thread(() -> llenar(mapa, 0));
        Thread b = new Thread(() -> llenar(mapa, 1_000_000));
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println(mapa.size() + " de 40000");   // puede faltar alguna
    }
}
```

Las claves de los dos hilos no se repiten, así que un mapa seguro acabaría con 40000 parejas. En diecisiete ejecuciones de prueba quedaron entre 28663 y 38088: desaparecieron miles por el camino, sin excepción ni mensaje. `join` no arregla eso, solo garantiza que `main` lee cuando los dos escritores han terminado. Con `ArrayList` pasa algo parecido: dos `add` a la vez pierden elementos, y recorrerla mientras otro hilo añade lanzó `ConcurrentModificationException` en las ocho pasadas de prueba.

## `ConcurrentHashMap`: la tabla que aguanta

`ConcurrentHashMap` es la respuesta para un mapa compartido. Sus operaciones son atómicas y las lecturas no toman un cerrojo global, así que dos hilos pueden leer y escribir a la vez sin serializarse. No admite `null` en clave ni en valor: `put(clave, null)` lanza `NullPointerException`, y con eso desaparece la ambigüedad de `get` que tenía `HashMap` y que ya contó el capítulo de [mapas](/docs/colecciones/mapas/).

Los atajos de `Map` que viste allí tienen aquí versión atómica, y ahí está la diferencia: `putIfAbsent`, `compute`, `computeIfAbsent` y `merge` leen, calculan y escriben como una sola operación, no como un `get` seguido de un `put`. El cálculo se hace con el cubo de esa clave bloqueado, así que tiene que ser corto y no puede tocar otras claves del mismo mapa. Por eso `merge(palabra, 1, Integer::sum)` cuenta sin perder sumas aunque varios hilos escriban la misma palabra.

El iterador es *débilmente consistente*: recorre las entradas que la tabla tenía en algún momento desde que se creó, puede ver unas y no otras, y no lanza `ConcurrentModificationException` ni aunque el mapa cambie mientras tanto. `size()` devuelve lo que hay en ese instante: con escrituras en marcha es una estimación y sirve para vigilar, no para decidir. Para conteos que pasan de `int` está `mappingCount()` (Java 8), que devuelve un `long` y también es una estimación.

```java
import java.util.concurrent.ConcurrentHashMap;

public class CuentaPalabras {
    public static void main(String[] args) throws InterruptedException {
        String[] palabras = "uno dos uno tres dos uno".split(" ");
        ConcurrentHashMap<String, Integer> cuenta = new ConcurrentHashMap<>();
        Thread[] hilos = new Thread[3];
        for (int h = 0; h < hilos.length; h++) {
            int turno = h;
            hilos[h] = new Thread(() -> {
                for (int i = turno; i < palabras.length; i += 3) {
                    cuenta.merge(palabras[i], 1, Integer::sum);   // atómico
                }
            });
        }
        for (Thread hilo : hilos) {
            hilo.start();
        }
        for (Thread hilo : hilos) {
            hilo.join();
        }
        System.out.println(cuenta.size() + " claves");   // 3, siempre
        System.out.println(cuenta.get("uno"));           // 3
        System.out.println(cuenta.get("dos"));           // 2
        System.out.println(cuenta.get("tres"));          // 1
    }
}
```

Tres hilos recorren el mismo array de palabras y escriben en el mismo mapa; el reparto de turnos lo decide el planificador y cambia en cada ejecución. El resultado no: `merge` es atómico, así que las cuentas salen exactas y al final hay 3 claves, con `uno` a 3, `dos` a 2 y `tres` a 1. Los `join` fijan el momento de leer.

## La operación compuesta sigue siendo una carrera

Que cada método sea atómico no convierte en atómica una secuencia de métodos. `containsKey` y luego `put` son dos llamadas, y entre las dos cabe otro hilo: los dos ven `false` y los dos escriben. Lo mismo con `get` y `put` para incrementar un contador: `mapa.put(clave, mapa.get(clave) + 1)` pierde incrementos aunque el mapa sea concurrente.

> [!OJO]
> En un `ConcurrentHashMap`, la atomicidad es del método, no del bloque. Si la decisión depende de lo que acabas de leer, usa el método que decide y escribe de una vez (`putIfAbsent`, `compute`, `computeIfAbsent`, `merge`) o protege la secuencia con un cerrojo propio. Un `synchronized` alrededor de dos llamadas atómicas también funciona, pero entonces el mapa concurrente no te está aportando gran cosa.

## `CopyOnWriteArrayList`: leer sin cerrojos

`CopyOnWriteArrayList` resuelve el problema por el otro lado: no bloquea a los lectores porque las escrituras nunca tocan el array que se está leyendo. Cada `add`, `set` o `remove` copia el array entero, cambia la copia y publica la referencia nueva; el array viejo se queda como estaba hasta que nadie lo usa. El iterador guarda la referencia del array del momento en que se creó: es una foto, no refleja cambios posteriores y no puede lanzar `ConcurrentModificationException`. Sus propios `remove`, `set` y `add` no están soportados y lanzan `UnsupportedOperationException`.

El precio crece con el tamaño: cada escritura copia todos los elementos. Con muchas lecturas y pocas escrituras sale a cuenta (listas de oyentes, catálogos que se recargan de vez en cuando, configuración); con una lista grande y escrituras frecuentes es la peor opción de esta página.

```java
import java.util.Iterator;
import java.util.concurrent.CopyOnWriteArrayList;

public class Copias {
    public static void main(String[] args) throws InterruptedException {
        CopyOnWriteArrayList<String> oyentes = new CopyOnWriteArrayList<>();
        oyentes.add("consola");
        Iterator<String> foto = oyentes.iterator();   // la foto se hace aquí
        Thread alta = new Thread(() -> {
            for (int i = 0; i < 1_000; i++) {
                oyentes.add("oyente-" + i);           // cada alta copia el array
            }
        });
        alta.start();
        int vistos = 0;
        while (foto.hasNext()) {                      // recorre la foto, no la lista
            foto.next();
            vistos++;
        }
        alta.join();
        System.out.println("vistos: " + vistos + ", al final: " + oyentes.size());
    }
}
```

El iterador se creó antes de arrancar el escritor, así que recorre la foto de ese momento y ve solo `consola`: la salida es `vistos: 1, al final: 1001` en todas las ejecuciones. El escritor añade mil elementos mientras el bucle avanza y no hay excepción, porque el bucle no mira la lista viva; el tamaño final es 1001 porque `join` espera a que termine.

## `BlockingQueue`: el productor y el consumidor

Una `BlockingQueue` es la estructura del patrón productor y consumidor, y la pieza que hace el trabajo es el bloqueo: `put` espera si la cola está llena y `take` espera si está vacía. Las dos esperas sueltan el cerrojo mientras duran, así que el otro extremo puede avanzar. Para no esperar para siempre están `offer(elemento, tiempo, unidad)` y `poll(tiempo, unidad)`, que aguardan como mucho ese plazo y devuelven `false` o `null` si no hubo suerte. Un pool de hilos del capítulo 3 es, por dentro, un productor y varios consumidores con una de estas colas en medio.

`ArrayBlockingQueue` es una cola acotada sobre un array: la capacidad se fija al construirla y no cambia. Su constructor con un booleano activa el reparto justo, en orden de llegada, a costa de rendimiento. `LinkedBlockingQueue` está hecha de nodos enlazados, suele dar más rendimiento que la de array con una latencia menos predecible y, si no le pasas capacidad, su tope es `Integer.MAX_VALUE`, que en la práctica es no tener tope. La cola a mano de [Memoria compartida y sincronización](/docs/concurrencia/sincronizacion/) hacía esto mismo con `wait` y `notifyAll`; estas clases ya lo traen hecho y probado.

<figure class="diagram diagram--framed">
  <p class="diagram__label">El recorrido de un dato por la cola</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">Productor</span>
      <code class="diagram__value">put(dato)</code>
      <span class="diagram__hint">Con la cola llena, espera a que el consumidor saque algo.</span></li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">Cola acotada</span>
      <code class="diagram__value">capacidad 2</code>
      <span class="diagram__hint">El tope es fijo y no crece: si se llena, frena al productor.</span></li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Consumidor</span>
      <code class="diagram__value">take()</code>
      <span class="diagram__hint">Con la cola vacía, espera sin gastar CPU hasta que llegue un dato.</span></li>
  </ol>
  <figcaption class="diagram__caption">Dos esperas y un tope: el productor espera sitio, el consumidor espera datos y la capacidad acotada impide que la cola crezca sin límite.</figcaption>
</figure>

```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class Tuberia {
    static final BlockingQueue<Integer> COLA = new ArrayBlockingQueue<>(2);

    public static void main(String[] args) throws InterruptedException {
        Thread productor = new Thread(() -> {
            try {
                for (int i = 1; i <= 5; i++) {
                    COLA.put(i);                 // espera si no hay hueco
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "productor");
        Thread consumidor = new Thread(() -> {
            try {
                int suma = 0;
                for (int i = 1; i <= 5; i++) {
                    suma += COLA.take();         // espera si está vacía
                }
                System.out.println("suma: " + suma);   // 15, siempre
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "consumidor");
        consumidor.start();
        productor.start();
        productor.join();
        consumidor.join();
        System.out.println("fin");
    }
}
```

El productor llena una cola de capacidad 2 con cinco números y el consumidor los suma. Los dos se bloquean y se desbloquean según quién vaya por delante, así que el entrelazado cambia en cada ejecución: cuántas veces espera cada uno no se puede predecir. Lo que sí es fijo es la suma, 15, y que `fin` salga al final, porque los dos `join` esperan a que ambos hilos terminen. Aquí el consumidor sabe que van cinco; en un pipeline de verdad no lo sabe, y se para con un valor centinela que no sea un dato.

## `AtomicInteger` y `LongAdder`

`AtomicInteger` guarda un `int` y lo cambia con operaciones atómicas: `incrementAndGet`, `getAndIncrement`, `addAndGet`, `get`. No hay monitor por medio; el hardware ofrece la instrucción que hace la lectura y la escritura inseparables. La pieza de debajo es `compareAndSet(esperado, nuevo)`: escribe el valor nuevo solo si el actual es el esperado y devuelve si lo consiguió. Un incremento es esa misma idea en bucle: lee, calcula, intenta el cambio y repite si otro se adelantó, sin bloquear a nadie.

`LongAdder` (Java 8) es para estadísticas. En vez de un único valor disputado por todos los hilos, mantiene varias celdas y cada hilo suma en la suya cuando hay contención; `sum()` las recorre y las suma. Sale más barato con muchos hilos, ocupa más memoria y tiene una trampa: `sum()` no es una foto atómica, así que si lo llamas mientras otros siguen sumando puede quedarse corto. Con los hilos ya terminados, el número es exacto.

```java
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;

public class Contadores {
    static final AtomicInteger ATOMICO = new AtomicInteger();
    static final LongAdder SUMA = new LongAdder();

    public static void main(String[] args) throws InterruptedException {
        Thread[] hilos = new Thread[4];
        for (int i = 0; i < hilos.length; i++) {
            hilos[i] = new Thread(() -> {
                for (int j = 0; j < 100_000; j++) {
                    ATOMICO.incrementAndGet();
                    SUMA.increment();
                }
            });
            hilos[i].start();
        }
        for (Thread hilo : hilos) {
            hilo.join();
        }
        System.out.println(ATOMICO.get());   // 400000, siempre
        System.out.println(SUMA.sum());      // 400000, siempre: el join cierra la cuenta
        AtomicInteger cupo = new AtomicInteger(1);
        System.out.println(cupo.compareAndSet(1, 0));    // true: valía 1 y pasa a 0
        System.out.println(cupo.compareAndSet(1, -1));   // false: ya no vale 1
    }
}
```

Cuatro hilos hacen cien mil incrementos cada uno. El `join` de cada uno cierra la cuenta, así que `get()` y `sum()` dan 400000 en todas las ejecuciones. `compareAndSet` devuelve `true` la primera vez, cuando el cupo vale 1, y `false` la segunda, porque ya vale 0 y no toca nada.

## Esperar y limitar: `CountDownLatch` y `Semaphore`

`CountDownLatch` es un contador que se usa una sola vez: se construye con un número, cada tarea llama a `countDown()` al terminar y `await()` bloquea hasta que llega a cero. No se puede reiniciar; para eso está `CyclicBarrier`, que es la barrera reutilizable en la que cada hilo espera a que lleguen los demás y, cuando llega el último, todos siguen y la barrera se puede volver a usar.

`Semaphore` no espera a nadie: reparte permisos. `acquire()` toma uno y bloquea si no quedan, `release()` lo devuelve, y con tres permisos como mucho tres hilos pasan a la vez mientras el cuarto espera. Sirve para limitar la concurrencia (tres descargas, dos conexiones, una escritura a disco), no para proteger datos: los permisos no saben qué estás tocando.

```java
import java.util.concurrent.CountDownLatch;

public class Arranque {
    public static void main(String[] args) throws InterruptedException {
        int tareas = 3;
        CountDownLatch listas = new CountDownLatch(tareas);
        for (int i = 1; i <= tareas; i++) {
            String id = "tarea " + i;
            new Thread(() -> {
                System.out.println("lista " + id);   // el orden de estas tres varía
                listas.countDown();
            }).start();
        }
        listas.await();
        System.out.println("las " + tareas + " listas");   // siempre la última línea
    }
}
```

Las tres líneas de `lista tarea` salen en cualquier orden, porque cada hilo arranca cuando le toca; la última línea es siempre `las 3 listas`, porque `await()` no vuelve hasta que el contador llega a cero y cada `countDown()` va después de su `println`.

## `Collections.synchronizedList` y compañía

Antes de `java.util.concurrent` había otra salida: envolver la colección. `Collections.synchronizedList`, `synchronizedMap`, `synchronizedSet` y `synchronizedCollection` devuelven un envoltorio en el que cada método toma un cerrojo sobre un mutex interno, así que cada llamada suelta es atómica. Y ahí se acaba la promesa: una secuencia de llamadas sigue sin ser atómica y el iterador no está sincronizado. Para recorrerlo hay que tomar el cerrojo a mano y no soltarlo en todo el bucle, con `synchronized (lista) { for (String s : lista) { ... } }`; si no, otro hilo puede cambiar la lista entre dos `next()` y el iterador lanza `ConcurrentModificationException`.

Además, todas las lecturas pasan por el mismo cerrojo, así que dos lectores se esperan entre sí: en cuanto hay concurrencia de verdad es peor que `ConcurrentHashMap` y que `CopyOnWriteArrayList`. Se queda para código heredado que ya recibía una `List` y para casos tan esporádicos que no merece la pena cambiar el tipo.

## Cuál elegir

| Estructura | Qué garantiza | Cuándo usarla |
| --- | --- | --- |
| `ConcurrentHashMap` | `get` y `put` atómicos, sin cerrojo global; iterador débilmente consistente | Estado compartido por clave, contadores y cachés |
| `CopyOnWriteArrayList` | Lectura sin cerrojo e iterador sobre una foto fija | Muchas lecturas, pocas escrituras y listas pequeñas |
| `ArrayBlockingQueue` | Cola FIFO acotada; `put` y `take` bloquean | Productor y consumidor con memoria limitada |
| `LinkedBlockingQueue` | Cola FIFO con tope opcional y más rendimiento que la de array | Productor y consumidor sin capacidad fija |
| `AtomicInteger`, `LongAdder` | Operaciones atómicas sobre un número | Contadores y estadísticas de muchas escrituras |
| `CountDownLatch`, `Semaphore` | Esperar a que terminen varias tareas; limitar cuántos hilos pasan | Arranques coordinados y cupos de concurrencia |
| `Collections.synchronizedList` | Cada método con cerrojo, pero el iterador no | Código heredado, como última opción |

## Lo que viene

El capítulo 5 cambia de herramienta: `ReentrantLock`, `ReadWriteLock` y las condiciones, que dan más control que `synchronized` y también más formas de equivocarse. Con los cerrojos llegan los interbloqueos y las herramientas para verlos: el thread dump, `jstack` y lo que hay que buscar en la pila cuando dos hilos no avanzan.

## Qué te llevas

- `HashMap` y `ArrayList` no son seguros entre hilos: un redimensionado concurrente pierde entradas y el iterador *fail-fast* avisa cuando detecta el cambio, no siempre.
- `ConcurrentHashMap` hace atómico cada método, no una secuencia: no admite `null`, su `size()` es una estimación con escrituras en marcha y su iterador es débilmente consistente y no lanza `ConcurrentModificationException`.
- `containsKey` más `put`, o `get` más `put`, siguen siendo una carrera: el arreglo es `putIfAbsent`, `compute`, `computeIfAbsent` o `merge`.
- `CopyOnWriteArrayList` copia el array en cada escritura y su iterador es una foto: lectura sin cerrojo para listas pequeñas y con muchas más lecturas que escrituras.
- `ArrayBlockingQueue` y `LinkedBlockingQueue` bloquean al productor con la cola llena y al consumidor con la cola vacía; `offer` y `poll` con plazo acotan la espera.
- `AtomicInteger` da incrementos atómicos con `compareAndSet` por debajo, y `LongAdder` cambia contención por memoria: su `sum()` no es una foto atómica.
- `CountDownLatch` espera a varias tareas una sola vez y `Semaphore` limita cuántos hilos pasan; `Collections.synchronizedList` necesita un `synchronized` externo para recorrer.
