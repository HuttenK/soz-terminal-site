let submissionId=null,submissionPayload=null,examSession=null;
function addSubmissionControls(container){
 if(!employee||!records.every(Boolean))return;
 if(!submissionId)submissionId=crypto.randomUUID();
 const payload={id:submissionId,sessionToken:examSession,testCode:selectedTest.code,revision:window.QUIZ_REVISION,employeeNumber:employee.number,identificationCode:employee.code,answers:records.map((r,i)=>({questionId:data[i].id,selected:r.selected}))};
 const area=document.createElement('section');area.className='submission-area';
 const notice=document.createElement('p');notice.textContent='Результат автоматически отправляется инструктору.';
 const status=document.createElement('p');status.setAttribute('role','status');
 const retry=document.createElement('button');retry.className='primary';retry.textContent='ПОВТОРИТЬ ОТПРАВКУ';retry.hidden=true;
 area.append(notice,status,retry);container.append(area);
 let busy=false,received=false,attempt=0,timer;
 const warn=e=>{if(!received){e.preventDefault();e.returnValue='';}};
 window.addEventListener('beforeunload',warn);
 const online=()=>{if(!received&&area.isConnected)send();};
 window.addEventListener('online',online);
 async function send(){
  if(busy||received||!area.isConnected)return;
  clearTimeout(timer);busy=true;attempt++;retry.hidden=true;status.textContent='Сохранение результата… Не закрывайте страницу.';
  try{
   const r=await window.terminalFetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
   const result=await r.json();if(result.code==='attempt_locked'){received=true;window.removeEventListener('beforeunload',warn);window.removeEventListener('online',online);notice.textContent=result.error;status.textContent='Ранее сохранённый результат остаётся у инструктора.';retry.hidden=true;return;}if(!r.ok||!result.received)throw new Error(result.error||'Ошибка отправки.');
   received=true;window.removeEventListener('beforeunload',warn);window.removeEventListener('online',online);
   if(!area.isConnected)return;
   if(Number.isInteger(result.score)&&$('result-score'))$('result-score').textContent=`${result.score} / ${result.total}`;
   notice.textContent='Результат сохранён и отправлен инструктору.';status.textContent='Номер отправки: '+result.receipt;area.dataset.received='true';
  }catch(e){
   if(!area.isConnected){window.removeEventListener('beforeunload',warn);window.removeEventListener('online',online);return;}
   status.textContent='Отправка пока не подтверждена. '+(e.name==='TimeoutError'?'Истекло время ожидания.':e.message)+' Не закрывайте страницу.';
   retry.hidden=false;
   if(attempt<3)timer=setTimeout(send,attempt*2500);
  }finally{busy=false;}
 }
 retry.onclick=send;
 send();
}
