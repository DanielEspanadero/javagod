---
title: 'Elegir un IDE para Java'
description: 'Criterios para elegir entre IntelliJ IDEA, VS Code, Eclipse y NetBeans según tu forma de aprender y trabajar.'
section: entorno
order: 2
since: 8
---

No necesitas acertar con una herramienta definitiva para empezar con Java.
Elige una que puedas usar con comodidad, que entienda tu proyecto y que no te
obligue a aprender su configuración antes de escribir tu primera clase.
Tus conocimientos de Java no dependen de esa elección.

**Comparación revisada el 29 de octubre de 2026 (2026-10-29).**
Este capítulo es documental: sus valoraciones no se pueden demostrar ejecutando
un programa, a diferencia de los ejemplos del resto del curso.
Las licencias, la compatibilidad y las integraciones pueden cambiar.
Lo que se atribuye a los productos describe la situación en el momento de revisar este capítulo,
no una garantía para futuras entregas ni una prueba en tu ordenador.

## Primero, decide qué necesitas

Un editor te permite modificar texto; un entorno de desarrollo integrado, o
**IDE**, reúne además navegación por el código, análisis, ejecución y depuración.
Un editor ampliado mediante extensiones también puede cubrir ese trabajo.
La frontera importa menos que las tareas que puedas realizar sin fricción.

Antes de mirar nombres, ordena estos criterios según tu situación.
Si tu portátil va justo de memoria, ese límite puede pesar más que una
integración que todavía no utilizas. Si trabajas en equipo, importa que puedas
abrir su proyecto sin cambiar la forma en que se construye.

### Coste y licencia

Distingue entre descarga gratuita, software libre y uso permitido por tu licencia.
No significan lo mismo: comprueba si puedes estudiar, trabajar y distribuir
extensiones con las condiciones que necesitas.
Una opción de pago puede encajar en tu trabajo sin ser necesaria para aprender.
Consulta las condiciones vigentes de la edición y de cada complemento antes de
instalarlo; una licencia educativa puede tener límites de uso profesional.

### LTS actual y funciones preview

Separa tres preguntas: qué JDK necesita el editor para arrancar, con qué JDK
compila tu proyecto y qué sintaxis entiende su analizador.
Que el IDE se abra no demuestra que comprenda el Java de tu proyecto.

En el momento de revisar este capítulo, la LTS actual es Java 25.
Esta referencia es posterior a Java 8 y no cambia el mínimo del capítulo:
los criterios también te sirven para elegir una herramienta para proyectos antiguos.
Comprueba la LTS que necesites en las notas de compatibilidad del producto.

Las funciones *preview* son características provisionales de una entrega de Java.
No presupongas que soporte de la LTS y soporte de previews sean equivalentes.
Conviene comprobar la versión exacta del JDK, el analizador y las opciones de
compilación y ejecución. No necesitas previews para empezar este curso.

### Refactorización y depuración

Refactorizar es cambiar la estructura del código sin cambiar su comportamiento.
Valora si puedes renombrar un método y revisar sus usos, extraer otro método o
mover una clase con una vista previa comprensible de los cambios.
Eso aporta más información que contar acciones en un menú.

Para depurar, busca puntos de interrupción, ejecución paso a paso, inspección de
variables y una pila de llamadas que puedas recorrer.
Comprueba que entiendes cómo iniciar la depuración y detener el programa.
Una interfaz con muchos paneles no garantiza que te resulte más clara.

### Maven y Gradle

Maven y Gradle describen cómo construir un proyecto y resolver sus dependencias.
No son dialectos de Java ni sustitutos del editor.
Aquí te interesa que la herramienta importe el proyecto, sincronice las
bibliotecas y permita ejecutar sus tareas sin inventar una configuración paralela.

Comprueba ambos si los necesitas: que un editor importe Maven no demuestra que
su integración con Gradle tenga el mismo alcance.
En un equipo, conserva los archivos de construcción compartidos como referencia.
El tutorial para aprender esas herramientas queda fuera de esta comparación.

### Peso, respuesta y comunidad

No midas solo el tamaño de la descarga: observa el arranque, la indexación inicial,
la respuesta al escribir y el consumo mientras depuras.
Un editor pequeño con muchas extensiones puede acabar consumiendo más recursos
de los que esperabas. Prueba con un proyecto parecido al tuyo.

El ecosistema importa cuando falta una integración o aparece un problema.
Busca documentación mantenida, respuestas recientes y complementos cuyo origen
y permisos entiendas. Instalar muchos no equivale a trabajar con más comodidad.
Comprueba su mantenimiento y su compatibilidad antes de depender de ellos.

### Accesibilidad y uso con teclado

Prueba el lector de pantalla que utilices, el contraste, el tamaño del texto y
el foco visible. Revisa también los paneles de errores y el depurador, no solo
el área donde escribes: una extensión puede tener otra calidad de acceso.

