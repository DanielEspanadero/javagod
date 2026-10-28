---
title: 'JUnit 5 en la práctica'
description: 'Organiza pruebas con Jupiter, comprueba resultados y excepciones, parametriza casos y ejecuta la suite desde la terminal.'
section: calidad
order: 2
since: 8
---

## Un ejecutor, no una definición de calidad

JUnit descubre pruebas, prepara su ciclo de vida y presenta los fallos. Tú sigues teniendo que
elegir qué comportamiento merece una aserción. Una barra verde con expectativas equivocadas
no demuestra que el programa cumpla su contrato.

JUnit 5 reúne Platform, que permite descubrir y ejecutar pruebas, y Jupiter, que aporta el
modelo de programación usado aquí. Vintage es el motor para pruebas antiguas de JUnit 3 y 4;
no lo necesitas para estos ejemplos. No mezcles `org.junit.Test` con `org.junit.jupiter.api.Test`.

Este capítulo fija **JUnit Jupiter 5.12.2 y Platform Console Standalone 1.12.2**.
Esa combinación admite Java 8. Las pruebas se han compilado con `--release 8` y ejecutado
con JDK 21. JUnit no forma parte del JDK: aquí descargas un ejecutor a una carpeta temporal,
no añades ninguna dependencia al sitio. JUnit 6 requiere Java 17; no cambies de versión sin revisar el mínimo.

<figure class="diagram diagram--framed">
  <p class="diagram__label">De un archivo a una suite ejecutada</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Compilar</span>
      <code class="diagram__value">javac + API</code>
      <span class="diagram__hint">El compilador necesita las anotaciones y aserciones en el classpath.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Descubrir</span>
      <code class="diagram__value">Platform + Jupiter</code>
      <span class="diagram__hint">El motor reconoce las clases, los métodos y los casos parametrizados.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Informar</span>
      <code class="diagram__value">resultado + exit</code>
      <span class="diagram__hint">La consola muestra los fallos y devuelve un código útil para automatizar.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Tener solo el JAR de la API permite compilar, pero no sustituye al motor ni al lanzador.</figcaption>
</figure>

## Una suite pequeña y completa

Guarda este archivo como `SeatsTest.java`. El modelo está incluido para poder ejecutar el
capítulo sin otros archivos. En una aplicación, importarías la clase de producción.
Hay cinco métodos de prueba: cuatro con `@Test` y uno parametrizado con tres invocaciones.
El resultado es **siete pruebas ejecutadas**, no cinco.

```java
import java.time.Duration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class SeatsTest {
    static final class Seats {
        private int available;

        Seats(int capacity) {
            available = capacity;
        }

        int available() {
            return available;
        }

        void reserve(int count) {
            if (count <= 0) {
                throw new IllegalArgumentException("positive count required");
            }
            if (count > available) {
                throw new IllegalStateException("not enough seats");
            }
            available -= count;
        }
    }

    private Seats seats;

    @BeforeAll
    static void startSuite() {
        System.out.println("suite start");
    }

    @BeforeEach
    void prepareSeats() {
        seats = new Seats(3);
    }

    @AfterEach
    void releaseReference() {
        seats = null;
    }

    @AfterAll
    static void endSuite() {
        System.out.println("suite end");
    }

    @Test
    @DisplayName("Reservar dos deja una plaza")
    void reservingTwoLeavesOneSeat() {
        seats.reserve(2);
        assertEquals(1, seats.available(), "remaining seats after reserving two");
    }

    @Test
    void rejectingExcessLeavesCapacityUnchanged() {
        IllegalStateException error = assertThrows(
                IllegalStateException.class, () -> seats.reserve(4));
        assertAll("rejection",
                () -> assertEquals("not enough seats", error.getMessage()),
                () -> assertEquals(3, seats.available(), "rejection must not consume seats"));
    }

    @ParameterizedTest(name = "reserve {0}, remaining {1}")
    @CsvSource({"1, 2", "2, 1", "3, 0"})
    void validReservationsLeaveExpectedCapacity(int requested, int remaining) {
        seats.reserve(requested);
        assertEquals(remaining, seats.available(), () -> "requested: " + requested);
    }

    @Test
    void readingCapacityFinishesWithinBudget() {
        int available = assertTimeout(Duration.ofSeconds(10), () -> seats.available());
        assertEquals(3, available);
    }

    @Nested
    @DisplayName("Cuando la sala está llena")
    class WhenFull {
        @BeforeEach
        void fillSeats() {
            seats.reserve(3);
        }

        @Test
        void rejectingAnotherSeatKeepsZeroAvailable() {
            assertThrows(IllegalStateException.class, () -> seats.reserve(1));
            assertEquals(0, seats.available());
        }
    }
}
```

