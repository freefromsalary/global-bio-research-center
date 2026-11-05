import {text} from './adapters.mjs';
// Official Arrowhead listing; public link snapshots are not evidence of a new vacancy.
export function readCareerLinks(html,feed){
 const found=new Map();
 for(const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const title=text(m[2]);let url;try{url=new URL(m[1].replace(/&amp;/g,'&'),feed.url);}catch{continue;}
  if(url.protocol!=='https:'||url.hostname!==new URL(feed.url).hostname||!url.searchParams.has('gh_jid')||title.length<8||/read more/i.test(title))continue;
  if(!/cardiometabol|MASH|obes|clinical|medical|manufactur|regulator|CMC|partnership|business development|pharmaco/i.test(title))continue;
  const key=url.searchParams.get('gh_jid');
  found.set(key,{section:'social',kind:'job',event_key:'career:'+feed.company+':'+key,company:feed.company,title,summary:'공식 채용 페이지에서 현재 열람 가능한 공고입니다. 최초 공고일 미제공으로 이번 회차 신규 채용 또는 조직 확대 신호로 집계하지 않습니다.',sources:[{label:feed.name,url:url.href}],published_at:null,tags:['공식 채용','현재 공고','최초 공고일 미확인'],job:{id:key,first_posted_at:null,status:'active',temporal_status:'current_listing'}});
 }
 if(!found.size&&!/no open positions|no current openings/i.test(text(html)))throw Error('채용 링크를 추출하지 못함; 공고 0건으로 판정하지 않음');
 return [...found.values()];
}
