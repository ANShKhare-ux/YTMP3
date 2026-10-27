const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const EventEmitter = require('events');

// Mock all external dependencies before requiring the module
jest.mock('fs');
jest.mock('child_process');
jest.mock('https');
jest.mock('ffmpeg-static', () => '/mock/path/to/ffmpeg-static', { virtual: true });

describe('binManager', () => {
  let binManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Re-mock dependencies for each test
    jest.mock('fs');
    jest.mock('child_process');
    jest.mock('https');
    jest.mock('ffmpeg-static', () => '/mock/path/to/ffmpeg-static', { virtual: true });

    const fsMock = require('fs');
    const childProcessMock = require('child_process');

    // Setup basic mock implementations
    fsMock.existsSync.mockReturnValue(true);
    fsMock.mkdirSync = jest.fn();
    fsMock.chmodSync = jest.fn();
    fsMock.copyFileSync = jest.fn();
    fsMock.unlink = jest.fn((p, cb) => cb && cb(null));

    childProcessMock.execSync.mockImplementation((cmd) => {
      if (cmd.includes('--version') || cmd.includes('-version')) {
        return '1.0.0\n';
      }
      return '';
    });

    // Require module after mocks are setup
    binManager = require('./binManager');
  });

  describe('Initialization', () => {
    it('should create bin directory if it does not exist', () => {
      jest.resetModules();
      const fsMock = require('fs');
      fsMock.existsSync.mockReturnValue(false);
      fsMock.mkdirSync = jest.fn();

      const localBinManager = require('./binManager');
      expect(fsMock.existsSync).toHaveBeenCalledWith(localBinManager.BIN_DIR);
      expect(fsMock.mkdirSync).toHaveBeenCalledWith(localBinManager.BIN_DIR, { recursive: true });
    });
  });

  describe('Getter functions', () => {
    it('should return correct paths', () => {
      const isWin = process.platform === 'win32';
      const expectedYtDlpName = isWin ? 'yt-dlp.exe' : 'yt-dlp';

      expect(binManager.getBinDir()).toBe(binManager.BIN_DIR);
      expect(binManager.getYtDlpPath()).toBe(path.join(binManager.BIN_DIR, expectedYtDlpName));
    });

    it('should return local ffmpeg location if it exists', () => {
      const fsMock = require('fs');
      fsMock.existsSync.mockImplementation((p) => {
        if (p.includes('ffmpeg') && !p.includes('ffmpeg-static')) return true; // Local ffmpeg
        return false;
      });
      expect(binManager.getFfmpegLocation()).toBe(binManager.BIN_DIR);
    });

    it('should fallback to ffmpeg-static path if local does not exist', () => {
      const fsMock = require('fs');
      fsMock.existsSync.mockImplementation((p) => {
        if (p.includes('ffmpeg-static')) return true;
        return false;
      });
      // We must reset modules to allow binManager to capture the mocked requires
      jest.resetModules();
      const newFsMock = require('fs');
      newFsMock.existsSync.mockImplementation((p) => {
        if (p.includes('ffmpeg-static')) return true;
        return false;
      });
      const localBinManager = require('./binManager');
      expect(localBinManager.getFfmpegLocation()).toBe('/mock/path/to/ffmpeg-static');
    });

    it('should return null if no ffmpeg path exists', () => {
      const fsMock = require('fs');
      fsMock.existsSync.mockReturnValue(false);
      expect(binManager.getFfmpegLocation()).toBeNull();
    });
  });

  describe('updateYtDlp', () => {
    it('should fail if yt-dlp is not installed', async () => {
      const fsMock = require('fs');
      fsMock.existsSync.mockReturnValue(false);
      const result = await binManager.updateYtDlp();
      expect(result.success).toBe(false);
      expect(result.message).toBe('yt-dlp binary not installed');
    });

    it('should update and return new version if installed', async () => {
      const fsMock = require('fs');
      const cpMock = require('child_process');
      fsMock.existsSync.mockReturnValue(true);
      cpMock.execSync
        .mockReturnValueOnce('Updating to 2024.10.22...') // First call: -U
        .mockReturnValueOnce('2024.10.22\n');           // Second call: --version

      const result = await binManager.updateYtDlp();
      expect(result.success).toBe(true);
      expect(result.version).toBe('2024.10.22');
      expect(result.output).toBe('Updating to 2024.10.22...');
      expect(cpMock.execSync).toHaveBeenCalledTimes(2);
    });

    it('should handle update execution errors', async () => {
      const fsMock = require('fs');
      const cpMock = require('child_process');
      fsMock.existsSync.mockReturnValue(true);
      cpMock.execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = await binManager.updateYtDlp();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Command failed');
    });
  });

  describe('verifyBinaries', () => {
    describe('yt-dlp verification', () => {
      it('should verify yt-dlp if it already exists', async () => {
        const fsMock = require('fs');
        const cpMock = require('child_process');
        fsMock.existsSync.mockReturnValue(true);
        cpMock.execSync.mockReturnValue('2024.01.01\n');

        const status = await binManager.verifyBinaries();

        expect(status.ytDlp).toBe(true);
        expect(status.ytDlpVersion).toBe('2024.01.01');

        if (process.platform !== 'win32') {
           expect(fsMock.chmodSync).toHaveBeenCalled();
        }
        expect(cpMock.execSync).toHaveBeenCalledWith(expect.stringContaining('--version'), expect.any(Object));
      });

      it('should handle yt-dlp execution error', async () => {
        const fsMock = require('fs');
        const cpMock = require('child_process');
        fsMock.existsSync.mockReturnValue(true);
        cpMock.execSync.mockImplementation((cmd) => {
          if (cmd.includes('yt-dlp')) throw new Error('Exec error');
          return '1.0.0';
        });

        const status = await binManager.verifyBinaries();

        expect(status.ytDlp).toBe(false);
        expect(status.ytDlpVersion).toBeNull();
      });

      it('should download yt-dlp if it does not exist', async () => {
        const fsMock = require('fs');
        const httpsMock = require('https');
        const cpMock = require('child_process');

        let existsCount = 0;
        fsMock.existsSync.mockImplementation((p) => {
          if (p.includes('yt-dlp')) {
             if (existsCount === 0) {
               existsCount++;
               return false; // Initial check fails
             }
             return true; // Subsequent checks pass (after download)
          }
          return true; // ffmpeg checks
        });

        const mockStream = new EventEmitter();
        mockStream.close = jest.fn((cb) => cb());
        fsMock.createWriteStream.mockReturnValue(mockStream);

        const mockRequest = new EventEmitter();
        mockRequest.pipe = jest.fn();
        mockRequest.statusCode = 200;

        httpsMock.get.mockImplementation((...args) => {
          const cb = args.pop();
          const options = typeof args[1] === 'object' ? args[1] : {};
          const url = args[0];
          cb(mockRequest);
          setTimeout(() => {
            mockStream.emit('finish');
          }, 0);
          return new EventEmitter();
        });

        const status = await binManager.verifyBinaries();

        expect(httpsMock.get).toHaveBeenCalled();
        expect(fsMock.createWriteStream).toHaveBeenCalled();
        expect(cpMock.execSync).toHaveBeenCalled();
      });

      it('should handle download HTTP error', async () => {
        const fsMock = require('fs');
        const httpsMock = require('https');

        fsMock.existsSync.mockImplementation((p) => {
          if (p.includes('yt-dlp')) return false;
          return true;
        });

        const mockStream = new EventEmitter();
        fsMock.createWriteStream.mockReturnValue(mockStream);

        const mockRequest = new EventEmitter();
        mockRequest.statusCode = 404;

        httpsMock.get.mockImplementation((...args) => {
          const cb = args.pop();
          const options = typeof args[1] === 'object' ? args[1] : {};
          const url = args[0];
          cb(mockRequest);
          return new EventEmitter();
        });

        const status = await binManager.verifyBinaries();

        expect(status.ytDlp).toBe(false);
      });

      it('should follow redirects', async () => {
        const fsMock = require('fs');
        const httpsMock = require('https');

        let existsCount = 0;
        fsMock.existsSync.mockImplementation((p) => {
          if (p.includes('yt-dlp')) {
             if (existsCount === 0) {
               existsCount++;
               return false;
             }
             return true;
          }
          return true;
        });

        const mockStream = new EventEmitter();
        mockStream.close = jest.fn((cb) => cb());
        fsMock.createWriteStream.mockReturnValue(mockStream);

        let callCount = 0;
        httpsMock.get.mockImplementation((...args) => {
          const cb = args.pop();
          const options = typeof args[1] === 'object' ? args[1] : {};
          const url = args[0];
          callCount++;
          if (callCount === 1) {
            const redirectReq = new EventEmitter();
            redirectReq.statusCode = 302;
            redirectReq.headers = { location: 'https://final-destination.com/yt-dlp' };
            cb(redirectReq);
          } else {
            const finalReq = new EventEmitter();
            finalReq.pipe = jest.fn();
            finalReq.statusCode = 200;
            cb(finalReq);
            setTimeout(() => {
              mockStream.emit('finish');
            }, 0);
          }
          return new EventEmitter();
        });

        const status = await binManager.verifyBinaries();

        expect(httpsMock.get).toHaveBeenCalledTimes(2);
      });
    });

    describe('ffmpeg verification', () => {
      it('should copy ffmpeg-static to local bin if not present locally', async () => {
        jest.resetModules();
        const fsMock = require('fs');
        const cpMock = require('child_process');

        fsMock.existsSync.mockImplementation((p) => {
          if (p.includes('yt-dlp')) return true;
          if (p.includes('ffmpeg') && !p.includes('ffmpeg-static')) return false; // Not in local bin
          return true; // Exists in ffmpeg-static
        });

        cpMock.execSync.mockReturnValue('5.0.0\n');

        const localBinManager = require('./binManager');
        const status = await localBinManager.verifyBinaries();

        expect(fsMock.copyFileSync).toHaveBeenCalled();
        expect(status.ffmpeg).toBe(true);
      });

      it('should handle ffmpeg-static copy error', async () => {
        jest.resetModules();
        const fsMock = require('fs');

        fsMock.existsSync.mockImplementation((p) => {
          if (p.includes('yt-dlp')) return true;
          if (p.includes('ffmpeg') && !p.includes('ffmpeg-static')) return false;
          return true;
        });

        fsMock.copyFileSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const localBinManager = require('./binManager');
        const status = await localBinManager.verifyBinaries();

        // Will try to fallback to system ffmpeg
        expect(fsMock.copyFileSync).toHaveBeenCalled();
      });

      it('should fallback to system ffmpeg if local is not available', async () => {
        const fsMock = require('fs');
        const cpMock = require('child_process');

        fsMock.existsSync.mockImplementation((p) => {
          if (p.includes('yt-dlp')) return true;
          return false; // No local or static ffmpeg
        });

        cpMock.execSync.mockImplementation((cmd) => {
          if (cmd === 'ffmpeg -version') return 'system-ffmpeg-4.4\n';
          return '1.0.0'; // yt-dlp version
        });

        const status = await binManager.verifyBinaries();

        expect(status.ffmpeg).toBe(true);
        expect(status.ffmpegVersion).toBe('system-ffmpeg-4.4');
      });

      it('should return false if no ffmpeg is found anywhere', async () => {
        const fsMock = require('fs');
        const cpMock = require('child_process');

        fsMock.existsSync.mockImplementation((p) => {
          if (p.includes('yt-dlp')) return true;
          return false;
        });

        cpMock.execSync.mockImplementation((cmd) => {
          if (cmd === 'ffmpeg -version') throw new Error('Not found');
          return '1.0.0';
        });

        const status = await binManager.verifyBinaries();

        expect(status.ffmpeg).toBe(false);
        expect(status.ffmpegVersion).toBeNull();
      });
    });
  });
});
