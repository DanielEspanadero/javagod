---
title: 'Hilos y su ciclo de vida'
description: 'Qué es un hilo, cómo se crea y arranca, qué estados atraviesa y cómo esperar, interrumpir y nombrar hilos sin adivinar.'
section: concurrencia
order: 1
since: 8
---

## Un proceso, varios hilos

Un programa Java no se ejecuta dentro de un hilo: se ejecuta dentro de un proceso, la JVM, y ese
proceso puede tener muchos hilos. Cada hilo tiene su propia pila de llamadas y su propio contador de
programa: por ahí va su ejecución, con sus variables locales. Lo que comparten es el heap, donde viven
los objetos, y las variables estáticas. Por eso dos hilos de la misma JVM ven el mismo objeto: si uno
cambia un campo, el otro puede ver el cambio, aunque no en el momento que esperas.

La pila es privada; el heap, no. Un hilo no tiene una copia del objeto: tiene una referencia al mismo
objeto. Y una línea de Java no es atómica por ocupar una línea: `total++` son leer, sumar y escribir, y
el planificador puede cambiar de hilo entre cualquiera de esos pasos. La concurrencia no es solo que las
cosas pasen a la vez; es que pueden entrelazarse.

## Crear un hilo: `Thread` y `Runnable`

Para ejecutar código en otro hilo necesitas un objeto `Thread` y algo que ejecutar. Hay dos caminos:
implementar `Runnable` y pasarlo al constructor, o extender `Thread` y sobrescribir `run()`. El primero
separa la tarea del hilo; el segundo ata la tarea a una subclase de `Thread`.

```java
public class CrearHilos {
    static class Heredero extends Thread {
        Heredero() {
            super("heredero");
        }

        @Override
        public void run() {
            System.out.println("run en " + getName());
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Runnable tarea = () -> System.out.println(
                "Runnable en " + Thread.currentThread().getName());
        Thread hilo = new Thread(tarea, "encargo");

        hilo.start();
        hilo.join();
        tarea.run();
        new Heredero().start();
    }
}
```

`start()` pide a la JVM que arranque un hilo nuevo y que llame a `run()` dentro de él. `run()` es un
método normal: si lo llamas tú, se ejecuta en el hilo que hace la llamada. En el ejemplo, `hilo.start()`
imprime `Runnable en encargo` y `tarea.run()` imprime `Runnable en main`. El `join()` de en medio no
forma parte de la creación: está para que la salida sea la misma en cada ejecución.

El nombre se pasa en el constructor `Thread(Runnable, String)` o se cambia con `setName`; sin nombre,
la JVM pone uno del estilo de `Thread-0`. `Thread.currentThread()` devuelve el hilo que ejecuta la línea.
El nombre del hilo es lo que te permite reconocerlo en un log y en un thread dump. Un dump se pide con
`jcmd <pid> Thread.print` o `jstack <pid>` y muestra, para cada hilo, su nombre, su estado y su pila.
Sin nombres, el dump es una lista de `Thread-12`; con nombres, ves `cobros` o `http-8080`.

## Un hilo se arranca una vez

Un `Thread` representa una ejecución, no una tarea reutilizable. `start()` solo se puede llamar una
vez; el segundo intento lanza `IllegalThreadStateException`, aunque el hilo ya haya terminado. Para
repetir el trabajo, crea otro `Thread` con la misma `Runnable`: la tarea sí se puede reutilizar.

```java
public class UnaVez {
    public static void main(String[] args) throws InterruptedException {
        Thread hilo = new Thread(() -> System.out.println("trabajo"), "unico");
        hilo.start();
        hilo.join();
        try {
            hilo.start();
        } catch (IllegalThreadStateException e) {
            System.out.println("segundo start: " + e.getClass().getSimpleName());
        }
    }
}
```

El estado no vuelve a `NEW` y el hilo no se reinicia. Si lo que quieres es reutilizar hilos en vez de
crear uno por tarea, eso es un pool, y llega en el capítulo 3.

## Los seis estados

`getState()` devuelve un valor de `Thread.State`, una enumeración con seis constantes: `NEW`,
`RUNNABLE`, `BLOCKED`, `WAITING`, `TIMED_WAITING` y `TERMINATED`. La figura agrupa las tres esperas en
una tarjeta para que el ciclo quepa de un vistazo; la tabla las separa.

