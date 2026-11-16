const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  formatDuration,
  getJob,
  getHistory,
  cancelConversion,
  DOWNLOADS_DIR,
  isAria2Available,
  setAria2Available,
  buildConversionArgs,
  parseProgress,
  detectPlatform,
  isValidMediaExtension,
  findOutputFile,
  attachProcessListeners,
  cleanOldDownloads,
  _jobs
} = require('../server/converter');

test('converter - formatDuration formatting rules', () => {
  // Edge cases and invalid values
  assert.strictEqual(formatDuration(0), '0:00');
  assert.strictEqual(formatDuration(null), '0:00');
  assert.strictEqual(formatDuration(undefined), '0:00');
  assert.strictEqual(formatDuration(NaN), '0:00');

  // Sub-minute formatting
  assert.strictEqual(formatDuration(5), '0:05');
  assert.strictEqual(formatDuration(42), '0:42');

  // Multi-minute formatting
  assert.strictEqual(formatDuration(60), '1:00');
  assert.strictEqual(formatDuration(125), '2:05');
  assert.strictEqual(formatDuration(599), '9:59');

  // Multi-hour formatting
  assert.strictEqual(formatDuration(3600), '1:00:00');
  assert.strictEqual(formatDuration(3665), '1:01:05');
  assert.strictEqual(formatDuration(36000), '10:00:00');
});

test('converter - getJob returns null for non-existent job ID', () => {
  const result = getJob('unknown-job-id-9999');
  assert.strictEqual(result, null);
});

test('converter - cancelConversion returns false for non-existent job ID', () => {
  const result = cancelConversion('non-existent-job-uuid');
  assert.strictEqual(result, false);
});

test('converter - getHistory returns array without raw process leaks', () => {
  const history = getHistory();
  assert.ok(Array.isArray(history), 'History should be an array');
  for (const entry of history) {
    assert.strictEqual(entry.process, undefined, 'History entries must not expose child process handles');
    assert.ok(typeof entry.status === 'string', 'History entry must have status');
  }
});

test('converter - DOWNLOADS_DIR exists and is an absolute directory', () => {
  assert.ok(path.isAbsolute(DOWNLOADS_DIR), 'DOWNLOADS_DIR should be an absolute path');
  assert.ok(fs.existsSync(DOWNLOADS_DIR), 'DOWNLOADS_DIR must exist on disk');
  const stats = fs.statSync(DOWNLOADS_DIR);
  assert.ok(stats.isDirectory(), 'DOWNLOADS_DIR must be a directory');
});

test('converter - buildConversionArgs configures extractor client ios,android for YouTube', () => {
  const result = buildConversionArgs({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'test.mp3'
  });

  const extractorArgIndex = result.args.indexOf('--extractor-args');
  assert.ok(extractorArgIndex !== -1, '--extractor-args must be present for YouTube URLs');
  assert.strictEqual(
    result.args[extractorArgIndex + 1],
    'youtube:player_client=ios,android',
    'Extractor client must be configured to ios,android'
  );
  assert.ok(
    !result.args.includes('youtube:player_client=android,web'),
    'Old android,web extractor client must not be used'
  );
});

test('converter - buildConversionArgs optimizes --http-chunk-size to 5M', () => {
  const result = buildConversionArgs({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'test.mp3'
  });

  const chunkIndex = result.args.indexOf('--http-chunk-size');
  assert.ok(chunkIndex !== -1, '--http-chunk-size must be specified');
  assert.strictEqual(result.args[chunkIndex + 1], '5M', '--http-chunk-size must be optimized to 5M');
  assert.notStrictEqual(result.args[chunkIndex + 1], '10M', '--http-chunk-size must not be 10M');
});

test('converter - buildConversionArgs configures aria2c external downloader when available', () => {
  const result = buildConversionArgs({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'test.mp3',
    useAria2: true
  });

  const downloaderIndex = result.args.indexOf('--downloader');
  assert.ok(downloaderIndex !== -1, '--downloader flag must be present when aria2 is available');
  assert.strictEqual(result.args[downloaderIndex + 1], 'aria2c');

  const downloaderArgsIndex = result.args.indexOf('--downloader-args');
  assert.ok(downloaderArgsIndex !== -1, '--downloader-args flag must be present');
  assert.strictEqual(result.args[downloaderArgsIndex + 1], 'aria2c:-s 16 -x 16 -k 1M -j 16');
});

