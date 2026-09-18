# Rediseño frontend de Mis Propiedades

Fecha: 18 de septiembre de 2026

## Objetivo

Rediseñar la interfaz de Mis Propiedades con una estética patrimonial contemporánea, profesional y responsive, conservando la aplicación como HTML, CSS y JavaScript nativos y manteniendo sin cambios el modelo de datos, Google Sheets, Google Apps Script, exportación Excel, comprobantes PDF y funcionamiento PWA.

La aplicación está destinada al uso personal del propietario y a copias entregadas a algunos amigos. Cada copia debe comenzar sin datos ni credenciales del propietario original y conectarse exclusivamente a la Google Sheet y al Apps Script del usuario correspondiente.

## Restricciones

- No incorporar frameworks, compiladores ni dependencias de desarrollo.
- No cambiar el formato intercambiado con Google Sheets ni las conversiones de `app-sync.js`.
- No modificar el contrato actual de Apps Script: listado por `GET`, altas y ediciones mediante `POST` con `action: save`, y bajas mediante `POST` con `action: delete`.
- Mantener la aplicación instalable como PWA.
- Mantener todas las funciones existentes.
- Mantener una única pantalla continua; la sidebar será navegación interna, no un sistema de rutas.
- Mantener la identidad fija “Mis Propiedades”, sin personalización de marca por usuario.

## Dirección visual

La dirección aprobada es “Patrimonial contemporánea”:

- Verde profundo para navegación y acciones principales.
- Fondo marfil suave para reducir fatiga visual.
- Superficies blancas con bordes discretos y sombras livianas.
- Dorado cálido como acento limitado a identidad, indicadores y acciones patrimoniales.
- Verde, ámbar y rojo reservados para estados semánticos.
- Tipografía sans serif profesional para la interfaz y serif moderada para títulos y cifras destacadas.
- Bordes redondeados, espacios generosos y jerarquía clara, evitando una apariencia rígida o excesivamente cuadrada.

Todo el contenido debe caber correctamente en sus tarjetas. Las cifras usarán límites de ancho y formatos compactos cuando corresponda. Los textos largos podrán bajar de línea; en celdas de tabla se aplicará truncado con acceso al contenido completo mediante título o ayuda contextual.

## Estructura de la pantalla

### Sidebar

La sidebar permanecerá fija en desktop y contendrá:

- Resumen.
- Propiedades.
- Alertas.
- Comprobante de pago.
- Exportar a Excel.
- Configuración.
- Estado de conexión con Google Sheets.

Resumen, Propiedades y Alertas desplazarán suavemente a su sección dentro de la misma página. Comprobante, exportación y configuración ejecutarán las funciones correspondientes. La acción principal “Nueva propiedad” permanecerá en el encabezado del contenido.

### Encabezado

Mostrará la fecha, el título del resumen y las acciones “Instalar app” —cuando el navegador la ofrezca— y “Nueva propiedad”. No incluirá textos extensos que compitan con los datos.

### KPIs

Se mostrarán cinco indicadores:

1. Cantidad total de propiedades.
2. Valor patrimonial estimado.
3. Ingreso mensual por alquileres.
4. Porcentaje de ocupación.
5. Rentabilidad anual promedio.

La cantidad de casos en mora se integrará en “Atención requerida” o en Alertas para evitar saturar la fila de KPIs. Los cálculos seguirán derivándose de `PROPIEDADES` y no requerirán información nueva.

### Gráficos

Los gráficos serán discretos y representarán solamente información actual disponible:

- Distribución por estado: alquilada, vacía, en venta y en reforma.
- Distribución por tipo de propiedad si el espacio y la cantidad de categorías permiten una lectura clara.

No se mostrarán tendencias históricas porque la arquitectura actual no almacena historial. Los gráficos se implementarán con CSS o SVG local, sin introducir una biblioteca adicional.

### Alertas

Las alertas se mostrarán en un panel compacto, priorizadas por severidad:

- Mora.
- Contratos vencidos o próximos a vencer.
- Seguros próximos a vencer.

Cada alerta identificará la propiedad y abrirá su ficha cuando sea seleccionada. Los colores nunca serán el único indicador de estado.

### Tabla de propiedades

La tabla será el elemento principal del dashboard y conservará:

- Búsqueda por dirección, referencia o inquilino.
- Filtros por estado, tipo y mora.
- Ordenamiento por columnas.
- Apertura de la ficha completa al seleccionar una fila.

Las columnas de desktop serán Propiedad, Tipo, Estado, Inquilino, Vencimiento de contrato, Mora y Alquiler. El ID y la ubicación secundaria aparecerán bajo la dirección para aprovechar mejor el espacio. Los contenidos largos se truncarán visualmente sin romper la cuadrícula.

La cantidad de resultados será visible. No se añadirá paginación funcional en esta etapa, ya que la implementación actual opera correctamente sobre la lista completa y el volumen esperado es reducido.

## Ficha de propiedad

En desktop se abrirá como panel lateral amplio; en móvil ocupará la pantalla completa. La ficha organizará los datos existentes en:

- Resumen económico.
- Información principal.
- Contrato e inquilino.
- Documentación y servicios.

Las acciones Editar y Comprobante estarán siempre visibles en el encabezado de la ficha. Los datos ausentes se mostrarán como “—”, sin dejar recuadros rotos o etiquetas aisladas.

## Formulario de alta y edición

El formulario conservará todos los campos y validaciones existentes. Los campos se agruparán en:

1. Identificación y ubicación.
2. Características.
3. Información económica.
4. Ocupación y contrato.
5. Seguros y documentación.

En desktop se utilizarán dos columnas cuando el contenido lo permita; en móvil, una sola. Las acciones Guardar, Eliminar y Cancelar quedarán en una zona estable. Eliminar solo aparecerá durante la edición.

