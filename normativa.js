(function(){
'use strict';
/* Bloques agregados de vigilancia para informes técnicos: no almacena datos clínicos individualizados. */
Object.assign(DATA_TYPES, {
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
const parentValidate=validate;
validate=function(k,input){
 let r=parentValidate(k,input);
 if(typeof r==='string')return r;
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