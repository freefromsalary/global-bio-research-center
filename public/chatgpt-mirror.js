// Display supplied ChatGPT text without rewriting or inserting independent research.
export function renderChatgptMirror({report, section, query, reports, onDate, el}) {
  const $ = s => document.querySelector(s);
  const names = {news:'01 글로벌 뉴스',clinical:'02 대사 · 심혈관 · 안과 임상',social:'03 X · LinkedIn · 채용'};
  const original = report.original_sections || {};
  $('#heading').textContent = report.report_date + ' ' + (report.slot === 'AM' ? '오전' : '오후') + ' · ChatGPT 브리핑 원문';
  $('#caption').textContent = 'CHATGPT ORIGINAL / ' + (report.slot === 'AM' ? '08:00' : '16:00') + ' KST';
  $('#status').textContent = 'ChatGPT 원문 보관 · 마지막 반영 ' + new Date(report.updated_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}) + ' KST · 자동 수신 연결 미완료';
  $('#clinicalNote').hidden = true;
  $('#infographic').hidden = true;
  $('#coverage').hidden = true;
  $('#pagination').replaceChildren();
  $('#stats').replaceChildren(...Object.entries(names).map(([key,name]) => {
    const d=el('div',undefined,'stat');
    d.append(el('small',name),el('strong',original[key]?.text?'원문 수신':'원문 미수신'),el('small',original[key]?.text?'받은 내용 그대로 표시':'소식 없음으로 판정한 것이 아닙니다'));
    return d;
  }));
  const keys = section === 'all' ? Object.keys(names) : [section];
  const cards = keys.map(key => {
    const source=original[key], card=el('article',undefined,'card original-report');
    card.append(el('h3',names[key]));
    if (!source?.text) {
      card.append(el('p','이 회차의 ChatGPT 원문을 아직 받지 못했습니다. 관련 소식이 없다는 뜻이 아닙니다.','original-missing'));
      return query ? null : card;
    }
    if(query && !source.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())) return null;
    card.append(el('p','사용자가 전달한 ChatGPT 브리핑 본문을 수정·요약하지 않고 보관했습니다. 첨부 텍스트에는 이미지 파일과 원문 기사 링크 주소가 포함되어 있지 않습니다.','original-provenance'));
    const download=el('a','원문 텍스트 내려받기');
    download.href=source.file;download.download='';card.append(download);
    card.append(el('div',source.text,'original-body'));
    return card;
  }).filter(Boolean);
  $('#cards').replaceChildren(...cards);
  if(!cards.length) $('#cards').append(el('p','받은 원문에서 검색어를 찾지 못했습니다.','empty'));
  $('#dates').replaceChildren(...[...new Set(reports.map(r=>r.report_date))].sort().reverse().map(date=>{
    const button=el('button',date,date===report.report_date?'active':'');button.onclick=()=>onDate(date);return button;
  }));
}
