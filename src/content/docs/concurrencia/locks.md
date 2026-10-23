---
title: 'Locks, deadlocks y diagnóstico'
description: 'Cuando synchronized no llega: ReentrantLock, condiciones, cerrojos de lectura y escritura, StampedLock, interbloqueos y su diagnóstico.'
section: concurrencia
order: 5
since: 8
---

## Lo que `synchronized` no sabe hacer

`synchronized` da exclusión y visibilidad, y con `wait` y `notifyAll` da la espera. Lo que no sabe hacer es rendirse si el cerrojo no llega,
entrar sin esperar, repartir los turnos por orden de llegada, dejar que la espera se interrumpa con `interrupt()`, ni tener dos condiciones en
el mismo monitor. Las cinco respuestas están en `java.util.concurrent.locks`.

## `ReentrantLock`: el cerrojo que se suelta a mano

`ReentrantLock` es la misma idea que un monitor, con el cerrojo en la mano: `lock()` para entrar y `unlock()` para salir. Lo que gana está en la
API. `tryLock()` no espera y contesta si entró; `tryLock(200, TimeUnit.MILLISECONDS)` espera ese plazo y contesta `false` si venció;
`lockInterruptibly()` se rinde con `InterruptedException` si interrumpen el hilo que espera; y `new ReentrantLock(true)` reparte el turno al
que lleva más tiempo esperando. Como el monitor, es reentrante: `getHoldCount()` dice cuántas veces lo tomó su dueño y la segunda entrada no
bloquea, así que se suelta con el mismo número de `unlock()` y el último va en un `finally`.

```java
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

public class Intentos {
    public static void main(String[] args) throws InterruptedException {
        ReentrantLock cerrojo = new ReentrantLock();
        CountDownLatch intentos = new CountDownLatch(1);
        cerrojo.lock();                                    // main se queda el cerrojo
        try {
            Thread hilo = new Thread(() -> {
                try {
                    System.out.println("sin plazo: " + cerrojo.tryLock());       // false
                    System.out.println("con plazo: "
                            + cerrojo.tryLock(200, TimeUnit.MILLISECONDS));   // false
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                intentos.countDown();
            }, "aspirante");
            hilo.start();
            intentos.await();              // los dos intentos ya fallaron
            hilo.join();
        } finally {
            cerrojo.unlock();              // el cerrojo queda libre
        }
        System.out.println("fin");
    }
}
```

El orden lo fija un `CountDownLatch`, no la suerte: el plazo de 200 ms vence de verdad porque `main` no suelta el cerrojo hasta que el otro hilo
avisa de que ya intentó las dos veces. La salida es siempre `sin plazo: false`, `con plazo: false` y `fin`, y en un cerrojo justo el plazo respeta
la cola, mientras que `tryLock()` sin plazo se la salta.

> [!OJO]
> `unlock()` va en un `finally`, siempre que el cerrojo se tome sin condición: si el cuerpo lanza una excepción y no se suelta, el cerrojo se
> queda tomado para siempre y el programa se para sin decir nada. Y con el cerrojo tomado no se llama a código ajeno ni se hace entrada o
> salida: un `println`, una consulta o un callback alargan la espera de los demás. Un callback que toma otros cerrojos puede crear un ciclo;
> volver a tomar el mismo `ReentrantLock` desde su hilo dueño no bloquea, porque es reentrante.

## `Condition`: varias salas de espera en un cerrojo

`newCondition()` da un `Condition` atado al cerrojo. `await()` es el `wait` del capítulo 2: solo se puede llamar con el cerrojo tomado (si no,
`IllegalMonitorStateException`), lo suelta mientras duerme y lo vuelve a tomar antes de volver. `signal()` es `notify()` y `signalAll()` es
`notifyAll()`, con la misma regla: la condición se comprueba en un `while`, porque despertar no la garantiza. Lo que añade es que un cerrojo puede
tener varias condiciones, cada una con su cola, así que un `signal` despierta solo a los suyos y no al que no toca, como le pasaba al `notify` del
capítulo 2. Además `await(200, MILLISECONDS)` devuelve un `boolean` con señal o plazo, y existe `awaitUninterruptibly()`, que `wait` no tiene.

```java
import java.util.ArrayDeque;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class Cola {
    private final ArrayDeque<Integer> datos = new ArrayDeque<>();
    private final ReentrantLock cerrojo = new ReentrantLock();
    private final Condition haySitio = cerrojo.newCondition();   // no llena
    private final Condition hayDatos = cerrojo.newCondition();   // no vacia

    void poner(int valor) throws InterruptedException {
        cerrojo.lock();
        try {
            while (datos.size() == 3) {           // capacidad tres
                haySitio.await();                 // suelta el cerrojo mientras espera
            }
            datos.addLast(valor);
            hayDatos.signalAll();                 // hay un dato que antes no estaba
        } finally {
            cerrojo.unlock();
        }
    }

    int quitar() throws InterruptedException {
        cerrojo.lock();
        try {
            while (datos.isEmpty()) {
                hayDatos.await();
            }
            int valor = datos.removeFirst();
            haySitio.signalAll();                 // hay un hueco que antes no estaba
            return valor;
        } finally {
            cerrojo.unlock();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Cola cola = new Cola();
        Thread productor = new Thread(() -> {
            try {
                for (int i = 1; i <= 6; i++) {
                    cola.poner(i);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "productor");
        productor.start();
        int suma = 0;
        for (int i = 0; i < 6; i++) {
            suma += cola.quitar();                // main hace de consumidor
        }
        productor.join();
        System.out.println("suma: " + suma);      // 21, siempre
    }
}
```

