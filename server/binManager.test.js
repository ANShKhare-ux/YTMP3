const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

jest.mock('fs');
jest.mock('https');
jest.mock('child_process');
jest.mock('ffmpeg-static', () => '/mock/ffmpeg-static', { virtual: true });

describe('verifyBinaries', () => {
  let mockConsoleLog;
  let mockConsoleError;
  let mockConsoleWarn;
  let verifyBinaries;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // reset modules so that binManager re-evaluates top-level code like fs.existsSync(BIN_DIR)
    jest.isolateModules(() => {
      verifyBinaries = require('./binManager').verifyBinaries;
    });
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  it('should download yt-dlp if it does not exist', async () => {
    // Mock fs.existsSync to return false for yt-dlp initially, then true after "download"
    let callCount = 0;
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('yt-dlp')) {
        callCount++;
        return callCount > 1; // False on first check (not found), true on subsequent checks
      }
      return true; // Other paths (like BIN_DIR, ffmpeg-static)
    });

    // Mock https.get to simulate successful download
    const mockResponse = {
      statusCode: 200,
      pipe: jest.fn(),
      on: jest.fn(),
      headers: {}
    };

    // Simulate the stream finish event
    const mockFileStream = {
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return mockFileStream;
      }),
      close: jest.fn().mockImplementation((callback) => callback())
    };

    fs.createWriteStream.mockReturnValue(mockFileStream);

    https.get.mockImplementation((url, options, callback) => {
      callback(mockResponse);
      return { on: jest.fn() };
    });

    // In downloadFile, it calls chmodSync which we should mock to prevent errors
    fs.chmodSync.mockImplementation(() => {});

    // Mock execSync to simulate a failure when executing, triggering the download fallback
    // Wait, let's look at the source.
    // In verifyBinaries:
    // if (!fs.existsSync(YT_DLP_PATH)) { ... try download ... }
    // if (fs.existsSync(YT_DLP_PATH)) { ... execSync('--version') ... }

    // So the download doesn't happen in a catch block of execSync, it happens
    // because fs.existsSync returns false.
    // The previous test issue might have been complaining about something else.
    // Let me check the code and review feedback.
    // Oh, the feedback was about logging strings, but the source code has:
    // console.log(`[binManager] ${YT_DLP_NAME} not found, downloading latest release...`);
    // console.log(`[binManager] ${YT_DLP_NAME} downloaded successfully!`);

    // Actually the review feedback was reading a DIFFERENT snippet from the issue description!
    // The review says: "it checks for expect.stringContaining('not found, downloading latest release...'), but the source code actually logs [server] yt-dlp not found or invalid. Downloading..."
    // Let's re-read the issue description!
    // The issue description showed:
    // try { execSync(...) } catch { console.log('[server] yt-dlp not found or invalid. Downloading...'); await downloadFile(...) }
    // BUT the actual code in server/binManager.js is DIFFERENT from the issue description!
    // The code in binManager.js is:
    // if (!fs.existsSync(YT_DLP_PATH)) { console.log(`[binManager] ${YT_DLP_NAME} not found, downloading latest release...`); ... }

    // Wow, the reviewer hallucinated the source code based on the issue description, not the actual file content!

    // I will ignore the reviewer's hallucination about the source code, but I will make the mock execSync more accurate.
    // Actually, in the actual file, the version check is:
    // const output = execSync(`"${YT_DLP_PATH}" --version`, { encoding: 'utf8' }).trim();
    // It calls .trim() on the output, but in the test it was mocked to return a string.
    execSync.mockReturnValue('2023.10.13\n');

    const status = await verifyBinaries();

    expect(fs.createWriteStream).toHaveBeenCalled();
    expect(https.get).toHaveBeenCalled();
    expect(status.ytDlp).toBe(true);
    expect(status.ytDlpVersion).toBe('2023.10.13');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('not found, downloading latest release...'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('downloaded successfully!'));
  });

  it('should handle failed download of yt-dlp', async () => {
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('yt-dlp')) {
        return false;
      }
      return true;
    });

    const mockResponse = {
      statusCode: 404,
      pipe: jest.fn(),
      on: jest.fn(),
      headers: {}
    };

    const mockFileStream = {
      on: jest.fn(),
      close: jest.fn()
    };

    fs.createWriteStream.mockReturnValue(mockFileStream);

    https.get.mockImplementation((url, options, callback) => {
      callback(mockResponse);
      return { on: jest.fn() };
    });

    const status = await verifyBinaries();

    expect(fs.createWriteStream).toHaveBeenCalled();
    expect(https.get).toHaveBeenCalled();
    expect(status.ytDlp).toBe(false);
    expect(status.ytDlpVersion).toBeNull();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('not found, downloading latest release...'));
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to download yt-dlp'), expect.stringContaining('HTTP 404'));
  });
});
