(function(){
'use strict';
/* Bloques agregados de vigilancia para informes técnicos: no almacena datos clínicos individualizados. */
Object.assign(DATA_TYPES, {
 psicosocial:{
  name:'Condiciones psicosociales y organización del trabajo',
  module:'Módulo 3 · Factores psicosociales',
  short:'Psicosocial',
  description:'Vigilancia colectiva de condiciones organizacionales: carga de trabajo, turnos, autonomía, relaciones y apoyo. Estos recuentos no son diagnósticos, ni demuestran causalidad.',
  rule:'Una fila por período × área × factor × método aplicado. Personas evaluadas ≤ personas elegibles; personas con señal ≤ evaluadas. Señal significa respuesta que cumple un criterio previamente definido para revisión, NO una enfermedad. Define instrumento, criterio y acciones fuera de la plantilla; protege los grupos pequeños.',
  columns:['periodo','area','factor','metodo','personas_elegibles','personas_evaluadas','personas_con_senal','medidas_programadas','medidas_verificadas'],
  numeric:['personas_elegibles','personas_evaluadas','personas_con_senal','medidas_programadas','medidas_verificadas'],
  key:['periodo','area','factor','metodo'],
  sample:[
   ['2026-09','Operaciones','Carga de trabajo','Encuesta de condiciones de trabajo',52,44,16,3,1],
   ['2026-09','Mantenimiento','Cambios de turno','Entrevista colectiva estructurada',35,28,11,2,1],
   ['2026-09','Administración','Autonomía y apoyo','Encuesta de condiciones de trabajo',28,23,7,2,0]
  ]
 },
 evaluaciones_medicas:{
  name:'Evaluaciones médicas ocupacionales',module:'Salud · NT-03:2016 arts. 26–30',short:'Exámenes ocupacionales',
  description:'Control agregado de exámenes de ingreso, prevacacionales, posvacacionales, egreso, exposición ocupacional y periódicos programados según riesgos. No se cargan fichas, diagnósticos ni resultados médicos individuales.',
  rule:'Una fila por período × área × tipo × proceso/criterio. Programadas = evaluaciones a ejecutar; realizadas = evaluaciones efectivamente hechas; realizadas_en_plazo = evaluaciones ejecutadas dentro del plazo aplicable (arts. 29–30: 15 días hábiles previos/posteriores). La periodicidad «anual» proviene del programa y riesgos, no es regla universal. La cantidad pendiente se calcula automáticamente.',
  columns:['periodo','area','tipo_evaluacion','proceso_o_criterio','programadas','realizadas','realizadas_en_plazo','con_seguimiento'],
  numeric:['programadas','realizadas','realizadas_en_plazo','con_seguimiento'],
  key:['periodo','area','tipo_evaluacion','proceso_o_criterio'],
  sample:[
    ['2026-09','Operaciones','Prevacacional','Programa de vacaciones',20,18,16,3],
    ['2026-09','Operaciones','Posvacacional','Reintegro de vacaciones',15,13,12,1],
    ['2026-09','Mantenimiento','Periódica por exposición','Ruido ocupacional',24,20,19,4],
    ['2026-09','Administración','Anual programada','Programa de vigilancia del centro',30,26,25,2],
    ['2026-09','Mantenimiento','Ingreso','Valoración según puesto',5,5,5,0],
    ['2026-09','Operaciones','Egreso','Valoración según puesto',2,2,2,0]
  ]
 },
 eventos_salud:{
  name:'Enfermedades y accidentes comunes · consolidado',module:'Salud y eventos · Reglamento art. 34',short:'Eventos de salud',
  description:'Registra en forma agregada los episodios de enfermedades comunes, enfermedades ocupacionales calificadas, sospechas en investigación y accidentes comunes. La clasificación de origen ocupacional exige respaldo de la autoridad competente.',
  rule:'Elija una categoría explícita. registros cuenta episodios; personas_afectadas identifica personas distintas dentro de esa categoría, sin sumarlas entre categorías. Nunca coloque datos nominativos.',
  columns:['periodo','area','categoria','registros','personas_afectadas'],
  numeric:['registros','personas_afectadas'],key:['periodo','area','categoria'],
  sample:[['2026-09','Operaciones','Enfermedad común',9,7],['2026-09','Operaciones','Sospecha de origen ocupacional',2,2],['2026-09','Mantenimiento','Accidente común',1,1]]
 },
 reposos:{
  name:'Reposos según origen · consolidado',module:'Salud y ausentismo · Reglamento art. 34',short:'Reposos',
  description:'Distingue los episodios de reposo de sus días y según la clasificación documentada del origen. No utilice estos totales como prueba de causalidad laboral.',
  rule:'episodios es cantidad de reposos y dias_reposo es la suma de días. La clasificación debe corresponder al expediente custodiado por salud ocupacional.',
  columns:['periodo','area','origen','episodios','dias_reposo'],numeric:['episodios','dias_reposo'],key:['periodo','area','origen'],
  sample:[['2026-09','Operaciones','Enfermedad común',7,31],['2026-09','Mantenimiento','Accidente de trabajo',1,8]]
 },
 salud_complementaria:{
  name:'Exámenes, referencias y discapacidad · resumen',module:'Vigilancia de salud · Reglamento art. 34',short:'Salud complementaria',
  description:'Agrega resultados operativos sin identificar diagnósticos ni personas. El detalle individual debe permanecer bajo custodia sanitaria.',
  rule:'examenes_realizados contabiliza exámenes, referencias_especializadas son derivaciones y personas_con_discapacidad es un recuento de personas. No sumarlos como si fueran la misma unidad.',
  columns:['periodo','area','examenes_realizados','resultados_con_seguimiento','referencias_especializadas','personas_con_discapacidad'],
  numeric:['examenes_realizados','resultados_con_seguimiento','referencias_especializadas','personas_con_discapacidad'],
  key:['periodo','area'],
  sample:[['2026-09','Operaciones',43,5,3,2],['2026-09','Mantenimiento',28,4,2,1]]
 },
 mediciones:{
  name:'Monitoreo ocupacional y ambiental · agregados',module:'Procesos peligrosos · NT-04:2023',short:'Mediciones',
  description:'Registra cuántas mediciones se practicaron y cuántas requieren análisis frente a un criterio técnico. La aplicación no decide por sí sola si hay incumplimiento de un límite legal.',
  rule:'La referencia_tecnica debe identificar el criterio técnico usado en la evaluación. mediciones_que_requieren_revision no puede exceder mediciones_realizadas.',
  columns:['periodo','area','proceso','agente','unidad','referencia_tecnica','mediciones_realizadas','mediciones_que_requieren_revision'],
  numeric:['mediciones_realizadas','mediciones_que_requieren_revision'],
  key:['periodo','area','proceso','agente','unidad','referencia_tecnica'],
  sample:[['2026-09','Mantenimiento','Soldadura','Humos metálicos','mg/m3','Evaluación técnica documentada',8,3],['2026-09','Operaciones','Empaque','Ruido','dBA','Evaluación técnica documentada',6,2]]
 },
 controles:{
  name:'Medidas de control por nivel',module:'Vigilancia técnica · Reglamento art. 34',short:'Controles preventivos',
  description:'Separa controles en fuente, ambiente y trabajadores para documentar implementación y verificación. Verificar ejecución no equivale automáticamente a demostrar eficacia.',
  rule:'El nivel debe ser Fuente, Ambiente o Trabajadores; verificadas ≤ implementadas ≤ programadas. Se requieren evidencias de funcionamiento y evaluación técnica.',
  columns:['periodo','area','proceso','nivel','programadas','implementadas','verificadas'],
  numeric:['programadas','implementadas','verificadas'],key:['periodo','area','proceso','nivel'],
  sample:[['2026-09','Mantenimiento','Soldadura','Fuente',4,3,2],['2026-09','Mantenimiento','Soldadura','Ambiente',3,2,1],['2026-09','Operaciones','Empaque','Trabajadores',5,5,4]]
 },
 jornada_detalle:{
  name:'Jornada, pausas y descansos · consolidado',module:'Tiempo libre · Reglamento art. 36',short:'Jornada detallada',
  description:'Apoya los informes sobre jornadas, horas extra, pausas de alimentación y descansos. El registro legal permanente por trabajador sigue siendo responsabilidad del centro de trabajo en sus sistemas protegidos.',
  rule:'Todos los valores son totales por área y período; los descansos efectivamente disfrutados no pueden exceder los programados. No mezclar horas con días ni duplicar vacaciones de la plantilla simplificada.',
  columns:['periodo','area','horas_ordinarias','horas_extra','pausas_alimentacion_programadas','pausas_alimentacion_disfrutadas','descansos_obligatorios_programados','descansos_obligatorios_disfrutados','descansos_convencionales_programados','descansos_convencionales_disfrutados','vacaciones_programadas_dias','vacaciones_disfrutadas_dias','actividades_recreativas_realizadas'],
  numeric:['horas_ordinarias','horas_extra','pausas_alimentacion_programadas','pausas_alimentacion_disfrutadas','descansos_obligatorios_programados','descansos_obligatorios_disfrutados','descansos_convencionales_programados','descansos_convencionales_disfrutados','vacaciones_programadas_dias','vacaciones_disfrutadas_dias','actividades_recreativas_realizadas'],
  key:['periodo','area'],
  sample:[['2026-09','Operaciones',7900,190,260,250,200,181,44,39,120,98,2],['2026-09','Mantenimiento',6100,230,205,190,160,139,32,26,100,61,1]]
 }
});
for(const k of Object.keys(DATA_TYPES))if(!Array.isArray(db[k]))db[k]=[];
const parentValidate=validate;
validate=function(k,input){
 let r=parentValidate(k,input);
 if(typeof r==='string')return r;
 if(k==='psicosocial'){
  if(r.personas_elegibles===0)return 'personas_elegibles debe ser mayor que cero';
  if(r.personas_evaluadas>r.personas_elegibles)return 'personas_evaluadas no puede superar personas_elegibles';
  if(r.personas_con_senal>r.personas_evaluadas)return 'personas_con_senal no puede superar personas_evaluadas';
  if(r.medidas_verificadas>r.medidas_programadas)return 'medidas_verificadas no puede superar medidas_programadas';
 }
 if(k==='evaluaciones_medicas'){
 const validTypes=['Ingreso','Prevacacional','Posvacacional','Egreso','Periódica por exposición','Anual programada','Otra programada'];
 if(!validTypes.includes(r.tipo_evaluacion))return 'tipo_evaluacion: selecciona una de las categorías de la plantilla';
 if(r.realizadas>r.programadas)return 'realizadas excede programadas: revisa o actualiza la planificación';
 if(r.realizadas_en_plazo>r.realizadas)return 'realizadas_en_plazo no puede exceder realizadas';
 if(r.con_seguimiento>r.realizadas)return 'con_seguimiento no puede exceder realizadas';
 }
 if(k==='eventos_salud'){
   if(!['Enfermedad común','Enfermedad ocupacional calificada','Sospecha de origen ocupacional','Accidente común'].includes(r.categoria))
     return 'categoria: use Enfermedad común, Enfermedad ocupacional calificada, Sospecha de origen ocupacional o Accidente común';
   if(r.personas_afectadas>r.registros)return 'personas_afectadas no debe exceder registros en este resumen';
 }
 if(k==='salud_complementaria'&&r.resultados_con_seguimiento>r.examenes_realizados)
   return 'resultados_con_seguimiento excede examenes_realizados';
 if(k==='mediciones'&&r.mediciones_que_requieren_revision>r.mediciones_realizadas)
   return 'mediciones_que_requieren_revision excede mediciones_realizadas';
 if(k==='controles'){
   if(!['Fuente','Ambiente','Trabajadores'].includes(r.nivel))return 'nivel: utilice Fuente, Ambiente o Trabajadores';
   if(r.implementadas>r.programadas||r.verificadas>r.implementadas)return 'debe cumplirse verificadas ≤ implementadas ≤ programadas';
 }
 if(k==='jornada_detalle'){
   for(const [planned,used] of [
   ['pausas_alimentacion_programadas','pausas_alimentacion_disfrutadas'],
   ['descansos_obligatorios_programados','descansos_obligatorios_disfrutados'],
   ['descansos_convencionales_programados','descansos_convencionales_disfrutados'],
   ['vacaciones_programadas_dias','vacaciones_disfrutadas_dias']
   ])if(r[used]>r[planned])return used+' excede el total programado';
 }
 return r;
};
})();