Las clases y los métodos de prueba pueden tener visibilidad de paquete: no necesitan ser
`public`, pero no deben ser `private`. Los métodos `@Test` de este ejemplo devuelven `void`.
La clase de producción mínima solo modela reservas; no pretende ser una API completa de aforo.

## El ciclo de vida evita dependencias entre casos

Por defecto, Jupiter crea una instancia de la clase de pruebas por cada prueba, incluidas las
invocaciones parametrizadas. `@BeforeEach` prepara tres plazas antes de cada una y `@AfterEach`
limpia después. Poner `seats = null` ilustra el punto de limpieza, no es necesario para el recolector.
En una prueba con recursos reales, ahí cerrarías lo que hayas abierto para ese caso.

`@BeforeAll` se ejecuta una vez antes de las pruebas de la clase y `@AfterAll` una vez después.
Con el ciclo de vida por defecto, esos dos métodos deben ser estáticos.
`@TestInstance(TestInstance.Lifecycle.PER_CLASS)` permite que no lo sean, pero comparte instancia:
úsalo con una razón concreta y evita que el estado de un caso contamine el siguiente.

`@Nested` agrupa un contexto en una clase interna no estática. Antes del caso de `WhenFull`,
se ejecutan la preparación exterior y después la interior. Los métodos de limpieza siguen el
orden inverso. No uses el orden de ejecución de las pruebas como mecanismo de preparación.
El nombre `startSuite` es descriptivo: `@BeforeAll` no es un gancho global de toda la ejecución.

## Aserciones que explican qué esperabas

En `assertEquals`, escribe primero el esperado y después el real. El mensaje describe la
regla que falla; no sustituye a la comparación ni se imprime cuando todo va bien.
La variante con `Supplier<String>` calcula el mensaje solo si hace falta informar del fallo.

`assertAll` ejecuta las comprobaciones agrupadas y reúne sus fallos, salvo errores irrecuperables.
Aquí mensaje y estado forman una sola promesa de rechazo sin cambios parciales.
Para otros contratos tienes `assertTrue`, `assertNull`, `assertArrayEquals` o `assertSame`.
Este último comprueba identidad; para igualdad de valor consulta [Object y sus contratos](/docs/objetos/object-y-contratos/).

`assertThrows` devuelve la excepción capturada y acepta también subclases del tipo esperado.
Si necesitas exactamente ese tipo, usa `assertThrowsExactly`. Limita la lambda a la operación
que debe fallar; una excepción lanzada durante la preparación no debería hacer pasar el caso.
Los mensajes de excepción solo deben fijarse si son parte del contrato que quieres proteger.

## Tiempo máximo no significa rendimiento garantizado

`assertTimeout` ejecuta en el mismo hilo y comprueba la duración al terminar. Si la operación
no acaba, no la interrumpe al alcanzar el límite. El presupuesto de diez segundos del ejemplo
es deliberadamente amplio; no demuestra que una consulta tenga un rendimiento concreto.

`assertTimeoutPreemptively` ejecuta en otro hilo e intenta interrumpir al superar el tiempo.
Eso puede cambiar el comportamiento de código que usa `ThreadLocal` o transacciones ligadas al hilo.
Además, interrumpir no garantiza que una tarea que ignore la interrupción se detenga.
No confundas estas aserciones con un benchmark ni pongas umbrales de milisegundos dependientes de la máquina.

