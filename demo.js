/* Modo demostración SVE: trimestre completo sin mezclar registros reales. */
(function(){
'use strict';
const APP_KEY='movidasst_sve_v1';
const EVIDENCE_KEY='movidasst_sve_evidencias_v1';
const CONFIG_KEY='movidasst_sve_reportconfig_v1';
const BACKUP_KEY='movidasst_sve_demo_backup_v1';
const PERIODS=['2026-07','2026-08','2026-09'];
const AREAS=[
 {name:'Operaciones',workers:52,process:'Empaque y manipulación de cargas',agent:'Ruido',unit:'dBA'},
 {name:'Mantenimiento',workers:35,process:'Soldadura y reparación',agent:'Humos metálicos',unit:'mg/m³'},
 {name:'Administración',workers:28,process:'Trabajo administrativo',agent:'Iluminación',unit:'lux'}
];
const ORG='Industrias Horizonte · EMPRESA FICTICIA PARA DEMOSTRACIÓN';
const FORM=[
 'formalType','formalPeriod','formalQuarter','formalYear','formalOrg',
 'formalResponsible','formalParticipation','formalMethod','formalHypothesis','formalDecision'
];
const DEMO_CONFIG={
 formalType:'trimestral_salud',formalPeriod:'2026-09',formalQuarter:'3',formalYear:'2026',
 formalOrg:ORG,formalResponsible:'Servicio de Seguridad y Salud en el Trabajo (simulado)',
 formalParticipation:'con',
 formalMethod:'CASO FICTICIO. Consolidación mensual por área, proceso y tipo de evento (julio–septiembre de 2026). Datos numéricos agregados provenientes de registros didácticos. Se analiza morbilidad por cortes mensuales, eventos, exámenes ocupacionales, reposos, exposiciones, utilización del tiempo libre y desempeño de controles. La historia de salud individual no está alojada en esta aplicación.',
 formalHypothesis:'CASO FICTICIO. Se observa coincidencia temporal entre condiciones organizacionales, horas extraordinarias y reportes de malestar. Esta asociación descriptiva no demuestra causa. Investigar cargas reales, cambios de turno, descansos y otros factores, con evaluaciones periódicas y participación de trabajadores antes de atribuir un origen.',
 formalDecision:'CASO FICTICIO. Priorizar el control ergonómico en operaciones, comprobar la efectividad del sistema de extracción en mantenimiento, corregir los exámenes prevacacionales pendientes y verificar el disfrute de descansos. Registrar mediciones y repetir la evaluación antes de atribuir relaciones causales.'
};
const backupExists=()=>!!localStorage.getItem(BACKUP_KEY);
const demoActive=()=>{try{return !!JSON.parse(localStorage.getItem(APP_KEY)||'{}').isDemo}catch(e){return false}};
function put(k,x){if(x===null||x===undefined)localStorage.removeItem(k);else localStorage.setItem(k,x)}
function fromArray(k,values){const columns=DATA_TYPES[k].columns;return Object.fromEntries(columns.map((field,i)=>[field,values[i]]));}
function populate(){
 const data=Object.fromEntries(Object.keys(DATA_TYPES).map(k=>[k,[]]));
 const push=(k,row)=>{const rec=fromArray(k,row);const validated=validate(k,rec);if(typeof validated==='string')throw Error(k+': '+validated);data[k].push(validated)};
 for(let p=0;p<PERIODS.length;p++){
  const month=PERIODS[p];
  for(let a=0;a<AREAS.length;a++){
   const area=AREAS[a],count=area.workers,base=p+a;
   const lowBack=4+(a===0?5:a===1?2:0)+(p*2),ocular=2+(a===1?3:0)+p;
   for(const [condition,existing,reported,newCases] of [
     ['Molestias lumbares',lowBack,lowBack+5+(a%2),2+(p%2)+(a===0?1:0)],
     ['Irritación ocular',ocular,ocular+3+(a%2),1+(a===1?1:0)]
   ])push('morbilidad',[month,month+'-01',area.name,condition,count,existing,count-existing,newCases,reported,'si']);
   push('accidentes',[month,area.name,count,(a===2?0:(base%3===0?2:1)),2+base,Math.round(count*(151+((p+a)%3)*5))]);
   push('procesos',[month,area.name,area.process,6+base,3+(base%5),5+(p%2),3+(base%2)]);
   const plannedVacation=12+a*4+p*3,usedVacation=plannedVacation-(a===1?4:2+p);
   push('tiempo',[month,area.name,count,count-2-(base%4),Math.round(count*(2.2+(base%3))),plannedVacation,usedVacation]);
   push('psicosocial',[month,area.name,a===0?'Carga y ritmo de trabajo':a===1?'Turnos y previsibilidad':'Autonomía y apoyo','Encuesta agregada de organización',count,count-5-(base%3),7+base,3,1+(base%2)]);
   for(const activity of ['Evaluación de salud','Inducción preventiva']){
     const enrolled=count,completed=count-(activity==='Evaluación de salud'?4+(base%3):2+(base%4));
     push('cobertura',[month,area.name,activity,enrolled,completed]);
   }
   for(const typ of [
     'Ingreso','Prevacacional','Posvacacional','Egreso','Periódica por exposición','Anual programada'
   ]){
     const planned=typ==='Ingreso'?2+(p%2):typ==='Egreso'?1+(a%2):typ==='Prevacacional'?6+(a%3)+p:typ==='Posvacacional'?5+p:typ==='Periódica por exposición'?8+a*2:7+a*3;
     const shortfall=(typ==='Egreso'||typ==='Ingreso')?0:(base%3===0?2:1);
     const done=planned-shortfall,within=Math.max(0,done-((typ==='Prevacacional'||typ==='Posvacacional')?(base%2):0));
     push('evaluaciones_medicas',[month,area.name,typ,(typ==='Periódica por exposición'?area.agent:typ==='Anual programada'?'Cronograma interno SST':typ==='Ingreso'||typ==='Egreso'?'Evaluación ocupacional del puesto':'Programación de vacaciones'),planned,done,within,Math.min(done,(base+1)%3)]);
   }
   const cases=[
     ['Enfermedad común',4+(base%3),4+(base%3)],
     ['Enfermedad ocupacional calificada',a===1&&p===2?1:0,a===1&&p===2?1:0],
     ['Sospecha de origen ocupacional',1+(base%2),1+(base%2)],
     ['Accidente común',1+(base%2),1+(base%2)]
   ];
   cases.forEach(([category,episodes,affected])=>push('eventos_salud',[month,area.name,category,episodes,affected]));
   for(const [origin,episodes,days] of [
    ['Enfermedad común',3+(base%3),8+(base%3)*3],
    ['Accidente común',1,2+(p%2)],
    ['Accidente de trabajo',a===2?0:1,a===2?0:4+(a%2)],
    ['Enfermedad ocupacional calificada',a===1&&p===2?1:0,a===1&&p===2?6:0]
   ])push('reposos',[month,area.name,origin,episodes,days]);
   push('salud_complementaria',[month,area.name,14+(base%4),2+(base%3),1+(base%2),a===0?2:a===1?1:0]);
   push('mediciones',[month,area.name,area.process,area.agent,area.unit,'Criterio del programa de monitoreo (simulado)',4+(base%3),1+(base%2)]);
   for(const level of ['Fuente','Ambiente','Trabajadores']){
      const programmed=4+(base%3),implemented=programmed-1,checked=implemented-((level==='Trabajadores')?0:1);
      push('controles',[month,area.name,area.process,level,programmed,implemented,checked]);
   }
   const plannedMeal=count*20,mealTaken=plannedMeal-1-base;
   const dayRest=8+base,dayTaken=dayRest-1-(base%2),conv=6+base,convTaken=conv-1;
   push('jornada_detalle',[month,area.name,count*160,Math.round(count*(2.2+(base%3))),plannedMeal,mealTaken,dayRest,dayTaken,conv,convTaken,plannedVacation,usedVacation,2+(base%2)]);
  }
 }
 return data;
}
function demoActions(){
 return [
  {id:'demo-act-01',module:'Vigilancia de procesos',priority:'Alta',finding:'Mantenimiento: se identificaron mediciones que requieren revisión técnica y oportunidades de control.',measure:'Verificar extracción localizada, revisar las fuentes y repetir las mediciones con el protocolo técnico.',owner:'Higiene ocupacional y mantenimiento',due:'2026-08-18',evidence:'DEMO-INS-001 / programa de verificaciones',status:'Verificada',verificationEvidence:'DEMO-ACTA-001 (ficticia) y resultados comparativos de medición (simulados)',verificationResult:'Se ejecutó la inspección y el ajuste. Continúa seguimiento de exposición en septiembre.',verificationDate:'2026-08-19'},
  {id:'demo-act-02',module:'Vigilancia de la salud',priority:'Alta',finding:'En operaciones se observaron molestias lumbares de forma recurrente en los cortes mensuales.',measure:'Revisar exigencias biomecánicas por tarea, introducir rediseño de alturas y evaluar eficacia de las medidas.',owner:'Ergonomía, Servicio SST y supervisión',due:'2026-09-22',evidence:'DEMO-ERG-002 / plan de intervención',status:'En ejecución'},
  {id:'demo-act-03',module:'Exámenes ocupacionales',priority:'Media',finding:'Exámenes prevacacionales y posvacacionales no realizados conforme al cronograma.',measure:'Ajustar agenda de salud ocupacional y verificar oportunidad con registros individuales bajo custodia médica.',owner:'Medicina y enfermería ocupacional',due:'2026-09-28',evidence:'DEMO-PLAN-SALUD-003',status:'Verificada',verificationEvidence:'DEMO-ACTA-003 (ficticia), control consolidado de citas y supervisión',verificationResult:'Se actualizó programación; persisten evaluaciones pendientes que requieren nueva acción.',verificationDate:'2026-09-29'},
  {id:'demo-act-04',module:'Tiempo libre',priority:'Media',finding:'Se detectaron descansos disfrutados por debajo de los programados.',measure:'Revisar programación con jefaturas y comprobar descansos efectivos en la documentación protegida.',owner:'Talento Humano y Servicio SST',due:'2026-09-30',evidence:'DEMO-REG-TIEMPO-004',status:'Pendiente'},
  {id:'demo-act-05',module:'Control de acciones',priority:'Baja',finding:'La revisión mensual no identifica evidencia de eficacia de todos los controles.',measure:'Completar protocolo de seguimiento de acciones con indicadores antes/después y validación profesional.',owner:'Comité de Seguridad y Salud Laboral',due:'2026-09-15',evidence:'DEMO-CSSL-005',status:'Verificada',verificationEvidence:'DEMO-ACTA-CSSL-005 (ficticia)',verificationResult:'Se aprobó el método de evaluación, pendiente verificación sostenida de resultados.',verificationDate:'2026-09-16'}
 ];
}
function demoEvidence(){
 const reviewIds=['A01','A02','A03','A04','A05','A14','A15','A06','A07','A08','A09','A10','A11','A13','T01','T02','T03','N01','N02','N03','N04'];
 const result={};
 for(const id of reviewIds)result[id]={status:'Disponible',reference:'DOCUMENTO SIMULADO DEMO/SVE/2026-T3/'+id+' — no válido como evidencia real'};
 for(const id of ['A12','T04'])result[id]={status:'Pendiente',reference:'Falta utilizar formato/canal oficial INPSASEL. Caso didáctico; no hay constancia de consignación.'};
 return result;
}
function hasReal(){try{const parsed=JSON.parse(localStorage.getItem(APP_KEY)||'{}');if(parsed.isDemo)return false;return Object.values(parsed.db||{}).some(a=>Array.isArray(a)&&a.length)||!!parsed.actions?.length||!!localStorage.getItem(EVIDENCE_KEY)||!!localStorage.getItem(CONFIG_KEY)}catch(e){return true}}
function backupNow(){
 if(backupExists())return true;
 const snapshot={app:demoActive()?null:localStorage.getItem(APP_KEY),evidence:demoActive()?null:localStorage.getItem(EVIDENCE_KEY),config:demoActive()?null:localStorage.getItem(CONFIG_KEY),reportOrg:document.getElementById('reportOrganization')?.value||''};
 try{localStorage.setItem(BACKUP_KEY,JSON.stringify(snapshot));return true}catch(e){alert('No fue posible proteger los datos actuales. Exporta un respaldo CSV o Excel e inténtalo nuevamente. No se modificó ningún dato.');return false}
}
function loadDemo(){
 if(demoActive()){
  if(!confirm('Ya estás utilizando la demostración. ¿Restablecer el trimestre ficticio completo y perder los cambios que hiciste en la demo?'))return false;
 }else if(hasReal()){
  if(!confirm('Tienes datos guardados. Los conservaré como copia local temporal mientras exploras la demostración y los restauraré al salir.\n\nRecomendación: exporta también un respaldo Excel antes de continuar.\n\n¿Cargar trimestre DEMO 2026 (julio–septiembre)?'))return false;
 }
 const previous={app:localStorage.getItem(APP_KEY),evidence:localStorage.getItem(EVIDENCE_KEY),config:localStorage.getItem(CONFIG_KEY)};
 if(!backupNow())return false;
 try{
  const dataset=populate(),actionList=demoActions(),ev=demoEvidence();
  localStorage.setItem(APP_KEY,JSON.stringify({db:dataset,actions:actionList,isDemo:true,reportDesign:{
    question:'¿En qué áreas se concentran las molestias musculoesqueléticas, los síntomas respiratorios y las fallas de controles, y qué decisiones de prevención requieren?',
    definition:'Registro colectivo mensual de personas con síntomas informados, condiciones por área y período, sin identificar a trabajadores ni asumir origen ocupacional.',
    alert:'Concentración de reportes en una tarea, cambio relevante entre períodos o control técnico que no cumple su criterio: activar revisión de fuentes y medidas.'
  }}));
  localStorage.setItem(EVIDENCE_KEY,JSON.stringify(ev));
  localStorage.setItem(CONFIG_KEY,JSON.stringify(DEMO_CONFIG));
 }catch(e){
  for(const [key,value] of Object.entries({[APP_KEY]:previous.app,[EVIDENCE_KEY]:previous.evidence,[CONFIG_KEY]:previous.config}))put(key,value);
  alert('No se pudo cargar la demostración sin errores: '+e.message+'\nNo se modificaron los datos reales.');
  return false;
 }
 window.location.reload();
 return true;
}
function clearDemo(){
 if(!demoActive()){alert('No hay una demostración activa. Tus datos reales no se han modificado.');return false}
 if(!confirm('Se borrará la demostración (datos ficticios, acciones y evidencias). Si existían datos reales antes de entrar, se restaurarán en este navegador.\n\n¿Salir de la DEMO y empezar con tus datos?'))return false;
 try{
  const stored=localStorage.getItem(BACKUP_KEY);
  if(stored){const state=JSON.parse(stored);put(APP_KEY,state.app);put(EVIDENCE_KEY,state.evidence);put(CONFIG_KEY,state.config);try{sessionStorage.setItem('movidasst_sve_restore_report_org',state.reportOrg||'')}catch(e){}}
  else{localStorage.removeItem(APP_KEY);localStorage.removeItem(EVIDENCE_KEY);localStorage.removeItem(CONFIG_KEY)}
  localStorage.removeItem(BACKUP_KEY);
 }catch(e){alert('No se pudo recuperar el estado anterior. Exporta un respaldo y revisa el almacenamiento del navegador.');return false}
 window.location.reload();return true;
}
function updateDisplay(){
 const active=demoActive(),banner=document.getElementById('demoStatusBar'),box=document.getElementById('demoModePanel'),
 go=document.getElementById('goDemo'),load=document.getElementById('loadDemoReports'),
 exit=document.getElementById('exitCompleteDemo'),exit2=document.getElementById('exitDemoReports');
 if(banner){banner.hidden=!active;banner.classList.toggle('active',active)}
 if(box)box.classList.toggle('demo-active',active);
 if(go)go.textContent=active?'↻ Reiniciar demostración completa':'▶ Cargar trimestre demo completo';
 const homeLoad=document.getElementById('loadCompleteDemo');if(homeLoad)homeLoad.textContent=active?'↻ Reiniciar demostración completa':'▶ Cargar demostración completa';
 if(load)load.textContent=active?'↻ Reiniciar demo del trimestre':'▶ Cargar trimestre demo completo';
 for(const b of [exit,exit2])if(b)b.hidden=!active;
 const title=document.getElementById('demoModeTitle');
 if(title)title.textContent=active?'Demostración completa activa · julio–septiembre 2026':'Prueba un SVE completo, sin ingresar datos reales';
 const sub=document.getElementById('demoModeCopy');
 if(sub)sub.textContent=active?'Los 12 componentes, 3 meses, acciones, referencias ficticias e informes están cargados. Puedes descargar plantillas, analizar resultados e imprimir los cuatro informes. Al salir se eliminan los ejemplos y se restauran tus datos anteriores, si los había.':'Carga tres meses ficticios con información de salud, exámenes médicos, morbilidad, accidentes, procesos peligrosos, descanso y acciones. Explora e imprime los informes antes de comenzar con tus datos.';
 const stats=document.getElementById('demoStats');
 if(stats){const db0=active?JSON.parse(localStorage.getItem(APP_KEY)||'{}').db||{}:{};const count=Object.values(db0).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);stats.textContent=active?Object.keys(DATA_TYPES).length+' componentes · '+count+' filas ficticias · 5 acciones · 23 puntos de revisión':'Trimestre ficticio julio–septiembre 2026 · sin datos personales';}
 const clearAll=document.getElementById('clearAll');
 if(clearAll)clearAll.textContent=active?'Borrar demo y restaurar mis datos':'Eliminar todos mis datos locales';
 const hload=document.getElementById('goLoad');
 if(hload&&active)hload.innerHTML='Ver información de prueba <span aria-hidden="true">›</span>';
 if(active){let org=document.getElementById('reportOrganization');if(org)org.value=ORG}
}
function openReport(type){
 if(!['mensual','trimestral_salud','trimestral_tiempo','interno'].includes(type))type='trimestral_salud';
 if(typeof go==='function')go('informes');
 const advanced=document.getElementById('advancedReports');if(advanced)advanced.open=true;
 const select=document.getElementById('formalType');
 if(select){select.value=type;select.dispatchEvent(new Event('change',{bubbles:true}));}
 const month=document.getElementById('formalPeriod');
 if(month)month.value='2026-09';
 const y=document.getElementById('formalYear');if(y)y.value='2026';
 const q=document.getElementById('formalQuarter');if(q)q.value='3';
 const generate=document.getElementById('formalGenerate');if(generate)generate.click();
 const preview=document.getElementById('formalPreview');if(preview&&typeof preview.scrollIntoView==='function')preview.scrollIntoView({block:'start',behavior:'smooth'});
}
function attach(){
 updateDisplay();
 if(!demoActive()){try{const saved=sessionStorage.getItem('movidasst_sve_restore_report_org');if(saved!==null){const field=document.getElementById('reportOrganization');if(field)field.value=saved;sessionStorage.removeItem('movidasst_sve_restore_report_org')}}catch(e){}}
 for(const id of ['exitCompleteDemo','exitDemoReports','clearDemoTop']){const b=document.getElementById(id);if(b)b.addEventListener('click',clearDemo)}
 const loadButton=document.getElementById('loadCompleteDemo');if(loadButton)loadButton.addEventListener('click',loadDemo);
 const reportBtn=document.getElementById('goDemoReports');if(reportBtn)reportBtn.addEventListener('click',()=>{if(!demoActive()){try{sessionStorage.setItem('movidasst_demo_report_pending','trimestral_salud')}catch(e){}if(!loadDemo())try{sessionStorage.removeItem('movidasst_demo_report_pending')}catch(e){}return}openReport('trimestral_salud')});
 document.querySelectorAll('[data-demo-report]').forEach(b=>b.addEventListener('click',()=>{const type=b.dataset.demoReport||'trimestral_salud';if(!demoActive()){try{sessionStorage.setItem('movidasst_demo_report_pending',type)}catch(e){}if(!loadDemo())try{sessionStorage.removeItem('movidasst_demo_report_pending')}catch(e){}return}openReport(type)}));
 try{const pending=sessionStorage.getItem('movidasst_demo_report_pending');if(pending&&demoActive()){sessionStorage.removeItem('movidasst_demo_report_pending');openReport(pending)}}catch(e){}
 const clearAll=document.getElementById('clearAll');
 if(clearAll)clearAll.addEventListener('click',function(event){if(demoActive()){event.preventDefault();event.stopImmediatePropagation();clearDemo()}},true);
}
window.SVEDemo={load:loadDemo,exit:clearDemo,active:demoActive,update: updateDisplay,build:populate};
document.addEventListener('DOMContentLoaded',attach);
})();