Se meten seis números y se sacan seis: la suma es 21 siempre. Quién se bloquea y cuántas veces depende del planificador; que nadie espere para
siempre, no. Cada `await` va en un `while` porque `signalAll` despierta a toda la cola y solo uno encuentra el hueco.

## `ReadWriteLock`: muchos lectores o un escritor

`ReentrantReadWriteLock` parte el cerrojo en dos: `readLock()` lo comparten a la vez todos los lectores y `writeLock()` es exclusivo y excluye
a los dos. Si un lector tiene el de lectura, un segundo lector entra y `getReadLockCount()` vale 2; el de escritura no entra hasta que el
último lector suelta.

Subir no se puede: el hilo que tiene el de lectura y pide el de escritura no lo consigue nunca, porque se quedaría esperando a que él mismo
suelte lo que tiene. Bajar sí: el que tiene el de escritura puede pedir el de lectura. El de lectura tampoco admite `newCondition()`: lanza
`UnsupportedOperationException`, porque la condición vive en el de escritura. Sale a cuenta con lecturas muchas y largas y escrituras pocas;
duele si las lecturas son tan cortas que el cerrojo cuesta más que el trabajo, si las escrituras son frecuentes o si un lector se duerme.

## `StampedLock`: leer sin cerrojo (Java 8)

`StampedLock` (Java 8) no es un `Lock`: cada operación devuelve un `long` que es el sello, y hay que devolverlo para soltar (`unlockRead(sello)`,
`unlockWrite(sello)`). Su gracia es la lectura optimista: `tryOptimisticRead()` da un sello sin bloquear a nadie, copias los campos y
`validate(sello)` contesta si alguien escribió mientras copiabas; si contesta `false`, tiras la copia y repites con `readLock()`. No es reentrante
(no puedes contar con volver a adquirirlo desde el mismo hilo), `readLock()` y `writeLock()` no atienden a `interrupt()` (para eso están `readLockInterruptibly()`
y `writeLockInterruptibly()`) y no tiene dueño. `tryConvertToWriteLock(sello)` intenta subir sin soltar, algo que `ReentrantReadWriteLock` no
permite.

## Deadlock: dos cerrojos que se esperan

Un interbloqueo necesita cuatro condiciones a la vez: exclusión mutua, retener y esperar, sin expropiación y espera circular.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Las cuatro condiciones del interbloqueo</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">Exclusión mutua</span><span class="diagram__hint">Cada cerrojo lo tiene un hilo como mucho.</span></li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">Retener y esperar</span><span class="diagram__hint">Un hilo guarda lo que tiene mientras pide lo que no.</span></li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Sin expropiación</span><code class="diagram__value">tryLock(200, ms)</code><span class="diagram__hint">Nadie quita el cerrojo desde fuera: solo se suelta desde dentro.</span></li>
    <li class="diagram__node"><span class="diagram__index">04</span><span class="diagram__title">Espera circular</span><code class="diagram__value">A espera B</code><span class="diagram__hint">Cada uno espera algo que tiene el siguiente de la cadena.</span></li>
  </ol>
  <figcaption class="diagram__caption">Con las cuatro a la vez el programa no avanza ni termina. El plazo permite abandonar la espera y soltar lo retenido; un orden global evita la espera circular.</figcaption>
</figure>

El caso clásico son dos hilos y dos cerrojos en orden inverso: el primero hace `A.lock(); B.lock();` y el segundo hace `B.lock(); A.lock();`.
Si el primero se queda con A y el segundo con B, cada uno espera el del otro y ninguno suelta lo que tiene: no hay excepción ni mensaje y el
programa no termina. Se evita con un orden global (todo el código toma A antes que B) o sin esperar el segundo cerrojo más allá de un plazo.

```java
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

public class Bloqueo {
    private static final ReentrantLock A = new ReentrantLock();
    private static final ReentrantLock B = new ReentrantLock();

    public static void main(String[] args) throws InterruptedException {
        B.lock();                                  // main se queda B
        try {
            Thread hilo = new Thread(() -> {
                A.lock();                          // el hilo toma A y quiere B
                try {
                    boolean entre = B.tryLock(200, TimeUnit.MILLISECONDS);
                    if (entre) {
                        B.unlock();                // solo se suelta si se entro
                    }
                    System.out.println("segundo cerrojo: " + entre);   // false
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    A.unlock();
                }
            }, "hilo-A");
            hilo.start();
            hilo.join();                           // espera a que se rinda
        } finally {
            B.unlock();
        }

        ThreadMXBean bean = ManagementFactory.getThreadMXBean();
        long[] bloqueados = bean.findDeadlockedThreads();
        System.out.println("en deadlock: "
                + (bloqueados == null ? "ninguno" : bloqueados.length));
    }
}
```

