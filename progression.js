'use strict';
let progressionRun=0;
function showHome(){
 screen='home';
 for(const id of ['test-selection','enrollment','workspace','results','participant','progression'])$(id).hidden=true;
 $('home').hidden=false;
 document.querySelector('.brand>div').firstChild.textContent='ГО';
 $('mode-label').textContent='ГЛАВНОЕ МЕНЮ';
 document.querySelector('.status-strip span:last-child').textContent='АКАДЕМИЯ НАДЗОРА';
 $('footer-status').textContent='СИСТЕМА ГОТОВА';
 document.querySelector('footer>span:last-child').textContent='СЕКТОР-2 / УЧЕБНЫЙ ТЕРМИНАЛ';
 $('home-title').focus();reveal($('home'));
}
$('open-testing').onclick=()=>{showSelection(true);beep();};
$('open-progression').onclick=()=>{showProgression();beep();};
document.querySelectorAll('.home-back').forEach(b=>b.onclick=()=>{showHome();beep();});
$('refresh-progression').onclick=()=>loadCertifications();
function progressNode(tag,className,text){
 const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;
}
function progressPlural(n,forms){return forms[n%100>=11&&n%100<=14?2:n%10===1?0:n%10>=2&&n%10<=4?1:2];}
async function progressRequest(path){
 const response=await window.terminalFetch(path,{cache:'no-store',signal:AbortSignal.timeout(15000)});
 const body=await response.json();if(!response.ok)throw Error(body.error||'Реестр временно недоступен.');return body;
}
function showProgression(){
 screen='progression';$('home').hidden=true;$('test-selection').hidden=true;$('progression').hidden=false;
 $('mode-label').textContent='ПРОГРЕССИЯ / УЧЕБНЫЙ РЕЕСТР';
 $('footer-status').textContent='ОТМЕТКИ ПОДТВЕРЖДАЕТ ИНСТРУКТОР';$('progression-title').focus();
 reveal($('progression'));loadCertifications();
}
async function loadCertifications(){
 const run=++progressionRun;$('progression-status').textContent='Загрузка реестра…';$('refresh-progression').disabled=true;
 $('certification-list').replaceChildren();
 try{
  const {courses}=await progressRequest('/api/progression');if(run!==progressionRun)return;
  tests.forEach((test,i)=>{
   const course=courses.find(c=>c.code===test.code);if(!course)return;
   const card=progressNode('details','certification-card'),summary=progressNode('summary','certification-summary');
   const icon=progressNode('span','cert-icon icon-'+i);icon.setAttribute('aria-hidden','true');
   const title=progressNode('div','certification-heading'),code=progressNode('span','certification-code',test.code);
   title.append(code,progressNode('h2','',test.title),progressNode('p','',test.description));
   const meta=progressNode('div','certification-meta');meta.append(progressNode('strong','',String(course.attendees)),progressNode('span','',progressPlural(course.attendees,['УЧАСТНИК','УЧАСТНИКА','УЧАСТНИКОВ'])),progressNode('small','',course.stages.length+' '+progressPlural(course.stages.length,['ЭТАП','ЭТАПА','ЭТАПОВ'])));
   const arrow=progressNode('span','expand-arrow','+');arrow.setAttribute('aria-hidden','true');summary.append(icon,title,meta,arrow);
   const panel=progressNode('div','certification-body');
   const search=progressNode('form','roster-search'),label=progressNode('label','','Найти сотрудника'),input=progressNode('input');
   input.placeholder='Номер сотрудника';input.maxLength=100;input.type='search';label.append(input);
   const find=progressNode('button','','НАЙТИ');search.append(label,find);
   const roster=progressNode('div','roster'),message=progressNode('p','roster-status');message.setAttribute('role','status');
   const pagination=progressNode('div','roster-pagination'),prev=progressNode('button','','← НАЗАД'),next=progressNode('button','','ДАЛЕЕ →'),page=progressNode('span');
   prev.type=next.type='button';pagination.append(prev,page,next);panel.append(search,message,roster,pagination);card.append(summary,panel);$('certification-list').append(card);
   let offset=0,loaded=false,requestId=0;
   async function loadRoster(){
    const local=++requestId;message.textContent='Загрузка участников…';roster.replaceChildren();prev.disabled=next.disabled=true;
    try{
     const result=await progressRequest('/api/progression?'+new URLSearchParams({code:test.code,search:input.value.trim(),offset}));
     if(local!==requestId||run!==progressionRun)return;loaded=true;
     message.textContent=result.total?'Найдено: '+result.total:input.value.trim()?'Сотрудники с таким номером не найдены.':'Пока нет участников. Инструктор добавит их в реестр.';
     result.items.forEach(person=>{
      const row=progressNode('article','person-progress'),head=progressNode('div','person-heading'),done=person.completed.length,total=result.course.stages.length;
      head.append(progressNode('h3','','Сотрудник '+person.employeeNumber),progressNode('span',done===total?'completion-badge complete':'completion-badge',done===total?'ОБУЧЕНИЕ ЗАВЕРШЕНО':done+' / '+total+' ЭТАПОВ'));
      const stages=progressNode('ol','stage-track');
      result.course.stages.forEach((stage,n)=>{
       const complete=person.completed.includes(stage.id),li=progressNode('li',complete?'stage-done':'stage-pending');
       li.append(progressNode('span','stage-mark',complete?'✓':String(n+1).padStart(2,'0')),progressNode('span','',stage.title));
       li.setAttribute('aria-label',stage.title+': '+(complete?'пройден':'ожидает прохождения'));stages.append(li);
      });
      const date=progressNode('small','progress-updated','Обновлено: '+new Date(person.updatedAt).toLocaleString('ru-RU'));
      row.append(head,stages,date);roster.append(row);
     });
     page.textContent='Страница '+(offset/50+1);pagination.hidden=result.total<=50;prev.disabled=offset===0;next.disabled=!result.hasMore;
    }catch(error){if(local===requestId&&run===progressionRun){message.textContent='Не удалось загрузить участников. '+error.message;loaded=false;pagination.hidden=true;}}
   }
   card.addEventListener('toggle',()=>{if(card.open&&!loaded)loadRoster();});
   search.onsubmit=e=>{e.preventDefault();offset=0;loadRoster();};
   prev.onclick=()=>{offset=Math.max(0,offset-50);loadRoster();};next.onclick=()=>{offset+=50;loadRoster();};
  });
  $('progression-status').textContent='';reveal($('certification-list'));
 }catch(error){if(run===progressionRun)$('progression-status').textContent='Не удалось загрузить реестр. '+error.message+' Нажмите «Обновить».';}
 finally{if(run===progressionRun)$('refresh-progression').disabled=false;}
}
