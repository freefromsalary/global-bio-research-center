export const topicRules=[['대사',/obes|overweight|MASH|MASLD|NASH|GLP.?1|amylin|diabet|metabol|비만|대사|당뇨/i],['심혈관',/cardio|heart failure|ASCVD|CKM|CKLM|Lp\(a\)|lipoprotein|심혈관|심부전/i],['안과',/ophthal|retina|macular|geographic atrophy|AMD|glaucoma|안과|망막|황반/i]];
export function classifyResearch(item){
 const corpus=[item.title,item.summary,item.drug,item.company,item.tags].flat().filter(Boolean).join(' ');
 const topics=topicRules.filter(([,test])=>test.test(corpus)).map(([name])=>name);
 const category=item.section==='social'?'채용·업계':/earning|financial|실적|분기/i.test(item.kind+' '+item.title)?'실적·컨콜':/licens|partnership|acqui|merger|계약|인수|기술이전/i.test(corpus)?'계약·사업개발':/FDA|approval|regulator|허가|승인/i.test(corpus)?'규제':/phase|trial|임상/i.test(corpus)?'임상개발':'산업 뉴스';
 const priority=(topics.length?30:0)+(/MASH|DD01|DD18|OLX|디앤디|올릭스/i.test(corpus)?30:0)+(/phase.?3|FDA|실적|컨콜|licens|acqui|interim|financial results/i.test(corpus)?20:0)+(item.editorial_review?.status==='reviewed'?15:0);
 return {topics,category,priority};
}
export function orderResearch(items,sort='importance'){
 return [...items].sort((a,b)=>sort==='company'?String(a.company||'').localeCompare(String(b.company||'')):sort==='latest'?String(b.published_at||b.collected_at).localeCompare(String(a.published_at||a.collected_at)):(b.research?.priority??classifyResearch(b).priority)-(a.research?.priority??classifyResearch(a).priority)||String(b.published_at||b.collected_at).localeCompare(String(a.published_at||a.collected_at)));
}
export function consolidateResearch(items){
 const groups=new Map();
 for(const item of items){
  const corpus=[item.title,item.company,item.summary].join(' ');
  const alias=/boehringer|베링거/i.test(corpus)&&/SBP|Sino|시노/i.test(corpus)?'boehringer-sbp-option':/sanofi|사노피/i.test(corpus)&&/nurix|뉴릭스/i.test(corpus)&&/STAT6|stop|discontinu|중단|axing/i.test(corpus)?'sanofi-nurix-stat6':null;
  const key=alias?item.report_date+':'+alias:item.event_key||item.id;
  if(!groups.has(key)){groups.set(key,item);continue;}
  const previous=groups.get(key),chosen=item.editorial_review?.status==='reviewed'&&previous.editorial_review?.status!=='reviewed'?item:previous;
  const sources=[...new Map([...(previous.sources||[]),...(item.sources||[])].map(s=>[s.url,s])).values()];
  groups.set(key,{...chosen,sources});
 }
 return [...groups.values()];
}