<figure class="diagram diagram--framed">
  <p class="diagram__label">El ciclo de vida y sus tres esperas</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">NEW</span>
      <span class="diagram__hint">Nadie llamó a <code>start()</code>; <code>start()</code> lo pasa a RUNNABLE.</span></li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">RUNNABLE</span>
      <span class="diagram__hint">Ejecuta o espera turno; de aquí salen las esperas y el final.</span></li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Las tres esperas</span>
      <code class="diagram__value">BLOCKED</code>
      <code class="diagram__value">WAITING</code>
      <code class="diagram__value">TIMED_WAITING</code>
      <span class="diagram__hint">Desde RUNNABLE; monitor, señal o plazo. Vuelven a RUNNABLE.</span></li>
    <li class="diagram__node"><span class="diagram__index">04</span><span class="diagram__title">TERMINATED</span>
      <span class="diagram__hint">Solo desde RUNNABLE; <code>run()</code> vuelve o lanza una excepción.</span></li>
  </ol>
  <figcaption class="diagram__caption">El camino principal es NEW, RUNNABLE, TERMINATED. Las esperas son desvíos: se entra desde RUNNABLE y se vuelve a RUNNABLE; el final solo llega desde RUNNABLE.</figcaption>
</figure>

El recorrido de la figura es el camino principal: `NEW`, `RUNNABLE`, `TERMINATED`. Las esperas son desvíos:
desde `RUNNABLE` se entra en `BLOCKED`, `WAITING` o `TIMED_WAITING`, y desde cualquiera de las tres se
vuelve a `RUNNABLE`; el final solo llega desde `RUNNABLE`. `RUNNABLE` no significa que el hilo use la
CPU, solo que la JVM no lo tiene esperando; el sistema operativo puede no haberle dado turno. Una
espera con plazo no es lo mismo que una sin plazo: `sleep`, `join` con tiempo y `wait` con tiempo son
`TIMED_WAITING`; `join()` sin tiempo, `wait()` sin tiempo y `park()` son `WAITING`. `BLOCKED` es solo
para el monitor de un `synchronized`; una lectura de disco no lo pasa a `BLOCKED`.

| Estado | Entra cuando | Sale cuando |
| --- | --- | --- |
| `NEW` | Creas el `Thread` y nadie llamó a `start()`. | `start()` lo pasa a `RUNNABLE`. |
| `RUNNABLE` | Arranca o vuelve de una espera. | Espera un monitor, una señal o un plazo, o termina. |
| `BLOCKED` | Otro hilo tiene el monitor de un `synchronized`. | El monitor queda libre. |
| `WAITING` | `wait()`, `join()` o `park()` sin plazo. | `notify()`, `notifyAll()`, `unpark()` o el hilo esperado termina. |
| `TIMED_WAITING` | `sleep(ms)`, `wait(ms)`, `join(ms)` o `park` con plazo. | Vence el plazo o llega la misma señal que en `WAITING`. |
| `TERMINATED` | `run()` vuelve o lanza una excepción. | Ya no se sale: el hilo no vuelve a arrancar. |

> [!NOTA]
> La portada de JavaGod simplifica el ciclo en cinco tarjetas y coloca `sleep` en `WAITING`. La API
> separa esa espera en `TIMED_WAITING`, y en este capítulo manda la API: `sleep(1000)` deja el hilo en
> `TIMED_WAITING`, no en `WAITING`.

## Esperar a que termine: `join`

`join()` deja el hilo que lo llama esperando hasta que el hilo destino termina. Sin plazo espera para
siempre; `join(millis)` espera como mucho ese tiempo. Si el destino todavía está en `NEW`, `join()`
vuelve al instante; si el hilo que espera recibe `interrupt()`, `join()` lanza `InterruptedException`.

En el ejemplo, `main` arranca dos hilos, espera a los dos y solo entonces lee lo que escribieron. Cada
hilo escribe un campo distinto; `join()` no solo espera, también hace visibles las escrituras que el
hilo hizo antes de terminar. La suma es 42 en todas las ejecuciones.

```java
public class Estados {
    static int parteA;
    static int parteB;

    public static void main(String[] args) throws InterruptedException {
        Thread a = new Thread(() -> {
            parteA = 21;
            System.out.println("a dentro: " + Thread.currentThread().getState());
        }, "a");
        Thread b = new Thread(() -> parteB = 21, "b");

        System.out.println("antes de start: " + a.getState());
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println("suma: " + (parteA + parteB));
        System.out.println("despues de join: " + a.getState());
    }
}
```

La salida es `antes de start: NEW`, `a dentro: RUNNABLE`, `suma: 42` y `despues de join: TERMINATED`.
Las cuatro líneas salen siempre en ese orden: los dos `join()` fijan los dos puntos que podrían bailar.
El ejemplo pilla tres de los seis estados; los otros tres necesitan una espera que provoque otro hilo.

## Dormir e interrumpir

`Thread.sleep(millis)` deja el hilo en `TIMED_WAITING` y no suelta los monitores que tenga.
`interrupt()` no mata el hilo: pone una marca. Si el hilo está en `sleep`, `wait` o `join`, esa espera
lanza `InterruptedException` y limpia la marca; si ejecuta código normal, la marca queda para que la
consulte. La interrupción es una petición, no una orden.

