const _t = (str) => {
  let out = str;
  const idxContextSep = out.indexOf('_');
  if (idxContextSep >= 0) out = out.slice(idxContextSep + 1);
  out = out.trim();
  return out;
};

export default _t;
