import test from 'node:test';import assert from 'node:assert/strict';import {searchItems,latestVersions} from '../public/archive.js';
const items=[{id:'1',event_key:'e',report_date:'2026-11-03',slot:'AM',section:'news',title:'Earnings',company:'Novo',summary:'컨콜 Q&A',collected_at:'2026-11-03T07:00:00Z'},{id:'2',event_key:'e',report_date:'2026-11-04',slot:'PM',section:'news',title:'Update',company:'Novo',summary:'가이던스 변경',collected_at:'2026-11-04T07:00:00Z'}];
test('search spans dates and slots',()=>assert.equal(searchItems(items,{date:'2026-11-04',slot:'PM',query:'novo'}).length,2));
test('date browsing does not remove old report when later version exists',()=>assert.equal(latestVersions(searchItems(items,{date:'2026-11-03',slot:'AM'}))[0].id,'1'));
test('latest version hides duplicate event in cross-date search',()=>assert.equal(latestVersions(items)[0].id,'2'));
