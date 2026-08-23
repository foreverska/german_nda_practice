let responseText = `{\n  "key": "value"\n}`;
console.log("Before: ", responseText);
responseText = responseText.replace(/[\u0000-\u001F]/g, (char) => {
  if (char === '\n') return '\\n';
  if (char === '\r') return '\\r';
  if (char === '\t') return '\\t';
  return '';
});
console.log("After: ", responseText);
try {
  JSON.parse(responseText);
  console.log("Success!");
} catch (e) {
  console.log("Error: ", e.message);
}
