---
title: 'BigDecimal y aritmética decimal'
description: 'Representa cantidades decimales exactas y decide su escala, comparación y redondeo sin arrastrar errores binarios.'
section: biblioteca
order: 5
since: 8
---

## Un decimal con reglas explícitas

Para medir una distancia aproximada, `double` suele encajar. Para sumar importes cuya representación
decimal debe ser exacta, necesitas otro contrato: `BigDecimal`, del paquete `java.math`.
No representa una moneda ni decide impuestos por ti; representa números decimales y deja que tú
elijas las reglas de cálculo y redondeo.

Los ejemplos de este capítulo son programas completos compatibles con Java 8. Puedes compilarlos
con el JDK 21 usando `javac --release 8 Nombre.java` y ejecutarlos con `java Nombre`.

<figure class="diagram diagram--framed">
  <p class="diagram__label">De la entrada al importe final</p>
  <ol class="diagram__flow">
    <li class="diagram__node"><span class="diagram__index">01</span><span class="diagram__title">Entrada exacta</span>
      <code class="diagram__value">"19.90"</code>
      <span class="diagram__hint">El texto conserva el decimal que quieres representar.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">02</span><span class="diagram__title">Cálculo</span>
      <code class="diagram__value">multiply / add</code>
      <span class="diagram__hint">Cada operación devuelve un valor nuevo.</span>
    </li>
    <li class="diagram__node"><span class="diagram__index">03</span><span class="diagram__title">Regla de salida</span>
      <code class="diagram__value">setScale</code>
      <span class="diagram__hint">Escala y redondeo elegidos por tu dominio.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">La exactitud de la entrada y la política de redondeo son decisiones distintas.</figcaption>
</figure>

## Construye desde texto, no desde un literal double

`0.1` es un literal `double`: antes de llamar al constructor ya se ha convertido en una aproximación
binaria. `new BigDecimal(0.1)` conserva exactamente esa aproximación, no el decimal que tenías en mente.

Guarda como `DecimalInput.java`:

```java
import java.math.BigDecimal;

public class DecimalInput {
    public static void main(String[] args) {
        System.out.println(new BigDecimal(0.1));
        BigDecimal first = new BigDecimal("0.1");
        BigDecimal second = new BigDecimal("0.2");
        System.out.println(first.add(second));
        System.out.println(BigDecimal.valueOf(0.1));
    }
}
```

Salida:

```text
0.1000000000000000055511151231257827021181583404541015625
0.3
0.1
```

`BigDecimal.valueOf(double)` usa la representación textual canónica del `double`, por eso el último
resultado es más corto. Es preferible al constructor de `double` cuando ya recibes ese tipo, pero
no recupera precisión perdida por cálculos anteriores. Si controlas la entrada, conserva el texto
o usa unidades enteras con una escala conocida.

El constructor de texto espera punto decimal, no una coma española ni símbolos de moneda.
`"19,90"` no es una entrada válida y lanza `NumberFormatException`. Separar presentación y cálculo
es tan importante aquí como al trabajar con fechas.

## Valor sin escala, escala sin misterio

El modelo es un entero sin escala multiplicado por diez elevado a menos la escala.
Así, `19.90` tiene entero sin escala `1990` y escala `2`. La escala cuenta posiciones decimales;
la precisión cuenta los dígitos del entero sin escala, no solo los que hay tras el punto.

Guarda como `DecimalScale.java`:

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

public class DecimalScale {
    public static void main(String[] args) {
        BigDecimal price = new BigDecimal("19.90");
        System.out.println(price.unscaledValue());
        System.out.println(price.scale());
        System.out.println(price.precision());
        BigDecimal padded = price.setScale(3);
        System.out.println(padded);
        System.out.println(price);
        System.out.println(new BigDecimal("19.995")
                .setScale(2, RoundingMode.HALF_UP));
    }
}
```

Salida:

```text
1990
2
4
19.900
19.90
20.00
```

`BigDecimal` es inmutable: `setScale` no cambia `price`. Lo mismo ocurre con `add`, `subtract`,
`multiply` y `divide`; asigna el resultado o lo perderás. No hay operadores `+` y `*` para estos objetos.

Aumentar la escala añade ceros sin perder información. Reducirla puede exigir redondeo:
`setScale(2)` sin modo lanza `ArithmeticException` si tendría que descartar dígitos no nulos.
Si quieres comprobar que una cantidad ya cumple tu escala, usa `RoundingMode.UNNECESSARY`.

La escala puede ser negativa. Al eliminar ceros finales de `1000`, por ejemplo, puedes obtener
una representación científica con escala `-3`. No deduzcas que todas las escalas son positivas
ni uses `stripTrailingZeros()` como formato para importes.

## Igualdad numérica e igualdad de representación

`2.0` y `2.00` valen lo mismo numéricamente, pero tienen escalas distintas. `equals` compara
valor y escala; `compareTo` compara el valor numérico. Decide qué igualdad necesita tu operación.

Guarda como `DecimalEquality.java`:

```java
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