El programa termina: `segundo cerrojo: false` y `en deadlock: ninguno`, en ese orden. Con `lock()` en vez de `tryLock` esa espera no tendría
plazo y `main`, que está en `join()`, no soltaría B: dos hilos parados para siempre. El volcado del proceso lo dice sin adivinar:

```text
Found one Java-level deadlock:
=============================
"hilo-A":
  waiting for ownable synchronizer 0x0000000330014b60,
  (a java.util.concurrent.locks.ReentrantLock$NonfairSync),
  which is held by "hilo-B"
```

Eso imprime `jstack <pid>` (o `jcmd <pid> Thread.print`) cuando hay un interbloqueo de verdad: `Found one Java-level deadlock`, quién espera qué y
quién lo tiene, y la pila de cada hilo con la línea que pidió el cerrojo. La dirección cambia. Aquí `hilo-A` espera el cerrojo de `hilo-B` y
`hilo-B` espera el de `hilo-A`; con `synchronized` el texto habla de un monitor (`waiting to lock monitor`) en vez de un ownable synchronizer. Y
desde el programa, `ThreadMXBean.findDeadlockedThreads()` contesta con los identificadores de los hilos atrapados, o `null` si no hay ninguno.

## `ThreadLocal`: estado por hilo

`ThreadLocal` guarda un valor distinto por hilo sin pasarlo por parámetro: cada hilo ve el suyo. `ThreadLocal.withInitial(...)` (Java 8) fija
el valor de partida, así que `get()` no devuelve `null` la primera vez.

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Ficha {
    private static final ThreadLocal<String> USUARIO =
            ThreadLocal.withInitial(() -> "invitado");

    public static void main(String[] args) {
        ExecutorService pool = Executors.newSingleThreadExecutor();
        pool.execute(() -> {
            USUARIO.set("ana");                       // la tarea deja la ficha puesta
            System.out.println("tarea 1: " + USUARIO.get());
        });
        pool.execute(() -> {
            System.out.println("tarea 2 empieza: " + USUARIO.get());   // ana
            USUARIO.remove();                                          // limpia
            System.out.println("tarea 2 despues: " + USUARIO.get());   // invitado
        });
        pool.shutdown();                    // la JVM espera a que el pool termine
    }
}
```

Las tres líneas son siempre esas. El pool tiene un solo hilo, así que las dos tareas corren en el mismo hilo y la segunda encuentra la ficha de
la primera: `ana`. El valor vive en el hilo, no en la tarea, así que en un servidor con hilos reutilizados el usuario de una petición aparece en
la siguiente; por eso `remove()` se llama al acabar la tarea, y en un `finally` si algo puede fallar. Mientras el hilo viva, la ficha también.

| Mecanismo | Qué añade | Cuándo elegirlo |
| --- | --- | --- |
| `synchronized` | Exclusión, visibilidad y una condición por monitor; se suelta solo | Lo que cabe en un bloque y no necesita plazos ni justicia |
| `ReentrantLock` | `tryLock`, plazos, espera interrumpible, justicia opcional y varias condiciones | Cuando necesitas rendirte, interrumpir o repartir turnos |
| `ReadWriteLock` | Varios lectores a la vez y un escritor; la condición vive en el de escritura | Lecturas muchas y largas, escrituras pocas |
| `StampedLock` | Lectura optimista con sello y validación, sin tomar cerrojo | Lecturas dominantes; no es reentrante y sus cerrojos no atienden a `interrupt()` |

## Lo que viene

El capítulo 6 cambia la pieza de abajo, no la de arriba: los hilos virtuales los gestiona la JVM y cuestan tan poco que puedes tener miles. Los
cerrojos, las condiciones y los interbloqueos son los mismos.

## Qué te llevas

- `ReentrantLock` da `tryLock` con plazo, espera interrumpible, justicia y varias condiciones; `unlock()` va en un `finally`.
- `Condition` es el `wait`/`notify` del capítulo 2 con varias colas; la condición se comprueba siempre en un `while`.
- `ReadWriteLock` deja pasar a muchos lectores o a un escritor: bajar de escritura a lectura se puede, subir no. `StampedLock` lee con un
  sello y valida después, no es reentrante, sus cerrojos no atienden a `interrupt()` y no tiene dueño.
- Un interbloqueo necesita exclusión, retener y esperar, no expropiar y espera circular. Se evita con un orden global o con `tryLock` con
  plazo, y se diagnostica con `jstack`, `jcmd` y `ThreadMXBean.findDeadlockedThreads()`.
- `ThreadLocal` da un valor por hilo; en un pool, la tarea siguiente hereda el de la anterior si no llamas a `remove()`.
