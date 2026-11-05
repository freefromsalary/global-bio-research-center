import {orderResearch} from './research-policy.js?v=20261105-5';
export const cleanText=value=>String(value||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
export function concise(value,limit=230){const text=cleanText(value).replace(/^출처 피드 발췌 \([^)]*\):\s*/,'');if(text.length<=limit)return text;const cut=text.slice(0,limit);return cut.replace(/\s+\S*$/,'')+'…';}
export function jobFacts(item){
 const title=String(item.title||'');
 const rules=[
  [/cardiometabolic.*medical science liaison/i,'심혈관·대사 / 메디컬','심혈관·대사 분야 Medical Science Liaison(학술 담당자)'],
  [/medical science liaison|health outcomes liaison/i,'메디컬·학술','의료진 학술 소통·의학정보 담당 전문가'],
  [/CMC.*regulatory|regulatory.*CMC/i,'CMC·인허가','의약품 제조·품질(CMC) 규제 대응 전문가'],
  [/regulatory/i,'인허가·규제','의약품 인허가 및 규제 업무 전문가'],
  [/clinical.*quality|PV.*quality/i,'임상·약물감시 품질','임상시험·약물감시 품질관리 전문가'],
  [/clinical research associate/i,'임상 운영','임상시험 모니터링 담당자(CRA)'],
  [/clinical|medical director/i,'임상개발','임상 개발·운영 또는 의학 담당 전문가'],
  [/manufactur|technical transfer/i,'제조·생산','의약품 제조·공정·기술이전 전문가'],
  [/pharmaco/i,'약리·임상약리','약리·약동학·약물 개발 연구 전문가'],
  [/partnership|business development/i,'사업개발·파트너링','외부 협력·파트너십 담당 전문가'],
  [/publication/i,'메디컬 커뮤니케이션','의학·임상 연구 결과 출판 담당 전문가'],
  [/medical/i,'메디컬 업무','의학정보·메디컬 업무 전문가']
 ];
 const found=rules.find(([pattern])=>pattern.test(title));
 return {company:item.company||'회사 미확인',field:item.job?.field||found?.[1]||'분야 미확인 — 원문 확인',expertise:item.job?.expertise||found?.[2]||title||'직무 정보 미확인',basis:item.job?.expertise?'공고 정보':'직무명 기준 분류 · 세부 경력·자격은 원문 확인'};
}
export function clinicalFacts(item){
 const c=item.clinical||{},summary=String(item.summary||'');
 const conditions=(c.conditions||[]).join(' · ')||summary.match(/질환:\s*([^\n]+)/)?.[1]||['망막색소변성','지리적 위축','MASH','비만','심부전'].filter(x=>(item.title+' '+summary).includes(x)).join(' · ')||'적응증 미확인 — 원문 확인';
 const phase=(c.phases||[]).map(x=>({PHASE1:'1상',PHASE2:'2상',PHASE3:'3상',PHASE4:'4상',EARLY_PHASE1:'초기 1상',NA:'해당 없음'}[x]||x)).join(' / ');
 const status={RECRUITING:'모집 중',NOT_YET_RECRUITING:'모집 전',ACTIVE_NOT_RECRUITING:'진행 중·모집 종료',COMPLETED:'완료',TERMINATED:'중단',SUSPENDED:'일시 중지',WITHDRAWN:'철회'}[c.status]||c.status;
 const drug=item.drug||c.interventions?.map(x=>x.name).join(' · ')||'시험 약물 미확인';
 const design=[phase,status,c.enrollment?.count!=null?'등록 규모 '+c.enrollment.count+'명':null].filter(Boolean).join(' · ');
 return {company:item.company||'회사·의뢰자 미확인',indication:conditions,drug,overview:design||concise(summary,200),endpoint:c.primary_outcomes?.[0]?.measure||null};
}
export function highlights(items,section){
 const ranked=orderResearch(items.filter(i=>i.section===section&&i.clinical_event?.type!=='administrative_update'&&(section!=='clinical'||i.clinical_event?.type!=='baseline'||i.editorial_review?.status==='reviewed')),'importance');
 const reviewed=ranked.filter(i=>i.editorial_review?.status==='reviewed'),others=ranked.filter(i=>i.editorial_review?.status!=='reviewed');
 return [...reviewed,...others].slice(0,3).map(item=>{
  let takeaway=concise(item.highlight||item.summary);
  if(section==='social'&&item.kind==='job'){const f=jobFacts(item);takeaway=f.company+' · '+f.field+' — '+f.expertise;}
  if(section==='clinical'){const f=clinicalFacts(item);takeaway=f.company+' · '+f.indication+' — '+concise(f.drug+' / '+f.overview,180);}
  return {item,takeaway};
 });
}