public class DecimalEquality {
    public static void main(String[] args) {
        BigDecimal first = new BigDecimal("2.0");
        BigDecimal second = new BigDecimal("2.00");
        System.out.println(first.equals(second));
        System.out.println(first.compareTo(second) == 0);
        Set<BigDecimal> hashed = new HashSet<>();
        Set<BigDecimal> sorted = new TreeSet<>();
        hashed.add(first);
        hashed.add(second);
        sorted.add(first);
        sorted.add(second);
        System.out.println(hashed.size());
        System.out.println(sorted.size());
    }
}
```

Salida:

```text
false
true
2
1
```

`HashSet` usa `equals` y `hashCode`; `TreeSet` usa su orden, aquí el natural definido por `compareTo`.
Esta diferencia no es un fallo de la colección. Si vas a usar importes como claves, fija una política
de escala antes de almacenarlos y aplícala en todas las entradas. Repasa
[el contrato de equals](/docs/objetos/object-y-contratos/) si necesitas diseñar un tipo monetario propio.

## Dividir obliga a elegir

Un decimal finito no puede representar exactamente un tercio. `divide` sin política no adivina
cuántas cifras quieres: lanza `ArithmeticException` si el resultado tiene expansión decimal infinita.

Guarda como `DecimalDivision.java`:

```java
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

public class DecimalDivision {
    public static void main(String[] args) {
        BigDecimal one = BigDecimal.ONE;
        BigDecimal three = new BigDecimal("3");
        try {
            one.divide(three);
        } catch (ArithmeticException e) {
            System.out.println("Hace falta redondear");
        }
        System.out.println(one.divide(three, 2, RoundingMode.HALF_UP));
        System.out.println(new BigDecimal("10.00")
                .divide(new BigDecimal("4"), 2, RoundingMode.UNNECESSARY));
        System.out.println(new BigDecimal("123.45")
                .round(new MathContext(3, RoundingMode.HALF_EVEN)));
    }
}
```

Salida:

```text
Hace falta redondear
0.33
2.50
123
```

`divide(divisor, 2, modo)` pide dos posiciones decimales. `MathContext(3, modo)` pide tres dígitos
significativos: precisión y escala no son intercambiables. Ojo con `divide(divisor, modo)`:
esa sobrecarga conserva la escala del dividendo, no añade dos decimales por defecto.

| Modo | Regla |
| --- | --- |
| `HALF_UP` | Al más cercano; los empates se alejan de cero |
| `HALF_EVEN` | Al más cercano; en empate queda par el último dígito retenido |
| `DOWN` | Hacia cero, también para negativos |
| `FLOOR` | Hacia menos infinito |
| `UNNECESSARY` | Rechaza cualquier operación que necesite redondeo |

> [!AVISO]
> Dos decimales y `HALF_UP` no son una ley universal del dinero. La moneda, el reparto y las normas
> del cálculo determinan cuándo y cómo redondear. Redondear cada línea o solo el total puede dar
> resultados distintos; documenta la política en vez de repartir llamadas a `setScale` por el código.

## Mostrar no es calcular

`toString()` puede usar notación científica; `toPlainString()` no usa exponente.
Ninguno añade separadores de miles ni un símbolo monetario. Para presentar según un locale, utiliza
`NumberFormat`, manteniendo el `BigDecimal` como valor del cálculo.

Una escala de dos tampoco evita dividir entre cero: eso sigue siendo `ArithmeticException`.
Valida las reglas de negocio en la frontera y no captures una excepción para devolver cero en silencio.

## Qué te llevas

- Construye los decimales controlados desde texto o unidades enteras, no desde literales `double`.
- Escala y precisión describen cosas distintas; las operaciones devuelven valores nuevos.
- Usa `compareTo` para igualdad numérica y recuerda que `equals` también exige la misma escala.
- En divisiones no exactas, elige escala o precisión y un modo de redondeo explícito.
- Separa la política monetaria y la presentación del cálculo decimal.
