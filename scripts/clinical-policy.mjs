const fields=['status','phases','enrollment','primary_outcomes','results_first_posted_date'];
function stable(v){if(Array.isArray(v))return v.map(stable).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;}
export function snapshot(item){return item.clinical||{version:0,first_posted_date:null,last_updated_date:item.summary?.match(/등록처 갱신일: (\d{4}-\d{2}-\d{2})/)?.[1]||null};}
export function clinicalFingerprint(item){const c=snapshot(item);if(c.version!==1)return JSON.stringify({nct:item.nct,title:item.title,summary:item.summary?.replace(/등록처 갱신일:.*$/m,'')});return JSON.stringify(stable({nct:item.nct,title:item.title,company:item.company,drug:item.drug,...Object.fromEntries(fields.map(k=>[k,c[k]??null])),first_posted_date:c.first_posted_date}));}
export function mergeClinical(items){const groups=new Map(),other=[];for(const i of items){if(i.section!=='clinical'||!i.nct){other.push(i);continue;}const key=i.nct+':'+clinicalFingerprint(i),found=groups.get(key);if(!found){groups.set(key,{...i});continue;}const areas=[...(found.tags||'').split(' · '),...(i.tags||'').split(' · ')].filter(Boolean);found.tags=[...new Set(areas)].sort().join(' · ');found.sources=[...new Map([...found.sources,...i.sources].map(s=>[s.url,s])).values()];}return [...other,...groups.values()];}
export function classifyClinical(item,previous,date){
  const c=snapshot(item),p=previous?snapshot(previous):null;
  if(c.version===1&&p?.version===1){
    const changed=fields.filter(k=>JSON.stringify(stable(p[k]??null))!==JSON.stringify(stable(c[k]??null)));
    if(changed.length)return {type:'important_change',changed_fields:changed,changes:changed.map(field=>({field,before:p[field]??null,after:c[field]??null})),note:'주요 등록 필드 변경 후보. 원문 대조·분석 필요.'};
    return {type:'administrative_update',changed_fields:[],note:'주요 등록 필드 변화 없음. 브리핑에서 제외.'};
  }
  if(c.version===1&&c.first_posted_date===date)return {type:'new_registration',changed_fields:[],date_precision:'day',note:'등록처 최초 공개일 기준. 회차 내 정확한 시각은 미제공.'};
  return {type:'baseline',changed_fields:[],note:'초기 비교 기준자료. 신규 등록이나 중요 변경으로 확인된 자료가 아님.'};
}
