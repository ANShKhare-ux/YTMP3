const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  isPhotoSupportedUrl,
  extractInstagramPhotosFromHtml,
  createZipBuffer,
  downloadPhotoJob,
  resolvePhotoMetadata
} = require('../server/photoResolver');
const { DOWNLOADS_DIR } = require('../server/converter');

test('photoResolver - isPhotoSupportedUrl identifies supported social media photo URLs', () => {
  // Supported photo & carousel platforms
  assert.strictEqual(isPhotoSupportedUrl('https://www.instagram.com/p/DgBNZl4tY0P/'), true);
  assert.strictEqual(isPhotoSupportedUrl('https://instagram.com/p/C_abc123/'), true);
  assert.strictEqual(isPhotoSupportedUrl('https://www.instagram.com/reel/C_xyz456/'), true);
  assert.strictEqual(isPhotoSupportedUrl('https://www.reddit.com/r/pics/comments/12345/sunset_over_mountains/'), true);
  assert.strictEqual(isPhotoSupportedUrl('https://redd.it/12345'), true);
  assert.strictEqual(isPhotoSupportedUrl('https://twitter.com/nasa/status/123456789'), true);
  assert.strictEqual(isPhotoSupportedUrl('https://x.com/space/status/987654321'), true);
  assert.strictEqual(isPhotoSupportedUrl('https://cdn.example.com/image.jpg'), true);
  assert.strictEqual(isPhotoSupportedUrl('https://cdn.example.com/photo.png?v=2'), true);

  // Non-photo platforms or audio/video specific links
  assert.strictEqual(isPhotoSupportedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), false);
  assert.strictEqual(isPhotoSupportedUrl('https://youtu.be/dQw4w9WgXcQ'), false);
  assert.strictEqual(isPhotoSupportedUrl('https://soundcloud.com/artist/track-name'), false);
  assert.strictEqual(isPhotoSupportedUrl(''), false);
  assert.strictEqual(isPhotoSupportedUrl(null), false);
  assert.strictEqual(isPhotoSupportedUrl(undefined), false);
});

test('photoResolver - extractInstagramPhotosFromHtml parses EmbeddedMediaImage and dedupes CDN URLs', () => {
  const sampleHtml = `
    <!DOCTYPE html><html><body>
      <div class="UsernameText">photographer_pro</div>
      <div class="Caption">Stunning golden hour portrait</div>
      <img class="EmbeddedMediaImage" src="https://instagram.fidr4-3.fna.fbcdn.net/v/t51.82787-15/123_456_789_n.jpg?stp=dst-jpg_e35_tt6&amp;token=abc" />
      <img src="https://instagram.fidr4-3.fna.fbcdn.net/v/t51.82787-15/123_456_789_n.jpg?stp=c0.135.1080.1080a_dst-jpg_s150x150" />
      <img src="https://instagram.fidr4-3.fna.fbcdn.net/v/t51.82787-15/999_888_777_n.jpg?stp=dst-jpg_e35_tt6" />
    </body></html>
  `;

  const photos = extractInstagramPhotosFromHtml(sampleHtml);
  assert.strictEqual(photos.length, 2, 'Should extract 2 unique photos and deduplicate thumbnails of slide 1');
  assert.strictEqual(photos[0].index, 1);
  assert.ok(photos[0].url.includes('123_456_789_n.jpg'), 'Slide 1 should match primary EmbeddedMediaImage');
  assert.strictEqual(photos[1].index, 2);
  assert.ok(photos[1].url.includes('999_888_777_n.jpg'), 'Slide 2 should match second unique carousel image');
});

test('photoResolver - extractInstagramPhotosFromHtml strictly excludes author HoverCardPhotos previews', () => {
  const sampleHtmlWithHoverCard = `
    <!DOCTYPE html><html><body>
      <div class="UsernameText">robiinluca</div>
      <img class="EmbeddedMediaImage" src="https://instagram.fidr4-3.fna.fbcdn.net/v/t51.82787-15/current_post_slide1.jpg?stp=dst-jpg_e35_tt6" />
      <!-- Owner profile hover card displaying older recent posts from their feed -->
      <a class="HoverCardRoot" href="https://www.instagram.com/robiinluca/">
        <div class="HoverCardPhotos">
          <img src="https://instagram.fidr4-3.fna.fbcdn.net/v/t51.82787-15/older_recent_post_slide1.jpg?stp=dst-jpg_e35_tt6" />
        </div>
      </a>
    </body></html>
  `;

  const photos = extractInstagramPhotosFromHtml(sampleHtmlWithHoverCard, 'current_post');
  assert.strictEqual(photos.length, 1, 'Should extract only the post slide and strictly ignore HoverCardPhotos');
  assert.ok(photos[0].url.includes('current_post_slide1.jpg'), 'Extracted photo must be from current post');
  assert.strictEqual(photos.some(p => p.url.includes('older_recent_post')), false, 'Must not contain older posts from author hover card');
});

