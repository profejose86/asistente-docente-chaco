// MBIT: comparación local, sin modificar códigos ni datos del catálogo.
(() => {
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_‐‑–—-]/g,' ').replace(/\s+/g,' ').trim();
  const codeKey = value => {
    const match=normalize(value).match(/^([a-z]{2,5})\s*0*(\d+)$/);
    return match ? `${match[1]}:${Number(match[2])}` : '';
  };
  const words = value => normalize(value).split(/[^a-z0-9]+/).filter(word=>word&&!['de','del','la','el','las','los','un','una','para','por','y','formulario','tramite'].includes(word));
  function near(a,b) {
    if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1)return false;
    let edits=0,i=0,j=0;
    while(i<a.length&&j<b.length){
      if(a[i]===b[j]){i++;j++;continue;}
      if(++edits>1)return false;
      if(a[i]===b[j+1]&&a[i+1]===b[j]){i+=2;j+=2;}
      else if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}
    }
    return edits+(a.length-i)+(b.length-j)<=1;
  }
  function rank(record,query) {
    const q=normalize(query),code=normalize(record.code),key=codeKey(query)||codeKey(words(query).join(' '));
    if(!q)return 1;
    if(code && (codeKey(record.code)||/\d/.test(code)) && q===code)return 1000;
    if(key&&key===codeKey(record.code))return 990;
    const compact=q.replace(/\s/g,''),compactCode=code.replace(/\s/g,'');
    // Comparar el prefijo antes de descartar un código incompleto, como BD-0.
    if(/^[a-z]{1,5}\d*$/.test(compact)&&codeKey(record.code)&&compactCode.startsWith(compact))return 750;
    if(/^\d+$/.test(compact)){
      const segments=code.match(/\d+/g)||[];
      if(segments.includes(compact))return 880;
      if(segments.some(segment=>Number(segment)===Number(compact)))return 860;
      if(segments.some(segment=>segment.includes(compact)))return 650;
    }
    if(key)return 0; // No aproximar códigos completos distintos.
    const titles=[record.title,record.officialName].filter(Boolean).map(normalize);
    const synonyms=(record.keywords||[]).map(normalize);
    if(titles.includes(q))return 900;
    if(titles.some(title=>title.startsWith(q)))return 850;
    if(synonyms.includes(q))return 800;
    const tokens=words(q);if(!tokens.length)return 0;
    const candidates=words([...titles,...synonyms].join(' '));
    if(tokens.every(token=>candidates.includes(token)))return 700;
    if(tokens.every(token=>candidates.some(word=>word.startsWith(token))))return 600;
    if(tokens.every(token=>candidates.includes(token)||candidates.some(word=>near(token,word))))return 300;
    return 0;
  }
  function search(records,query,category='') {
    const seen=new Set();
    return records.map((record,index)=>({record,index,score:rank(record,query)})).filter(({record,score})=>{
      if(!score||!['available','published','ready',undefined].includes(record.status)||(category&&record.category!==category)||seen.has(record.id))return false;
      seen.add(record.id);return true;
    }).sort((a,b)=>b.score-a.score||a.index-b.index).map(item=>item.record);
  }
  window.adcMBITSearch=Object.freeze({normalize,codeKey,rank,search});
})();
