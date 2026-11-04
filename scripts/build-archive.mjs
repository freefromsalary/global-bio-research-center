import {readFile,writeFile,mkdir} from 'node:fs/promises';import {windowFor,hash} from './core.mjs';
const [date,slot]=process.argv.slice(2);windowFor(date,slot);const raw=JSON.parse(await readFile(`work/${date}-${slot}.json`,'utf8'));
if(raw.demo)throw Error('Demo data cannot be published as research');
const dir='public/data';await mkdir(dir,{recursive:true});let index;try{index=JSON.parse(await readFile(`${dir}/index.json`,'utf8'));}catch{index={schema_version:1,reports:[]};}
const filename=`${date}-${slot}.json`;let previous={items:[]};try{previous=JSON.parse(await readFile(`${dir}/${filename}`,'utf8'));}catch{}
const oldKeys=new Set();for(const r of index.reports){if(r.date===date&&r.slot===slot)continue;const other=JSON.parse(await readFile(`${dir}/${r.file}`,'utf8'));for(const i of other.items||[])oldKeys.add(`${i.event_key}:${i.content_hash}`);}
const current=(raw.items||[]).filter(i=>!oldKeys.has(`${i.event_key}:${i.content_hash}`)).map(i=>({...i,report_date:date,slot,id:i.id||hash(`${i.event_key}:${i.content_hash}`)}));
const items=[...new Map([...previous.items,...current].map(i=>[`${i.event_key}:${i.content_hash}`,i])).values()];
const report={schema_version:1,report_date:date,slot,status:'partial',updated_at:new Date().toISOString(),window:raw.window,coverage:raw.coverage||[],items};
await writeFile(`${dir}/${filename}`,JSON.stringify(report,null,2));index.reports=index.reports.filter(r=>!(r.date===date&&r.slot===slot));index.reports.push({date,slot,file:filename,count:items.length,status:report.status});index.reports.sort((a,b)=>b.date.localeCompare(a.date)||b.slot.localeCompare(a.slot));index.updated_at=report.updated_at;await writeFile(`${dir}/index.json`,JSON.stringify(index,null,2));console.log(`Archive saved: ${date} ${slot}, ${items.length} unique versions`);
