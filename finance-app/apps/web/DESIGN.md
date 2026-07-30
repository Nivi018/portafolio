---
name: Personal Finance Web
description: Una consola diaria para registrar, comprender y sostener hábitos financieros personales.
colors:
  primary: "#4EA5FF"
  primary-strong: "#2377D4"
  canvas: "#0B1212"
  surface: "#101C1B"
  surface-raised: "#162725"
  line: "rgba(214, 255, 242, 0.1)"
  overlay-line: "rgba(255, 255, 255, 0.12)"
  text: "#EEFBF6"
  muted: "#8CA59E"
  alert: "#FF8374"
typography:
  display:
    fontFamily: "Aptos, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Aptos, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Aptos, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Aptos, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.2em"
  micro:
    fontFamily: "Aptos, Trebuchet MS, Segoe UI, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  control: "12px"
  card: "16px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  card-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  input-default:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
---

# Design System: Personal Finance Web

## Overview

**Creative North Star: "La consola de hábito financiero"**

Esta interfaz convierte un ritual diario potencialmente pesado en una consola de progreso: ordenada, inmediata y lo bastante agradable como para invitar al regreso. La aplicación no debe tratar las finanzas como una hoja de cálculo fría ni como una alarma constante; su papel es ofrecer contexto y control con una calma premium.

El sistema combina una base oscura, superficies estratificadas y un azul de avance para que los datos se sientan confiables y vivos. La elevación se usa de forma consistente en toda la aplicación para que cards, formularios, navegación y acciones importantes compartan una sensación de objeto cuidado, no de panel plano.

**Key Characteristics:**
- Oscuro, profundo y sereno, sin parecer pesado.
- Azul de progreso reservado para acción, selección y avance positivo.
- Elevación suave pero presente en toda la aplicación.
- Información financiera escaneable con jerarquías compactas.
- Interacciones cotidianas amigables, rápidas y sin dramatismo.

## Colors

La paleta usa un entorno carbón verdoso como contenedor silencioso; el azul es la señal de avance y el coral aparece solo cuando un gasto, alerta o error necesita atención.

### Primary
- **Azul de Progreso:** se usa para acciones principales, navegación activa, foco, estados de avance y elementos que invitan a continuar. Su función es transmitir progreso confiable, no urgencia.
- **Azul de Profundidad:** refuerza hover y estados activos manteniendo la sensación premium y serena.

### Secondary
- **Coral de Atención:** reservado para gastos, excedentes, errores y acciones destructivas. Nunca compite con el azul en una misma jerarquía de acciones.

### Neutral
- **Carbón de Fondo:** sostiene el canvas de la aplicación y absorbe el ruido visual.
- **Superficie Profunda:** forma cards, paneles y sidebar sin romper la continuidad oscura.
- **Superficie Elevada:** da estructura a campos, selects y capas internas.
- **Marfil Frío:** texto prioritario y cifras principales.
- **Verde Grisáceo:** textos auxiliares, labels y metadatos.

**The Progress Signal Rule.** El azul solo significa avance, acción disponible, selección o foco. No se usa como relleno decorativo masivo.

## Typography

**Display Font:** Aptos, Trebuchet MS, Segoe UI, sans-serif.
**Body Font:** Aptos, Trebuchet MS, Segoe UI, sans-serif.

**Character:** Una sans neutral y directa sostiene el uso repetido. El peso y el contraste, no la ornamentación, hacen que los números se sientan importantes y las explicaciones sigan siendo ligeras.

### Hierarchy
- **Display** (600, 2.25rem, 1.1): títulos de página y declaraciones de contexto financiero.
- **Title** (600, 1.5rem, 1.2): valor principal en cards y títulos de sección.
- **Body** (400, 0.875rem, 1.5): descripciones, movimientos y ayuda contextual.
- **Label** (600, 0.75rem, 0.2em): eyebrows y taxonomías de pantalla en mayúsculas.
- **Micro** (600, 0.625rem, 1.2): etiquetas compactas de navegación móvil.

**The Number First Rule.** Saldos, montos y porcentajes usan mayor tamaño y contraste que sus etiquetas; la lectura debe funcionar de un vistazo.

