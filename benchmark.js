const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { performance } = require('perf_hooks');

const TEST_DIR = path.join(__dirname, 'test_downloads');

async function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  } else {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
  for (let i = 0; i < 5000; i++) {
    fs.writeFileSync(path.join(TEST_DIR, `file_${i}.txt`), 'test');
  }
}

function measureLag(fn, done) {
  let maxLag = 0;
  let interval = setInterval(() => {
    const start = performance.now();
    setTimeout(() => {
      const lag = performance.now() - start;
      if (lag > maxLag) maxLag = lag;
    }, 0);
  }, 1);

  setTimeout(async () => {
    const start = performance.now();
    await fn();
    const duration = performance.now() - start;
    clearInterval(interval);
    setTimeout(() => done(duration, maxLag), 50);
  }, 100);
}

function syncCleanup() {
  const now = Date.now();
  const maxAge = -1; // Force delete
  if (fs.existsSync(TEST_DIR)) {
    const files = fs.readdirSync(TEST_DIR);
    for (const file of files) {
      const fullPath = path.join(TEST_DIR, file);
      try {
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(fullPath);
        }
      } catch {}
    }
  }
}

async function asyncCleanup() {
  const now = Date.now();
  const maxAge = -1; // Force delete
  try {
    const exists = await fsp.access(TEST_DIR).then(() => true).catch(() => false);
    if (exists) {
      const files = await fsp.readdir(TEST_DIR);
      for (const file of files) {
        const fullPath = path.join(TEST_DIR, file);
        try {
          const stats = await fsp.stat(fullPath);
          if (now - stats.mtimeMs > maxAge) {
            await fsp.unlink(fullPath);
          }
        } catch {}
      }
    }
  } catch {}
}

async function run() {
  await setup();
  console.log('Running sync cleanup...');
  await new Promise(resolve => {
    measureLag(() => syncCleanup(), (duration, lag) => {
      console.log(`Sync Cleanup - Duration: ${duration.toFixed(2)}ms, Max Event Loop Lag: ${lag.toFixed(2)}ms`);
      resolve();
    });
  });

  await setup();
  console.log('Running async cleanup...');
  await new Promise(resolve => {
    measureLag(async () => await asyncCleanup(), (duration, lag) => {
      console.log(`Async Cleanup - Duration: ${duration.toFixed(2)}ms, Max Event Loop Lag: ${lag.toFixed(2)}ms`);
      resolve();
    });
  });

  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

run();
