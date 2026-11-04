export const sectionNames={news:'글로벌 뉴스',clinical:'대사 · 심혈관 · 안과 임상',social:'X · LinkedIn · 채용'};
export const clinicalLabels={new_registration:'신규 등록 (최초 공개일 확인)',important_change:'주요 필드 변경 · 분석 전',administrative_update:'단순 갱신 · 브리핑 제외',baseline:'초기 기준자료 · 신규 아님'};
export const clinicalFieldLabels={status:'모집·진행 상태',phases:'임상 단계',enrollment:'등록 규모',primary_outcomes:'주요 평가변수',results_first_posted_date:'결과 최초 게시일'};
export function clinicalVisible(item,scope='briefing'){
  if(item.section!=='clinical')return true;
  const type=item.clinical_event?.type||'baseline';
  if(scope==='all')return true;if(scope==='baseline')return type==='baseline';if(scope==='new')return type==='new_registration';if(scope==='changed')return type==='important_change';
  if(item.editorial_review?.status==='reviewed')return true;
  const drugStudy=(item.clinical?.interventions||[]).some(i=>['DRUG','BIOLOGICAL','GENETIC'].includes(i.type));
  return drugStudy&&['new_registration','important_change'].includes(type);
}
export function searchItems(items,{date,slot,section='all',query=''}){const q=query.trim().toLocaleLowerCase();return items.filter(i=>(q?[i.title,i.summary,i.company,i.drug,i.nct,i.tags,i.kind].filter(Boolean).join(' ').toLocaleLowerCase().includes(q):i.report_date===date&&i.slot===slot)&&(section==='all'||i.section===section));}
export function latestVersions(items){const seen=new Set();return [...items].sort((a,b)=>String(b.collected_at).localeCompare(String(a.collected_at))).filter(i=>{const key=i.event_key||i.id;if(!key)return true;if(seen.has(key))return false;seen.add(key);return true;});}
