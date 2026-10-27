// Mide lo que el aprendiz ve sin abrir desplegables ni pasar de pestaña.
function visibleCopy(node) {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('details:not([open])').forEach(details => {
    [...details.childNodes].forEach(child => { if (child.nodeName !== 'SUMMARY') child.remove(); });
  });
  copy.querySelectorAll('.phase-footer, script, [hidden]').forEach(child => child.remove());
  return copy;
}

function visibleWords(node) {
  const copy = visibleCopy(node);
  const walker = copy.ownerDocument.createTreeWalker(copy, 4);
  const parts = [];
  while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
  return parts.join(' ').split(/\s+/u).filter(Boolean).length;
}

function visibleButtons(node) {
  return visibleCopy(node).querySelectorAll('button, a.button').length;
}

module.exports = { visibleWords, visibleButtons };