test('converter - buildConversionArgs gracefully falls back to yt-dlp downloader when aria2c is absent', () => {
  const result = buildConversionArgs({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'test.mp3',
    useAria2: false
  });

  assert.strictEqual(result.args.includes('--downloader'), false, '--downloader must not be present when aria2c is absent');
  assert.strictEqual(result.args.includes('aria2c'), false, 'aria2c must not be configured when unavailable');
  assert.ok(result.args.includes('-N'), '-N flag must still be present for native fragment concurrency');
  assert.ok(result.args.includes('--http-chunk-size'), '--http-chunk-size must still be present for native downloading');
});

test('converter - isAria2Available handles state and setAria2Available allows testing overrides', () => {
  const originalState = isAria2Available();
  assert.strictEqual(typeof originalState, 'boolean', 'isAria2Available must return a boolean');

  setAria2Available(true);
  assert.strictEqual(isAria2Available(), true, 'isAria2Available must return true when set to true');

  setAria2Available(false);
  assert.strictEqual(isAria2Available(), false, 'isAria2Available must return false when set to false');

  // Restore original state
  setAria2Available(originalState);
  assert.strictEqual(isAria2Available(), originalState, 'isAria2Available state restored');
});

test('converter - parseProgress handles native yt-dlp and aria2c progress output', () => {
  const jobState = {
    status: 'starting',
    progress: 0,
    speed: '0 KiB/s',
    eta: '--:--',
    totalSize: 'Calculating...'
  };

  // Test yt-dlp native line
  parseProgress('[download]  45.2% of 15.00MiB at 3.20MiB/s ETA 00:03', jobState);
  assert.strictEqual(jobState.status, 'downloading');
  assert.strictEqual(jobState.progress, 45);
  assert.strictEqual(jobState.speed, '3.20MiB/s');
  assert.strictEqual(jobState.eta, '00:03');
  assert.strictEqual(jobState.totalSize, '15.00MiB');

  // Test aria2c multi-connection download line
  parseProgress('[#366579 12.0MiB/23.4MiB(51%) CN:16 DL:4.1MiB ETA:2s]', jobState);
  assert.strictEqual(jobState.status, 'downloading');
  assert.strictEqual(jobState.progress, 51);
  assert.strictEqual(jobState.speed, '4.1MiB/s');
  assert.strictEqual(jobState.eta, '2s');
  assert.strictEqual(jobState.totalSize, '23.4MiB');

  // Test audio conversion transition
  parseProgress('[ExtractAudio] Destination: /path/to/file.mp3', jobState);
  assert.strictEqual(jobState.status, 'converting');
  assert.ok(jobState.progress >= 92);

  // Test metadata tagging transition
  parseProgress('[Metadata] Adding metadata to /path/to/file.mp3', jobState);
  assert.strictEqual(jobState.status, 'tagging');
  assert.strictEqual(jobState.progress, 98);
});

