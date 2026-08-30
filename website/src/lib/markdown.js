/**
 * A deliberately small markdown parser.
 *
 * The article page needs to drop ad units *between* paragraphs, so it needs the
 * body as a list of blocks rather than one HTML string — that, plus the fact
 * that we control the content, is why this exists instead of a dependency.
 *
 * Supported: # h1–### h3, paragraphs, - / * bullets, 1. ordered lists,
 * > quotes, --- rules, ![alt](src) images, and inline **bold**, *italic*,
 * `code` and [links](href).
 */

const escapeHtml = s =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Inline formatting → HTML. The text is escaped first, so this is safe. */
export function renderInline(text = '') {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, label, href) =>
        `<a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noreferrer noopener"' : ''}>${label}</a>`,
    );
}

/**
 * Split markdown into blocks.
 * @returns {{type: string, text?: string, items?: string[], src?: string, alt?: string, level?: number}[]}
 */
export function parseMarkdown(md = '') {
  const blocks = [];
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  let paragraph = [];
  let list = null; // {type: 'ul'|'ol', items: []}

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({type: 'p', text: paragraph.join(' ').trim()});
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({type: list.type, items: list.items});
      list = null;
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushAll();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushAll();
      blocks.push({type: 'h', level: heading[1].length, text: heading[2]});
      continue;
    }

    if (/^(---|\*\*\*|___)$/.test(line)) {
      flushAll();
      blocks.push({type: 'hr'});
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (image) {
      flushAll();
      blocks.push({type: 'img', alt: image[1], src: image[2]});
      continue;
    }

    if (line.startsWith('> ')) {
      flushAll();
      blocks.push({type: 'quote', text: line.slice(2)});
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (list?.type !== 'ul') {
        flushList();
        list = {type: 'ul', items: []};
      }
      list.items.push(bullet[1]);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      flushParagraph();
      if (list?.type !== 'ol') {
        flushList();
        list = {type: 'ol', items: []};
      }
      list.items.push(ordered[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushAll();
  return blocks;
}

/** Rough word count, for a reading estimate when the API hasn't given one. */
export function readingMinutes(md = '') {
  return Math.max(1, Math.round(String(md).split(/\s+/).filter(Boolean).length / 200));
}

/** Headings, for the article's table of contents. */
export function tableOfContents(blocks) {
  return blocks
    .filter(b => b.type === 'h' && b.level === 2)
    .map(b => ({id: slugifyHeading(b.text), text: b.text}));
}

export function slugifyHeading(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
