# Laboratorio SVE · La Movida de SST

**Aplicación web para transformar registros agregados en decisiones preventivas.** Diseñada para el curso «Diseño y Gestión de Sistemas de Vigilancia Epidemiológica en Seguridad y Salud en el Trabajo (SST)».

Academia Movida de SST · Elaborado por David Linares Brea · [www.movidasst.com](https://www.movidasst.com)

## Recorrido
Definir → Registrar → Validar → Calcular → Interpretar → Actuar → Verificar.

## Funciones
- Aplicación responsive con barra inferior fija y cinco pestañas: Inicio, Datos, Indicadores, Acciones, Informes.
- Plantillas **CSV y Excel** para cinco componentes: morbilidad, accidentes, procesos peligrosos, tiempo libre y cobertura.
- Carga local de datos estructurados con validaciones; rechaza columnas de identificación personal y duplicados se actualizan por clave.
- Prevalencia puntual, incidencia acumulada condicionada a cohorte y seguimiento, conteo de consultas, frecuencia operativa de accidentes, verificación de controles, descanso efectivo, vacaciones y cobertura.
- Selección de período, área, condición de morbilidad y actividad de cobertura.
- Listado de acciones con responsables por función, prioridad, fecha de verificación y evidencia.
- Exportación de un Excel con hojas, respaldos CSV e impresión de informe a PDF («Guardar como PDF»).
- Demostración con datos ficticios claramente identificados.

## Instrucciones de uso
1. En la pestaña Datos selecciona componente y descarga la plantilla Excel o CSV.
2. No modifiques los nombres de columnas; usa **YYYY-MM** para período. La morbilidad también requiere **fecha_corte YYYY-MM-DD**, correspondiente al inicio del período de seguimiento.
3. Introduce solo **resúmenes agregados**: una fila por período × área × condición o actividad.
4. Importa el archivo. Los datos se validan; las filas erróneas se explican y se descartan.
5. Consulta Indicadores, elige filtros y documenta acciones con evidencia de verificación.
6. Usa Informes para PDF, exportación Excel o copias CSV.

### Morbilidad
- `casos_existentes` es el número de personas que cumplen la definición de caso en la `fecha_corte`.
- `poblacion_evaluada` es el denominador correspondiente a esa fecha.
- `poblacion_en_riesgo = poblacion_evaluada - casos_existentes` para una cohorte inicialmente evaluada, sin casos existentes entre el grupo en riesgo.
- `casos_nuevos` son primeras apariciones en el período entre quienes estaban libres de la condición al inicio.
- La incidencia acumulada simple se muestra solo con `seguimiento_completo=si`.
- `consultas` son visitas y no deben interpretarse como número de personas enfermas.
- La prevalencia de áreas distintas solo puede compararse cuando los casos comparten **igual condición, fecha de corte y criterios**.

### Otros indicadores
- La frecuencia operativa de accidentes por millón de horas registra **eventos**, no una incidencia epidemiológica de personas accidentadas; no debe confundirse con una obligación normativa única.
- Cobertura = completadas/elegibles para una **misma actividad**; no mezclar actividades diferentes.
- La verificación documental de controles no demuestra automáticamente su eficacia técnica.
- Las diferencias descriptivas no demuestran relaciones causales.

## Privacidad
Este sitio es **estático**. No incorpora servidor ni autenticación; los datos agregados se calculan localmente y permanecen en el navegador mediante almacenamiento local. No se comparten automáticamente ni se sincronizan entre equipos. No uses esta aplicación para datos identificables o clínicos: **no incluir nombres, cédulas/RUT, correos, historias clínicas ni registros individuales**. Los resultados de grupos muy pequeños pueden permitir reidentificación: agrupa categorías antes de subir datos.

## Requisitos técnicos
- CSV funciona sin conexión adicional.
- Excel .xlsx necesita la librería SheetJS cargada desde cdnjs (versión 0.18.5). Si no está disponible, utiliza CSV.
- Para PDF: en la pestaña Informes, pulsar «Generar PDF / Imprimir» y escoger «Guardar como PDF».
- El almacenamiento local se pierde al borrar datos del navegador; exporta siempre un respaldo.

## Publicación
GitHub Pages: [movidasst.github.io/sve](https://movidasst.github.io/sve/). Si no está activo, ve al repositorio → **Settings → Pages** y selecciona **GitHub Actions** para el workflow `Deploy SVE GitHub Pages`. Mantén publicados `index.html`, `app.js`, `styles.css`, `manifest.webmanifest` y `sw.js`.

## Marco de referencia
LOPCYMAT, Reglamento Parcial de LOPCYMAT (arts. 34–36), NT-03:2016 (funciones de enfermería, art. 37), NT-04:2023 (2.5.5, 2.6 y 2.7) y fundamentos OPS/CDC. La aplicación es educativa y de apoyo a la gestión; no sustituye el análisis normativo vigente ni la valoración clínica profesional.