test('converter - buildConversionArgs handles case-insensitive YouTube URLs and ignores non-YouTube platforms', () => {
  // 1. Uppercase and mixed-case YouTube URLs must be recognized
  const upperYt = buildConversionArgs({
    url: 'HTTPS://WWW.YOUTUBE.COM/WATCH?V=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'test.mp3'
  });
  const upperIdx = upperYt.args.indexOf('--extractor-args');
  assert.ok(upperIdx !== -1, '--extractor-args must be present for uppercase YouTube URL');
  assert.strictEqual(upperYt.args[upperIdx + 1], 'youtube:player_client=ios,android');

  const shortYt = buildConversionArgs({
    url: 'HTTPS://YOUTU.BE/dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'test.mp3'
  });
  const shortIdx = shortYt.args.indexOf('--extractor-args');
  assert.ok(shortIdx !== -1, '--extractor-args must be present for uppercase youtu.be URL');
  assert.strictEqual(shortYt.args[shortIdx + 1], 'youtube:player_client=ios,android');

  // 2. Non-YouTube URLs must NOT include YouTube extractor args
  const nonYtUrls = [
    'https://soundcloud.com/artist/sample-track',
    'https://www.tiktok.com/@creator/video/1234567890',
    'https://www.instagram.com/reel/Cx123456/'
  ];
  for (const nonYt of nonYtUrls) {
    const res = buildConversionArgs({
      url: nonYt,
      format: 'mp3',
      quality: '320k',
      outputTemplate: 'test.mp3'
    });
    assert.strictEqual(
      res.args.includes('--extractor-args'),
      false,
      `Non-YouTube platform (${nonYt}) must not configure --extractor-args`
    );
  }

  // 3. Omitted, null, or empty url/format must not throw and must not configure extractor args
  const emptyRes = buildConversionArgs({
    format: null,
    outputTemplate: 'test.mp3'
  });
  assert.strictEqual(emptyRes.args.includes('--extractor-args'), false);
  assert.strictEqual(emptyRes.targetFormat, 'mp3');
});

test('converter - buildConversionArgs omits extractor client when cookiePath is provided', () => {
  const result = buildConversionArgs({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'test.mp3',
    cookiePath: '/path/to/cookies.txt'
  });

  const cookieIndex = result.args.indexOf('--cookies');
  assert.ok(cookieIndex !== -1, '--cookies flag must be present');
  assert.strictEqual(result.args[cookieIndex + 1], '/path/to/cookies.txt');
  assert.strictEqual(
    result.args.includes('--extractor-args'),
    false,
    '--extractor-args must be omitted when authenticated cookies are used'
  );
});

test('converter - buildConversionArgs supports turbo=false mode', () => {
  const result = buildConversionArgs({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    format: 'mp3',
    quality: '320k',
    outputTemplate: 'test.mp3',
    turbo: false
  });

  assert.strictEqual(result.args.includes('-N'), false, '-N should not be present when turbo=false');
  assert.strictEqual(result.args.includes('--downloader'), false, '--downloader should not be present when turbo=false');
});

test('converter - parseProgress handles aria2c output edge cases (chunked, initial connect, minute ETA)', () => {
  const jobState = {
    status: 'starting',
    progress: 0,
    speed: '0 KiB/s',
    eta: '--:--',
    totalSize: 'Calculating...'
  };

  // Initial connection line before percentage is calculated
  parseProgress('[#366579 0B/23.4MiB CN:1 DL:0B]', jobState);
  assert.strictEqual(jobState.status, 'downloading', 'status should transition to downloading on initial aria2 connection');
  assert.strictEqual(jobState.totalSize, '23.4MiB');
  assert.strictEqual(jobState.speed, '0B/s');

  // Chunked transfer without total size or percentage
  parseProgress('[#366579 5.2MiB CN:4 DL:1.2MiB ETA:1m30s]', jobState);
  assert.strictEqual(jobState.status, 'downloading');
  assert.strictEqual(jobState.speed, '1.2MiB/s');
  assert.strictEqual(jobState.eta, '1m30s');

  // Raw bytes download line (small media or slow initial chunk)
  parseProgress('[download]  10.0% of 500B at 250B/s ETA 00:01', jobState);
  assert.strictEqual(jobState.status, 'downloading');
  assert.strictEqual(jobState.totalSize, '500B');
  assert.strictEqual(jobState.speed, '250B/s');
  assert.strictEqual(jobState.eta, '00:01');

  // FFmpeg merger progress
  parseProgress('[ffmpeg] Merging formats into "output.mp4"', jobState);
  assert.strictEqual(jobState.status, 'converting');
  assert.ok(jobState.progress >= 92);

  // Thumbnail converter progress
  parseProgress('[ThumbnailsConvertor] Converting thumbnail...', jobState);
  assert.strictEqual(jobState.status, 'tagging');
  assert.strictEqual(jobState.progress, 98);
});

