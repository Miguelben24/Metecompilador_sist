export function analizarSemantico(palabrasClave, simbolosLista, transiciones){
  const errores = [];
  const setPC = new Set();
  for(const [pc] of palabrasClave){
    if(setPC.has(pc)) errores.push(`Palabra clave duplicada: '${pc}'.`);
    setPC.add(pc);
  }
  const setSim = new Set();
  for(const [s] of simbolosLista){
    if(setSim.has(s)) errores.push(`Símbolo duplicado: '${s}'.`);
    setSim.add(s);
  }
  const registradas = new Set();
  for(const t of transiciones){
    const clave = t.origen + '|' + t.condicion;
    if(registradas.has(clave)){
      errores.push(`No determinismo: el estado q${t.origen} con la condición '${t.condicion}' ya tiene un destino asignado.`);
    }
    registradas.add(clave);
    if(t.condicion!=='ID' && t.condicion!=='NUM' && !setPC.has(t.condicion) && !setSim.has(t.condicion)){
      errores.push(`La condición '${t.condicion}' usada en la transición del estado q${t.origen} no está declarada ni como palabra clave (PC) ni como símbolo (S).`);
    }
  }
  return { ok: errores.length===0, errores };
}