## Parametriza datos, no historias diferentes

`@CsvSource` suministra las tres parejas de enteros y Jupiter convierte los argumentos.
Cada fila tiene su propio resultado y ejecuta su preparación y limpieza.
La plantilla `name` hace visible la entrada que falló sin leer el cuerpo del método.
Para una lista de valores simples puedes usar `@ValueSource`; para objetos, `@MethodSource`.
Estas fuentes pertenecen a `junit-jupiter-params`, incluido en el ejecutor standalone usado aquí.

Da a los métodos nombres de comportamiento y usa `@DisplayName` para un rótulo legible.
No llames a todos `test1` ni metas errores y éxitos en una tabla con lógica condicional creciente.
Cuando cambie la preparación o la promesa, escribe otro caso o un contexto `@Nested`.

## Ejecuta desde la terminal

En una terminal POSIX con JDK 21 y `curl`, ejecuta lo siguiente y guarda allí `SeatsTest.java`.
La descarga fija una versión; no uses un enlace a «la última» si quieres reproducir el resultado.
El JAR standalone incluye API, motor Jupiter, fuentes parametrizadas y lanzador de consola.

```sh
WORK=$(mktemp -d)
cd "$WORK"
curl -fL -o junit.jar https://repo.maven.apache.org/maven2/org/junit/platform/junit-platform-console-standalone/1.12.2/junit-platform-console-standalone-1.12.2.jar
# Guarda SeatsTest.java en esta carpeta antes de compilar.
mkdir classes
javac --release 8 -Xlint:-options -cp junit.jar -d classes SeatsTest.java
java -jar junit.jar execute --class-path classes --scan-class-path --fail-if-no-tests --details summary --disable-ansi-colors
```

El escaneo descubre `SeatsTest` porque su nombre termina en `Test`. No presupongas que descubre
cualquier nombre: para escoger una clase concreta puedes usar `--select-class SeatsTest` en lugar
de `--scan-class-path`. Aquí «suite» significa el conjunto descubierto, sin necesitar otra clase anotada.

La ejecución verificada devuelve **exit 0: 7 tests found, 7 tests successful, 0 tests failed**.
También aparecen `suite start` y `suite end`; el resumen incluye contenedores y duración variable.
No copies la duración como si fuese una salida estable ni confundas contenedores con pruebas.

## Comprueba también que un fallo se ve

En la carpeta temporal, guarda como `BrokenTest.java` esta expectativa intencionadamente falsa:

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class BrokenTest {
    @Test
    void wrongExpectation() {
        assertEquals(2, 1, "deliberate failure");
    }
}
```

Compila con `javac --release 8 -Xlint:-options -cp junit.jar -d classes BrokenTest.java` y repite
el comando de escaneo anterior. Ahora devuelve **exit 1: 8 tests found, 7 tests successful,
1 test failed**. El diagnóstico contiene `deliberate failure` y `expected: <2> but was: <1>`.
Es una demostración del ejecutor, no una prueba que debas conservar en la suite de trabajo.

## Cuándo no basta JUnit

JUnit organiza comprobaciones de Java, pero no sustituye herramientas especializadas.
Usa JMH para microbenchmarks, un navegador automatizado para interacción visual y herramientas
de carga para tráfico concurrente. Las pruebas de integración pueden ejecutarse con JUnit,
pero necesitan además la base de datos o el servicio real y un entorno aislado.
No conviertas una prueba unitaria en una petición a producción ni confundas un mock con ese entorno.

## Qué te llevas

- Jupiter aporta anotaciones y aserciones; Platform y el motor hacen posible la ejecución.
- Aísla cada caso, nombra la promesa y usa parámetros cuando solo cambien los datos.
- Comprueba excepción y efectos; los límites temporales no son mediciones de rendimiento.
- Ejecuta desde la terminal y mira tanto los recuentos como el código de salida.
