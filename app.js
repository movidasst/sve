'use strict';
/* Laboratorio SVE — Movida SST. Procesamiento local de datos agregados. */
const DATA_TYPES = {
  morbilidad:{
    name:'Morbilidad y vigilancia de la salud',module:'Módulo 2 · Salud',short:'Morbilidad',
    description:'Casos existentes en una fecha, casos nuevos durante un período y consultas registradas. Cada fila debe referirse a una condición definida, un área y un período. Si los casos nuevos no tuvieron seguimiento completo, marca «no».',
    rule:'Indica fecha_corte en formato YYYY-MM-DD (fecha de prevalencia y comienzo del seguimiento). Para incidencia acumulada: población en riesgo = población evaluada al inicio − casos existentes. El período es YYYY-MM y los casos nuevos corresponden a esa cohorte. Las consultas no son personas.',
    columns:['periodo','fecha_corte','area','condicion','poblacion_evaluada','casos_existentes','poblacion_en_riesgo','casos_nuevos','consultas','seguimiento_completo'],
    numeric:['poblacion_evaluada','casos_existentes','poblacion_en_riesgo','casos_nuevos','consultas'],
    key:['periodo','area','condicion'],
    sample:[['2026-09','2026-09-01','Operaciones','Molestias lumbares',50,15,35,3,22,'si'],['2026-09','2026-09-01','Mantenimiento','Molestias lumbares',40,6,34,4,13,'si'],['2026-09','2026-09-01','Administración','Molestias lumbares',30,3,27,1,5,'si']]
  },
  accidentes:{
    name:'Accidentes e incidentes de trabajo',module:'Módulo 2 · Accidentes',short:'Accidentes',
    description:'Eventos por área y período, para reconocer patrones y orientar investigaciones. El número de accidentes contabiliza eventos, no necesariamente personas diferentes.',
    rule:'La frecuencia por millón de horas es un indicador operativo del ejemplo, NO un índice único exigido por toda la normativa. Indica siempre horas de trabajo, período y criterio del evento.',
    columns:['periodo','area','trabajadores','accidentes','incidentes','horas_trabajadas'],
    numeric:['trabajadores','accidentes','incidentes','horas_trabajadas'],
    key:['periodo','area'],
    sample:[['2026-09','Operaciones',50,2,5,8800],['2026-09','Mantenimiento',40,1,3,7040],['2026-09','Administración',30,0,1,5280]]
  },
  procesos:{
    name:'Vigilancia de procesos peligrosos',module:'Módulo 3 · Procesos',short:'Procesos',
    description:'Inspecciones, hallazgos y verificación de controles. Cada fila corresponde a un proceso en un área y período.',
    rule:'Los hallazgos son eventos que pueden repetirse dentro de una inspección; no se dividen por inspecciones para presentarlos como «porcentaje de personas expuestas».',
    columns:['periodo','area','proceso','inspecciones','hallazgos','controles_programados','controles_verificados'],
    numeric:['inspecciones','hallazgos','controles_programados','controles_verificados'],
    key:['periodo','area','proceso'],
    sample:[['2026-09','Operaciones','Empaque',8,6,5,3],['2026-09','Mantenimiento','Soldadura',6,4,4,2]]
  },
  tiempo:{
    name:'Utilización del tiempo libre',module:'Módulo 3 · Tiempo libre',short:'Tiempo libre',
    description:'Verifica descansos efectivos, horas extra y vacaciones realmente disfrutadas, más allá de los calendarios programados.',
    rule:'Los días de vacaciones son acumulados del área para el período. El porcentaje de disfrute es días disfrutados / días programados: no equivale al porcentaje de trabajadores que salieron de vacaciones.',
    columns:['periodo','area','personas_elegibles','personas_descanso_efectivo','horas_extra','dias_vacaciones_programados','dias_vacaciones_disfrutados'],
    numeric:['personas_elegibles','personas_descanso_efectivo','horas_extra','dias_vacaciones_programados','dias_vacaciones_disfrutados'],
    key:['periodo','area'],
    sample:[['2026-09','Operaciones',50,40,190,120,98],['2026-09','Mantenimiento',40,29,230,100,61]]
  },
  cobertura:{
    name:'Cobertura de actividades del SVE',module:'Módulo 4 · Implementación',short:'Cobertura',
    description:'Compara población elegible con actividades efectivamente completadas. Identifica brechas sin confundir cobertura con eficacia.',
    rule:'Cobertura = actividades completadas / personas elegibles × 100, cuando se prevé una actividad por persona elegible. Si existe otra unidad de ejecución, adapta el instrumento antes de importar.',
    columns:['periodo','area','actividad','elegibles','completadas'],
    numeric:['elegibles','completadas'],
    key:['periodo','area','actividad'],
    sample:[['2026-09','Operaciones','Evaluación de salud',50,44],['2026-09','Mantenimiento','Evaluación de salud',40,31],['2026-09','Administración','Evaluación de salud',30,27]]
  }
};
const STORE_KEY='movidasst_sve_v1';let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
const emptyDB=()=>Object.fromEntries(Object.keys(DATA_TYPES).map(k=>[k,[]]));
let db=emptyDB(),actions=[],dataset='morbilidad',filter={period:'',area:'',condition:'',activity:''},isDemo=false,toastTimer,reportDesign={question:'',definition:'',alert:''};
const $=(s,base=document)=>base.querySelector(s);
const $$=(s,base=document)=>Array.from(base.querySelectorAll(s));
const htmlEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const sum=(arr,k)=>arr.reduce((t,r)=>t+(Number(r[k])||0),0);
const fmt=(n,d=0)=>Number.isFinite(n)?new Intl.NumberFormat('es-VE',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n):'—';
const pct=(a,b)=>b>0?100*a/b:null;
const valPct=x=>x===null?'—':fmt(x,1)+' %';
const latestPeriod=()=>[...new Set(Object.values(db).flat().map(r=>r.periodo))].sort().at(-1)||'';
const option=(value,label,selected)=>'<option value="'+htmlEsc(value)+'"'+(selected?' selected':'')+'>'+htmlEsc(label)+'</option>';
const hasData=()=>Object.values(db).some(a=>a.length)||actions.length;
function notify(s){const x=$('#toast');x.textContent=s;x.classList.add('shown');clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.remove('shown'),4200)}
function persist(){try{localStorage.setItem(STORE_KEY,JSON.stringify({db,actions,isDemo,reportDesign}))}catch(e){notify('No se pudo conservar todo el conjunto localmente. Exporta un respaldo.')}}
function load(){try{const old=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(old&&old.db){for(const k of Object.keys(DATA_TYPES))db[k]=Array.isArray(old.db[k])?old.db[k]:[];actions=Array.isArray(old.actions)?old.actions:[];reportDesign=old.reportDesign&&typeof old.reportDesign==='object'?{question:String(old.reportDesign.question||'').slice(0,450),definition:String(old.reportDesign.definition||'').slice(0,450),alert:String(old.reportDesign.alert||'').slice(0,450)}:{question:'',definition:'',alert:''};isDemo=!!old.isDemo}}catch(e){db=emptyDB();actions=[];reportDesign={question:'',definition:'',alert:''}}}
function go(tab){const key=['inicio','datos','indicadores','acciones','informes'].includes(tab)?tab:'inicio';$$('.panel').forEach(x=>x.classList.toggle('active',x.id==='panel-'+key));$$('.nav-item').forEach(x=>{let active=x.dataset.tab===key;x.classList.toggle('active',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});if(location.hash!=='#'+key)history.replaceState(null,'','#'+key);window.scrollTo({top:0,behavior:'auto'});if(key==='inicio')renderHome();if(key==='datos')renderData();if(key==='indicadores')renderIndicators();if(key==='acciones')renderActions();if(key==='informes')renderReport();renderGuides()}

function setGuide(id,title,message,target,label){
 const node=$('#'+id);if(!node)return;
 node.innerHTML='<strong>'+htmlEsc(title)+'</strong><p>'+htmlEsc(message)+'</p>'+(target?'<button type="button" class="btn secondary mini" data-guide-tab="'+htmlEsc(target)+'">'+htmlEsc(label)+' →</button>':'');
}
function renderGuides(){
 const total=Object.values(db).reduce((a,v)=>a+v.length,0),complete=Object.values(reportDesign).filter(x=>String(x).trim()).length;
 const verified=actions.filter(a=>a.status==='Verificada').length;
 if(complete===0)setGuide('guidedNext','Empieza aquí · Definir','Escribe qué quieres vigilar, qué contarás como caso o evento y qué señal activa una revisión. No necesitas cifras todavía.',null,'');
 else if(total===0)setGuide('guidedNext','Siguiente · Registrar','Ya comenzaste la ficha de diseño ('+complete+'/3 campos). Elige un componente y carga un primer registro de prueba o un resumen agregado.','datos','Ir a mis datos');
 else if(actions.length===0)setGuide('guidedNext','Siguiente · Interpretar','Tienes '+total+' registros agregados. Revisa indicadores, denominadores y límites antes de decidir controles.','indicadores','Revisar indicadores');
 else if(verified===0)setGuide('guidedNext','Siguiente · Verificar','Ya documentaste '+actions.length+' acciones. Comprueba resultados frente a un criterio y guarda la evidencia de verificación.','acciones','Verificar mis acciones');
 else setGuide('guidedNext','Siguiente · Documentar','Tienes '+total+' registros, '+actions.length+' acciones y '+verified+' verificadas. Puedes generar un informe que conserve la secuencia desde el problema hasta la mejora.','informes','Preparar mi informe');
 const d=db[dataset]||[];
 setGuide('dataGuide','1 · Selecciona, 2 · registra, 3 · comprueba',d.length?'Hay '+d.length+' registros de «'+DATA_TYPES[dataset].name+'». Revisa unidades, duplicados, fechas y fuentes; después interpreta los resultados.':'Para «'+DATA_TYPES[dataset].name+'», primero lee qué mide la plantilla. Descarga un ejemplo, completa datos agregados por área y período, impórtalos o usa el formulario manual.',d.length?'indicadores':null,d.length?'Interpretar estos datos':'');
 if(total===0)setGuide('indicatorGuide','Primero necesitamos datos comparables','Aún no hay registros agregados para analizar. Carga un componente con su población, evento y período; no interpretes cifras inexistentes.','datos','Registrar información');
 else setGuide('indicatorGuide','Lee cada indicador en orden','Comprueba qué se contó (numerador), sobre quiénes o qué se calculó (denominador), el período y la calidad de los registros. Un aumento o asociación no demuestra por sí mismo la causa.','acciones','Definir medidas preventivas');
 if(actions.length===0)setGuide('actionGuide','Del resultado a la prevención','Comienza con un hallazgo comprobable y describe el control sobre la tarea o la organización, quién lo hará y qué evidencia demostrará su funcionamiento. No basta con anotar una capacitación o reparación.',total?'indicadores':'datos',total?'Volver a los indicadores':'Registrar primero');
 else setGuide('actionGuide','Cerrar solo después de comprobar','Tienes '+actions.length+' acciones, de las cuales '+verified+' están verificadas. Una orden de trabajo o una actividad cumplida no demuestra necesariamente eficacia; registra evidencia del desempeño obtenido.','informes','Documentar el seguimiento');
 const status=$('#reportGuideStatus');if(status){status.innerHTML='<strong>Estado de la preparación del informe</strong><p>'+htmlEsc(complete===3?'Definiste las tres preguntas iniciales.':complete+'/3 elementos de la ficha inicial completados; los restantes figurarán como pendientes.')+' '+htmlEsc(total+' registros cargados y '+actions.length+' acciones documentadas.')+'</p>';}
}

function renderHome(){const rows=Object.values(db).reduce((a,v)=>a+v.length,0),open=actions.filter(a=>a.status!=='Verificada').length;$('#homeStats').innerHTML=[[''+Object.values(db).filter(a=>a.length).length,'Componentes con datos'],[''+rows,'Registros agregados'],[''+open,'Acciones por verificar']].map(([value,label])=>'<div class="stat-card"><div class="value">'+htmlEsc(value)+'</div><span>'+htmlEsc(label)+'</span></div>').join('');}
function updateDatasetSelect(){
 const groups=[
 ['Vigilancia de salud y exámenes',['evaluaciones_medicas','morbilidad','eventos_salud','reposos','salud_complementaria','accidentes']],
 ['Procesos peligrosos',['procesos','mediciones','controles']],
 ['Condiciones psicosociales',['psicosocial']],
 ['Tiempo libre',['tiempo','jornada_detalle']],
 ['Implementación y cobertura',['cobertura']]
 ];
 $('#datasetSelect').innerHTML=groups.map(([label,keys])=>'<optgroup label="'+htmlEsc(label)+'">'+keys.filter(k=>DATA_TYPES[k]).map(k=>option(k,DATA_TYPES[k].name,k===dataset)).join('')+'</optgroup>').join('');
 $('#aModule').innerHTML=Object.entries(DATA_TYPES).map(([k,v])=>option(k,v.name,false)).join('');
}
function renderData(){const m=DATA_TYPES[dataset];$('#datasetSelect').value=dataset;$('#datasetTitle').textContent=m.name;$('#datasetExplain').textContent=m.description;$('#datasetRule').textContent='Cómo completar el formato: '+m.rule;$('#datasetCount').textContent=db[dataset].length;renderManualFields();renderDataTable();renderGuides()}
const FIELD_TITLES={
 periodo:'Período (AAAA-MM)',fecha_corte:'Fecha de corte',area:'Área de trabajo',condicion:'Condición de salud vigilada',proceso:'Proceso o tarea',
 poblacion_evaluada:'Personas evaluadas',casos_existentes:'Personas con casos existentes',poblacion_en_riesgo:'Personas inicialmente en riesgo',
 casos_nuevos:'Casos nuevos',consultas:'Consultas registradas',seguimiento_completo:'¿Se completó el seguimiento?',
 accidentes:'Accidentes',incidentes:'Incidentes',horas_trabajadas:'Horas trabajadas',trabajadores:'Trabajadores',
 inspecciones:'Inspecciones realizadas',hallazgos:'Hallazgos observados',controles_programados:'Controles planificados',
 controles_verificados:'Controles cuya ejecución fue verificada',personas_elegibles:'Personas elegibles',
 personas_evaluadas:'Personas que participaron',personas_con_senal:'Personas con señal según criterio',
 factor:'Factor de organización del trabajo',metodo:'Método de evaluación',medidas_programadas:'Medidas previstas',
 medidas_verificadas:'Medidas cuya ejecución fue verificada',elegibles:'Actividades o personas elegibles',
 completadas:'Actividades completadas',actividad:'Actividad de vigilancia',tipo_evaluacion:'Tipo de evaluación',
 programadas:'Evaluaciones programadas',realizadas:'Evaluaciones realizadas',realizadas_en_plazo:'Realizadas en el plazo aplicable',
 con_seguimiento:'Evaluaciones con seguimiento',tipo:'Tipo',nivel:'Nivel de control',
 personas_descanso_efectivo:'Personas con descanso efectivo',horas_extra:'Horas extraordinarias',
 dias_vacaciones_programados:'Días de vacaciones programados',dias_vacaciones_disfrutados:'Días de vacaciones disfrutados',
 resultados_con_seguimiento:'Resultados que requieren seguimiento',personas_afectadas:'Personas afectadas',
 registros:'Episodios o registros',episodios:'Episodios',dias_reposo:'Días de reposo',referencia_tecnica:'Criterio técnico de referencia',
 mediciones_realizadas:'Mediciones realizadas',mediciones_que_requieren_revision:'Mediciones que requieren revisión técnica',
 programadas:'Evaluaciones programadas',implementadas:'Medidas implementadas',verificadas:'Medidas verificadas'
};
const FIELD_HINTS={
 periodo:'Indica un mes, por ejemplo 2026-09. Mantén igual el período de los datos que deseas comparar.',
 fecha_corte:'Día en que se identifican los casos existentes. Debe corresponder al período indicado.',
 poblacion_en_riesgo:'Personas evaluadas menos quienes ya tenían la condición al inicio. No es el total de consultas.',
 casos_existentes:'Personas que tenían la condición en la fecha de corte, no consultas acumuladas.',
 casos_nuevos:'Personas que aparecen por primera vez con la condición durante el seguimiento definido.',
 consultas:'Una persona puede consultar varias veces; no representa personas distintas.',
 seguimiento_completo:'La incidencia acumulada simple se muestra solo cuando el seguimiento está declarado completo.',
 personas_con_senal:'Personas cuyo resultado cumple un criterio de revisión previamente definido; no equivale a diagnóstico.',
 controles_verificados:'Cuenta la verificación de ejecución. La eficacia exige además comprobar el desempeño.',
 medidas_verificadas:'Cuenta la ejecución comprobada, no infiere automáticamente eficacia ni control del riesgo.',
 elegibles:'Especifica en la actividad si la unidad de conteo son personas o actividades. No las mezcles.',
 horas_trabajadas:'Horas del período que se usarán como denominador del indicador de accidentes.'
};
const fieldLabel=c=>FIELD_TITLES[c]||c.replaceAll('_',' ').replace(/^./,x=>x.toUpperCase());

function renderManualFields(){
 const m=DATA_TYPES[dataset],sets={
  categoria:['Enfermedad común','Enfermedad ocupacional calificada','Sospecha de origen ocupacional','Accidente común'],
  origen:['Enfermedad común','Enfermedad ocupacional calificada','Accidente común','Accidente de trabajo'],
  nivel:['Fuente','Ambiente','Trabajadores'],
  tipo_evaluacion:['Ingreso','Prevacacional','Posvacacional','Egreso','Periódica por exposición','Anual programada','Otra programada']
 };
 $('#manualFields').innerHTML=m.columns.map(c=>{
   const label='<label for="field_'+htmlEsc(c)+'">'+htmlEsc(fieldLabel(c))+'</label>';
   let field='';
   if(c==='seguimiento_completo')field='<select id="field_'+c+'" name="'+c+'" required><option value="si">Sí</option><option value="no">No</option></select>';
   else if(sets[c])field='<select id="field_'+c+'" name="'+c+'" required>'+sets[c].map((choice,i)=>'<option value="'+htmlEsc(choice)+'">'+htmlEsc(choice)+'</option>').join('')+'</select>';
   else field='<input id="field_'+htmlEsc(c)+'" name="'+htmlEsc(c)+'" type="'+(m.numeric.includes(c)?'number':'text')+'" '+(m.numeric.includes(c)?'min="0" step="1"':'maxlength="100"')+' '+(c==='periodo'?'pattern="[0-9]{4}-(0[1-9]|1[0-2])" placeholder="2026-09"':c==='fecha_corte'?'pattern="[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}" placeholder="2026-09-01"':'')+' required>';
   return '<div class="field">'+label+field+(FIELD_HINTS[c]?'<small class="field-hint">'+htmlEsc(FIELD_HINTS[c])+'</small>':'')+'</div>';
 }).join('');
}
function renderDataTable(){const m=DATA_TYPES[dataset],rows=db[dataset],cols=m.columns;$('#dataTableWrap').innerHTML=!rows.length?'<div class="empty-table">Todavía no hay registros. Descarga una plantilla o utiliza el formulario.</div>':'<table class="data-table"><thead><tr>'+cols.map(c=>'<th>'+htmlEsc(fieldLabel(c))+'</th>').join('')+'<th>Eliminar</th></tr></thead><tbody>'+rows.slice(-35).map(r=>'<tr>'+cols.map(c=>'<td>'+htmlEsc(r[c])+'</td>').join('')+'<td><button class="del-row" data-delete="'+htmlEsc(keyOf(dataset,r))+'" title="Eliminar fila">×</button></td></tr>').join('')+'</tbody></table>';$('#datasetCount').textContent=rows.length;$('#dataPreviewNote').textContent=rows.length>35?'Se muestran los últimos 35 de '+rows.length+' registros. Exporta el CSV para revisarlos todos.':'Los registros son resúmenes agregados, no historias individuales.'}
function keyOf(k,r){return DATA_TYPES[k].key.map(f=>String(r[f]).trim().toLowerCase()).join('|')}
function validate(k,input){const m=DATA_TYPES[k],r={};for(const c of m.columns){let x=input[c];if(x===undefined||x===null||String(x).trim()==='')return 'Falta completar: '+fieldLabel(c);if(m.numeric.includes(c)){if(!/^\d+$/.test(String(x).trim()))return c+' debe ser un entero igual o mayor que 0';x=Number(x);if(!Number.isSafeInteger(x)||x>1e9)return c+' excede el rango permitido'}else{x=String(x).trim();if(x.length>100)return c+' tiene más de 100 caracteres';if(c==='periodo'&&!/^20\d{2}-(0[1-9]|1[0-2])$/.test(x))return 'periodo debe ser YYYY-MM (ejemplo: 2026-09)';if(c==='fecha_corte'&&(!/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(x)||x.slice(0,7)!==String(input.periodo).trim()||!Number.isFinite(new Date(x+'T00:00:00').getTime())||new Date(x+'T00:00:00').toISOString().slice(0,10)!==x))return 'fecha_corte debe ser YYYY-MM-DD y corresponder al período';if(c==='seguimiento_completo'){x=norm(x);if(!['si','no'].includes(x))return 'seguimiento_completo: usa si o no'}if(!['periodo','seguimiento_completo'].includes(c)&&x.length<2)return c+' está incompleto'}r[c]=x}
if(k==='morbilidad'){if(r.poblacion_evaluada<=0)return 'poblacion_evaluada debe ser mayor que cero';if(r.casos_existentes>r.poblacion_evaluada)return 'casos_existentes no puede exceder poblacion_evaluada';if(r.poblacion_en_riesgo!==r.poblacion_evaluada-r.casos_existentes)return 'poblacion_en_riesgo debe ser poblacion_evaluada − casos_existentes, para la misma cohorte';if(r.casos_nuevos>r.poblacion_en_riesgo)return 'casos_nuevos no puede exceder poblacion_en_riesgo'}
if(k==='tiempo'){if(r.personas_descanso_efectivo>r.personas_elegibles)return 'personas_descanso_efectivo excede elegibles';if(r.dias_vacaciones_disfrutados>r.dias_vacaciones_programados)return 'días disfrutados exceden días programados'}
if(k==='cobertura'&&r.completadas>r.elegibles)return 'completadas excede elegibles';
if(k==='procesos'&&r.controles_verificados>r.controles_programados)return 'controles verificados exceden programados';
return r}
function addRows(k,inputs){const tentative=inputs.map(input=>validate(k,input));if(isDemo&&tentative.some(r=>typeof r!=='string')){return {good:0,replaced:0,errors:['Estás en DEMOSTRACIÓN. Para cargar datos reales primero selecciona «Borrar demo y comenzar con mis datos». Los registros ficticios no se mezclarán con tus registros reales.']}}let good=0,replaced=0,errors=[];for(const [idx,input] of inputs.entries()){const r=validate(k,input);if(typeof r==='string'){errors.push('Fila '+(idx+2)+': '+r);continue}if(k==='morbilidad'&&db[k].some(a=>a.periodo===r.periodo&&norm(a.condicion)===norm(r.condicion)&&a.fecha_corte!==r.fecha_corte)){errors.push('Fila '+(idx+2)+': las áreas de la misma condición/período deben utilizar idéntica fecha de corte.');continue}const key=keyOf(k,r);let pos=db[k].findIndex(x=>keyOf(k,x)===key);if(pos>=0){db[k][pos]=r;replaced++}else if(db[k].length<5000){db[k].push(r);good++}else errors.push('Se alcanzó el máximo de 5.000 registros en el componente')}if(good||replaced){isDemo=false;persist();renderHome();renderData()}return {good,replaced,errors}}
function makeCSV(rows){return rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s)&&!(/^\-?\d+$/.test(s)))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}).join(';')).join('\r\n')+'\r\n'}
function dl(content,name,type){const blob=new Blob([content],{type:type||'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
function datasetCSV(k,sample=false){const m=DATA_TYPES[k];return '\ufeff'+makeCSV([m.columns,...(sample?m.sample:db[k].map(r=>m.columns.map(c=>r[c])))])}
function exportTemplate(k,asExcel){const m=DATA_TYPES[k];if(asExcel&&window.XLSX){const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet([m.columns]);ws['!cols']=m.columns.map(c=>({wch:Math.max(c.length+3,18)}));XLSX.utils.book_append_sheet(wb,ws,'Plantilla');XLSX.writeFile(wb,'SVE_Plantilla_'+k+'.xlsx');notify('Plantilla Excel descargada: '+m.name)}else{dl('\ufeff'+makeCSV([m.columns]),'SVE_Plantilla_'+k+'.csv','text/csv;charset=utf-8');if(asExcel)notify('Excel no está disponible sin conexión; descargué la plantilla CSV.');else notify('Plantilla CSV descargada.')}}
function csvParse(text){const s=text.replace(/^\ufeff/,'').replace(/\r\n?/g,'\n');const first=(s.split('\n').find(x=>x.trim())||'');const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';let out=[],row=[],cell='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===sep&&!quoted){row.push(cell);cell=''}else if(c==='\n'&&!quoted){row.push(cell);if(row.some(x=>String(x).trim()))out.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('CSV: comillas sin cerrar');row.push(cell);if(row.some(x=>String(x).trim()))out.push(row);return out}
const blockedHeaders=['nombre','apellido','cedula','dni','rut','telefono','correo','email','direccion','documento_identidad','historia_clinica','identificador','id_trabajador','fecha_nacimiento','paciente'];
function rowsFromGrid(grid,k){const cols=DATA_TYPES[k].columns;if(!grid.length)throw Error('El archivo está vacío');const headers=grid[0].map(x=>norm(x));const bad=headers.find(h=>blockedHeaders.includes(h));if(bad)throw Error('Columna de dato personal no permitida: '+bad+'. Usa únicamente registros agregados.');const missing=cols.filter(x=>!headers.includes(x));if(missing.length)throw Error('Faltan columnas: '+missing.join(', '));const unexpected=headers.filter(x=>x&&!cols.includes(x));if(unexpected.length)throw Error('Columnas no reconocidas: '+unexpected.join(', ')+'. Utiliza la plantilla de este componente.');return grid.slice(1).filter(row=>row.some(x=>String(x??'').trim())).map(row=>Object.fromEntries(cols.map(col=>[col,row[headers.indexOf(col)]])))}
async function importFile(file){if(!file)return;const out=$('#importResult');out.innerHTML='';try{if(file.size>4*1024*1024)throw Error('Máximo 4 MB por archivo. Divide los registros por período.');let grid=[],extension=file.name.split('.').at(-1).toLowerCase();if(extension==='csv'){grid=csvParse(await file.text())}else if(['xls','xlsx'].includes(extension)){if(!window.XLSX)throw Error('Para importar Excel se necesita conexión a la biblioteca XLSX. Guarda la hoja como CSV e inténtalo nuevamente.');let buffer=await file.arrayBuffer(),workbook=XLSX.read(buffer,{type:'array'}),sheet=workbook.Sheets[workbook.SheetNames[0]];grid=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''})}else throw Error('Formato no admitido. Usa .csv o .xlsx');if(grid.length>5002)throw Error('El archivo supera 5.000 filas');const {good,replaced,errors}=addRows(dataset,rowsFromGrid(grid,dataset));out.innerHTML=(good||replaced?'<div class="import-good">'+good+' nuevos registros; '+replaced+' actualizados.</div>':'')+(errors.length?'<div class="import-bad">'+htmlEsc(errors.slice(0,12).join('\n'))+(errors.length>12?'\n… y '+(errors.length-12)+' más':'')+'</div>':'');if(!good&&!replaced&&!errors.length)out.innerHTML='<div class="import-bad">No se encontraron filas de datos.</div>';$('#uploadFile').value='';notify('Importación terminada: '+good+' nuevos, '+replaced+' actualizados, '+errors.length+' observados.')}catch(e){out.innerHTML='<div class="import-bad">'+htmlEsc(e.message)+'</div>';notify('Revisa el archivo de importación.');$('#uploadFile').value=''}}
function optionsForFilter(){const all=Object.values(db).flat(),periods=[...new Set(all.map(r=>r.periodo))].sort().reverse(),areas=[...new Set(all.map(r=>r.area))].sort((a,b)=>a.localeCompare(b,'es')),conds=[...new Set(db.morbilidad.map(r=>r.condicion))].sort((a,b)=>a.localeCompare(b,'es')),activities=[...new Set(db.cobertura.map(r=>r.actividad))].sort((a,b)=>a.localeCompare(b,'es'));if(!periods.includes(filter.period))filter.period=periods[0]||'';if(!areas.includes(filter.area))filter.area='';if(!conds.includes(filter.condition))filter.condition=conds[0]||'';if(!activities.includes(filter.activity))filter.activity=activities[0]||'';$('#periodFilter').innerHTML=periods.map(p=>option(p,p,p===filter.period)).join('')||option('','Sin datos',true);$('#areaFilter').innerHTML=option('','Todas las áreas',!filter.area)+areas.map(a=>option(a,a,a===filter.area)).join('');$('#conditionFilter').innerHTML=conds.map(c=>option(c,c,c===filter.condition)).join('')||option('','Sin datos',true);$('#activityFilter').innerHTML=activities.map(a=>option(a,a,a===filter.activity)).join('')||option('','Sin datos',true);$('#filterNote').textContent=filter.period?'Período de referencia: '+filter.period+'. Las áreas solo se agrupan si son poblaciones distintas con la misma definición.':'Importa datos para activar los indicadores.'}
function rowsFor(k){return db[k].filter(r=>(!filter.period||r.periodo===filter.period)&&(!filter.area||r.area===filter.area)&&(k!=='morbilidad'||!filter.condition||r.condicion===filter.condition)&&(k!=='cobertura'||!filter.activity||r.actividad===filter.activity))}
function card(label,num,foot,warning=false){return '<div class="metric-card'+(warning?' warning':'')+'"><div class="m-label">'+htmlEsc(label)+'</div><div class="m-number">'+htmlEsc(num)+'</div><div class="m-foot">'+htmlEsc(foot)+'</div></div>'}
function collectMetrics(){const m=rowsFor('morbilidad'),a=rowsFor('accidentes'),p=rowsFor('procesos'),t=rowsFor('tiempo'),c=rowsFor('cobertura');const pre=pct(sum(m,'casos_existentes'),sum(m,'poblacion_evaluada')),inc=m.length&&m.every(x=>x.seguimiento_completo==='si')?pct(sum(m,'casos_nuevos'),sum(m,'poblacion_en_riesgo')):null,co=pct(sum(c,'completadas'),sum(c,'elegibles')),ver=pct(sum(p,'controles_verificados'),sum(p,'controles_programados')),desc=pct(sum(t,'personas_descanso_efectivo'),sum(t,'personas_elegibles')),vac=pct(sum(t,'dias_vacaciones_disfrutados'),sum(t,'dias_vacaciones_programados')),rate=sum(a,'horas_trabajadas')?sum(a,'accidentes')*1e6/sum(a,'horas_trabajadas'):null;return {m,a,p,t,c,pre,inc,co,ver,desc,vac,rate}}
function renderExamIndicators(){
 const target=$('#examsIndicators');
 if(!target)return;
 const records=rowsFor('evaluaciones_medicas');
 const by=new Map();
 for(const r of records){
   const k=r.tipo_evaluacion, x=by.get(k)||{plan:0,done:0,timely:0,followup:0};
   x.plan+=r.programadas;x.done+=r.realizadas;x.timely+=r.realizadas_en_plazo;x.followup+=r.con_seguimiento;
   by.set(k,x);
 }
 if(!by.size){target.innerHTML='<p class="muted">Aún no hay evaluaciones médicas de este período. Descarga la plantilla en Datos → Vigilancia de salud y exámenes.</p>';return}
 const header='<div class="table-wrap"><table class="data-table"><thead><tr><th>Tipo de evaluación</th><th>Programadas</th><th>Realizadas</th><th>Pendientes</th><th>Cobertura</th><th>En plazo</th><th>Seguimiento</th></tr></thead><tbody>';
 target.innerHTML=header+[...by].map(([type,x])=>'<tr><td><strong>'+htmlEsc(type)+'</strong></td><td>'+fmt(x.plan)+'</td><td>'+fmt(x.done)+'</td><td>'+fmt(Math.max(0,x.plan-x.done))+'</td><td>'+valPct(pct(x.done,x.plan))+'</td><td>'+valPct(pct(x.timely,x.done))+'</td><td>'+fmt(x.followup)+'</td></tr>').join('')+'</tbody></table></div><p class="fine-print">La cobertura se calcula por tipo de examen: realizados/programados. «En plazo» se calcula sobre los realizados según el plazo aplicable. Los exámenes pueden corresponder a una misma persona en diferentes momentos; no sumes tipos para obtener personas únicas.</p>';
}


function renderPsychosocialIndicators(){
 const target=$('#psychosocialIndicators');
 if(!target)return;
 const list=rowsFor('psicosocial');
 if(!list.length){
  target.innerHTML='<p class="muted">Todavía no hay registros de condiciones psicosociales para este período. En Datos selecciona «Condiciones psicosociales y organización del trabajo» y descarga la plantilla.</p>';
  return;
 }
 const header='<div class="table-wrap"><table class="data-table psy-table"><thead><tr><th>Área / factor</th><th>Método</th><th>Evaluación</th><th>Señales</th><th>Medidas verificadas</th></tr></thead><tbody>';
 target.innerHTML=header+list.map(r=>{
  const enough=r.personas_evaluadas>=5&&r.personas_elegibles>=5;
  const alerts=enough&&r.personas_con_senal>=5?r.personas_con_senal+' ('+valPct(pct(r.personas_con_senal,r.personas_evaluadas))+')':r.personas_con_senal===0?'Sin señales': 'Reservado por grupo pequeño';
  const coverage=enough?valPct(pct(r.personas_evaluadas,r.personas_elegibles)):'Reservado';
  return '<tr><td><strong>'+htmlEsc(r.area)+'</strong><br>'+htmlEsc(r.factor)+'</td><td>'+htmlEsc(r.metodo)+'</td><td>'+coverage+'<br><small>'+ (enough?fmt(r.personas_evaluadas)+' de '+fmt(r.personas_elegibles):'Grupo pequeño')+'</small></td><td>'+htmlEsc(alerts)+'</td><td>'+fmt(r.medidas_verificadas)+' / '+fmt(r.medidas_programadas)+'</td></tr>';
 }).join('')+'</tbody></table></div>';
}

function renderIndicators(){optionsForFilter();const x=collectMetrics(),n=x.m.length;$('#indicatorGrid').innerHTML=[
card('Prevalencia puntual',valPct(x.pre),x.m.length?sum(x.m,'casos_existentes')+' casos / '+sum(x.m,'poblacion_evaluada')+' personas evaluadas':'Sin datos de morbilidad'),
card('Incidencia acumulada',valPct(x.inc),n?(x.inc===null?'Seguimiento incompleto o sin población en riesgo válida':sum(x.m,'casos_nuevos')+' casos nuevos / '+sum(x.m,'poblacion_en_riesgo')+' personas inicialmente en riesgo'):'Sin datos',x.inc===null&&n>0),
card('Consultas registradas',x.m.length?fmt(sum(x.m,'consultas')):'—',x.m.length?'Consultas: no equivalen a personas ni diagnósticos':'Sin datos'),
card('Accidentes registrados',x.a.length?fmt(sum(x.a,'accidentes')):'—',x.a.length?'Eventos de trabajo durante '+filter.period:'Sin datos'),
card('Accidentes / millón h',x.rate===null?'—':fmt(x.rate,1),x.a.length?sum(x.a,'accidentes')+' eventos / '+fmt(sum(x.a,'horas_trabajadas'))+' horas × 1.000.000':'Sin horas de trabajo'),
card('Verificación de controles',valPct(x.ver),x.p.length?sum(x.p,'controles_verificados')+' verificados / '+sum(x.p,'controles_programados')+' programados':'Sin datos'),
card('Cobertura de vigilancia',valPct(x.co),x.c.length?sum(x.c,'completadas')+' actividades completadas / '+sum(x.c,'elegibles')+' elegibles':'Sin datos'),
card('Descanso efectivo',valPct(x.desc),x.t.length?sum(x.t,'personas_descanso_efectivo')+' personas con descanso / '+sum(x.t,'personas_elegibles')+' elegibles':'Sin datos'),
card('Vacaciones disfrutadas',valPct(x.vac),x.t.length?sum(x.t,'dias_vacaciones_disfrutados')+' días / '+sum(x.t,'dias_vacaciones_programados')+' días programados':'Sin datos')
].join('');
renderExamIndicators();
renderPsychosocialIndicators();
const byArea=new Map();for(const r of x.m){const k=r.area,z=byArea.get(k)||{existing:0,pop:0};z.existing+=r.casos_existentes;z.pop+=r.poblacion_evaluada;byArea.set(k,z)}const vals=[...byArea].map(([area,r])=>({area,p:pct(r.existing,r.pop)})).filter(r=>r.p!==null).sort((a,b)=>b.p-a.p);$('#areaChart').innerHTML=vals.length?vals.map(y=>'<div class="bar-entry"><strong title="'+htmlEsc(y.area)+'">'+htmlEsc(y.area)+'</strong><div class="bar-track"><div class="bar-fill" style="width:'+Math.min(100,y.p).toFixed(2)+'%"></div></div><span>'+valPct(y.p)+'</span></div>').join(''):'<div class="empty-table">Carga información de morbilidad para comparar áreas.</div>';$('#chartNote').textContent=vals.length?'Porcentaje = casos existentes / población evaluada del área × 100. Las diferencias descriptivas no prueban causalidad.':'';
const observations=[];if(x.m.length){observations.push(['Morbilidad','En la condición «'+filter.condition+'» se registraron '+sum(x.m,'casos_existentes')+' personas con la condición de '+sum(x.m,'poblacion_evaluada')+' evaluadas en '+filter.period+'. La prevalencia puntual es '+valPct(x.pre)+'. '+(x.inc===null?'No se estima incidencia acumulada simple: falta seguimiento completo o población válida.':'Se identificaron '+sum(x.m,'casos_nuevos')+' casos nuevos entre '+sum(x.m,'poblacion_en_riesgo')+' personas inicialmente libres de la condición ('+valPct(x.inc)+' en el período).')])}
if(x.c.length)observations.push(['Cobertura','Completaron la actividad '+sum(x.c,'completadas')+' de '+sum(x.c,'elegibles')+' personas elegibles ('+valPct(x.co)+'). Esta cifra describe alcance, no eficacia preventiva.']);
if(x.p.length)observations.push(['Procesos','Se verificaron '+sum(x.p,'controles_verificados')+' de '+sum(x.p,'controles_programados')+' controles programados ('+valPct(x.ver)+'). Es necesario contrastar además el funcionamiento real de esos controles.']);
if(x.t.length)observations.push(['Tiempo libre','El disfrute de vacaciones registrado equivale al '+valPct(x.vac)+' de los días programados. Debe investigarse el motivo de los días pendientes; no atribuir automáticamente efectos sobre la salud.']);
const psy=rowsFor('psicosocial');
if(psy.length)observations.push(['Organización del trabajo y factores psicosociales', 'Se han registrado '+psy.length+' evaluaciones colectivas de factores y métodos, por área y período. Revisa cobertura, señales y acciones sin sumar participantes entre factores: una persona podría responder a varios. Una señal requiere evaluación de condiciones organizacionales y no prueba enfermedad ni causalidad.']);
if(x.a.length)observations.push(['Accidentes','Se registraron '+sum(x.a,'accidentes')+' accidentes de trabajo y '+sum(x.a,'incidentes')+' incidentes en el período. Examina severidad, tareas y causas con la investigación correspondiente.']);
$('#interpretations').innerHTML=observations.length?observations.map(([title,text])=>'<div class="reading-card"><strong>'+htmlEsc(title)+'</strong><p>'+htmlEsc(text)+'</p></div>').join(''):'<div class="empty-table">Aún no hay registros para interpretar. Ve a Datos y comienza por una plantilla.</div>';
}
function renderActions(){const sorted=[...actions].sort((a,b)=>a.due.localeCompare(b.due));$('#actionCount').textContent=actions.length;$('#actionsList').innerHTML=sorted.length?sorted.map(a=>{const late=a.due<new Date().toISOString().slice(0,10)&&a.status!=='Verificada';return '<article class="action-card"><div class="action-top"><span class="status-chip '+(a.status==='Verificada'?'done':late?'late':'')+'">'+htmlEsc(late?'Vencida · '+a.status:a.status)+'</span><small>'+htmlEsc(a.priority)+' · '+htmlEsc(a.module)+'</small></div><h3>'+htmlEsc(a.finding)+'</h3><p><strong>Medida:</strong> '+htmlEsc(a.measure)+'</p><div class="meta"><b>Responsable:</b> '+htmlEsc(a.owner)+' · <b>Verificar:</b> '+htmlEsc(a.due)+'<br><b>Evidencia:</b> '+htmlEsc(a.evidence)+'</div><div class="action-buttons"><label class="field"><small>Estado de verificación</small><select data-action-status="'+htmlEsc(a.id)+'">'+['Pendiente','En ejecución','Verificada'].map(x=>option(x,x,x===a.status)).join('')+'</select></label><button class="btn danger-outline mini" data-action-delete="'+htmlEsc(a.id)+'" type="button">Eliminar</button></div></article>'}).join(''):'<div class="card"><div class="empty-table">Sin acciones registradas. El análisis debe conducir a decisiones y a su verificación.</div></div>'}
function reportHTML(){const x=collectMetrics(),name=$('#reportOrganization').value.trim(),period=filter.period||'Sin período',label=isDemo?'EJEMPLO DIDÁCTICO — DATOS FICTICIOS':'INFORME CON DATOS AGREGADOS',mNotes=[];
if(x.m.length)mNotes.push('Morbilidad ('+filter.condition+'): '+sum(x.m,'casos_existentes')+' casos existentes / '+sum(x.m,'poblacion_evaluada')+' evaluados = '+valPct(x.pre)+'. Casos nuevos: '+sum(x.m,'casos_nuevos')+'. Incidencia acumulada: '+valPct(x.inc)+(x.inc===null?' (no estimable con el seguimiento informado)':' en '+period)+'. Consultas: '+sum(x.m,'consultas')+' (no equivalen a personas).');
if(x.a.length)mNotes.push('Accidentes: '+sum(x.a,'accidentes')+' eventos de trabajo; '+sum(x.a,'incidentes')+' incidentes. Frecuencia operativa por millón de horas trabajadas: '+(x.rate===null?'sin denominador válido':fmt(x.rate,1))+'.');
const psys=rowsFor('psicosocial');
if(psys.length)mNotes.push('Condiciones psicosociales: '+psys.length+' registros por área/factor/método en '+period+'. Evaluaciones, señales y medidas deben interpretarse por separado; no sumar personas entre factores ni inferir diagnósticos o causalidad.');
if(x.p.length)mNotes.push('Procesos peligrosos: '+sum(x.p,'hallazgos')+' hallazgos en '+sum(x.p,'inspecciones')+' inspecciones; verificación de controles '+valPct(x.ver)+'.');
if(x.t.length)mNotes.push('Tiempo libre: descanso efectivo '+valPct(x.desc)+'; disfrute de días de vacaciones programados '+valPct(x.vac)+'. Horas extra acumuladas: '+sum(x.t,'horas_extra')+'.');
if(x.c.length)mNotes.push('Implementación: cobertura de actividades '+valPct(x.co)+'.');
const actionRows=actions.map(a=>'<tr><td>'+htmlEsc(a.finding)+'</td><td>'+htmlEsc(a.measure)+'</td><td>'+htmlEsc(a.owner)+'</td><td>'+htmlEsc(a.due)+'</td><td>'+htmlEsc(a.status)+'</td></tr>').join('');
return {name,period,label,notes:mNotes,actions:actionRows,metrics:x}};

function renderReport(){
 optionsForFilter();
 const r=reportHTML(),total=Object.values(db).reduce((n,rows)=>n+rows.length,0);
 const defined=Object.values(reportDesign).filter(x=>String(x).trim()).length;
 const steps=[
 ['1. Definir',defined+'/3 respuestas'],['2. Registrar',total+' registros'],
 ['3. Calcular',r.notes.length+' lecturas'],['4. Interpretar','Con límites'],
 ['5. Actuar',actions.length+' acciones'],['6. Verificar',actions.filter(a=>a.status==='Verificada').length+' verificadas']
 ];
 $('#reportPreview').innerHTML='<div class="eyebrow teal">'+htmlEsc(r.label)+'</div>'+
 '<h2 style="margin:8px 0">Vista previa · Informe guiado de vigilancia</h2>'+
 '<p class="r-sub">'+htmlEsc(r.name||'Centro de trabajo pendiente')+' · '+htmlEsc(r.period)+' · '+htmlEsc(filter.area||'Todas las áreas')+'</p>'+
 '<p class="muted">El PDF sigue seis etapas de trabajo, no comienza directamente con una tabla de cifras. Si faltan definiciones o registros, aparecerán como pendientes.</p>'+
 '<div class="report-stage-grid">'+steps.map(([a,b])=>'<div><strong>'+htmlEsc(a)+'</strong><span>'+htmlEsc(b)+'</span></div>').join('')+'</div>'+
 '<h3>Qué se incluirá</h3><p class="muted">'+htmlEsc(r.notes.length?'Indicadores y hallazgos, denominadores, limitaciones, '+actions.length+' acciones preventivas y criterios de verificación.':'Todavía no hay datos para calcular. El documento contendrá tu diseño inicial y los campos que faltan por completar.')+'</p>';
}
function buildPrintable(){
 const r=reportHTML(),x=r.metrics,esc=htmlEsc,period=r.period,area=filter.area||'Todas las áreas',
 effective=Object.fromEntries(Object.keys(DATA_TYPES).map(k=>[k,(db[k]||[]).filter(z=>(!filter.period||z.periodo===filter.period)&&(!filter.area||z.area===filter.area))]));
 const withData=Object.keys(effective).filter(k=>effective[k].length>0);
 const num=(arr,key)=>sum(arr,key),pctText=n=>valPct(n);
 const word=(value)=>value&&String(value).trim()?esc(value):'<em class="pdf-pending">Pendiente de definir: completar en Inicio.</em>';
 const step=(n,title,lead,contents)=>'<section class="pdf-section"><div class="pdf-section-head"><span>'+n+'</span><div><h2>'+title+'</h2><p>'+lead+'</p></div></div>'+contents+'</section>';
 const kpi=(title,value,formula,reading)=>'<article class="pdf-indicator"><strong>'+esc(title)+'</strong><b>'+esc(value)+'</b><small>'+esc(formula)+'</small><p>'+esc(reading)+'</p></article>';
 const metrics=[];
 if(x.m.length){
  metrics.push(kpi('Prevalencia puntual',pctText(x.pre),num(x.m,'casos_existentes')+' casos existentes / '+num(x.m,'poblacion_evaluada')+' personas evaluadas × 100','Es la proporción de casos existentes en la fecha de corte. No expresa casos nuevos ni demuestra el origen del problema.'));
  metrics.push(kpi('Incidencia acumulada',pctText(x.inc),num(x.m,'casos_nuevos')+' casos nuevos / '+num(x.m,'poblacion_en_riesgo')+' personas inicialmente libres de la condición × 100',x.inc===null?'No estimable: revisar seguimiento, denominador o criterio de cohorte.':'Solo es interpretable para la cohorte y el período con seguimiento completo declarados.'));
 }
 if(x.a.length)metrics.push(kpi('Accidentes por millón de horas',x.rate===null?'No calculable':fmt(x.rate,1),num(x.a,'accidentes')+' eventos / '+num(x.a,'horas_trabajadas')+' horas × 1.000.000','Es frecuencia operativa de eventos, no incidencia de personas accidentadas.'));
 if(x.c.length)metrics.push(kpi('Cobertura de actividad',pctText(x.co),num(x.c,'completadas')+' actividades completadas / '+num(x.c,'elegibles')+' elegibles × 100','Mide cuánto se ejecutó. No confirma que la actividad haya producido un control eficaz.'));
 if(x.p.length)metrics.push(kpi('Controles verificados',pctText(x.ver),num(x.p,'controles_verificados')+' controles verificados / '+num(x.p,'controles_programados')+' controles programados × 100','Verificar ejecución no es lo mismo que demostrar eficacia de la medida.'));
 if(x.t.length){
  metrics.push(kpi('Descanso efectivo',pctText(x.desc),num(x.t,'personas_descanso_efectivo')+' personas / '+num(x.t,'personas_elegibles')+' elegibles × 100','Contrastar con documentos y disfrute efectivo; un dato faltante no prueba incumplimiento.'));
  metrics.push(kpi('Días de vacaciones disfrutados',pctText(x.vac),num(x.t,'dias_vacaciones_disfrutados')+' días disfrutados / '+num(x.t,'dias_vacaciones_programados')+' días programados × 100','Indica proporción de días, no proporción de trabajadores.'));
 }
 const psy=effective.psicosocial||[];
 if(psy.length){
  const valid=psy.filter(z=>z.personas_elegibles>=5&&z.personas_evaluadas>=5);
  metrics.push(kpi('Vigilancia psicosocial',psy.length+' registros','Por área × factor × método × período',valid.length?'Las señales deben interpretarse por separado. Algunas celdas pueden reservarse para proteger la confidencialidad.':'No se presentan recuentos de personas por grupos pequeños. No equivale a diagnóstico.'));
 }
 const metricsHTML=metrics.length?'<div class="pdf-indicator-grid">'+metrics.join('')+'</div>':'<p class="pdf-empty">No hay registros comparables para producir indicadores. Primero carga una fuente de información y define su población, período y criterio.</p>';
 const conditions=x.m.length?'Condición: '+esc(filter.condition||'Definida en registros')+' · Personas evaluadas: '+num(x.m,'poblacion_evaluada')+'.':'La población evaluada debe documentarse en los registros por área y evento.';
 const quality=[
 ['Período y área',period==='Sin período'?'Pendiente de seleccionar':'Referencia: '+period+' · '+area],
 ['Fuentes y unidades',withData.length?withData.map(k=>DATA_TYPES[k].short+' ('+effective[k].length+' registros)').join('; '):'Sin fuentes cargadas para los filtros actuales'],
 ['Calidad de la información','Revisar registros duplicados, fecha de corte, criterios de caso, completitud y cambios en población antes de comparar resultados.'],
 ['Denominadores','Personas, consultas, eventos, horas, evaluaciones y días NO son unidades intercambiables.']
 ];
 const qualityHTML='<dl class="pdf-facts">'+quality.map(([term,desc])=>'<div><dt>'+esc(term)+'</dt><dd>'+esc(desc)+'</dd></div>').join('')+'</dl>';
 const interpretations=r.notes.length?'<div class="pdf-reading">'+r.notes.map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>':'<p class="pdf-empty">No hay hallazgos calculados para interpretar. La ausencia de registros no significa ausencia de eventos.</p>';
 const actionCards=actions.length?'<div class="pdf-actions">'+actions.map((a,i)=>{
  const verified=a.status==='Verificada'&&a.verificationEvidence&&a.verificationResult;
  return '<article class="pdf-action"><div class="pdf-action-head"><b>Medida '+(i+1)+' · '+esc(a.priority||'Prioridad por definir')+'</b><span>'+esc(a.status||'Pendiente')+'</span></div>'+
  '<p><strong>Hallazgo:</strong> '+esc(a.finding)+'</p>'+
  '<p><strong>Decisión preventiva:</strong> '+esc(a.measure)+'</p>'+
  '<p><strong>Responsable:</strong> '+esc(a.owner)+' · <strong>Fecha prevista:</strong> '+esc(a.due||'Pendiente')+'</p>'+
  '<p><strong>Evidencia prevista:</strong> '+esc(a.evidence||'No definida')+'</p>'+
  '<p class="pdf-check"><strong>Resultado de verificación:</strong> '+(verified?esc(a.verificationResult)+' · Soporte: '+esc(a.verificationEvidence):'Pendiente de comprobar desempeño y documentar el resultado, no solo ejecutar la actividad.')+'</p></article>';
 }).join('')+'</div>':'<p class="pdf-empty">No se han documentado acciones. Tras interpretar los hallazgos, define medidas sobre la fuente o la organización del trabajo, asigna responsable y criterio verificable.</p>';
 const verified=actions.filter(z=>z.status==='Verificada'&&z.verificationEvidence&&z.verificationResult).length;
 const next=withData.length===0?'1. Importar un primer registro colectivo. 2. Verificar población y período. 3. Analizar resultados.':actions.length===0?'1. Priorizar un hallazgo. 2. Definir controles y responsables. 3. Programar evidencia de verificación.':verified===0?'1. Revisar medidas pendientes. 2. Comparar resultados posteriores con un criterio técnico. 3. Registrar la evidencia.':'1. Comparar resultados antes y después de las medidas. 2. Registrar desvíos y decidir si reabrir acciones. 3. Programar el siguiente ciclo de vigilancia.';
 const html='<article class="guided-pdf">'+
 '<header class="pdf-header"><div class="pdf-brand">LA MOVIDA DE SST <span>+</span><small>ACADEMIA · DE LA REACCIÓN A LA PREVENCIÓN</small></div><div class="pdf-document-kind">INFORME GUIADO<br>DE VIGILANCIA</div></header>'+
 '<h1>Del dato a la decisión preventiva</h1>'+
 '<p class="pdf-deck">Diseño inicial, fuentes, indicadores, interpretación, medidas y verificación del SVE.</p>'+
 '<div class="pdf-meta"><b>'+esc(r.name||'Centro de trabajo pendiente de identificar')+'</b><span>Período: '+esc(period)+' · Área: '+esc(area)+'</span><span>'+esc(r.label)+' · Generado: '+esc(new Date().toLocaleDateString('es-VE'))+'</span></div>'+
 step('01','Definir el problema y la población','Primero aclara qué quieres conocer y qué decisión debe orientar la vigilancia.',
 '<dl class="pdf-facts"><div><dt>Pregunta y objetivo</dt><dd>'+word(reportDesign.question)+'</dd></div><div><dt>Evento o caso a vigilar</dt><dd>'+word(reportDesign.definition)+'</dd></div><div><dt>Población / alcance</dt><dd>'+conditions+'</dd></div><div><dt>Señal que activa la respuesta</dt><dd>'+word(reportDesign.alert)+'</dd></div></dl>')+
 step('02','Identificar y validar las fuentes','Define de dónde salen los datos, su unidad y si son comparables antes de calcular.',qualityHTML)+
 step('03','Calcular indicadores','Lee numerador, denominador, unidad y período. Un valor sin estas referencias puede inducir a errores.',metricsHTML)+
 step('04','Interpretar sin atribuir causas apresuradamente','El dato describe una señal; una asociación estadística no constituye una prueba causal.',interpretations+'<p class="pdf-caution"><strong>Límite:</strong> síntomas reportados, consultas, diagnósticos y enfermedades ocupacionales calificadas son categorías diferentes. Investiga exposición, temporalidad, sesgos y explicaciones alternativas; controla peligros identificados sin esperar certeza absoluta.</p>')+
 step('05','Priorizar y decidir medidas preventivas','Del hallazgo a una acción concreta con responsable, plazo y evidencia esperada.',actionCards)+
 step('06','Comprobar la eficacia y dar seguimiento','Una medida ejecutada o una inspección completada no equivale por sí sola a un riesgo controlado.',
 '<div class="pdf-next"><strong>Acciones documentadas:</strong> '+actions.length+' · <strong>Con resultado y soporte de verificación:</strong> '+verified+'.<p>Al verificar, compara la condición posterior con el criterio técnico u operativo definido; si persiste la exposición o la información es insuficiente, reabre o ajusta la medida.</p></div>')+
 step('07','Preparar el siguiente ciclo','El SVE es continuo: recoge, analiza, actúa, comprueba y vuelve a vigilar.','<p class="pdf-next">'+esc(next)+'</p>')+
 '<footer class="pdf-footer">La Academia Movida de SST · www.movidasst.com · Informe elaborado localmente con datos agregados. Documento de apoyo técnico, no es formato oficial de consignación ni prueba por sí solo cumplimiento legal.</footer>'+
 '</article>';
 $('#printSheet').innerHTML=html;
}
function exportAll(){if(window.XLSX){const wb=XLSX.utils.book_new();for(const [k,m] of Object.entries(DATA_TYPES)){const arr=[m.columns,...db[k].map(r=>m.columns.map(c=>r[c]))],ws=XLSX.utils.aoa_to_sheet(arr);ws['!cols']=m.columns.map(c=>({wch:Math.max(16,c.length+2)}));XLSX.utils.book_append_sheet(wb,ws,k)}const actionHeads=['componente','prioridad','hallazgo','medida','responsable','fecha_verificacion','evidencia','estado'];XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([actionHeads,...actions.map(a=>[a.module,a.priority,a.finding,a.measure,a.owner,a.due,a.evidence,a.status])]),'acciones');XLSX.writeFile(wb,'SVE_Movida_Respaldo.xlsx');notify('Archivo Excel con todas las hojas descargado.')}else{for(const k of Object.keys(DATA_TYPES))dl(datasetCSV(k),'SVE_'+k+'.csv','text/csv;charset=utf-8');exportActionsCSV();notify('Descargué los CSV. Para Excel conecta a internet.')}}
function exportActionsCSV(){dl('\ufeff'+makeCSV([['componente','prioridad','hallazgo','medida','responsable','fecha_verificacion','evidencia','estado'],...actions.map(a=>[a.module,a.priority,a.finding,a.measure,a.owner,a.due,a.evidence,a.status])]),'SVE_acciones.csv','text/csv;charset=utf-8')}
function demo(){if(window.SVEDemo&&typeof window.SVEDemo.load==='function')return window.SVEDemo.load();notify('La demostración no está disponible. Actualiza la página.');}
function ready(){
 load();updateDatasetSelect();$('#datasetSelect').addEventListener('change',e=>{dataset=e.target.value;$('#importResult').innerHTML='';$('#manualForm').classList.add('hidden');$('#toggleManual').textContent='Mostrar formulario';renderData()});
 $$('.nav-item').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));
 $$('[data-tab]:not(.nav-item)').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));
 $('#goLoad').addEventListener('click',()=>go('datos'));$('#goExamsData').addEventListener('click',()=>{dataset='evaluaciones_medicas';go('datos')});$('#goDemo').addEventListener('click',demo);$('#loadDemoReports').addEventListener('click',demo);
 $('#helpTop').addEventListener('click',()=>$('#helpDialog').showModal());$('#installApp').addEventListener('click',async()=>{if(installPrompt){installPrompt.prompt();try{await installPrompt.userChoice}catch(e){}installPrompt=null}else{alert('Para instalar SVE:\n\nAndroid (Chrome): abre el menú ⋮ y selecciona Instalar aplicación / Agregar a pantalla principal.\n\niPhone (Safari): toca Compartir → Añadir a pantalla de inicio.')}});
 $('#templateXLSX').addEventListener('click',()=>exportTemplate(dataset,true));$('#templateCSV').addEventListener('click',()=>exportTemplate(dataset,false));$('#sampleCSV').addEventListener('click',()=>dl('\ufeff'+makeCSV([DATA_TYPES[dataset].columns,...DATA_TYPES[dataset].sample]),'SVE_Ejemplo_'+dataset+'.csv','text/csv;charset=utf-8'));
 $('#uploadFile').addEventListener('change',e=>importFile(e.target.files[0]));
 const drop=$('#dropZone');['dragenter','dragover'].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.add('dragover')}));['dragleave','drop'].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.remove('dragover')}));drop.addEventListener('drop',e=>importFile(e.dataTransfer.files[0]));
 $('#toggleManual').addEventListener('click',()=>{const x=$('#manualForm'),open=x.classList.toggle('hidden');$('#toggleManual').textContent=open?'Mostrar formulario':'Ocultar formulario'});
 $('#manualForm').addEventListener('submit',e=>{e.preventDefault();const raw=Object.fromEntries(new FormData(e.currentTarget));const res=addRows(dataset,[raw]);if(res.errors.length){notify(res.errors.join(' | '));return}e.currentTarget.reset();notify('Registro validado y guardado localmente.');});
 $('#dataTableWrap').addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;if(!confirm('¿Eliminar este registro agregado?'))return;db[dataset]=db[dataset].filter(r=>keyOf(dataset,r)!==b.dataset.delete);persist();renderData();renderHome()});
 $('#exportDataset').addEventListener('click',()=>dl(datasetCSV(dataset),'SVE_'+dataset+'.csv','text/csv;charset=utf-8'));
 $('#deleteDataset').addEventListener('click',()=>{if(!db[dataset].length)return notify('Este componente no contiene registros.');if(confirm('¿Borrar los datos de '+DATA_TYPES[dataset].name+' del navegador?')){db[dataset]=[];persist();renderData();renderHome();notify('Componente borrado.')}});
 for(const [id,key] of [['periodFilter','period'],['areaFilter','area'],['conditionFilter','condition'],['activityFilter','activity']])$('#'+id).addEventListener('change',e=>{filter[key]=e.target.value;renderIndicators()});
 $('#actionForm').addEventListener('submit',e=>{e.preventDefault();const a={id:'a'+Date.now()+Math.random().toString(36).slice(2,7),module:$('#aModule').selectedOptions[0].text,priority:$('#aPriority').value,finding:$('#aFinding').value.trim(),measure:$('#aMeasure').value.trim(),owner:$('#aOwner').value.trim(),due:$('#aDue').value,evidence:$('#aEvidence').value.trim(),status:'Pendiente'};if([a.finding,a.measure,a.owner,a.due,a.evidence].some(x=>!x)){notify('Completa los campos de la acción.');return}actions.push(a);persist();e.currentTarget.reset();renderActions();notify('Acción registrada. Incluye seguimiento y evidencias.')});
 $('#actionsList').addEventListener('change',e=>{const id=e.target.dataset.actionStatus;if(!id)return;const a=actions.find(x=>x.id===id);if(a){a.status=e.target.value;persist();renderActions()}});
 $('#actionsList').addEventListener('click',e=>{const b=e.target.closest('[data-action-delete]');if(!b)return;if(!confirm('¿Eliminar esta acción?'))return;actions=actions.filter(a=>a.id!==b.dataset.actionDelete);persist();renderActions()});

 for(const [id,key] of [['reportQuestion','question'],['reportCaseDefinition','definition'],['reportAlert','alert']]){
  const field=$('#'+id);if(!field)continue;field.value=reportDesign[key]||'';
  field.addEventListener('input',()=>{reportDesign[key]=field.value.slice(0,450);persist();renderGuides();if($('#panel-informes').classList.contains('active'))renderReport()});
 }
 $('#continueToData')?.addEventListener('click',()=>go('datos'));
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-guide-tab]');if(b){go(b.dataset.guideTab);return}
  const choice=e.target.closest('[data-select-dataset]');if(choice){dataset=choice.dataset.selectDataset;go('datos');}
 });

 $('#reportOrganization').addEventListener('input',()=>{renderReport();persist()});$('#printReport').addEventListener('click',()=>{buildPrintable();window.print()});$('#exportWorkbook').addEventListener('click',exportAll);$('#downloadBackup').addEventListener('click',()=>{for(const k of Object.keys(DATA_TYPES))dl(datasetCSV(k),'SVE_'+k+'.csv','text/csv;charset=utf-8');exportActionsCSV();notify('Respaldo CSV exportado por componente.');});
 $('#clearAll').addEventListener('click',()=>{if(!confirm('¿Borrar definitivamente los registros y las acciones guardados en este navegador? Exporta un respaldo antes.'))return;db=emptyDB();actions=[];filter={period:'',area:'',condition:'',activity:''};reportDesign={question:'',definition:'',alert:''};isDemo=false;persist();go('inicio');notify('Datos locales eliminados.')});
 renderHome();renderData();go(location.hash.slice(1)||'inicio');
 if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
document.addEventListener('DOMContentLoaded',ready);
