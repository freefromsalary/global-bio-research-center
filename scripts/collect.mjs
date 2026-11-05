import {classifyResearch} from '../public/research-policy.js';
import {readFile,mkdir,writeFile} from 'node:fs/promises';import {normalize,windowFor,rest,hash} from './core.mjs';
import {collectFeed} from './adapters.mjs';
const [date,slot,...flags]=process.argv.slice(2),win=windowFor(date,slot),owner=process.env.OWNER_ID;
const config=JSON.parse(await readFile('sources.json','utf8'));const items=[],coverage=[];
for(const feed of config.feeds){if(feed.enabled===false){coverage.push({source:feed.name,status:'not_configured',section:feed.section,reason:feed.reason||'일반 웹 검색에서 확인할 출처; 서버 어댑터 미연결'});continue;}try{const data=await collectFeed({...feed,type:feed.type||'json'},win);let count=0;for(const raw of data.items){const item={...normalize(raw),...(raw.job?{job:raw.job}:{}),research:classifyResearch(raw)};const t=item.published_at?new Date(item.published_at):null;
// Publish only the report window. Delayed discoveries require explicit editorial review.
if(t&&(+t>+win.end||+t<=+win.start))continue;items.push(item);count++;}coverage.push({source:feed.name,status:data.truncated?'truncated':'ok',section:feed.section,count,checked_at:new Date().toISOString()});}catch(e){coverage.push({source:feed.name,status:'failed',section:feed.section,reason:String(e.message).slice(0,120)});}}
if(!config.feeds.length)coverage.push({source:'all',status:'not_configured'});
// Durable handoff file is created before the database operation for recovery.
const out={status:'partial',window:{start:win.start.toISOString(),end:win.end.toISOString()},coverage,items};await mkdir('work',{recursive:true});const file=`work/${date}-${slot}.json`;await writeFile(file,JSON.stringify(out,null,2));
if(flags.includes('--dry-run')){console.log(JSON.stringify({dry_run:true,items:items.length,coverage}));if(coverage.some(c=>['failed','truncated'].includes(c.status)))process.exitCode=1;}else{
if(!owner)throw Error('Missing OWNER_ID; staged collection file retained');
if(!config.feeds.length)throw Error('No sources configured; no report was marked complete');
await rest('rpc/ingest_briefing',{p_report:{owner_id:owner,report_date:date,slot,status:'partial',coverage},p_items:items.map(i=>({...i,owner_id:owner,report_date:date,slot}))});
console.log(JSON.stringify({report:`${date}-${slot}`,candidates:items.length,failed:coverage.filter(c=>c.status==='failed').length,checksum:hash(JSON.stringify(out))}));if(coverage.some(c=>c.status==='failed'))process.exitCode=1;
}

