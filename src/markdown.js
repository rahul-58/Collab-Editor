function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyInlineFormatting(text) {
  let output = escapeHtml(text);
  output = output.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/__(.+?)__/g, '<u>$1</u>');
  output = output.replace(/\*(.+?)\*/g, '<em>$1</em>');
  output = output.replace(/`(.+?)`/g, '<code>$1</code>');
  return output;
}

function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let listState = null;

  function closeList() {
    if (listState) {
      blocks.push(`</${listState}>`);
      listState = null;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      closeList();
      const level = trimmed.match(/^#+/)[0].length;
      blocks.push(`<h${level}>${applyInlineFormatting(trimmed.replace(/^#{1,3}\s+/, ''))}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (listState !== 'ul') {
        closeList();
        listState = 'ul';
        blocks.push('<ul>');
      }
      blocks.push(`<li>${applyInlineFormatting(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (listState !== 'ol') {
        closeList();
        listState = 'ol';
        blocks.push('<ol>');
      }
      blocks.push(`<li>${applyInlineFormatting(trimmed.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    closeList();
    blocks.push(`<p>${applyInlineFormatting(trimmed)}</p>`);
  }

  closeList();
  return blocks.length ? blocks.join('') : '<p></p>';
}

function textToHtml(text) {
  const paragraphs = String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`);

  return paragraphs.length ? paragraphs.join('') : '<p></p>';
}

module.exports = {
  markdownToHtml,
  textToHtml
};