> [!OJO]
> No te tragues `InterruptedException`. Un `catch` vacío borra la única señal de que alguien quería
> parar el hilo. Si no puedes propagarla, repón la marca con `Thread.currentThread().interrupt()` y
> decide tú cuándo salir.

```java
public class Interrupcion {
    public static void main(String[] args) throws InterruptedException {
        Thread hilo = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    Thread.sleep(10);
                    System.out.println("trabajo");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            System.out.println("salgo con la marca: "
                    + Thread.currentThread().isInterrupted());
        }, "trabajador");

        hilo.start();
        Thread.sleep(100);
        hilo.interrupt();
        hilo.join();
        System.out.println("main sigue");
    }
}
```

El trabajador puede imprimir más o menos líneas `trabajo`: el número de vueltas depende del instante
en que llega la interrupción. Lo que no cambia es el final: `salgo con la marca: true` y luego `main
sigue`, porque `join()` espera a que termine. La marca restaurada hace falsa la condición del bucle.

## Hilos daemon

Un hilo hereda el estado de daemon del hilo que lo crea, y `main` no es daemon: la JVM no termina
mientras quede un hilo de usuario vivo. Un hilo daemon es de servicio: cuando solo quedan daemons, la
JVM se apaga y se los lleva por delante. `setDaemon(true)` solo vale antes de `start()`; sobre un hilo
vivo lanza `IllegalThreadStateException`. Un daemon no es para trabajo que deba terminar: sus `finally`
pueden no ejecutarse. Si `main` crea un daemon que duerme un minuto y termina, el programa acaba en el
acto, no espera ese minuto.

## Dos hilos, un contador

Ahora el primer choque con el estado compartido. Dos hilos incrementan el mismo campo estático.
`total++` no es atómico: leer, sumar y escribir. Si los dos leen el mismo valor, los dos escriben el
mismo resultado y una actualización se pierde.

```java
public class Contador {
    static int total;

    public static void main(String[] args) throws InterruptedException {
        Runnable sumar = () -> {
            for (int i = 0; i < 1_000_000; i++) {
                total++;
            }
        };
        Thread a = new Thread(sumar, "a");
        Thread b = new Thread(sumar, "b");

        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println("total: " + total); // puede ser menos de 2000000
    }
}
```

Este ejemplo no es determinista. Puede imprimir 2000000 si el planificador no cruza ninguna
actualización, y menos si las cruza; nunca más, porque las actualizaciones se pierden, no se inventan.
En cincuenta ejecuciones de prueba el número siempre quedó por debajo del total; el tuyo puede ser otro.

La causa no es que `int` sea lento: es que la operación no es indivisible. El capítulo 2 explica la
memoria compartida y la sincronización; aquí basta con ver el síntoma.

## Lo que cuesta un hilo

Un hilo de plataforma es un hilo del sistema operativo: la JVM pide uno al sistema operativo y cada uno
tiene su pila. Crear miles es caro en memoria y en cambios de contexto. El capítulo 3 trae los executors
y los pools, que reutilizan hilos; el capítulo 6 trae los hilos virtuales, que gestiona la JVM y son
mucho más baratos. En este capítulo trabajas con hilos de plataforma.

## Lo que viene

El capítulo 2 entra en la memoria compartida: por qué el contador pierde actualizaciones, qué garantiza
`synchronized`, para qué sirve `volatile` y cómo esperar y despertar hilos sin perder señales.

## Qué te llevas

- Un hilo tiene pila y contador de programa propios y comparte el heap; dos hilos ven los mismos objetos.
- `Thread` y `Runnable` son las dos formas de crear un hilo; `start()` arranca un hilo nuevo y `run()`
  es una llamada normal en el hilo actual.
- Un `Thread` se arranca una sola vez: el segundo `start()` lanza `IllegalThreadStateException`, aunque
  el hilo ya haya terminado.
- `Thread.State` tiene seis valores: `NEW`, `RUNNABLE`, `BLOCKED`, `WAITING`, `TIMED_WAITING` y
  `TERMINATED`; `getState()` los lee y `join()` espera a que el hilo termine.
- `sleep` deja el hilo en `TIMED_WAITING`; `interrupt()` pide parar, no mata, y `InterruptedException`
  no se traga: se propaga o se repone la marca con `Thread.currentThread().interrupt()`.
- Un daemon no impide que la JVM termine; `setDaemon(true)` va antes de `start()`. Nombra los hilos
  para que los logs y los thread dumps se lean mejor.
- Dos hilos que incrementan el mismo campo pierden actualizaciones; el resultado puede ser menor que el
  total esperado. Los hilos de plataforma son caros: los pools llegan en el capítulo 3 y los virtuales
  en el 6.
