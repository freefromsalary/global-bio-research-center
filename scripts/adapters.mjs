// RSS 2.0 subset reader. No DTD, entity expansion, or HTML execution.
export function text(v=''){return String(v).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[n]).replace(/\s+/g,' ').trim();}
function tag(xml,name){return xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'))?.[1]||'';}
export function readRSS(xml,feed){
  if(/<!DOCTYPE|<!ENTITY/i.test(xml)||!/<rss[\s>]/i.test(xml))throw Error('Expected safe RSS 2.0');
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(([,body])=>{
    const title=text(tag(body,'title')),url=text(tag(body,'link')),date=text(tag(body,'pubDate'));
    if(!title||!url||!date)throw Error('RSS item missing title/link/date');
    const kind=/earnings|financial results|quarter.*results|full.year.*results/i.test(title)?'earnings':/conference call|webcast|investor.*call/i.test(title)?'call':'news';
    const excerpt=text(text(tag(body,'description'))).slice(0,650);
    return {section:feed.section||'news',kind,title,company:feed.company||'',summary:excerpt?`출처 피드 발췌 (원문 언어 · 분석 전): ${excerpt}`:'공식 발표가 등록되었습니다. 원문을 확인하세요. 자동 분석 전 자료입니다.',sources:[{label:feed.name,url}],published_at:new Date(date).toISOString(),tags:'피드 원문 · 분석 전'};
  });
}
export function clinicalItem(study,feed){
  const p=study.protocolSection,id=p?.identificationModule?.nctId;if(!/^NCT\d{8}$/.test(id||''))throw Error('Invalid clinical record');
  const s=p.statusModule||{},d=p.designModule||{};
  const clinical={version:1,first_posted_date:s.studyFirstPostDateStruct?.date||null,last_updated_date:s.lastUpdatePostDateStruct?.date||null,results_first_posted_date:s.resultsFirstPostDateStruct?.date||null,study_type:d.studyType||null,status:s.overallStatus||null,phases:[...new Set(d.phases||[])].sort(),enrollment:d.enrollmentInfo||null,primary_outcomes:(p.outcomesModule?.primaryOutcomes||[]).map(x=>({measure:x.measure||'',timeFrame:x.timeFrame||''})),interventions:(p.armsInterventionsModule?.interventions||[]).map(x=>({name:x.name,type:x.type})),sponsor_class:p.sponsorCollaboratorsModule?.leadSponsor?.class||null};
  return {section:'clinical',kind:'trial',event_key:`ctgov:${id}`,clinical,nct:id,company:p.sponsorCollaboratorsModule?.leadSponsor?.name||'',drug:(p.armsInterventionsModule?.interventions||[]).map(i=>i.name).join(', '),title:`${id} · ${p.identificationModule.briefTitle}`,summary:'레지스트리 스냅샷 (임상 성공 발표가 아닙니다)'+`\n최초 공개일: ${clinical.first_posted_date||'미확인'}\n상태: ${s.overallStatus||'미확인'} / 단계: ${(d.phases||[]).join(', ')||'해당 없음'}\n질환: ${(p.conditionsModule?.conditions||[]).join(', ')}\n등록 규모: ${d.enrollmentInfo?.count??'미확인'} (${d.enrollmentInfo?.type||'미확인'})\n주요 평가변수: ${(p.outcomesModule?.primaryOutcomes||[]).map(x=>x.measure).join('; ')||'미확인'}\n등록처 갱신일: ${s.lastUpdatePostDateStruct?.date||'미확인'} (정확한 게시 시각 미제공)`,tags:`${feed.area||''} · 레지스트리`,sources:[{label:'ClinicalTrials.gov 원본',url:`https://clinicaltrials.gov/study/${id}`}],published_at:null};
}
export async function fetchRetry(url,format='json',fetcher=fetch){
  if(new URL(url).protocol!=='https:')throw Error('HTTPS required');
  for(let attempt=0;attempt<3;attempt++){
    try{const r=await fetcher(url,{signal:AbortSignal.timeout(25000),headers:{Accept:format==='xml'?'application/rss+xml, application/xml':'application/json'}});
      if(!r.ok)throw Object.assign(Error(`HTTP ${r.status}`),{permanent:r.status!==429&&r.status<500});
      const value=await r.text();if(value.length>5_000_000)throw Object.assign(Error('Source exceeds 5MB'),{permanent:true});return ['xml','html'].includes(format)?value:JSON.parse(value);
    }catch(e){if(e.permanent||attempt===2)throw e;await new Promise(r=>setTimeout(r,1000*2**attempt));}
  }
}
export async function collectFeed(feed,win,request=fetchRetry){
  if(feed.type==='careers'){const {readCareerLinks}=await import('./source-adapters.mjs');return {items:readCareerLinks(await request(feed.url,'html'),feed),truncated:false};}
  if(feed.type==='rss')return {items:readRSS(await request(feed.url,'xml'),feed),truncated:false};
  if(feed.type==='clinicaltrials'){
    const items=[];let pageToken;
    for(let page=0;page<20;page++){
      const u=new URL('https://clinicaltrials.gov/api/v2/studies');u.searchParams.set('format','json');u.searchParams.set('query.cond',feed.query);u.searchParams.set('pageSize','100');u.searchParams.set('sort','LastUpdatePostDate:desc');
      const since=new Date(+win.start-48*3600000).toISOString().slice(0,10);u.searchParams.set('filter.advanced',`AREA[LastUpdatePostDate]RANGE[${since},${win.end.toISOString().slice(0,10)}]`);if(pageToken)u.searchParams.set('pageToken',pageToken);
      const data=await request(u.href);if(!Array.isArray(data.studies))throw Error('Invalid clinical response');items.push(...data.studies.map(s=>clinicalItem(s,feed)));pageToken=data.nextPageToken;if(!pageToken)return {items,truncated:false};
    }return {items,truncated:true};
  }
  if(feed.type==='json'){const data=await request(feed.url);if(!Array.isArray(data.items))throw Error('Invalid JSON feed');return {items:data.items,truncated:false};}
  throw Error('Unsupported adapter');
}
