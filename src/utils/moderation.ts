const INDONESIAN_PROFANITY = [
  'anjing',
  'anjir',
  'anjrit',
  'anying',
  'babi',
  'bangsat',
  'bangke',
  'bajingan',
  'brengsek',
  'bgst',
  'asu',
  'asw',
  'jancok',
  'jancuk',
  'cok',
  'cuk',
  'kontol',
  'memek',
  'ngentot',
  'ngewe',
  'pepek',
  'perek',
  'lonte',
  'pelacur',
  'tolol',
  'goblok',
  'goblog',
  'bego',
  'idiots',
  'idiot',
  'keparat',
  'kampret',
  'kunyuk',
  'pantek',
  'pukimak',
  'kimak',
  'tai',
  'taik',
  'titit',
  'kntl',
  'mmk',
  'jmbt',
  'jembut',
  'sundal',
  'jablay',
  'setan',
  'iblis',
  'bacot',
];

export function containsProfanity(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't');

  const words = normalized.split(/[^a-z]+/).filter(Boolean);
  return words.some((word) => INDONESIAN_PROFANITY.includes(word));
}

export function containsLink(text: string): boolean {
  const linkPattern =
    /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|id|co\.id|ac\.id|xyz|io|me|ly|gg|info|biz|site|online|link|top|vip)(\/|\b))/i;
  return linkPattern.test(text);
}
