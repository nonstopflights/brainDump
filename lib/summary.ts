export function miniSummary(text:string,images:string[]=[]):string {
  const normalized=text.replace(/\s+/g,' ').trim();
  if(normalized){const first=normalized.match(/^.{1,100}?(?:[.!?](?=\s|$)|$)/)?.[0]||normalized.slice(0,100);return first.length>100?first.slice(0,97).trimEnd()+'…':first;}
  return images.length?'Image note':'New thought';
}
