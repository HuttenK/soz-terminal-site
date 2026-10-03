'use strict';
const data=window.QUIZ_DATA;
const $=id=>document.getElementById(id);
const letters=['А','Б','В','Г','Д'];
const configured=data.every(q=>Array.isArray(q.options)&&q.options.length>=2&&Array.isArray(q.correct)&&q.correct.length>0&&q.correct.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length));
const isCorrect=(q,choice)=>q.correct.includes(choice);
let index=0,selected=null,finished=false,sound=true,audio,bootDone=false,authorized=false;
let screen="boot", selectedTest=null, employee=null;
const records=Array(data.length).fill(null);
const descriptions=['Маскот ГО с планшетом','Маскот ГО с опущенным оружием','Маскот ГО охраняет вход','Маскот ГО изучает регламент','Маскот ГО изучает план здания','Маскот ГО указывает путь эвакуации','Маскот ГО проверяет документы','Маскот ГО проводит интервью','Маскот ГО заполняет базу контактов','Маскот ГО сопровождает гражданина','Маскот ГО показывает палец вверх','Маскот ГО показывает палец вниз'];
function beep(bad=false){window.TerminalAudio.click(bad);}
function toggleSound(){sound= window.TerminalAudio.setEnabled(!sound);$('sound').textContent=`ЗВУК: ${sound?'ВКЛ':'ВЫКЛ'}`;$('sound').setAttribute('aria-pressed',sound);$('boot-sound').textContent=sound?'ЗВУК: ВКЛ':'ЗВУК: ВЫКЛ';$('boot-sound').setAttribute('aria-pressed',sound);if(sound){if(!bootDone)window.TerminalAudio.startup();else beep();}}
$('boot-sound').onclick=toggleSound;
$('boot-start').onclick=()=>window.TerminalAudio.unlock();
$('authorize').onclick=()=>{if(authorized)return;authorized=true;$('welcome').hidden=true;$('boot').hidden=false;window.TerminalAudio.setEnabled(sound);$('skip-boot').focus();};
function art(n){
 const image=$('mascot'),src=n<10?data[n].illustration:`assets/reaction-${n+1}.png`;
 const changed=image.getAttribute('src')!==src;
 image.src=src;image.alt=n<10?data[n].alt:descriptions[n];image.classList.toggle('final-scene',n<10);image.classList.toggle('sprite-sheet',n<10);image.dataset.scene=String(n+1);
 if(changed)image.decode().then(()=>{if(image.getAttribute('src')===src&&n>=10)reveal(image,8);}).catch(()=>{});
}
function render(focus=false){screen='quiz';$('test-selection').hidden=true;$('enrollment').hidden=true;$('participant').hidden=false;finished=false;$('workspace').hidden=false;$('results').hidden=true;const q=data[index],record=records[index];selected=record?.selected??null;$('section').textContent=q.section;$('counter').textContent=`${String(index+1).padStart(2,'0')} / ${data.length}`;$('scene-no').textContent=String(index+1).padStart(2,'0');$('question').textContent=q.title;$('scenario').textContent=q.context||'';$('scenario').hidden=!q.context;$('mode-label').textContent=configured?'АТТЕСТАЦИЯ / ТЕСТИРОВАНИЕ':'ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР';$('instruction').textContent=configured?'Выберите один вариант ответа.':'Варианты пока не заполнены. Можно проверить прохождение.';$('footer-status').textContent=configured?'ОДИН ОТВЕТ НА ВОПРОС':'ОТВЕТЫ ОЖИДАЮТ ЗАПОЛНЕНИЯ';$('progress').replaceChildren(...data.map((_,i)=>{const s=document.createElement('span');s.className=i===index?'active':records[i]?'done':'';return s;}));$('answers').replaceChildren();const legend=document.createElement('legend');legend.className='sr-only';legend.textContent='Варианты ответа';$('answers').append(legend);q.options.forEach((text,i)=>{const label=document.createElement('label');label.className='answer';if(record&&configured&&q.correct.includes(i))label.classList.add('correct');if(record&&configured&&i===record.selected&&!q.correct.includes(i))label.classList.add('wrong');const input=document.createElement('input');input.type='radio';input.name='answer';input.value=i;input.checked=i===selected;input.disabled=!!record;input.addEventListener('change',()=>{selected=i;$('submit').disabled=false;beep();});const span=document.createElement('span');const key=document.createElement('b');key.textContent=`[${letters[i]}]`;span.append(key,document.createTextNode(text));label.append(input,span);$('answers').append(label);});$('back').disabled=index===0;$('submit').disabled=selected===null;$('submit').textContent=record?(index===data.length-1?'ЗАВЕРШИТЬ':'СЛЕДУЮЩИЙ ВОПРОС'):'ПОДТВЕРДИТЬ';$('demo-controls').hidden=configured;$('feedback').className='feedback';$('feedback').textContent='';$('mascot-caption').innerHTML='СЛУЖИТЬ. ЗАЩИЩАТЬ.<br>СОБЛЮДАТЬ ПРОТОКОЛ.';art(index);if(record){if(configured){const ok=isCorrect(q,record.selected);art(ok?10:11);$('feedback').classList.toggle('bad',!ok);$('feedback').textContent=(ok?'ВЕРНО. ':'НЕВЕРНО. ')+(q.explanation||(!ok?`Допустимый ответ: ${q.correct.map(i=>letters[i]).join(' или ')}.`:''));$('mascot-caption').textContent=ok?'ПРОТОКОЛ СОБЛЮДЁН.':'ИЗУЧИТЕ РЕГЛАМЕНТ.';}else{$('feedback').textContent='Вариант выбран. Оценка появится после заполнения ответов.';}}if(focus){$('question').focus();reveal(document.querySelector('.question-panel'));}else reveal($('feedback'),3);}
function submit(){if(finished||selected===null)return;if(records[index]){if(index===data.length-1)showResults();else{index++;render(true);}beep();return;}records[index]={selected};beep(configured&&!isCorrect(data[index],selected));render();}
function showResults(){screen='results';finished=true;$('workspace').hidden=true;$('results').hidden=false;const score=records.filter((r,i)=>r&&isCorrect(data[i],r.selected)).length;$('results').replaceChildren();const grid=document.createElement('div');grid.className='result-grid';const body=document.createElement('div');const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent='СЕАНС ЗАВЕРШЁН';const h=document.createElement('h1');h.textContent=configured?'Результаты тестирования':'Просмотр завершён';const count=document.createElement('div');count.className='score';count.id='result-score';count.textContent=configured?`${score} / ${data.length}`:`${records.filter(Boolean).length} / ${data.length}`;const p=document.createElement('p');p.textContent=configured?'Правильных ответов. Результат учебного теста не присваивает сертификацию автоматически.':'Все вопросы просмотрены. Баллы не начислялись: варианты и ключ правильных ответов ещё не заполнены.';const list=document.createElement('div');list.className='result-list';records.forEach((r,i)=>{const s=document.createElement('span');s.textContent=`${String(i+1).padStart(2,'0')} ${configured?(isCorrect(data[i],r?.selected)?'+':'−'):'·'}`;list.append(s);});body.append(eyebrow,h,count,p,list);const img=document.createElement('img');img.src=`assets/reaction-${score===data.length?'11':'12'}.png`;img.alt=configured?(score===data.length?descriptions[10]:descriptions[11]):descriptions[0];grid.append(body,img);$('results').append(grid);addSubmissionControls($('results'));$('results').focus();reveal($('results'));}
function finishBoot(){if(bootDone)return;bootDone=true;clearInterval(bootTimer);$('boot').hidden=true;$('terminal').hidden=false;showSelection();reveal($('terminal'));try{window.TerminalAudio.ready();}catch(error){console.warn('Intro audio could not finish cleanly:',error);}}
let bootStep=0;const logs=['> УСТАНОВЛЕНИЕ СВЯЗИ С СЕКТОРОМ-2','> СИГНАЛ АЛЬЯНСА ПРИНЯТ','> ПРОВЕРКА ТЕРМИНАЛА… OK','> РЕЕСТР СЕРТИФИКАЦИЙ… OK','> СИСТЕМА ГОТОВА'];const bootTimer=setInterval(()=>{if(!authorized)return;const waiting=window.TerminalAudio.needsGesture();$('boot-start').hidden=!waiting;if(bootStep<logs.length){window.TerminalAudio.tick();$('boot-log').textContent=logs[bootStep];$('boot-bar').style.clipPath=`inset(0 ${100-(++bootStep)/logs.length*100}% 0 0)`;}else finishBoot();},1000);
$('skip-boot').onclick=finishBoot;$('submit').onclick=submit;$('back').onclick=()=>{if(index>0){index--;render(true);beep();}};$('sound').onclick=toggleSound;$('motion').onclick=()=>{const off=document.body.classList.toggle('no-crt');$('motion').textContent=`ЭЛТ: ${off?'ВЫКЛ':'ВКЛ'}`;$('motion').setAttribute('aria-pressed',!off);};$('demo-up').onclick=()=>{art(10);$('mascot-caption').textContent='ВЕРНЫЙ ОТВЕТ / ДЕМОНСТРАЦИЯ';beep();};$('demo-down').onclick=()=>{art(11);$('mascot-caption').textContent='НЕВЕРНЫЙ ОТВЕТ / ДЕМОНСТРАЦИЯ';beep(true);};$('demo-reset').onclick=()=>render();
document.addEventListener('keydown',e=>{if(!bootDone||screen!=='quiz'||finished||e.altKey||e.ctrlKey||e.metaKey)return;if(document.activeElement?.tagName==='BUTTON'&&e.key==='Enter')return;if(/^[1-5]$/.test(e.key)&&!records[index]){const input=$('answers').querySelectorAll('input')[Number(e.key)-1];if(!input)return;input.checked=true;input.dispatchEvent(new Event('change'));input.focus();e.preventDefault();}if(e.key==='Enter'&&!$('submit').disabled){e.preventDefault();submit();}});
for(const q of data){const image=new Image();image.src=q.illustration;}
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_quiz_state',description:'Read current quiz question and whether answers are configured; does not submit an answer.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({screen,test:selectedTest?.code??null,question:screen==='quiz'?index+1:null,title:data[index].title,configured,selected,answered:records.filter(Boolean).length,finished})})).catch(()=>{});}catch{}}