Intenta abrir un archivo, buscar una clase, ir a su definición, renombrarla e
iniciar la depuración sin ratón. Comprueba que puedes reasignar los atajos que
chocan con tu teclado o con las herramientas de asistencia del sistema.
No hay una valoración de accesibilidad que sustituya esa prueba personal.

<figure class="diagram diagram--framed">
  <p class="diagram__label">Una elección reversible</p>
  <ol class="diagram__flow">
    <li class="diagram__node">
      <span class="diagram__index">01</span>
      <span class="diagram__title">Necesidades</span>
      <span class="diagram__hint">Prioriza recursos, licencia y acceso.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">02</span>
      <span class="diagram__title">Prueba breve</span>
      <span class="diagram__hint">Abre, renombra y depura el mismo proyecto.</span>
    </li>
    <li class="diagram__node">
      <span class="diagram__index">03</span>
      <span class="diagram__title">Decisión provisional</span>
      <span class="diagram__hint">Conserva tu código y cambia si hace falta.</span>
    </li>
  </ol>
  <figcaption class="diagram__caption">Compara tareas concretas, no una lista de funciones que quizá no uses.</figcaption>
</figure>

## Comparación orientativa

La tabla resume tendencias **en el momento de revisar este capítulo**.
No es una matriz de compatibilidad por versión ni una medición de rendimiento.
Cada celda de producto queda limitada a esa revisión: confirma las condiciones,
el soporte de tu JDK y los complementos necesarios antes de decidir.

| Criterio | IntelliJ IDEA Community | IntelliJ IDEA Ultimate | VS Code con Extension Pack for Java | Eclipse IDE | Apache NetBeans |
| --- | --- | --- | --- | --- | --- |
| Coste y licencia | Base comunitaria gratuita y de código abierto; comprueba cómo se ofrece en la distribución vigente. | Oferta de pago con condiciones específicas; comprueba posibles modalidades gratuitas y sus límites. | Editor y pack gratuitos; revisa por separado las licencias de la distribución y las extensiones. | Gratuita y de código abierto; revisa las licencias de los complementos. | Gratuita y de código abierto; revisa las condiciones de módulos adicionales. |
| LTS y previews | Comprueba la compatibilidad del analizador y del JDK del proyecto; las previews requieren revisión aparte. | Comprueba el mismo encaje entre analizador, JDK y previews; pagar no garantiza soporte inmediato. | Depende del soporte Java instalado y del JDK configurado; confirma las previews por separado. | Comprueba el nivel de Java admitido por JDT y las actualizaciones para previews. | Comprueba el nivel de Java admitido por el editor y sus requisitos para previews. |
| Refactorización | Suele encajar si buscas navegación y cambios estructurales centrados en Java. | Comparte ese enfoque; valora si tus otras tecnologías justifican ampliar la edición. | El soporte Java aporta refactorizaciones; comprueba las que necesita tu proyecto. | JDT suele ofrecer un flujo de refactorización integrado con sus vistas de Java. | Suele reunir las refactorizaciones habituales en una interfaz centrada en el proyecto. |
| Depuración | Flujo integrado; comprueba que te orientas en variables y pila. | Flujo integrado; valora las integraciones adicionales solo si las necesitas. | El pack incorpora soporte de depuración; puede requerir ajustar el lanzamiento. | Depurador integrado con perspectivas y vistas que conviene aprender. | Depurador integrado; comprueba cómo inicia tu aplicación y presenta sus hilos. |
| Maven y Gradle | Integraciones orientadas a importar y sincronizar el proyecto; verifica ambos casos. | Valora el mismo flujo con las tecnologías de tu equipo; verifica ambos casos. | Maven forma parte del enfoque del pack; para Gradle conviene comprobar extensiones adicionales. | Maven suele encajar con m2e; para Gradle conviene comprobar Buildship y el paquete instalado. | Suele permitir trabajar con proyectos Maven y Gradle; comprueba la importación del tuyo. |
| Peso y respuesta | La indexación puede notarse; prueba con tu memoria y tamaño de proyecto. | Las integraciones activas pueden añadir carga; mide con lo que vayas a usar. | Arranque del editor y servicios Java tienen costes distintos; mide con el pack activo. | El paquete y los plugins influyen; comprueba la respuesta tras indexar. | El tamaño del proyecto y los módulos activos influyen; prueba durante la depuración. |
| Plugins y comunidad | Ecosistema compartido con IDEA; revisa requisitos de edición de cada plugin. | Valora su catálogo según tu trabajo, no por la cantidad de plugins. | Ecosistema amplio para varios lenguajes; comprueba compatibilidad y mantenimiento. | Ecosistema de plugins y documentación de Java; elige un paquete coherente. | Comunidad Apache y módulos; verifica mantenimiento para tus necesidades concretas. |
| Accesibilidad y teclado | Prueba navegación, foco y lector de pantalla con tus ajustes. | Prueba también los paneles de las integraciones adicionales. | Prueba editor y extensiones: la accesibilidad de uno no demuestra la del conjunto. | Comprueba perspectivas, foco y atajos con tu sistema de asistencia. | Comprueba navegación de proyectos, salida y depurador sin ratón. |

