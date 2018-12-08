let codeBlocks = document.getElementsByClassName("split");

for (let i = 0; i < codeBlocks.length; i++) {
  let block = codeBlocks[i],
      jn = JSON.parse(block.innerText),
      keys = Object.keys(jn),
      composed = '{<br/>';
  keys.forEach((key, index) => {
    composed += '&nbsp;&nbsp;';
    if (typeof jn[key] === 'object') {
      composed += '"' + key + '" : [ "' + jn[key].join('" , "') + '" ]';
    } else if (['language', '_id', '__v'].indexOf(key) > -1) {
      composed += '"' + jn[key] + '" : "' + key + '"';
    } else {
      composed += '"' + key + '" : "' + jn[key] + '"';
    }
    if (index < keys.length - 1) {
      composed += '،';
    }
    composed += '<br/>';
  });
  composed += '{';
  block.innerHTML = composed;
}