test('photoResolver - extractInstagramPhotosFromHtml parses Relay SSR carousel_media payload with all slides in 1080p', () => {
  const mockRelayHtml = `
    <!DOCTYPE html><html><body>
      <script type="application/json" data-sjs>
        {
          "require": [
            ["PolarisMedia", "get", [], [{
              "code": "DgBNdFUjTk1",
              "user": { "username": "robiinluca" },
              "caption": { "text": "7 Pro photography tips" },
              "carousel_media": [
                { "code": "slide1", "image_versions2": { "candidates": [{ "url": "https://cdn.example.com/s1_1080.jpg", "width": 1080, "height": 1350 }, { "url": "https://cdn.example.com/s1_720.jpg", "width": 720, "height": 900 }] } },
                { "code": "slide2", "image_versions2": { "candidates": [{ "url": "https://cdn.example.com/s2_1080.jpg", "width": 1080, "height": 1350 }] } },
                { "code": "slide3", "image_versions2": { "candidates": [{ "url": "https://cdn.example.com/s3_1080.jpg", "width": 1080, "height": 1350 }] } }
              ]
            }]]
          ]
        }
      </script>
    </body></html>
  `;

  const photos = extractInstagramPhotosFromHtml(mockRelayHtml, 'slide2');
  assert.strictEqual(photos.length, 3, 'Must extract all 3 carousel slides');
  assert.strictEqual(photos[0].index, 1);
  assert.strictEqual(photos[0].url, 'https://cdn.example.com/s1_1080.jpg', 'Must pick highest resolution 1080p candidate');
  assert.strictEqual(photos[1].index, 2);
  assert.strictEqual(photos[1].url, 'https://cdn.example.com/s2_1080.jpg');
  assert.strictEqual(photos[2].index, 3);
  assert.strictEqual(photos[2].url, 'https://cdn.example.com/s3_1080.jpg');
});

test('photoResolver - createZipBuffer generates standard valid PKZip archive', () => {
  const entries = [
    { filename: 'photo_01.jpg', data: Buffer.from('JPEG_DATA_1_SIMULATION') },
    { filename: 'photo_02.jpg', data: Buffer.from('JPEG_DATA_2_SIMULATION') }
  ];

  const zipBuf = createZipBuffer(entries);
  assert.ok(Buffer.isBuffer(zipBuf), 'Output must be a Node.js Buffer');
  assert.ok(zipBuf.length > 100, 'Zip buffer must contain local and central headers');

  // Verify PK\x03\x04 signature at start
  assert.strictEqual(zipBuf.readUInt32LE(0), 0x04034b50, 'Must begin with PKZip local file header signature');

  // Verify filenames are contained in buffer
  const contentStr = zipBuf.toString('utf8');
  assert.ok(contentStr.includes('photo_01.jpg'), 'Archive must contain photo_01.jpg');
  assert.ok(contentStr.includes('photo_02.jpg'), 'Archive must contain photo_02.jpg');
});

test('photoResolver - downloadPhotoJob produces completed single photo and multi-photo ZIP archives', async () => {
  const testJobId = 'test-photo-job-' + Date.now();
  const testPhotos = [
    { index: 1, url: 'https://example.com/slide1.jpg', label: 'Slide 1' },
    { index: 2, url: 'https://example.com/slide2.jpg', label: 'Slide 2' }
  ];

  // Mock global fetch to return deterministic buffers without outbound network requests
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: async () => Buffer.from(`Simulated JPEG Data for ${url}`)
    };
  };

  try {
    // 1. Test Multi-Photo ZIP Download
    const zipJobState = {
      id: `${testJobId}-zip`,
      title: 'Beautiful Travel Carousel',
      isCarousel: true,
      photos: testPhotos,
      status: 'starting',
      progress: 0,
      speed: ''
    };

    let historySaved = false;
    await downloadPhotoJob(zipJobState, 'zip', DOWNLOADS_DIR, () => {
      historySaved = true;
    });

    assert.strictEqual(zipJobState.status, 'completed', 'ZIP job must transition to completed');
    assert.strictEqual(zipJobState.progress, 100, 'ZIP job progress must reach 100%');
    assert.ok(zipJobState.filePath && fs.existsSync(zipJobState.filePath), 'ZIP output file must exist on disk');
    assert.ok(zipJobState.fileName.endsWith('_photos.zip'), 'ZIP filename must end with _photos.zip');
    assert.strictEqual(historySaved, true, 'History save callback must be triggered');

    // Clean up zip
    if (fs.existsSync(zipJobState.filePath)) {
      fs.unlinkSync(zipJobState.filePath);
    }

    // 2. Test Single Photo JPG Download
    const singleJobState = {
      id: `${testJobId}-jpg`,
      title: 'Solo Sunset Photo',
      isCarousel: false,
      photos: [testPhotos[0]],
      status: 'starting',
      progress: 0,
      speed: ''
    };

    await downloadPhotoJob(singleJobState, 'jpg', DOWNLOADS_DIR);
    assert.strictEqual(singleJobState.status, 'completed', 'JPG job must transition to completed');
    assert.strictEqual(singleJobState.progress, 100, 'JPG job progress must reach 100%');
    assert.ok(singleJobState.filePath && fs.existsSync(singleJobState.filePath), 'JPG output file must exist on disk');
    assert.ok(singleJobState.fileName.endsWith('.jpg'), 'JPG filename must end with .jpg');

    // Clean up jpg
    if (fs.existsSync(singleJobState.filePath)) {
      fs.unlinkSync(singleJobState.filePath);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test('photoResolver - resolvePhotoMetadata handles direct image links with presets', async () => {
  const result = await resolvePhotoMetadata('https://images.unsplash.com/photo-12345.jpg?auto=format');
  assert.strictEqual(result.isPhoto, true);
  assert.strictEqual(result.platform, 'Direct Image');
  assert.strictEqual(result.contentType, 'photo');
  assert.strictEqual(result.itemCount, 1);
  assert.ok(Array.isArray(result.presets) && result.presets.length > 0);
  assert.strictEqual(result.presets[0].format, 'jpg');
});