test('converter - formatDuration handles negative numbers, Infinity, and NaN', () => {
  assert.strictEqual(formatDuration(-1), '0:00');
  assert.strictEqual(formatDuration(-3600), '0:00');
  assert.strictEqual(formatDuration(Infinity), '0:00');
  assert.strictEqual(formatDuration(-Infinity), '0:00');
  assert.strictEqual(formatDuration(NaN), '0:00');
});

test('converter - detectPlatform accurately identifies platforms and ignores false positives', () => {
  // Twitter / X
  assert.strictEqual(detectPlatform('https://x.com/username/status/12345'), 'Twitter / X');
  assert.strictEqual(detectPlatform('https://www.twitter.com/username/status/12345'), 'Twitter / X');

  // Boundary check: domains ending in or containing 'x' must not match Twitter
  assert.strictEqual(detectPlatform('https://fox.com/watch/video'), 'Web Media');
  assert.strictEqual(detectPlatform('https://max.com/movies/sample'), 'Web Media');
  assert.strictEqual(detectPlatform('https://linux.com/news/article'), 'Web Media');
  assert.strictEqual(detectPlatform('https://example.com/audio.mp3'), 'Web Media');

  // Other supported platforms
  assert.strictEqual(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'YouTube');
  assert.strictEqual(detectPlatform('https://youtu.be/dQw4w9WgXcQ'), 'YouTube');
  assert.strictEqual(detectPlatform('https://www.instagram.com/reel/Cx123456/'), 'Instagram');
  assert.strictEqual(detectPlatform('https://www.tiktok.com/@creator/video/12345'), 'TikTok');
  assert.strictEqual(detectPlatform('https://soundcloud.com/artist/track-name'), 'SoundCloud');
  assert.strictEqual(detectPlatform('https://reddit.com/r/videos/comments/12345/clip'), 'Reddit');
  assert.strictEqual(detectPlatform('https://vimeo.com/12345678'), 'Vimeo');

  // Invalid URL fallback
  assert.strictEqual(detectPlatform('not-a-valid-url'), 'Web Media');
  assert.strictEqual(detectPlatform(''), 'Web Media');
  assert.strictEqual(detectPlatform(null), 'Web Media');
});

test('converter - child close event preserves cancelled status and ignores non-zero exit code', () => {
  const EventEmitter = require('node:events');
  const fakeChild = new EventEmitter();
  fakeChild.stdout = new EventEmitter();
  fakeChild.stderr = new EventEmitter();

  const jobId = 'test-cancellation-preservation-' + Date.now();
  const jobState = {
    id: jobId,
    url: 'https://example.com/audio.mp3',
    format: 'mp3',
    status: 'downloading',
    progress: 45,
    error: null,
    process: fakeChild
  };

  _jobs.set(jobId, jobState);

  try {
    // Attach genuine process listeners
    attachProcessListeners(jobState, fakeChild, 'mp3');

    // Simulate cancellation by user
    jobState.status = 'cancelled';
    jobState.error = 'Conversion was cancelled by user.';

    // Emit close event with exit code 1 (simulating process termination by SIGTERM / taskkill)
    fakeChild.emit('close', 1);

    // Verify that jobState.status remains 'cancelled' and error is not overwritten to 'failed'
    assert.strictEqual(jobState.status, 'cancelled', 'Job status must remain cancelled after exit code 1');
    assert.strictEqual(jobState.error, 'Conversion was cancelled by user.', 'Cancellation error must be preserved');
    assert.strictEqual(getJob(jobId).status, 'cancelled', 'getJob must report status as cancelled');

    // Contrast with active uncancelled job: exit code 1 must set status to failed
    const normalJobId = 'test-normal-failure-' + Date.now();
    const normalChild = new EventEmitter();
    normalChild.stdout = new EventEmitter();
    normalChild.stderr = new EventEmitter();
    const normalJob = {
      id: normalJobId,
      url: 'https://example.com/audio.mp3',
      format: 'mp3',
      status: 'downloading',
      error: null
    };
    attachProcessListeners(normalJob, normalChild, 'mp3');
    normalChild.emit('close', 1);
    assert.strictEqual(normalJob.status, 'failed', 'Uncancelled job must transition to failed on exit code 1');
    assert.ok(normalJob.error.includes('exit code 1'), 'Error must reflect exit code');
  } finally {
    _jobs.delete(jobId);
  }
});