**Community y Ultimate no son dos formas de Java.** En el momento de revisar
este capítulo, esos nombres distinguen ofertas cuyo empaquetado y condiciones
conviene confirmar en la distribución vigente de IntelliJ IDEA.
No deduzcas que necesitas una suscripción por ver una función en una guía.
Comprueba primero si esa función pertenece a tu edición y si realmente la necesitas.

En el momento de revisar este capítulo, el Extension Pack for Java reúne
extensiones para convertir VS Code en un entorno de trabajo con Java.
El coste práctico de ese enfoque puede estar en coordinar extensiones, servicios
y JDK, no necesariamente en pagar una licencia.

En el momento de revisar este capítulo, Eclipse organiza parte de su trabajo
mediante perspectivas y vistas, mientras NetBeans suele presentar el proyecto
como eje de navegación. Prueba esos modelos: que una interfaz te resulte familiar
puede reducir más fricción que una diferencia en el catálogo de complementos.

## Elige según tu perfil

### Tus primeros pasos

Si sigues una clase o tienes a alguien que te ayuda, suele convenir empezar con
su entorno: podréis hablar de las mismas acciones sin traducir cada pantalla.
IntelliJ IDEA en su oferta gratuita o NetBeans pueden ser candidatos si prefieres
un flujo Java integrado; Eclipse también encaja si cuentas con una guía cercana.
Antes de añadir plugins, aprende a abrir, ejecutar y detener tu programa.

### Estudio ocasional

Si ya usas VS Code para otros lenguajes, prueba el Extension Pack for Java antes
de mantener otro editor. Si cada sesión empieza reparando la configuración,
valora un IDE integrado y conserva un proyecto pequeño que puedas reabrir.
La continuidad entre sesiones puede importar más que disponer de muchas acciones.

### Trabajo profesional

Empieza por el proyecto y los acuerdos del equipo: JDK, construcción, pruebas,
depuración y licencias permitidas. Compara IDEA, Eclipse, NetBeans o VS Code
sobre ese repositorio, no sobre un archivo vacío.
Valora Ultimate si las integraciones que necesitas justifican una opción de pago;
no deduzcas que el trabajo profesional exige esa edición.

### Equipos con pocos recursos

Prueba VS Code con las extensiones necesarias, pero mide también los servicios
Java que arranca. Compara con una instalación ajustada de Eclipse o NetBeans,
y no descartes ni elijas IDEA solo por su reputación de consumo.
Cierra proyectos que no uses y repite la prueba tras la indexación inicial.
Si el equipo no responde con comodidad, un editor sencillo y el JDK pueden
servirte para empezar; renuncias a ayudas, no al lenguaje.

## Una prueba antes de quedarte

Dedica una sesión breve a un mismo proyecto pequeño en tus dos candidatos.
No necesitas convertir la elección en otra asignatura.

1. Comprueba licencia, requisitos y soporte del JDK que vas a utilizar.
2. Abre el proyecto y espera a que termine el análisis inicial.
3. Busca una clase y renombra un método revisando qué archivos cambiarían.
4. Detén la ejecución en un punto e inspecciona una variable.
5. Si usas Maven o Gradle, comprueba importación y ejecución de una tarea.
6. Repite las acciones importantes con teclado y tus ajustes de accesibilidad.

Anota dónde te has atascado y si la documentación te ha permitido continuar.
No necesitas puntuaciones universales: buscas un entorno que te deje practicar.
Guarda el código y la configuración compartida del proyecto, no solo ajustes locales.

## Qué te llevas

Todo IDE acaba llamando al mismo `javac` cuando delegas la compilación al JDK
del proyecto: elegir editor no cambia el lenguaje que estás aprendiendo.
Eso no significa que sus analizadores internos sean idénticos. En el momento de
revisar este capítulo, Eclipse utiliza también su compilador de Java, ECJ;
conviene distinguir el análisis del editor de la construcción que has configurado.
Para comparar resultados, comprueba JDK, opciones y herramienta de construcción.

Puedes seguir el recorrido de fuente, compilación y ejecución en
[Hola, mundo](/docs/fundamentos/hola-mundo/), sin depender de un botón concreto.
El editor se puede cambiar más adelante sin coste para tus conocimientos de Java:
quizá tengas que aprender otros atajos y ajustes, pero clases, tipos y métodos
siguen siendo lo que ya has aprendido.