## Layout

La app usa un shell de sidebar fija de 256px en escritorio y navegación inferior en móvil. El contenido vive en un contenedor amplio con máximo de 1560px y ritmo de 24px entre bloques principales. Las pantallas operativas privilegian grids de dos columnas para combinar captura y contexto; en móvil se convierten en una columna sin ocultar información esencial.

La densidad es media: los datos se agrupan en cards, pero cada bloque deja suficiente aire para que consultar diariamente no se sienta como revisar una planilla. Los encabezados de página separan eyebrow, título y explicación antes de cualquier acción.

## Elevation & Depth

La dirección es tonal y elevada. El fondo permanece profundo; las superficies se levantan con capas más claras, bordes de baja opacidad y sombras difusas consistentes. Las sombras deben ser visibles sin ser teatrales: comunican prioridad, foco y materialidad premium en toda la app.

**The Consistent Lift Rule.** Cards, formularios, sidebar, navegación móvil y overlays usan la misma familia de elevación. No mezclar zonas planas sin intención con componentes altamente elevados.

## Shapes

Los controles tienen esquinas suavemente redondeadas (12px) y los contenedores mayores usan 16px. Las esquinas no son decorativas: reducen tensión visual y hacen que la interacción frecuente se perciba amable. Los pills se reservan para estados compactos o etiquetas, nunca para convertir toda la interfaz en una colección de cápsulas.

## Components

### Buttons
- **Shape:** rectángulos suavizados (12px) con peso semibold.
- **Primary:** azul de progreso, texto en carbón y padding compacto para acciones frecuentes.
- **Hover / Focus:** azul de profundidad, elevación sutil y foco perceptible.
- **Secondary / Ghost:** superficie elevada o borde translúcido; nunca deben parecer una acción principal disfrazada.

**Implementation:** los nuevos botones principales usan `.ui-button-primary`; evita valores hexadecimales dentro del markup. Los formularios usan `.ui-field` y los contenedores elevados `.ui-card` para conservar la misma familia de superficie, foco y elevación.

### Cards / Containers
- **Corner Style:** esquinas de 16px.
- **Background:** superficie profunda sobre canvas carbón.
- **Shadow Strategy:** elevación difusa en reposo; más definida para acciones o capas prioritarias.
- **Border:** línea translúcida de bajo contraste para conservar separación sin fragmentar la pantalla.
- **Internal Padding:** 20–24px según densidad del contenido.

### Inputs / Fields
- **Style:** superficie elevada, borde translúcido y texto claro.
- **Focus:** borde azul de progreso y una sombra de foco suave; el foco nunca depende solo del color de texto.
- **Error / Disabled:** coral para error, opacidad reducida para estado deshabilitado sin perder legibilidad.

### Navigation
- **Desktop:** sidebar oscura elevada; item activo en azul de progreso, icono y label alineados en 8–12px de ritmo.
- **Mobile:** navegación inferior elevada, con icono y label breve; el estado activo se reconoce sin depender exclusivamente del color.

### Metric Cards
- **Style:** card elevada con label discreto, cifra dominante e icono contenido en superficie secundaria.
- **State:** azul para progreso/acción, coral para salida, gasto o alerta; los cambios incluyen iconografía direccional además de color.

## Do's and Don'ts

### Do:
- **Do** usar azul de progreso para acciones principales, selección, foco y avance positivo.
- **Do** mantener una familia de elevación consistente en toda la aplicación.
- **Do** hacer que cifras y estados financieros se entiendan antes que el copy auxiliar.
- **Do** conservar el fondo oscuro como contexto tranquilo y las superficies como capas legibles.
- **Do** diseñar formularios y movimientos para repetirse a diario sin fatiga visual.

### Don't:
- **Don't** usar coral como color decorativo o acción primaria.
- **Don't** aplanar componentes importantes cuando el resto del sistema usa elevación.
- **Don't** saturar pantallas con azul: su escasez conserva su significado de progreso.
- **Don't** esconder estados críticos solo en color; acompañarlos con texto, icono o forma.
- **Don't** hacer que la captura de un movimiento se sienta más compleja que la información que registra.
