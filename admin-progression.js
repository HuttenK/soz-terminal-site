'use strict';
(() => {
 let current=null,stages=[],offset=0,run=0,working=false;
 tests.forEach(t=>{const option=document.createElement('option');option.value=t.code;option.textContent=t.code+' — '+t.title;$('progress-course').append(option);});
 function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
 function section(progress){
  $('admin-progression').hidden=!progress;$('admin-testing').hidden=progress;
  $('tab-results').setAttribute('aria-pressed',!progress);$('tab-progression').setAttribute('aria-pressed',progress);
  if(progress){$('status').textContent='';loadProgress();}
 }
 $('tab-results').onclick=()=>section(false);$('tab-progression').onclick=()=>section(true);
 $('logout').addEventListener('click',()=>{run++;current=null;stages=[];$('admin-progress-roster').replaceChildren();$('stage-editor').replaceChildren();$('admin-progress-status').textContent='';$('progress-employee').value='';$('admin-progress-query').value='';$('admin-progression').hidden=true;$('admin-testing').hidden=false;$('tab-results').setAttribute('aria-pressed','true');$('tab-progression').setAttribute('aria-pressed','false');});
 async function request(path,body){
  const response=await window.terminalFetch(path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(15000)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Ошибка сохранения.');return result;
 }
 function lock(value){
  working=value;$('admin-progression').querySelectorAll('input,button,select').forEach(n=>n.disabled=value);
  $('tab-results').disabled=$('tab-progression').disabled=value;
  if(!value){$('progress-previous').disabled=!current||$('progress-previous').dataset.disabled==='true';$('progress-next').disabled=!current||$('progress-next').dataset.disabled==='true';}
 }
 function editStages(){
  $('stage-editor').replaceChildren();
  stages.forEach((s,i)=>{
   const row=el('div','stage-edit-row'),input=el('input');input.value=s.title;input.maxLength=80;input.setAttribute('aria-label','Название этапа '+(i+1));input.oninput=()=>s.title=input.value;
   const up=el('button','','↑'),down=el('button','','↓'),remove=el('button','','×');
   up.type=down.type=remove.type='button';up.setAttribute('aria-label','Переместить этап '+(i+1)+' выше');down.setAttribute('aria-label','Переместить этап '+(i+1)+' ниже');remove.setAttribute('aria-label','Удалить этап '+(i+1));
   up.disabled=i===0;down.disabled=i===stages.length-1;remove.disabled=stages.length===1;
   up.onclick=()=>{[stages[i-1],stages[i]]=[stages[i],stages[i-1]];editStages();};down.onclick=()=>{[stages[i],stages[i+1]]=[stages[i+1],stages[i]];editStages();};
   remove.onclick=()=>{stages.splice(i,1);editStages();};row.append(input,up,down,remove);$('stage-editor').append(row);
  });
  $('add-stage').disabled=stages.length>=12;
 }
 async function loadProgress(success=''){
  if(working)return;
  const ticket=++run,auth=generation;lock(true);$('admin-progress-status').textContent='Загрузка…';current=null;$('admin-progress-roster').replaceChildren();
  try{
   const data=await request('/api/admin/progression?'+new URLSearchParams({code:$('progress-course').value,offset,search:$('admin-progress-query').value.trim(),archived:$('show-progress-archive').checked?'1':'0'}));
   if(ticket!==run||auth!==generation)return;
   current=data.course;stages=current.stages.map(s=>({...s}));renderPeople(data.items);
   $('admin-progress-status').textContent=success||('Участников: '+data.total+'. Отметки сохраняются кнопкой в карточке сотрудника.');
   $('progress-page').textContent='Страница '+(offset/50+1)+' · '+data.total+' записей';
   $('progress-previous').dataset.disabled=String(offset===0);$('progress-next').dataset.disabled=String(!data.hasMore);
  }catch(error){if(ticket===run&&auth===generation){$('admin-progress-status').textContent=error.message;$('stage-editor').replaceChildren();}}
  finally{
   lock(false);
   if(current){editStages();$('progress-previous').disabled=$('progress-previous').dataset.disabled==='true';$('progress-next').disabled=$('progress-next').dataset.disabled==='true';}
   else{for(const id of ['save-stages','add-stage','progress-previous','progress-next'])$(id).disabled=true;}
  }
 }
 function renderPeople(items){
  $('admin-progress-roster').replaceChildren();
  if(!items.length){$('admin-progress-roster').append(el('p','instruction','Записей нет. Добавьте участника или измените поиск.'));return;}
  items.forEach(person=>{
   const article=el('article','admin-person'+(person.archived?' is-archived':''));
   article.append(el('h3','','Сотрудник '+person.employeeNumber+(person.archived?' · АРХИВ':'')));
   const checks=el('div','admin-stage-checks');
   current.stages.forEach(stage=>{
    const label=el('label'),input=el('input');input.type='checkbox';input.value=stage.id;input.checked=person.completed.includes(stage.id);label.append(input,document.createTextNode(stage.title));checks.append(label);
   });
   const tools=el('div','admin-tools'),save=el('button','primary','СОХРАНИТЬ ОТМЕТКИ'),archive=el('button','',person.archived?'ВОССТАНОВИТЬ':'В АРХИВ');
   const status=el('p','','Обновлено: '+new Date(person.updatedAt).toLocaleString('ru-RU'));status.setAttribute('role','status');
   async function update(archived){
    if(working||!current)return;
    const auth=generation;lock(true);status.textContent='Сохранение…';
    try{
     const completed=[...checks.querySelectorAll('input:checked')].map(n=>n.value);
     const result=await request('/api/admin/progression/update',{code:current.code,courseVersion:current.version,id:person.id,version:person.version,completed,archived});
     if(auth!==generation)return;
     person.version=result.version;person.completed=completed;person.archived=archived;
     article.classList.toggle('is-archived',archived);article.querySelector('h3').textContent='Сотрудник '+person.employeeNumber+(archived?' · АРХИВ':'');
     archive.textContent=archived?'ВОССТАНОВИТЬ':'В АРХИВ';status.textContent='Сохранено · '+new Date(result.updatedAt).toLocaleString('ru-RU');
    }catch(error){if(auth===generation)status.textContent=error.message;}
    finally{lock(false);if(current)editStages();}
   }
   save.onclick=()=>update(person.archived);
   archive.onclick=()=>{if(!person.archived&&!confirm('Скрыть сотрудника '+person.employeeNumber+' из публичного реестра? Отметки сохранятся в архиве.'))return;update(!person.archived);};
   tools.append(save,archive);article.append(checks,status,tools);$('admin-progress-roster').append(article);
  });
 }
 $('progress-course').onchange=()=>{offset=0;$('admin-progress-query').value='';loadProgress();};
 $('reload-progress').onclick=()=>loadProgress();
 $('admin-progress-search').onsubmit=e=>{e.preventDefault();offset=0;loadProgress();};
 $('show-progress-archive').onchange=()=>{offset=0;loadProgress();};
 $('progress-previous').onclick=()=>{if(offset>0){offset-=50;loadProgress();}};
 $('progress-next').onclick=()=>{offset+=50;loadProgress();};
 $('add-stage').onclick=()=>{if(stages.length<12){stages.push({id:crypto.randomUUID(),title:'Новый этап'});editStages();}};
 $('save-stages').onclick=async()=>{
  if(!current||working)return;
  if(stages.some(s=>!s.title.trim())){$('admin-progress-status').textContent='У каждого этапа должно быть название.';return;}
  const removed=current.stages.filter(s=>!stages.some(n=>n.id===s.id));
  if(removed.length&&!confirm('Исключить этапы из прогресса всех участников: '+removed.map(s=>s.title).join(', ')+'?'))return;
  const auth=generation;lock(true);let saved=false;
  try{await request('/api/admin/progression/stages',{code:current.code,version:current.version,stages});saved=true;}catch(error){if(auth===generation)$('admin-progress-status').textContent=error.message;}
  finally{lock(false);editStages();}
  if(saved&&auth===generation)loadProgress('Этапы сохранены. Отметки остальных этапов сохранены.');
 };
 $('enroll-progress').onsubmit=async e=>{
  e.preventDefault();if(!current||working)return;const employeeNumber=$('progress-employee').value.trim();if(!employeeNumber)return;
  const auth=generation;lock(true);let saved=false;
  try{await request('/api/admin/progression/enroll',{code:current.code,employeeNumber});saved=true;}catch(error){if(auth===generation)$('admin-progress-status').textContent=error.message;}
  finally{lock(false);if(current)editStages();}
  if(saved&&auth===generation){$('progress-employee').value='';$('admin-progress-query').value=employeeNumber;offset=0;loadProgress('Участник добавлен. Теперь можно отметить пройденные этапы.');}
 };
})();
