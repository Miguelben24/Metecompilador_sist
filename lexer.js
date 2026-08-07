import { KEYWORDS, ID, ENTERO, SIMBOL, COMA, FIN, ERROR } from './constants.js';

export function makeLexer(cad){
  let pos = 0;
  function isElement(ch){
    if(ch===undefined) return false;
    if(/[a-zA-Z0-9]/.test(ch)) return false;
    if(ch===' '||ch==='\n'||ch==='\t'||ch==='\r') return false;
    if(ch.charCodeAt(0)===39) return false;
    return true;
  }
  function next(){
    while(pos<cad.length && (cad[pos]===' '||cad[pos]==='\n'||cad[pos]==='\t'||cad[pos]==='\r')) pos++;
    if(pos>=cad.length) return {tok:FIN};
    if(cad[pos]==='#' && cad[pos+1]==='#'){
      pos+=2;
      while(pos<cad.length){
        if(cad[pos]==='#'&&cad[pos+1]==='#'){ pos+=2; break; }
        pos++;
      }
      return next();
    }
    if(cad[pos]==='"'){
      pos++;
      let s='';
      while(pos<cad.length && cad[pos]!=='"'){ s+=cad[pos]; pos++; }
      if(cad[pos]==='"') pos++;
      return {tok:ID, value:s};
    }
    if(/[a-zA-Z]/.test(cad[pos])){
      let s='';
      while(pos<cad.length && /[a-zA-Z0-9_]/.test(cad[pos])){ s+=cad[pos]; pos++; }
      if(KEYWORDS.hasOwnProperty(s)) return {tok:KEYWORDS[s], value:s};
      return {tok:ID, value:s};
    }
    if(/[0-9]/.test(cad[pos])){
      let s='';
      while(pos<cad.length && (/[0-9]/.test(cad[pos])||cad[pos]==='.' )){ s+=cad[pos]; pos++; }
      return {tok:ENTERO, value:s};
    }
    if(isElement(cad[pos])){
      const c = cad[pos]; pos++;
      if(c===',') return {tok:COMA, value:','};
      return {tok:SIMBOL, value:c};
    }
    pos++;
    return {tok:ERROR, value:cad[pos-1]};
  }
  return { next };
}
