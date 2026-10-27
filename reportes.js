/* Reportes técnicos y matriz de obligaciones — datos agregados, navegador local. */
(function(){
'use strict';
const EVIDENCE_KEY='movidasst_sve_evidencias_v1';
const CONFIG_KEY='movidasst_sve_reportconfig_v1';
const LEGAL=[
 ['A01','Reglamento art. 34.1','Accidentes comunes','eventos_salud','Accidente común'],
 ['A02','Reglamento art. 34.2','Accidentes de trabajo','accidentes',''],
 ['A03','Reglamento art. 34.3','Enfermedades comunes','eventos_salud','Enfermedad común'],
 ['A04','Reglamento art. 34.4','Enfermedades ocupacionales calificadas','eventos_salud','Enfermedad ocupacional calificada'],
 ['A05','Reglamento art. 34.5','Resultados agregados de exámenes de salud','salud_complementaria',''],
 ['A14','Reglamento Parcial art. 27 / NT-03:2016 arts. 26–30','Evaluaciones médicas por tipo, incluidas pre y posvacacionales','evaluaciones_medicas',''],
 ['A15','NT-03:2016 arts. 29 y 30','Evaluaciones pre y posvacacionales dentro del plazo aplicable','evaluaciones_medicas',''],
 ['A06','Reglamento art. 34.6','Referencias a centros especializados','salud_complementaria',''],
 ['A07','Reglamento art. 34.7','Reposos comunes','reposos','común'],
 ['A08','Reglamento art. 34.8','Reposos vinculados al trabajo','reposos','trabajo'],
 ['A09','Reglamento art. 34.9','Personas con discapacidad · dato agregado','salud_complementaria',''],
 ['A10','Reglamento art. 34.10','Factores de riesgo y procesos peligrosos','procesos',''],
 ['A11','Reglamento art. 34.11','Controles en la fuente, ambiente y trabajadores','controles',''],
 ['A12','Reglamento art. 34','Informe trimestral de vigilancia de accidentes y enfermedades · formato oficial','manual',''],
 ['A13','Reglamento art. 35','Custodia de historias de salud fuera de esta aplicación','manual',''],
 ['T01','LOPCYMAT art. 40.9 / Reglamento art. 36','Sistema de vigilancia de utilización del tiempo libre','jornada_detalle',''],
 ['T02','Reglamento art. 36','Vacaciones programadas y efectivamente disfrutadas','tiempo',''],
 ['T03','Reglamento art. 36','Turismo social y beneficios de tiempo libre','jornada_detalle',''],
 ['T04','Reglamento art. 36','Informe trimestral de tiempo libre · formato oficial','manual',''],
 ['N01','NT-04:2023 numeral 2.5.5','Monitoreo ocupacional y ambiental','mediciones',''],
 ['N02','NT-04:2023 numeral 2.6','Estadísticas de salud y divulgación mensual con confidencialidad','manual',''],
 ['N03','NT-04:2023 numeral 2.5.5','Participación del Comité de Seguridad y Salud Laboral','manual',''],
 ['N04','NT-04:2023 numerales 2.5.5–2.6','Medidas preventivas, seguimiento y evaluación','acciones','']
];
let evidence={},current=null;
const el=id=>document.getElementById(id);
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S=(rows,field)=>rows.reduce((a,r)=>a+(Number(r[field])||0),0);
const v=(n)=>new Intl.NumberFormat('es-VE',{maximumFractionDigits:1}).format(n);
const pc=(num,den)=>den>0?(num*100/den):null;
const fpc=(num,den)=>den>0?v(num*100/den)+' %':'No calculable';
const monthsOf=(type,month,year,q)=>{
 if(type==='mensual')return [month];
 if(type==='interno')return [month];
 const n=Number(year),start=(Number(q)-1)*3+1;
 return [0,1,2].map(z=>String(n)+'-'+String(start+z).padStart(2,'0'));
};
const rows=(k,months)=>((db[k]||[]).filter(r=>months.includes(r.periodo)));
const evidenceKey=r=>r[0];
function present(r,months){
 const entry=rows(r[3],months);
 if(r[3]==='manual')return false;
 if(r[3]==='acciones')return actions.some(a=>a.due&&String(a.due).slice(0,7)<=months[months.length-1]);
 if(r[0]==='T02')return entry.length||rows('jornada_detalle',months).length;
 if(r[0]==='A07')return entry.some(x=>/común|comun/i.test(x.origen));
 if(r[0]==='A08')return entry.some(x=>/trabajo|ocupacional/i.test(x.origen));
 if(r[0]==='T03')return entry.some(x=>Number(x.actividades_recreativas_realizadas)>0);
 if(r[0]==='A11')return ['Fuente','Ambiente','Trabajadores'].every(n=>entry.some(x=>x.nivel===n));
 if(r[0]==='A15')return entry.some(x=>x.tipo_evaluacion==='Prevacacional'||x.tipo_evaluacion==='Posvacacional');
 if(r[4])return entry.some(x=>x.categoria===r[4]);
 return entry.length>0;
}
function parameters(){
 let type=el('formalType').value,
 month=el('formalPeriod').value||latestPeriod()||'2026-10',
 year=String(el('formalYear').value||month.slice(0,4)),
 quarter=el('formalQuarter').value;
 return {type,months:monthsOf(type,month,year,quarter),month,year,quarter,org:el('formalOrg').value.trim(),responsible:el('formalResponsible').value.trim(),method:el('formalMethod').value.trim(),decision:el('formalDecision').value.trim(),participation:el('formalParticipation').value};
}
const reportType={
 mensual:{title:'Informe mensual de vigilancia de la salud · divulgación colectiva',base:'NT-04:2023, vigilancia de salud y divulgación mensual',scope:'Divulgación agregada: no se muestran diagnósticos individuales ni grupos pequeños.'},
 trimestral_salud:{title:'Informe técnico trimestral de vigilancia epidemiológica de accidentes y enfermedades ocupacionales',base:'LOPCYMAT art. 40.8; Reglamento Parcial art. 34',scope:'Documento técnico de soporte. NO es el formato oficial de consignación ante INPSASEL.'},
 trimestral_tiempo:{title:'Informe técnico trimestral de vigilancia de utilización del tiempo libre',base:'LOPCYMAT art. 40.9; Reglamento Parcial art. 36',scope:'Documento técnico de soporte. NO es el formato oficial de consignación ante INPSASEL.'},
 interno:{title:'Informe integrado interno de vigilancia epidemiológica',base:'LOPCYMAT / Reglamento Parcial / NT-04:2023',scope:'Documento interno de análisis del sistema; no sustituye los informes diferenciados ni oficiales.'}
};
function safeCount(n,publicVersion){
 return publicVersion&&n>0&&n<5?'Reservado (grupo pequeño)':v(n);
}
function reducePeriod(k,months,filter=()=>true){return rows(k,months).filter(filter)}
function reportNumbers(c){
 const m=c.months,kind=c.type,publicVersion=kind==='mensual',out=[],missing=[];
 const add=(head,desc)=>out.push({head,desc});
 const e=reducePeriod('eventos_salud',m),work=reducePeriod('accidentes',m),repos=reducePeriod('reposos',m),health=reducePeriod('salud_complementaria',m),exams=reducePeriod('evaluaciones_medicas',m),mor=reducePeriod('morbilidad',m),proc=reducePeriod('procesos',m),meas=reducePeriod('mediciones',m),ctrl=reducePeriod('controles',m),vac=reducePeriod('tiempo',m),shift=reducePeriod('jornada_detalle',m),cover=reducePeriod('cobertura',m);
 const has=e.length+work.length+repos.length+health.length+exams.length+mor.length+proc.length+meas.length+ctrl.length+vac.length+shift.length+cover.length;
 if(!has)missing.push('No se cargaron registros agregados correspondientes al período seleccionado.');
 if(kind==='mensual'||kind==='trimestral_salud'||kind==='interno'){
  if(e.length){
   const by={};for(const r of e){by[r.categoria]=(by[r.categoria]||0)+r.registros}
   add('Enfermedades comunes, ocupacionales y accidentes comunes',Object.entries(by).map(([name,count])=>name+': '+safeCount(count,publicVersion)+' registros').join(' · ')+'. Las sospechas se muestran separadas de enfermedades ocupacionales calificadas.');
  }else missing.push('Sin consolidado de enfermedades comunes, ocupacionales y accidentes comunes.');
  if(work.length){
   const accidents=S(work,'accidentes'),incidents=S(work,'incidentes'),hours=S(work,'horas_trabajadas');
   add('Accidentes e incidentes de trabajo',safeCount(accidents,publicVersion)+' accidentes de trabajo; '+safeCount(incidents,publicVersion)+' incidentes; '+v(hours)+' horas de trabajo agregadas. Indicador operativo de eventos por millón de horas: '+(publicVersion&&accidents>0&&accidents<5?'Reservado (grupo pequeño)':hours? v(accidents*1e6/hours):'No calculable')+'. No corresponde a incidencia acumulada de personas.');
  }else missing.push('Sin datos de accidentes e incidentes de trabajo.');
  if(repos.length){const by={};for(const r of repos){let v0=by[r.origen]||[0,0];v0[0]+=r.episodios;v0[1]+=r.dias_reposo;by[r.origen]=v0}
   add('Reposos por origen',Object.entries(by).map(([key,a])=>key+': '+safeCount(a[0],publicVersion)+' episodios y '+(publicVersion&&a[0]>0&&a[0]<5?'días reservados':v(a[1])+' días')).join(' · ')+'.');}
  else missing.push('Sin información agregada de reposos comunes y laborales.');
  if(health.length)add('Registro general de exámenes, referencias y discapacidad (puede coincidir con registros por tipo; no sumar ambos)','Exámenes realizados: '+v(S(health,'examenes_realizados'))+'; resultados que requieren seguimiento: '+safeCount(S(health,'resultados_con_seguimiento'),publicVersion)+'; referencias especializadas: '+safeCount(S(health,'referencias_especializadas'),publicVersion)+'; personas con discapacidad (por cortes mensuales, no personas únicas trimestrales): '+(m.length===1?safeCount(S(health,'personas_con_discapacidad'),publicVersion):'ver por mes')+'.');
  else missing.push('Sin registros de exámenes, referencias y discapacidad.');
  if(exams.length){
    const groups=[...new Set(exams.map(x=>x.tipo_evaluacion))];
    const pieces=[];
    for(const type of groups){
      const selected=exams.filter(x=>x.tipo_evaluacion===type);
      const planned=S(selected,'programadas'),done=S(selected,'realizadas');
      const timely=S(selected,'realizadas_en_plazo'),follow=S(selected,'con_seguimiento');
      const privateSmall=publicVersion&&((done>0&&done<5)||(follow>0&&follow<5)||(planned>0&&planned<5));
      if(privateSmall){
        pieces.push(type+': datos reservados en divulgación por grupo pequeño.');
      }else{
        pieces.push(type+': '+v(done)+' realizadas / '+v(planned)+' programadas; pendientes: '+v(Math.max(0,planned-done))+'; cobertura: '+fpc(done,planned)+'; oportunas: '+v(timely)+'/'+v(done)+' ('+fpc(timely,done)+'); con seguimiento: '+v(follow)+'.');
      }
    }
    add('Evaluaciones médicas ocupacionales por tipo · Reglamento art. 27 / NT-03:2016 arts. 26–30',pieces.join(' ')+ ' Son conteos de evaluaciones, no de personas únicas. El control de plazo se basa en los datos declarados y requiere respaldo externo.');
  }else missing.push('Sin desglose de evaluaciones de ingreso, prevacacionales, posvacacionales, egreso y periódicas.');
  if(mor.length){
   const conditions=[...new Set(mor.map(r=>r.condicion))];
   const groups=[];for(const condition of conditions){for(const month of m){const subset=mor.filter(x=>x.condicion===condition&&x.periodo===month);if(!subset.length)continue;const dates=[...new Set(subset.map(x=>x.fecha_corte))];if(dates.length>1){groups.push(condition+' '+month+': fechas de corte distintas; no se agrega la prevalencia.');continue}const exist=S(subset,'casos_existentes'),pop=S(subset,'poblacion_evaluada');groups.push(condition+' ('+month+', corte '+dates[0]+'): '+safeCount(exist,publicVersion)+' casos presentes / '+v(pop)+' evaluados = '+(publicVersion&&exist>0&&exist<5?'Reservado':fpc(exist,pop))+'.')}}
   add('Morbilidad · prevalencias por condición y corte',groups.join(' ')+ ' Las prevalencias de meses distintos NO se suman.');
  }else missing.push('Sin series de morbilidad/prevalencia.');
 }
 if(kind==='trimestral_salud'||kind==='interno'){
  if(proc.length)add('Procesos peligrosos','Inspecciones: '+v(S(proc,'inspecciones'))+'; hallazgos registrados: '+v(S(proc,'hallazgos'))+'; controles del módulo básico verificados: '+v(S(proc,'controles_verificados'))+'/'+v(S(proc,'controles_programados'))+'.');
  else missing.push('Sin inspecciones de procesos peligrosos.');
  if(meas.length){
   add('Monitoreo ocupacional / ambiental','Mediciones realizadas: '+v(S(meas,'mediciones_realizadas'))+'; mediciones que requieren revisión técnica: '+v(S(meas,'mediciones_que_requieren_revision'))+'. Los criterios técnicos se encuentran en las plantillas; este informe no afirma automáticamente incumplimientos.');
  }else missing.push('Sin monitoreo ocupacional / ambiental.');
  if(ctrl.length){
   add('Controles según su nivel',['Fuente','Ambiente','Trabajadores'].map(level=>{const a=ctrl.filter(r=>r.nivel===level);return level+': '+v(S(a,'implementadas'))+'/'+v(S(a,'programadas'))+' implementados, '+v(S(a,'verificadas'))+' verificados';}).join(' · ')+'.');
  }else missing.push('Sin clasificación de controles en fuente, ambiente y trabajadores.');
  if(cover.length){
   const groups=[...new Set(cover.map(x=>x.actividad))];add('Cobertura de actividades',groups.map(a=>{const r=cover.filter(x=>x.actividad===a);return a+': '+(m.length===1?fpc(S(r,'completadas'),S(r,'elegibles')):'datos disponibles; revisar porcentajes mes a mes para evitar sumar personas repetidas')}).join('; ')+'.');
  }
 }
 if(kind==='trimestral_tiempo'||kind==='interno'){
  if(shift.length){
   const table=[['Pausas de alimentación','pausas_alimentacion_disfrutadas','pausas_alimentacion_programadas'],['Descansos obligatorios','descansos_obligatorios_disfrutados','descansos_obligatorios_programados'],['Descansos convencionales','descansos_convencionales_disfrutados','descansos_convencionales_programados'],['Vacaciones','vacaciones_disfrutadas_dias','vacaciones_programadas_dias']];
   add('Jornadas y utilización del tiempo libre','Horas ordinarias: '+v(S(shift,'horas_ordinarias'))+'; horas extraordinarias: '+v(S(shift,'horas_extra'))+'. '+table.map(([label,num,den])=>label+': '+v(S(shift,num))+'/'+v(S(shift,den))+' ('+fpc(S(shift,num),S(shift,den))+')').join(' · ')+'. Actividades recreativas declaradas: '+v(S(shift,'actividades_recreativas_realizadas'))+'.');
  }else{missing.push('Sin registro detallado de jornadas, pausas, descansos obligatorios/convencionales y actividades de recreación.');if(vac.length)add('Vacaciones · módulo básico','Días disfrutados: '+v(S(vac,'dias_vacaciones_disfrutados'))+'/'+v(S(vac,'dias_vacaciones_programados'))+' programados; horas extraordinarias: '+v(S(vac,'horas_extra'))+'. Información insuficiente para sustituir el registro detallado del artículo 36.');}
 }
 const actionSubset=actions.filter(a=>!a.due||m.some(y=>String(a.due).slice(0,7)<=y));
 if(actionSubset.length){
   const total=actionSubset.length,verified=actionSubset.filter(a=>a.status==='Verificada').length,substantiated=actionSubset.filter(a=>a.status==='Verificada'&&a.verificationEvidence&&a.verificationResult).length;
   add('Medidas preventivas y seguimiento','Acciones registradas: '+total+'; declaradas verificadas: '+verified+'; con evidencia y resultado consignados: '+substantiated+'. Una medida ejecutada no equivale por sí sola a control eficaz.');
 }else missing.push('No se documentaron acciones preventivas correspondientes al ciclo de vigilancia.');
 return {out,missing,sourceKeys:{
   mensual:['eventos_salud','accidentes','reposos','salud_complementaria','evaluaciones_medicas','morbilidad'],
   trimestral_salud:['eventos_salud','accidentes','reposos','salud_complementaria','evaluaciones_medicas','morbilidad','procesos','mediciones','controles'],
   trimestral_tiempo:['jornada_detalle','tiempo'],
   interno:Object.keys(DATA_TYPES)
 }[kind],activeMonths:m,actionSubset};
}
function matrixHtml(c,edit){
 const head='<div class="matrix-intro"><strong>Comprobación de fuentes y evidencias</strong><small>«Datos cargados» solo confirma un registro agregado, no la suficiencia legal, exactitud clínica o la presentación oficial.</small></div>';
 return head+'<div class="matrix-items">'+LEGAL.map(req=>{
 const status=present(req,c.months),ev=evidence[req[0]]||{},pending=ev.status||'Pendiente',available=ev.status==='Disponible'&&!!String(ev.reference||'').trim();
 return '<article class="matrix-item"><div class="matrix-main"><strong>'+h(req[0])+' · '+h(req[2])+'</strong><span>'+h(req[1])+'</span><div class="matrix-tags"><span class="data-status '+(status?'has-data':'no-data')+'">'+(status?'Datos cargados':'Datos no acreditados en la app')+'</span><span class="data-status '+(available?'has-data':'no-data')+'">Evidencia: '+h(pending)+'</span></div></div>'+(edit?'<div class="matrix-entry"><select aria-label="Estado de evidencia" data-evidence-status="'+h(req[0])+'"><option value="Pendiente"'+(pending==='Pendiente'?' selected':'')+'>Pendiente de validar</option><option value="Disponible"'+(pending==='Disponible'?' selected':'')+'>Disponible y revisada</option><option value="No aplica"'+(pending==='No aplica'?' selected':'')+'>No aplica (justificar)</option></select><input aria-label="Referencia documental" data-evidence-reference="'+h(req[0])+'" maxlength="160" value="'+h(ev.reference||'')+'" placeholder="Código / ubicación documental (sin nombres)"></div>':'<small>'+h(ev.reference||'Sin referencia documental')+'</small>')+'</article>';
 }).join('')+'</div>';
}
function makeReport(c){
 const type=reportType[c.type],d=reportNumbers(c),publicVersion=c.type==='mensual';
 const rows2=d.out.map(x=>'<section class="rpt-section"><h3>'+h(x.head)+'</h3><p>'+h(x.desc)+'</p></section>').join('');
 const miss=d.missing.map(x=>'<li>'+h(x)+'</li>').join('');
 const activeEvidence=LEGAL.filter(req=>present(req,c.months)).length;
 const reviewed=LEGAL.filter(req=>{const x=evidence[req[0]]||{};return x.status==='Disponible'&&!!String(x.reference||'').trim()}).length;
 const evidenceNarrative='La matriz identifica '+activeEvidence+' campos con registros agregados y '+reviewed+' requisitos con evidencia declarada disponible/revisada, sobre '+LEGAL.length+' puntos de revisión. Esto no constituye una calificación legal de cumplimiento.';
 const table=publicVersion?'<p>El detalle de acciones y evidencias se mantiene en el informe interno, no en la versión destinada a divulgación pública.</p>':'<table class="rpt-tbl"><thead><tr><th>Medida / hallazgo</th><th>Responsable por función</th><th>Verificación</th><th>Conclusión</th></tr></thead><tbody>'+(d.actionSubset.length?d.actionSubset.map(a=>'<tr><td><strong>'+h(a.finding)+'</strong><br>'+h(a.measure)+'</td><td>'+h(a.owner)+'</td><td>'+h(a.due)+'<br>'+h(a.status)+'</td><td>'+h(a.verificationResult||'Sin resultado documentado')+'</td></tr>').join(''):'<tr><td colspan="4">Sin medidas documentadas.</td></tr>')+'</tbody></table>';
 const demoMode=(typeof isDemo!=='undefined')&&!!isDemo;
 return '<article class="sve-document"><div class="rpt-head"><div class="rpt-kicker">LA MOVIDA DE SST · DE LA REACCIÓN A LA PREVENCIÓN</div><h2>'+h(type.title)+'</h2><div class="rpt-sub">'+h(type.base)+'</div></div>'+
 '<div class="rpt-disclaimer"><strong>Alcance del documento.</strong> '+h(type.scope)+' '+(demoMode?'AVISO: LOS DATOS SON FICTICIOS.':'')+'</div>'+
 '<div class="rpt-meta"><div><b>Entidad:</b> '+h(c.org||'No identificada')+'</div><div><b>Período:</b> '+h(c.months.join(' · '))+'</div><div><b>Unidad:</b> '+h(c.responsible||'Servicio SST')+'</div><div><b>Fecha de generación:</b> '+h(new Date().toLocaleDateString('es-VE'))+'</div></div>'+
 '<h3>1. Objetivo y alcance</h3><p>Registrar, interpretar y comunicar de forma agregada información de vigilancia para orientar decisiones preventivas y verificar acciones. Se recopilan indicadores y evidencias referidas al período indicado; los registros personales y los expedientes sanitarios se custodian fuera de esta aplicación.</p>'+
 '<h3>2. Método y fuentes</h3><p>'+h(c.method||'Método específico pendiente de documentar por el Servicio SST. Las plantillas contienen cantidades agregadas, no constituyen resultados individuales ni diagnóstico clínico.')+'</p><p class="rpt-note">Fuentes cargadas: '+h(d.sourceKeys.filter(x=>rows(x,c.months).length).map(x=>DATA_TYPES[x].short).join(', ')||'Ninguna')+'.</p>'+
 '<h3>3. Indicadores y resultados</h3>'+ (rows2||'<p>No se dispone de datos correspondientes a este informe. No deben interpretarse cantidades ausentes como cero eventos.</p>')+
 '<h3>4. Interpretación y recomendaciones técnicas</h3><p>'+h(c.decision||'Pendiente de análisis y validación profesional. Los resultados descriptivos no acreditan relación causal.')+'</p>'+
 '<h3>5. Acciones y comprobación</h3>'+table+
 '<h3>6. Participación y documentación</h3><p>Participación institucional: '+h(c.participation==='con'?'Se declara disponible acta o evidencia':c.participation==='revision'?'Revisión en proceso':'Pendiente de documentar')+'. '+h(evidenceNarrative)+'</p>'+
 '<h3>7. Datos o evidencias pendientes</h3>'+(miss?'<ul>'+miss+'</ul>':'<p>No se identificaron faltantes de carga para los componentes revisados; comprobar registros, soportes y suficiencia de datos antes de circular el informe.</p>')+
 (publicVersion?'<h3>8. Resguardo documental</h3><p>La matriz de evidencias y los documentos internos no se incluyen en la versión de divulgación.</p>':'<h3>8. Matriz de correspondencia normativa</h3>'+matrixHtml(c,false))+
 '<p class="rpt-limit"><b>Confidencialidad:</b> no publicar información desagregada que permita identificar personas. Para grupos pequeños se reservan valores en el informe mensual de divulgación. Los registros agregados no sustituyen historias médicas individuales ni los formularios y trámites ante INPSASEL.</p>'+
 '<div class="rpt-signatures"><div>Revisado por Servicio SST / firma externa</div><div>Participación de representantes / constancia externa</div></div>'+
 '<footer>Elaborado por David Linares Brea · Academia Movida de SST · www.movidasst.com · Documento técnico generado localmente</footer></article>';
}
function presentReport(){
 const c=parameters();if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(c.month)){alert('Selecciona un mes de corte válido.');return;}
 if(!(Number(c.year)>=2000&&Number(c.year)<=2100)){alert('Año incorrecto.');return;}
 current={...c,html:makeReport(c)};
 el('formalPreview').innerHTML=current.html;
 el('normMatrix').innerHTML=matrixHtml(c,true);
 saveConfig();
}
function csvEscape(s){return String(s??'').replace(/[\r\n]/g,' ').replaceAll(';',',')}
function getSheets(){
 const c=(current||{...parameters()}),d=reportNumbers(c);
 const sheets=[];
 sheets.push({name:'Informe',data:[['Campo','Valor'],['Documento',reportType[c.type].title],['Empresa',c.org],['Meses',c.months.join(', ')],['Unidad responsable',c.responsible],['Método',c.method],['Interpretación',c.decision],['Precisión','Documento técnico no oficial'],...d.out.map(x=>[x.head,x.desc])]});
 if(c.type!=='mensual')sheets.push({name:'Matriz normativa',data:[['Código','Base normativa','Tema','Datos cargados','Estado de evidencia','Referencia'],...LEGAL.map(q=>[q[0],q[1],q[2],present(q,c.months)?'Sí':'No',(evidence[q[0]]||{}).status||'Pendiente',(evidence[q[0]]||{}).reference||''])]});
 if(c.type!=='mensual')sheets.push({name:'Acciones',data:[['Hallazgo','Medida','Responsable','Fecha','Estado','Evidencia de verificación','Resultado'],...d.actionSubset.map(x=>[x.finding,x.measure,x.owner,x.due,x.status,x.verificationEvidence||'',x.verificationResult||''])]});
 if(c.type!=='mensual')for(const k of d.sourceKeys){const def=DATA_TYPES[k],r=rows(k,c.months);sheets.push({name:k.slice(0,31),data:[def.columns,...r.map(a=>def.columns.map(key=>a[key]))]})}
 return sheets;
}
function exportExcel(){
 presentReport();
 if(!current)return;
 const sheets=getSheets();
 if(window.XLSX){
  const wb=XLSX.utils.book_new();
  for(const sh of sheets){let ws=XLSX.utils.aoa_to_sheet(sh.data);ws['!cols']=sh.data[0].map(v=>({wch:Math.max(17,Math.min(50,String(v).length+8))}));XLSX.utils.book_append_sheet(wb,ws,sh.name)}
  XLSX.writeFile(wb,'SVE_Informe_'+current.type+'_'+current.months.join('_')+'.xlsx');
  notify('Informe y matriz exportados a Excel.');
 }else{for(const sh of sheets)dl('\ufeff'+makeCSV(sh.data),'SVE_'+sh.name+'.csv','text/csv;charset=utf-8');notify('Excel no disponible. Se descargaron hojas CSV.')}
}
function exportWord(){
 presentReport();if(!current)return;
 const styles='body{font:11pt Arial,sans-serif;color:#142c3b}h2,h3{color:#00205b}h2{font-size:21pt}h3{font-size:13pt;padding-top:10pt;border-top:1px solid #dde5e9}.sve-document{padding:8px}.rpt-kicker{font-size:9pt;color:#007b85;font-weight:bold}.rpt-tbl{border-collapse:collapse;width:100%}.rpt-tbl th,.rpt-tbl td{border:1px solid #cad7df;padding:6px;font-size:9pt}.matrix-item{border-bottom:1px solid #ddd;padding:6px 0}.matrix-main span,.matrix-tags{display:block;font-size:9pt}.rpt-signatures{margin-top:24pt;display:table;width:100%}.rpt-signatures div{display:table-cell;border-top:1px solid #333;padding:8pt}.rpt-limit,.rpt-note{font-size:9pt}.rpt-disclaimer{background:#eef6f4;padding:10pt}.rpt-meta{margin:12pt 0}footer{margin-top:20pt;font-size:9pt}';
 const doc='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe SVE</title><style>'+styles+'</style></head><body>'+current.html+'</body></html>';
 dl('\ufeff'+doc,'SVE_Informe_'+current.type+'_'+current.months.join('_')+'.doc','application/msword;charset=utf-8');
 notify('Documento Word editable (.doc) descargado.');
}
function exportPDF(){
 presentReport();if(!current)return;
 let print=el('printSheet');print.innerHTML=current.html;document.body.classList.add('printing-sve');window.print();
}
function persistEvidence(){try{localStorage.setItem(EVIDENCE_KEY,JSON.stringify(evidence))}catch(e){notify('No se pudo guardar la matriz; exporta un respaldo.')}}
function saveConfig(){try{const values={};for(const id of ['formalType','formalPeriod','formalQuarter','formalYear','formalOrg','formalResponsible','formalParticipation','formalMethod','formalDecision'])values[id]=el(id).value;localStorage.setItem(CONFIG_KEY,JSON.stringify(values))}catch(e){}}
function hydrate(){try{let raw=JSON.parse(localStorage.getItem(EVIDENCE_KEY)||'{}');if(raw&&typeof raw==='object')evidence=raw}catch(e){}
 try{let raw=JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}');for(const [id,value] of Object.entries(raw||{})){if(el(id))el(id).value=value}}catch(e){}
 if(!el('formalPeriod').value)el('formalPeriod').value=latestPeriod()||new Date().toISOString().slice(0,7);
 if(!el('formalYear').value)el('formalYear').value=el('formalPeriod').value.slice(0,4);
 el('formalQuarter').value=String(Math.floor((Number(el('formalPeriod').value.slice(5,7))-1)/3)+1);
}
function init(){
 if(!el('formalGenerate'))return;
 hydrate();
 const refresh=()=>{current=null;el('normMatrix').innerHTML=matrixHtml(parameters(),true)};
 el('formalGenerate').addEventListener('click',presentReport);
 el('formalPDF').addEventListener('click',exportPDF);
 el('formalWord').addEventListener('click',exportWord);
 el('formalExcel').addEventListener('click',exportExcel);
 for(const id of ['formalType','formalPeriod','formalQuarter','formalYear','formalOrg','formalResponsible','formalParticipation','formalMethod','formalDecision']){
  el(id).addEventListener('change',()=>{saveConfig();refresh()});
 }
 el('normMatrix').addEventListener('change',e=>{
  let id=e.target.dataset.evidenceStatus;if(id){let entry=evidence[id]||{};entry.status=e.target.value;evidence[id]=entry;persistEvidence();refresh();}
 });
 el('normMatrix').addEventListener('focusout',e=>{
  let id=e.target.dataset.evidenceReference;if(id){let entry=evidence[id]||{};entry.reference=e.target.value.trim();evidence[id]=entry;persistEvidence();}
 });
 // Las acciones no deben marcarse como verificadas sin documentar resultado y soporte.
 el('actionsList').addEventListener('change',e=>{
  const id=e.target.dataset.actionStatus;
  if(!id||e.target.value!=='Verificada')return;
  const a=actions.find(x=>x.id===id);
  if(!a||a.verificationEvidence&&a.verificationResult)return;
  const ev=prompt('Referencia de evidencia de verificación (sin datos personales):',a.verificationEvidence||'');
  if(!ev||!ev.trim()){e.stopImmediatePropagation();renderActions();notify('No se marcó como verificada: falta evidencia.');return;}
  const result=prompt('Resultado de la comprobación: ¿funcionó la medida?, ¿qué se observó?',a.verificationResult||'');
  if(!result||!result.trim()){e.stopImmediatePropagation();renderActions();notify('No se marcó como verificada: falta el resultado.');return;}
  a.verificationEvidence=ev.trim().slice(0,400);
  a.verificationResult=result.trim().slice(0,600);
  a.verificationDate=new Date().toISOString().slice(0,10);
  persist();
 },true);
 el('formalPeriod').addEventListener('change',()=>{const m=el('formalPeriod').value;if(m){el('formalYear').value=m.slice(0,4);el('formalQuarter').value=String(Math.floor((Number(m.slice(5))-1)/3)+1)}});
 refresh();
}
document.addEventListener('DOMContentLoaded',init);
})();