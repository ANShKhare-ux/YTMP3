// Use fake timers BEFORE requiring the module so that the top-level setInterval uses fake timers
jest.useFakeTimers();

const { formatDuration, detectPlatform, normalizeUrl } = require('./converter');

describe('converter.js utilities', () => {
  afterAll(() => {
    jest.useRealTimers();
  });

  describe('formatDuration', () => {
    it('formats seconds less than a minute', () => {
      expect(formatDuration(45)).toBe('0:45');
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(0)).toBe('0:00');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(600)).toBe('10:00');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3665)).toBe('1:01:05');
      expect(formatDuration(7325)).toBe('2:02:05');
    });

    it('handles invalid or missing inputs', () => {
      expect(formatDuration(null)).toBe('0:00');
      expect(formatDuration(undefined)).toBe('0:00');
      expect(formatDuration('invalid')).toBe('0:00');
      expect(formatDuration(NaN)).toBe('0:00');
    });
  });

  describe('detectPlatform', () => {
    it('detects YouTube', () => {
      expect(detectPlatform('https://www.youtube.com/watch?v=123')).toBe('YouTube');
      expect(detectPlatform('https://youtu.be/123')).toBe('YouTube');
    });

    it('detects Instagram', () => {
      expect(detectPlatform('https://www.instagram.com/p/123')).toBe('Instagram');
      expect(detectPlatform('https://instagr.am/p/123')).toBe('Instagram');
    });

    it('detects TikTok', () => {
      expect(detectPlatform('https://www.tiktok.com/@user/video/123')).toBe('TikTok');
    });

    it('detects Twitter / X', () => {
      expect(detectPlatform('https://twitter.com/user/status/123')).toBe('Twitter / X');
      expect(detectPlatform('https://x.com/user/status/123')).toBe('Twitter / X');
      expect(detectPlatform('https://t.co/123')).toBe('Twitter / X');
    });

    it('detects Facebook', () => {
      expect(detectPlatform('https://www.facebook.com/watch/?v=123')).toBe('Facebook');
      expect(detectPlatform('https://fb.watch/123')).toBe('Facebook');
    });

    it('detects Reddit', () => {
      expect(detectPlatform('https://www.reddit.com/r/videos/123')).toBe('Reddit');
      expect(detectPlatform('https://redd.it/123')).toBe('Reddit');
    });

    it('detects SoundCloud', () => {
      expect(detectPlatform('https://soundcloud.com/user/track')).toBe('SoundCloud');
    });

    it('detects Twitch', () => {
      expect(detectPlatform('https://www.twitch.tv/videos/123')).toBe('Twitch');
    });

    it('detects Vimeo', () => {
      expect(detectPlatform('https://vimeo.com/123')).toBe('Vimeo');
    });

    it('detects Pinterest', () => {
      expect(detectPlatform('https://www.pinterest.com/pin/123')).toBe('Pinterest');
      expect(detectPlatform('https://pin.it/123')).toBe('Pinterest');
    });

    it('detects Bilibili', () => {
      expect(detectPlatform('https://www.bilibili.com/video/123')).toBe('Bilibili');
    });

    it('detects Threads', () => {
      expect(detectPlatform('https://www.threads.net/@user/post/123')).toBe('Threads');
    });

    it('returns Web Media for unknown platforms', () => {
      expect(detectPlatform('https://example.com/video.mp4')).toBe('Web Media');
    });
  });

  describe('normalizeUrl', () => {
    it('throws error for empty or invalid input type', () => {
      expect(() => normalizeUrl('')).toThrow('URL is required');
      expect(() => normalizeUrl(null)).toThrow('URL is required');
      expect(() => normalizeUrl(123)).toThrow('URL is required');
    });

    it('trims whitespace', () => {
      const url = '  https://youtube.com/watch?v=123  ';
      expect(normalizeUrl(url)).toBe('https://youtube.com/watch?v=123');
    });

    it('adds http:// if protocol is missing', () => {
      const url = 'youtube.com/watch?v=123';
      expect(normalizeUrl(url)).toBe('https://youtube.com/watch?v=123');
    });

    it('keeps existing https:// protocol', () => {
      const url = 'https://youtube.com/watch?v=123';
      expect(normalizeUrl(url)).toBe('https://youtube.com/watch?v=123');
    });

    it('keeps existing http:// protocol', () => {
      const url = 'http://youtube.com/watch?v=123';
      expect(normalizeUrl(url)).toBe('http://youtube.com/watch?v=123');
    });

    it('throws error for invalid domain format (no dot)', () => {
      // Just a string with no domain dot (e.g. "not-a-url")
      // normalizeUrl adds https://, so it becomes https://not-a-url
      // URL parsing will accept "not-a-url" as a hostname, but it fails the .includes('.') check
      expect(() => normalizeUrl('not-a-url')).toThrow('Please enter a valid link');
    });

    it('throws error for completely malformed URLs', () => {
      // Something that fails the new URL() constructor completely or our check
      // For instance a string that causes new URL to throw
      expect(() => normalizeUrl('http:// a')).toThrow('Please enter a valid link');
    });
  });
});
