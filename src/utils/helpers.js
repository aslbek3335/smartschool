/**
 * Har qanday YouTube havola shaklini (oddiy URL, youtu.be, shorts yoki allaqachon embed bo'lgan URL)
 * xavfsiz https://www.youtube.com/embed/VIDEO_ID formatiga o'tkazib beradi.
 * 
 * @param {string} url - YouTube video havolasi
 * @returns {string} - YouTube embed havolasi
 */
export const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) 
    ? `https://www.youtube.com/embed/${match[2]}` 
    : url;
};

export const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const getYouTubeThumbnail = (url) => {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};