test('converter - isValidMediaExtension accepts valid audio/video and rejects metadata/partial extensions', () => {
  const validExtensions = ['.mp3', '.m4a', '.wav', '.flac', '.mp4'];
  const excludedExtensions = ['.part', '.jpg', '.jpeg', '.webp', '.png', '.ytdl', '.temp', '.json', ''];

  for (const ext of validExtensions) {
    assert.strictEqual(isValidMediaExtension(ext), true, `Extension ${ext} must be accepted by isValidMediaExtension`);
    assert.strictEqual(isValidMediaExtension(`test-file${ext}`), true, `Filename with ${ext} must be accepted`);
  }

  for (const ext of excludedExtensions) {
    assert.strictEqual(isValidMediaExtension(ext), false, `Extension ${ext} must be rejected by isValidMediaExtension`);
    assert.strictEqual(isValidMediaExtension(`test-file${ext}`), false, `Filename with ${ext} must be rejected`);
  }
});

test('converter - findOutputFile discovers actual media files and excludes partial/image files in DOWNLOADS_DIR', () => {
  const testJobId = 'test-discovery-job-' + Date.now();
  const partFile = path.join(DOWNLOADS_DIR, `${testJobId}.part`);
  const imageFile = path.join(DOWNLOADS_DIR, `${testJobId}.jpg`);
  const mediaFile = path.join(DOWNLOADS_DIR, `${testJobId}.final.mp3`);

  fs.writeFileSync(partFile, 'partial download data');
  fs.writeFileSync(imageFile, 'thumbnail image data');

  try {
    // When only .part and .jpg exist, findOutputFile must NOT return them
    const foundNone = findOutputFile(testJobId, 'mp3');
    assert.strictEqual(foundNone, null, 'findOutputFile must return null when only non-media files exist');

    // When valid media file is present, findOutputFile must locate and return it
    fs.writeFileSync(mediaFile, 'completed audio data');
    const foundMedia = findOutputFile(testJobId, 'mp3');
    assert.strictEqual(foundMedia, mediaFile, 'findOutputFile must discover valid media file');
  } finally {
    if (fs.existsSync(partFile)) fs.unlinkSync(partFile);
    if (fs.existsSync(imageFile)) fs.unlinkSync(imageFile);
    if (fs.existsSync(mediaFile)) fs.unlinkSync(mediaFile);
  }
});

test('converter - cleanOldDownloads handles subdirectories and locked files without aborting', () => {
  const expiredFile1 = path.join(DOWNLOADS_DIR, 'test-clean-expired-1.tmp');
  const expiredFile2 = path.join(DOWNLOADS_DIR, 'test-clean-expired-2.tmp');
  const subDir = path.join(DOWNLOADS_DIR, 'test-clean-dir.tmp');

  fs.writeFileSync(expiredFile1, 'data1');
  fs.writeFileSync(expiredFile2, 'data2');
  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true });
  }

  // Backdate mtime by 3 hours (older than 2-hour threshold)
  const threeHoursAgo = (Date.now() - 3 * 60 * 60 * 1000) / 1000;
  fs.utimesSync(expiredFile1, threeHoursAgo, threeHoursAgo);
  fs.utimesSync(expiredFile2, threeHoursAgo, threeHoursAgo);

  try {
    cleanOldDownloads(2 * 60 * 60 * 1000);

    assert.strictEqual(fs.existsSync(expiredFile1), false, 'Expired file 1 should be removed');
    assert.strictEqual(fs.existsSync(expiredFile2), false, 'Expired file 2 should be removed');
    assert.strictEqual(fs.existsSync(subDir), true, 'Subdirectory should not cause unhandled error or deletion');
  } finally {
    if (fs.existsSync(expiredFile1)) fs.unlinkSync(expiredFile1);
    if (fs.existsSync(expiredFile2)) fs.unlinkSync(expiredFile2);
    if (fs.existsSync(subDir)) fs.rmdirSync(subDir);
  }
});





