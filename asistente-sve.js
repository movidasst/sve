'use strict';
/* Asistente operativo SVE: guía de captura, validación pedagógica y preparación de informe. */
(()=>{
const sections=[
 {id:'salud',title:'Salud',ref:'NT-04:2023, 2.6 · Reglamento Parcial, art. 34',keys:['morbilidad','accidentes','eventos_salud','reposos','evaluaciones_medicas','salud_complementaria'],minimum:['morbilidad','accidentes','eventos_salud'],why:'Vigilar accidentes comunes y de trabajo, enfermedades comunes y ocupacionales, evaluaciones y reposos. Diferenciar personas, consultas, eventos y días.'},
 {id:'procesos',title:'Riesgos y procesos peligrosos',ref:'NT-04:2023, 2.5.5 · Reglamento Parcial, art. 34',keys:['procesos','mediciones','controles','psicosocial'],minimum:['procesos','controles'],why:'Describir exposición, inspecciones, mediciones, controles preventivos y correctivos y verificación de su eficacia.'},
 {id:'tiempo',title:'Utilización del tiempo libre',ref:'NT-04:2023, 2.7 · Reglamento Parcial, art. 36',keys:['tiempo','jornada_detalle'],minimum:['tiempo','jornada_detalle'],why:'Comparar jornadas y pausas programadas con disfrute efectivo de descansos y vacaciones; examinar excesos de jornada.'}
];
const $=s=>document.querySelector(s);
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const counts=()=>Object.fromEntries(sections.map(s=>[s.id,s.keys.reduce((n,k)=>n+(Array.isArray(db[k])?db[k].length:0),0)]));
const allRecords=()=>Object.entries(db).flatMap(([k,rows])=>Array.isArray(rows)?rows.map(r=>({...r,_dataset:k})):[]);
function audit(){
 const rows=allRecords(),by=counts(),complete=Object.values(reportDesign||{}).filter(x=>String(x||'').trim()).length;
 const pending=(actions||[]).filter(a=>a.status!=='Verificada'||!a.verificationEvidence||!a.verificationResult).length;
 const issues=[];
 if(!$('#reportOrganization')?.value?.trim())issues.push('Identificar la organización o centro de trabajo.');
 if(!reportDesign?.question?.trim())issues.push('Definir la pregunta y finalidad preventiva de la vigilancia.');
 if(!reportDesign?.definition?.trim())issues.push('Definir qué constituye un caso o evento y su población.');
 if(!reportDesign?.alert?.trim())issues.push('Establecer una señal que active revisión o investigación.');
 sections.forEach(s=>{if(!by[s.id])issues.push('Incorporar registros agregados de '+s.title.toLowerCase()+' o documentar por qué no están disponibles.');});
 const periods=[...new Set(rows.map(r=>r.periodo).filter(Boolean))].sort(),areas=[...new Set(rows.map(r=>r.area).filter(Boolean))];
 const reviews=[];
 if(periods.length>1)reviews.push('Existen varios períodos: verifica que las definiciones y denominadores sean comparables.');
 if(areas.length>1)reviews.push('Existen varias áreas: evita publicar datos de grupos pequeños o identificables.');
 if(rows.some(r=>r._dataset==='morbilidad'&&Number(r.consultas)>0))reviews.push('Las consultas no son personas afectadas; no deduzcas prevalencia a partir de visitas.');
 if(rows.some(r=>r._dataset==='tiempo'||r._dataset==='jornada_detalle'))reviews.push('Los porcentajes agregados de vacaciones no sustituyen el registro individual del disfrute efectivo.');
 if(rows.some(r=>r._dataset==='controles'||r._dataset==='procesos'))reviews.push('Verificar la ejecución documental no equivale a demostrar la eficacia técnica del control.');
 if(pending)issues.push('Revisar '+pending+' acciones sin verificación completa (evidencia y resultado).');
 if(!rows.length)issues.push('Cargar registros agregados fiables antes de interpretar resultados.');
 return {rows,by,complete,pending,issues,reviews,periods,areas};
}
function inject(){
 const indicator=$('#panel-indicadores .page-lead');if(indicator&&!$('#sveInterpretationCoach')){
 const n=document.createElement('section');n.id='sveInterpretationCoach';n.className='card sve-coach';indicator.insertAdjacentElement('afterend',n)}
 const report=$('#panel-informes .page-lead');if(report&&!$('#sveReportCoach')){
 const n=document.createElement('section');n.id='sveReportCoach';n.className='card sve-coach';report.insertAdjacentElement('afterend',n)}
 const home=$('#panel-inicio .hero');if(home&&!$('#sveProgressCoach')){
 const n=document.createElement('section');n.id='sveProgressCoach';n.className='card sve-coach';home.insertAdjacentElement('afterend',n)}
 const action=$('#panel-acciones .page-lead');if(action&&!$('#sveActionCoach')){
 const n=document.createElement('section');n.id='sveActionCoach';n.className='card sve-coach';action.insertAdjacentElement('afterend',n)}
}
function layout(title,subtitle,content){return '<div class="sve-coach-head"><span class="eyebrow teal">ASISTENTE PASO A PASO</span><h2>'+title+'</h2><p>'+subtitle+'</p></div>'+content}
function render(){
 inject();let a;try{a=audit()}catch(err){return}
 const stats=sections.map(s=>'<div class="sve-coach-stat"><b>'+e(s.title)+'</b><strong>'+a.by[s.id]+'</strong><span>registros agregados</span><small>'+e(s.ref)+'</small></div>').join('');
 const home=$('#sveProgressCoach');if(home)home.innerHTML=layout('Tu SVE: qué tienes y qué falta','La ruta empieza con los tres ámbitos, no con un indicador aislado. La cantidad de registros no demuestra cumplimiento.', '<div class="sve-coach-grid">'+stats+'</div><p><b>Diseño definido:</b> '+a.complete+' de 3 componentes orientadores · <b>Períodos:</b> '+e(a.periods.join(', ')||'Sin registros')+' · <b>Acciones pendientes de comprobar:</b> '+a.pending+'</p><div class="sve-coach-next"><b>Próximo paso recomendado</b><p>'+e(a.issues[0]||'Revisar interpretación, medidas y preparar el informe con evidencias.')+'</p></div>');
 const analysis=$('#sveInterpretationCoach');if(analysis){
 const check=a.rows.length?'<div class="sve-coach-grid">'+stats+'</div>':'<p>No hay registros aún. Primero incorpora fuentes y comprueba que población, evento y período coincidan.</p>';
 analysis.innerHTML=layout('Cómo leer tus resultados','Antes de interpretar un indicador, comprueba que estás midiendo lo que crees medir.',check+'<div class="sve-coach-steps">'+[
 ['1. Numerador','Qué se contó: personas, eventos, consultas, mediciones o días. No mezcles unidades.'],['2. Denominador','De qué población, cantidad programada u horas proviene el dato.'],['3. Comparabilidad','Asegura misma definición, área y período antes de comparar.'],['4. Interpretación','Explica el cambio observado y también qué no puede concluirse.'],['5. Decisión','Registra qué investigar, qué control implementar y qué evidencia verificar.']
 ].map(x=>'<article><b>'+x[0]+'</b><p>'+x[1]+'</p></article>').join('')+'</div><h3>Advertencias específicas de tus registros</h3>'+(a.reviews.length?'<ul>'+a.reviews.map(x=>'<li>'+e(x)+'</li>').join('')+'</ul>':'<p>Aún no hay señales específicas. La revisión profesional de los datos y fuentes sigue siendo necesaria.</p>'));
 }
 const ac=$('#sveActionCoach');if(ac)ac.innerHTML=layout('De la señal a la comprobación','Cada medida debe responder a un hallazgo respaldado por datos y documentar su eficacia, no solo su ejecución.','<div class="sve-coach-steps">'+[['Hallazgo','Especifica área, período, fuente y magnitud.'],['Medida','Prioriza controles en la fuente y el proceso, según proceda.'],['Responsable','Define unidad responsable y fecha de revisión.'],['Evidencia','Documento o medición que permita demostrar implementación.'],['Resultado','Compara contra criterio previo y determina si la medida funcionó.']].map(x=>'<article><b>'+x[0]+'</b><p>'+x[1]+'</p></article>').join('')+'</div><p><b>Acciones sin verificación completa:</b> '+a.pending+'</p>');
 const rpt=$('#sveReportCoach');if(rpt){
 const issueHtml=a.issues.length?'<ul class="sve-checklist">'+a.issues.map(x=>'<li><span aria-hidden="true">○</span>'+e(x)+'</li>').join('')+'</ul>':'<p>Los campos orientadores y registros revisados están presentes. Aun así, corresponde evaluar calidad técnica y cumplimiento con sus soportes.</p>';
 rpt.innerHTML=layout('Antes de generar el informe','El documento debe contar la historia completa: finalidad → fuentes → registros → análisis → decisiones → verificación. Lo que falte quedará identificado como pendiente.','<div class="sve-coach-grid">'+stats+'</div><h3>Lista de preparación</h3>'+issueHtml+'<p class="sve-coach-note"><b>Alcance:</b> esta guía es educativa. Los informes de la aplicación no sustituyen los formatos oficiales de INPSASEL ni la custodia de registros individuales.</p><button type="button" id="sveCopyPending" class="btn secondary mini">Copiar pendientes para mi plan de trabajo</button>');
 rpt.querySelector('#sveCopyPending')?.addEventListener('click',()=>{const t='Pendientes de preparación del SVE:\n'+(a.issues.length?a.issues.map((x,i)=>(i+1)+'. '+x).join('\n'):'Sin pendientes automáticos; revisar evidencia técnica.');if(navigator.clipboard?.writeText)navigator.clipboard.writeText(t).catch(()=>{});else{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}});
 }
}
function init(){
 inject();render();
 // Recalcular cuando la persona navega, modifica el diseño o carga registros.
 document.addEventListener('click',event=>{if(event.target.closest('.nav-item,[data-tab],#continueToData,#loadCompleteDemo,#exitCompleteDemo,#clearAll,#deleteDataset,#formalGenerate,#printReport,#aModule,#actionForm,#manualForm'))setTimeout(render,80)});
 document.addEventListener('change',event=>{if(event.target.closest('#datasetSelect,#uploadFile,#manualForm,#actionForm,#reportOrganization,#reportQuestion,#reportCaseDefinition,#reportAlert'))setTimeout(render,150)});
 document.addEventListener('input',event=>{if(event.target.closest('#reportOrganization,#reportQuestion,#reportCaseDefinition,#reportAlert'))setTimeout(render,250)});
 if(typeof MutationObserver==='function'){const target=$('#panel-datos');if(target){let pending=false;const observer=new MutationObserver(()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;render()},350)});const counter=target.querySelector('#datasetCount');if(counter)observer.observe(counter,{childList:true,characterData:true,subtree:true})}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();