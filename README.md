# Laboratorio SVE · La Movida de SST

**Aplicación web para transformar registros agregados en decisiones preventivas.** Diseñada para el curso «Diseño y Gestión de Sistemas de Vigilancia Epidemiológica en Seguridad y Salud en el Trabajo (SST)».

Academia Movida de SST · Elaborado por David Linares Brea · [www.movidasst.com](https://www.movidasst.com)

## Recorrido
Definir → Registrar → Validar → Calcular → Interpretar → Actuar → Verificar.

## Funciones
- Aplicación responsive con barra inferior fija y cinco pestañas: Inicio, Datos, Indicadores, Acciones, Informes.
- Plantillas **CSV y Excel** para doce componentes, incluidos siete bloques normativos adicionales: morbilidad, accidentes, procesos peligrosos, tiempo libre y cobertura.
- Carga local de datos estructurados con validaciones; rechaza columnas de identificación personal y duplicados se actualizan por clave.
- Prevalencia puntual, incidencia acumulada condicionada a cohorte y seguimiento, conteo de consultas, frecuencia operativa de accidentes, verificación de controles, descanso efectivo, vacaciones y cobertura.
- Selección de período, área, condición de morbilidad y actividad de cobertura.
- Listado de acciones con responsables por función, prioridad, fecha de verificación y evidencia.
- Exportación de un Excel con hojas, respaldos CSV e impresión de informe a PDF («Guardar como PDF»).
- Demostración con datos ficticios claramente identificados.

## Versión normativa — Informes técnicos y matriz (octubre 2026)

Además de las cinco plantillas iniciales, esta versión incorpora **siete** plantillas agregadas adicionales:
- **Evaluaciones médicas ocupacionales**: ingreso, prevacacional, posvacacional, egreso, periódicas por exposición y anuales programadas según riesgos o plan. Cada una controla evaluaciones programadas, realizadas, en plazo y con seguimiento; la aplicación calcula pendientes y cobertura por tipo. Los plazos de 15 días hábiles para pre y posvacacionales se verifican frente a los registros originales custodiados por el Servicio de SST.
- **Enfermedades y accidentes comunes**: clasificación diferenciada de enfermedades comunes, enfermedades ocupacionales calificadas, sospechas y accidentes comunes.
- **Reposos**: episodios y días, según origen documentado.
- **Salud complementaria**: resumen histórico agregado de exámenes, resultados que necesitan seguimiento, referencias especializadas y personas con discapacidad. Si también utilizas evaluaciones desglosadas, no sumes ambos registros porque pueden duplicar exámenes.
- **Mediciones**: cantidad de mediciones ocupacionales/ambientales y revisión frente a criterios técnicos documentados.
- **Controles**: fuente, ambiente y trabajadores, con implementación y verificación.
- **Jornada detallada**: horas, alimentación, descansos obligatorios/convencionales, vacaciones y actividades recreativas. Son **consolidados**; los registros por trabajador exigidos en el art. 36 deben conservarse fuera de GitHub Pages en un sistema protegido.

**Nota técnica:** «anual programada» no significa un examen legal uniforme una vez al año para toda exposición; se documenta conforme a la evaluación de riesgos y el programa aplicable, sin sustituir otras evaluaciones obligatorias.

### Informes disponibles
En **Informes → Generador documental SVE** elige:
1. **Divulgación mensual colectiva de vigilancia de salud** (NT-04:2023, sección 2.6).
2. **Soporte técnico trimestral de accidentes y enfermedades** (Reglamento Parcial de la LOPCYMAT, art. 34).
3. **Soporte técnico trimestral de utilización del tiempo libre** (art. 36).
4. **Consolidado integral interno** para decisiones preventivas.

Cada informe ofrece **PDF** mediante impresión del navegador, **Word editable (.doc)** y **Excel (.xlsx)** con las series de origen, medidas y matriz (si la librería XLSX está disponible). Los informes trimestrales **NO son formularios oficiales**, **NO equivalen a consignación ante INPSASEL** y **NO certifican cumplimiento legal**. Verifica el formato y canal oficial vigente con la autoridad.

### Matriz documental
Se presentan 21 puntos de revisión con base normativa. La aplicación distingue:
- **Datos cargados:** existe al menos un registro agregado relacionado en el período.
- **Evidencia declarada disponible/revisada:** la persona usuaria seleccionó ese estado y consignó una referencia documental.
- **Pendiente o no aplica:** requiere justificación y revisión profesional.

La matriz **no asigna una calificación automática de cumplimiento**. La historia de salud debe permanecer en custodia profesional fuera de esta web. Las acciones solo pueden marcarse **«Verificada»** después de introducir referencia de evidencia y resultado de la comprobación.

## Demostración trimestral integral (datos ficticios)

En **Inicio**, pulsa **«Cargar demostración completa»** para abrir el período **julio–septiembre 2026** de *Industrias Horizonte*, una empresa enteramente ficticia.

El sistema genera **243 registros en los 12 componentes** de vigilancia, incluidas seis clases de evaluaciones médicas, tres áreas de trabajo, dos condiciones de morbilidad, eventos de salud, accidentes, mediciones, controles preventivos, jornadas, cinco acciones y 23 puntos de revisión documental (21 con referencias **simuladas** y dos trámites oficiales indicados como pendientes).

En **Informes** encontrarás accesos directos a cuatro documentos:
- informe mensual de salud (el mes de septiembre de 2026),
- soporte trimestral de accidentes y enfermedades,
- soporte trimestral de utilización del tiempo libre,
- informe integral interno.

Cada documento puede generarse e imprimirse como PDF; Word y Excel están disponibles desde los controles existentes. **Los datos, nombres de empresa, hallazgos y documentos de evidencia son completamente ficticios**. No use los informes de demostración como constancias legales, diagnósticos o reportes reales.

### Borrar demostración y empezar con datos propios

Cuando termines, selecciona **«Borrar demo y comenzar con mis datos»** en Inicio, Informes o en el aviso superior. Esta acción elimina exclusivamente el conjunto ficticio y **restaura los registros, acciones, evidencias y configuración que existían antes de cargarlo**, siempre que el almacenamiento local del navegador siga disponible. Si la aplicación estaba vacía, volverá a estar vacía.

La demostración nunca se mezcla silenciosamente con importaciones reales: para cargar archivos propios primero debes salir de ella. Antes de usar información productiva, exporta además un respaldo Excel/CSV de seguridad. Las modificaciones efectuadas durante una demostración se pierden al borrarla.

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