const tests=[
 {code:'ССЗ',title:'Сертификат санитарного звена',description:'Базовая полевая медицина и применение навыков в поле.',priority:'IV'},
 {code:'ДОЗОР',title:'Сертификат оперативного городского звена',description:'Базовая военно-тактическая подготовка в городских условиях.',priority:'III'},
 {code:'КПСИ',title:'Курс пресечения социальной инфекции',description:'Подавление протестов и подготовка кризисного переговорщика.',priority:'IV'},
 {code:'СОЗ',title:'Сертификат охранного звена',description:'Охрана ГА/ГК, взаимодействие с лоялистами и их профилирование.',priority:'IV',available:true},
 {code:'ПОТУН',title:'Применение особых технических устройств Надзора',description:'Использование особых технических устройств Надзора в городской среде.',priority:'IV'},
 {code:'СЛЗ',title:'Сертификат следственного звена',description:'Следственно-сыскная деятельность и сбор информации.',priority:'III'},
 {code:'НААН',title:'Наставническая аттестация Академии Надзора',description:'Подготовка менторов училища Гражданской Обороны и наставническая деятельность.',priority:'III',rank:true},
 {code:'БУП',title:'Базовые уроки управления',description:'Базовые навыки управления, распределение сил Надзора и контроль за ними.',priority:'IV',rank:true},
 {code:'КСЗ',title:'Курсы старшего звена',description:'Расширенная командная подготовка офицеров и специалистов в распределении сил Гражданской Обороны.',priority:'II',rank:true}
];
function showSelection(focus=false){
 screen='selection';finished=false;selectedTest=null;employee=null;submissionId=null;records.fill(null);index=0;selected=null;
 $('employee-form').reset();$('test-selection').hidden=false;$('enrollment').hidden=true;$('workspace').hidden=true;$('results').hidden=true;$('participant').hidden=true;
 document.querySelector('.brand>div').firstChild.textContent='ГО';
 $('mode-label').textContent='ВЫБОР СЕРТИФИКАЦИИ';document.querySelector('.status-strip span:last-child').textContent='9 УЧЕБНЫХ КУРСОВ';
 $('footer-status').textContent='ВЫБЕРИТЕ ТЕСТ';document.querySelector('footer>span:last-child').textContent='ГРАЖДАНСКАЯ ОБОРОНА';
 $('test-list').replaceChildren();
 for(const rank of [false,true]){
  const heading=document.createElement('h2');heading.textContent=rank?'Ранговые сертификации':'Специализированные сертификации';$('test-list').append(heading);
  if(rank){const note=document.createElement('p');note.className='rank-note';note.textContent='Получение допустимо по запросу к ранговым лидерам / менторам.';$('test-list').append(note);}
  tests.filter(t=>!!t.rank===rank).forEach(t=>{const button=document.createElement('button');button.type='button';button.className='test-card';button.dataset.code=t.code;const code=document.createElement('b');code.textContent=t.code;const text=document.createElement('span');text.textContent=t.title;const status=document.createElement('small');status.textContent=t.available?'10 ВОПРОСОВ · ТЕСТ':'ВОПРОСЫ ОЖИДАЮТСЯ';button.append(code,text,status);button.onclick=()=>selectTest(t);$('test-list').append(button);});
 }
 if(focus)$('selection-title').focus();reveal($('test-selection'));
}
function selectTest(test){
 selectedTest=test;screen='enrollment';$('test-selection').hidden=true;$('enrollment').hidden=false;$('test-category').textContent=test.code+' / ПРИОРИТЕТ '+test.priority;$('test-title').textContent=test.title;$('test-description').textContent=test.description;
 document.querySelector('.brand>div').firstChild.textContent=test.code;$('mode-label').textContent='ДАННЫЕ СОТРУДНИКА';
 $('enrollment-status').textContent=test.available?'5 вопросов и 5 ситуаций. В каждом задании выберите один ответ. После завершения результат автоматически отправится инструктору.':'Вопросы для этого теста ещё не добавлены. Начало тестирования пока недоступно.';
 $('start-test').disabled=!test.available;$('start-test').textContent=test.available?'НАЧАТЬ ТЕСТ':'ТЕСТ ГОТОВИТСЯ';$('test-title').focus();reveal($('enrollment'));beep();
}
$('selection-back').onclick=()=>showSelection(true);
for(const id of ['employee-number','identification-code'])$(id).addEventListener('input',()=>$(id).setCustomValidity(''));
$('employee-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!selectedTest?.available)return;
 for(const id of ['employee-number','identification-code']){const field=$(id);field.setCustomValidity(field.value.trim()?'':'Заполните это поле.');}
 if(!$('employee-form').reportValidity())return;
 if($('start-test').disabled)return;
 $('start-test').disabled=true;
 try{
  const response=await window.terminalFetch('/api/attempt-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identificationCode:$('identification-code').value.trim(),testCode:selectedTest.code}),signal:AbortSignal.timeout(15000)});
  const result=await response.json();
  if(!response.ok||!result.allowed)throw new Error(result.error||'Попытка уже завершена. Обратитесь к администратору для повторного допуска.');
 }catch(error){$('enrollment-status').textContent=error.message;return;}finally{$('start-test').disabled=false;}
 if(screen!=='enrollment')return;

 employee={number:$('employee-number').value.trim(),code:$('identification-code').value.trim()};
 $('participant').textContent='СОТРУДНИК: '+employee.number+' / ИДЕНТИФИКАЦИОННЫЙ КОД: '+employee.code;
 document.querySelector('.status-strip span:last-child').textContent='СОЗ / ГА · ГК';document.querySelector('footer>span:last-child').textContent='1–5: ВЫБОР / ENTER: ПОДТВЕРДИТЬ';
 submissionId=null;records.fill(null);index=0;selected=null;render(true);beep();
});

// Motion never delays input or changes quiz state. Repeated transitions are cancellable.
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let keyboardInput=false;
function cancelMotion(){document.getAnimations().filter(a=>!(a instanceof CSSAnimation)).forEach(a=>a.cancel());}
document.addEventListener('keydown',()=>{keyboardInput=true;document.body.classList.add('keyboard-input');cancelMotion();},true);
document.addEventListener('pointerdown',()=>{keyboardInput=false;document.body.classList.remove('keyboard-input');},true);
reduceMotion.addEventListener('change',e=>{if(e.matches)cancelMotion();});
function reveal(element,distance=10){
 if(!element||reduceMotion.matches||keyboardInput)return;
 element.getAnimations().filter(a=>!(a instanceof CSSAnimation)).forEach(a=>a.cancel());
 element.animate([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)'});
}

// Audio starts inside the authorization click so browsers allow playback.
