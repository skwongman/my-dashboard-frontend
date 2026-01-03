// Simple heuristic to guess the genre/tag based on the title
function guessGenre(title, seriesTitle) {
    const text = (title + seriesTitle).toLowerCase();
    
    if (seriesTitle === '配信休止' || title.includes('配信休止')) return '休止';
    if (seriesTitle === 'お知らせ' || title.includes('お知らせ')) return 'INFO';
    if (text.includes('ニュース') || text.includes('news')) return 'ニュース';
    if (text.includes('sp') || text.includes('スペシャル') || text.includes('特番')) return 'スペシャル';
    if (text.includes('ドラマ') || text.includes('劇場')) return 'ドラマ';
    if (text.includes('アニメ')) return 'アニメ';
    if (text.includes('動物') || text.includes('どうぶつ')) return '動物・自然';
    if (text.includes('音楽') || text.includes('歌') || text.includes('ライブ')) return '音楽';
    if (text.includes('笑') || text.includes('バラエティ') || text.includes('芸人')) return 'バラエティ';
    if (text.includes('スポーツ') || text.includes('駅伝') || text.includes('野球')) return 'スポーツ';
    
    return 'バラエティ'; // Default fallback
  }
  
  export function transformRawData(rawItems, defaultBroadcasterName = 'Live') {
    // 1. Filter for type = 'live'
    const liveItems = rawItems.filter(item => item.type === 'live');
  
    // 2. Map to internal model
    const programs = liveItems.map(item => {
      const c = item.content;
      const rel = item.relationEpisode?.content;
      
      const seriesTitle = c.seriesTitle || '';
      const title = c.title || '';
  
      const isSuspended = 
        seriesTitle === '配信休止' || 
        title.trim() === '' || 
        title.includes('配信準備中') || 
        seriesTitle.includes('配信準備中') ||
        title === 'お知らせ' || 
        seriesTitle === 'お知らせ' ||
        title.includes('地上波放送番組のお知らせ') || 
        seriesTitle.includes('地上波放送番組のお知らせ') ||
        title.includes('配信番組のお知らせ') ||
        seriesTitle.includes('配信番組のお知らせ');
      
      let displayTitle = title.trim();
      if (isSuspended) {
        displayTitle = '配信休止中';
      } else if (!displayTitle) {
        displayTitle = seriesTitle;
      }
  
      const broadcasterName = rel?.broadcasterName || defaultBroadcasterName;
  
      const thumbnailUrl = c.thumbnailPath;
  
      return {
        id: c.id,
        title: displayTitle,
        originalTitle: title,
        seriesTitle: seriesTitle,
        broadcasterName,
        startAt: new Date(c.startAt * 1000),
        endAt: new Date(c.endAt * 1000),
        platforms: c.allowPlatforms,
        isDVR: c.dvr?.isDVR || false,
        thumbnailUrl,
        episodeTitle: rel?.title,
        broadcastDateLabel: rel?.broadcastDateLabel,
        isSuspended,
        genreTag: guessGenre(title, seriesTitle),
      };
    });
  
    return programs.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  export function getHKDate(date) {
    return new Date(date.getTime() + (8 * 60 * 60 * 1000));
  }

  export const getMonth = (date) => getHKDate(date).getUTCMonth() + 1;
  export const getDay = (date) => getHKDate(date).getUTCDate();
  export const getWeekday = (date) => ['日', '月', '火', '水', '木', '金', '土'][getHKDate(date).getUTCDay()];
  
  export function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Hong_Kong',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }
  
  export function formatDate(date) {
    const hk = getHKDate(date);
    const month = hk.getUTCMonth() + 1;
    const day = hk.getUTCDate();
    const weekDay = ['日', '月', '火', '水', '木', '金', '土'][hk.getUTCDay()];
    return `${month}月${day}日(${weekDay})`;
  }