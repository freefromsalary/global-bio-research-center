import {sectionNames,searchItems,latestVersions,clinicalVisible,clinicalLabels,clinicalFieldLabels} from './archive.js?v=20261104-3';
const $=s=>document.querySelector(s);let rows=[],reports=[],slot='PM',section='all',history=false,page=1;
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function url(s){try{const u=new URL(s);return u.protocol==='https:'?u.href:null;}catch{return null;}}
function selected(){const found=searchItems(rows,{date:$('#date').value,slot,section,query:$('#query').value}).filter(i=>clinicalVisible(i,$('#clinicalScope').value)),rank={news:0,clinical:1,social:2};return (history?found:latestVersions(found)).sort((a,b)=>rank[a.section]-rank[b.section]);}
const statusNames={ok:'수집 성공',failed:'수집 실패',not_configured:'연결 대기',truncated:'일부 결과만 수집',unverified:'검증 전'};
function render(){
  const items=selected(),query=$('#query').value.trim(),date=$('#date').value,report=reports.find(r=>r.report_date===date&&r.slot===slot);
  const pageCount=Math.max(1,Math.ceil(items.length/20));page=Math.min(page,pageCount);
  const registry=latestVersions((report?.items||[]).filter(i=>i.section==='clinical'));
  const total=t=>registry.filter(i=>(i.clinical_event?.type||'baseline')===t).length;
  $('#clinicalNote').textContent=`선택 회차 임상: 신규 등록 확인 ${total('new_registration')}건 · 주요 필드 변경 후보 ${total('important_change')}건 · 초기 기준자료 ${total('baseline')}건. 기준자료는 신규·중요 변경으로 확인된 자료가 아니며, 단순 갱신과 함께 기본 목록에서 제외합니다. 신규 등록은 수집일이 아닌 등록처 최초 공개일로 확인합니다.`;
  $('#heading').textContent=query?`“${query}” 검색 결과`:`${date} ${slot==='AM'?'오전':'오후'} 브리핑`;
  $('#caption').textContent=query?'ALL DATES / ARCHIVE SEARCH':`${slot==='AM'?'08:00':'16:00'} KST / DAILY ARCHIVE`;
  $('#status').textContent=!reports.length?'첫 자동 수집을 준비 중입니다. 아직 저장된 실제 보고서가 없습니다.':!report?'선택 회차의 보고서가 없습니다.':`공개 아카이브 · ${report.status==='complete'?'검증 완료':'부분 수집 / 출처별 상태 확인 필요'} · 마지막 저장 ${new Date(report.updated_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} KST`;
  $('#stats').replaceChildren(...Object.keys(sectionNames).map(k=>{const d=el('div',undefined,'stat');d.append(el('small',sectionNames[k]),el('strong',`${items.filter(i=>i.section===k).length}건`),el('small',query?'전체 날짜 검색 결과':'선택 회차'));return d;}));
  $('#coverageRows').replaceChildren(...(report?.coverage||[]).map(c=>el('p',`${statusNames[c.status]||c.status} · ${c.source}${c.count!==undefined?` (${c.count}건)`:''}${c.reason?` — ${c.reason}`:''}`)));
  $('#coverage').hidden=!report;
  $('#cards').replaceChildren(...items.slice((page-1)*20,page*20).map(i=>{const card=el('article',undefined,'card'),meta=el('div',undefined,'meta');meta.append(el('span',sectionNames[i.section]),el('span',`${i.report_date} / ${i.slot}`),el('span',i.kind));card.append(meta,el('h3',i.title),el('p',i.summary));const tags=el('div',undefined,'tags');[i.company,i.drug,i.nct,i.tags].filter(Boolean).forEach(t=>tags.append(el('span',t)));card.append(tags);if(url(i.infographic)){const img=el('img');img.src=url(i.infographic);img.alt=`${sectionNames[i.section]} 인포그래픽`;img.loading='lazy';card.append(img);}const sources=el('div',undefined,'sources');for(const s of i.sources||[]){if(!url(s.url))continue;const a=el('a',`${s.label} ↗`);a.href=url(s.url);a.target='_blank';a.rel='noopener noreferrer';sources.append(a);}sources.append(el('p',`발표: ${i.published_at?new Date(i.published_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' KST':'정확한 시각 미제공'} · 수집: ${new Date(i.collected_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} KST`));card.append(sources);return card;}));
  const previous=el('button','이전 20건'),next=el('button','다음 20건');previous.disabled=page<=1;next.disabled=page>=pageCount;previous.onclick=()=>{page--;render();$('#heading').scrollIntoView();};next.onclick=()=>{page++;render();$('#heading').scrollIntoView();};$('#pagination').replaceChildren(previous,el('span',`${page} / ${pageCount} 페이지 · 전체 ${items.length}건`),next);
  Array.from($('#cards').children).forEach((card,index)=>{const item=items[(page-1)*20+index];if(item?.section==='clinical'){card.prepend(el('div',clinicalLabels[item.clinical_event?.type||'baseline'],'clinical-event'));const changed=item.clinical_event?.changed_fields||[];if(changed.length)card.append(el('p','변경 항목: '+changed.map(f=>clinicalFieldLabels[f]||f).join(', ')));for(const c of item.clinical_event?.changes||[])card.append(el('p',`${clinicalFieldLabels[c.field]||c.field}: ${JSON.stringify(c.before).slice(0,180)} → ${JSON.stringify(c.after).slice(0,180)}`));}});
  if(!items.length)$('#cards').append(el('p','이 조건에서 확인된 브리핑 대상이 없습니다. 초기 임상 수집분은 신규 등록으로 계산하지 않습니다. 필요하면 임상 표시 범위에서 기준자료를 열 수 있습니다.','empty'));
  $('#dates').replaceChildren(...[...new Set(reports.map(r=>r.report_date))].sort().reverse().map(d=>{const b=el('button',d,d===date?'active':'');b.onclick=()=>{$('#date').value=d;$('#query').value='';page=1;render();};return b;}));
  const figure=$('#infographic');figure.hidden=!items.length;figure.replaceChildren();if(items.length){const counts=Object.keys(sectionNames).map(k=>items.filter(i=>i.section===k).length),labels=['GLOBAL NEWS','CLINICAL TRIALS','SOCIAL / CAREERS'];const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="170" viewBox="0 0 1000 170"><rect width="1000" height="170" rx="12" fill="#eaf0e7"/>${counts.map((n,k)=>`<text x="${35+k*330}" y="43" font-family="sans-serif" font-size="12" fill="#6a7a72">${labels[k]}</text><text x="${35+k*330}" y="112" font-family="sans-serif" font-size="48" fill="#16745b">${n}</text>`).join('')}<text x="35" y="151" font-family="sans-serif" font-size="11" fill="#6a7a72">ARCHIVE COUNTS / NOT CLINICAL OUTCOMES</text></svg>`;const img=el('img');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);img.alt=`보관 자료 수: 뉴스 ${counts[0]}건, 임상 ${counts[1]}건, 소셜·채용 ${counts[2]}건`;figure.append(img);}
}
async function read(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(`보고서 불러오기 실패 (${r.status})`);return r.json();}
async function load(){
  try{
    const index=await read('data/index.json'),result=[];
    for(let i=0;i<index.reports.length;i+=6){
      const batch=await Promise.all(index.reports.slice(i,i+6).map(r=>{
        if(!/^\d{4}-\d{2}-\d{2}-(AM|PM)\.json$/.test(r.file))throw Error('잘못된 보고서 경로');
        return read('data/'+r.file);
      }));result.push(...batch);
    }
    reports=result;rows=reports.flatMap(r=>r.items||[]);
    if(reports[0]){$('#date').value=reports[0].report_date;slot=reports[0].slot;}
    else $('#date').value=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    syncSlots();render();
  }catch(e){$('#status').textContent=e.message;}
}
function syncSlots(){$('#slots').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.slot===slot));}
$('#slots').onclick=e=>{if(!e.target.dataset.slot)return;page=1;slot=e.target.dataset.slot;syncSlots();render();};$('#sections').onclick=e=>{if(!e.target.dataset.section)return;page=1;section=e.target.dataset.section;$('#sections').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.section===section));render();};$('#date').onchange=()=>{page=1;render();};$('#query').oninput=()=>{page=1;render();};$('#refresh').onclick=load;$('#versions').onclick=()=>{history=!history;page=1;$('#versions').classList.toggle('active',history);render();};
$('#clinicalScope').onchange=()=>{page=1;render();};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({exported_at:new Date().toISOString(),items:selected()},null,2)],{type:'application/json'}),a=el('a');a.href=URL.createObjectURL(blob);a.download=`bio-${$('#date').value}-${slot}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};await load();