Mientras se guarde o elimine, la acción quedará deshabilitada y mostrará progreso. Los errores se comunicarán dentro del panel, además de preservar los datos introducidos. Las validaciones actuales de ID único, ID inmutable y campos mínimos se mantendrán.

## Configuración independiente de Google Sheets

Se eliminará la URL personal fija del código. El primer inicio sin configuración mostrará un asistente de una sola pantalla con el campo “URL de Google Apps Script”.

Junto a la etiqueta habrá un ícono circular “i”. La explicación estará oculta inicialmente y aparecerá solamente al pulsar o enfocar el ícono. Informará:

- Qué es la URL.
- Que Google la genera al publicar Apps Script como aplicación web.
- Dónde encontrarla.
- Que debe terminar en `/exec`.
- Que se guarda únicamente en el dispositivo.

La ayuda se cerrará al volver a pulsar el ícono, al pulsar fuera o al presionar Escape.

La URL se validará en dos etapas:

1. Validación de formato HTTPS y terminación `/exec`.
2. Solicitud de prueba contra la API existente y comprobación de una respuesta JSON válida.

La URL se guardará en `localStorage` solo después de una prueba satisfactoria. La aplicación no incorporará datos de ejemplo ni la URL del propietario original.

Configuración permitirá:

- Ver el estado de conexión.
- Ver la última sincronización exitosa.
- Probar la conexión.
- Reemplazar la URL.
- Borrar la configuración local y volver al asistente.

Cambiar o borrar la URL local no modificará ninguna Google Sheet.

## Estados de interfaz

La aplicación tendrá estados explícitos para:

- Carga inicial.
- Sin propiedades.
- Sin resultados para los filtros activos.
- Sin alertas.
- Guardando.
- Eliminando.
- Generando comprobante.
- Conexión correcta.
- Error de red.
- URL ausente o inválida.

El texto actual “Datos guardados en este dispositivo” se reemplazará porque los datos se guardan en Google Sheets. Solo la configuración de conexión y el contador local de comprobantes se almacenan en el dispositivo.

## Responsive

### Desktop

- Sidebar expandida.
- KPIs en una sola fila cuando el ancho lo permita.
- Paneles de composición y alertas en dos columnas.
- Tabla completa.
- Fichas y formularios en panel lateral.

### Tablet

- Sidebar compacta con iconos y etiquetas abreviadas o panel desplegable.
- KPIs en dos o tres columnas.
- Paneles apilables.
- Tabla con las columnas menos importantes ocultas de forma progresiva.

### Móvil

- Navegación inferior o encabezado compacto con las acciones esenciales.
- KPIs en dos columnas.
- Paneles apilados.
- Propiedades presentadas como tarjetas, sin tabla horizontal.
- Ficha y formulario a pantalla completa.
- Áreas táctiles de al menos 44 píxeles.

## Accesibilidad

- Navegación completa mediante teclado.
- Indicador de foco visible.
- Etiquetas asociadas a los campos.
- Botones con nombres accesibles, incluido el ícono de información.
- Contraste suficiente.
- Estados expresados con texto e iconos además del color.
- Respeto de `prefers-reduced-motion` para reducir animaciones.

## PWA y funcionamiento sin conexión

Se mantendrán `manifest.webmanifest` y `sw.js`. El caché se actualizará al incorporar los nuevos recursos visuales. La interfaz podrá abrirse sin conexión si ya fue cargada, pero las operaciones contra Google Sheets informarán claramente que requieren conexión. No se implementará una cola offline de escrituras para evitar conflictos o pérdida silenciosa de datos.

## Funcionalidad que debe preservarse

- Cargar propiedades desde Google Sheets.
- Crear propiedades.
- Editar propiedades.
- Eliminar propiedades.
- Buscar, filtrar y ordenar.
- Calcular KPIs y rentabilidad.
- Mostrar alertas de contratos, seguros y mora.
- Abrir fichas completas.
- Exportar a Excel.
- Generar comprobantes PDF.
- Instalar la PWA.
- Convertir datos mediante `PropertySync` sin cambiar sus encabezados.

## Manejo de errores

- Los fallos de carga no ocultarán toda la interfaz; se mostrará un estado de error con acción para reintentar o revisar Configuración.
- Los errores al guardar o eliminar mantendrán abierto el formulario o la ficha y restaurarán los botones.
- La exportación sobre una lista vacía mostrará una explicación en lugar de crear un archivo sin contenido.
- La ausencia de las bibliotecas externas para Excel o PDF mostrará un error específico.
- La URL inválida nunca se persistirá como conexión activa.

## Estrategia de implementación

El rediseño se realizará dentro de la aplicación HTML/CSS/JavaScript actual:

- Reestructurar el marcado de `index.html` con secciones semánticas.
- Sustituir los estilos actuales por variables y componentes visuales coherentes.
- Mantener las funciones de negocio y sincronización existentes, adaptando únicamente sus puntos de renderizado y estados visuales.
- Incorporar configuración local de la URL y el asistente inicial.
- Actualizar el service worker cuando cambien los recursos.

No se introducirá un framework ni un proceso de compilación.

## Verificación

La implementación deberá comprobar:

- Conversión de datos entre aplicación y Google Sheet.
- Alta, edición y baja con una API simulada o entorno de prueba.
- Validaciones del formulario.
- Cálculos de KPIs, rentabilidad y alertas.
- Búsqueda, filtros y ordenamiento.
- Exportación Excel y generación PDF.
- Persistencia, reemplazo y borrado de la URL local.
- Estados de carga, vacío y error.
- Instalación y actualización de la PWA.
- Diseño a anchos representativos de desktop, tablet y móvil.
- Navegación por teclado y controles accesibles.
