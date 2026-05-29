/**
 * Classify a reel's video URL so the UI can render the right player:
 *  - direct file (.mp4/.webm/ImageKit) → <video>
 *  - YouTube / Vimeo page link → <iframe> embed
 * Returns {provider, id, embed, poster}.
 */
export function parseVideo(url = '') {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) {
    const id = yt[1];
    return {
      provider: 'youtube',
      id,
      embed: `https://www.youtube.com/embed/${id}`,
      poster: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) {
    return {provider: 'vimeo', id: vm[1], embed: `https://player.vimeo.com/video/${vm[1]}`, poster: null};
  }
  return {provider: 'file', id: null, embed: null, poster: null};
}

/** Build an autoplaying, muted, looping embed URL for the active feed slide. */
export function embedSrc(parsed, {autoplay = true} = {}) {
  if (parsed.provider === 'youtube') {
    const p = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: '1',
      loop: '1',
      playlist: parsed.id,
      controls: '1',
      modestbranding: '1',
      rel: '0',
      playsinline: '1',
    });
    return `${parsed.embed}?${p.toString()}`;
  }
  if (parsed.provider === 'vimeo') {
    const p = new URLSearchParams({autoplay: autoplay ? '1' : '0', muted: '1', loop: '1', playsinline: '1'});
    return `${parsed.embed}?${p.toString()}`;
  }
  return parsed.embed;
}
