// Mock timers globally before requiring anything
jest.useFakeTimers();

const fs = require('fs');

jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn()
  }),
  execFile: jest.fn()
}));

jest.mock('../binManager.js', () => ({
  getYtDlpPath: jest.fn(),
  getFfmpegPath: jest.fn(),
  getFfmpegLocation: jest.fn(),
  getBinDir: jest.fn(),
  getCookiePath: jest.fn()
}));

const actualFsExistsSync = fs.existsSync;
const actualFsReadFileSync = fs.readFileSync;

describe('getHistory', () => {

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should list completed jobs, sorted by newest first, and exclude process objects', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockJobs = [
      {
        id: 'id1',
        status: 'completed',
        createdAt: 1000,
        filePath: '/path/to/available.mp3',
        process: { mockProcessData: true }
      },
      {
        id: 'id2',
        status: 'completed',
        createdAt: 2000,
        filePath: '/path/to/missing.mp3',
        process: { mockProcessData: true }
      },
      {
        id: 'id3',
        status: 'downloading',
        createdAt: 3000,
        process: { mockProcessData: true }
      },
      {
        id: 'id4',
        status: 'failed',
        createdAt: 4000,
        process: { mockProcessData: true }
      }
    ];

    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
      if (!p) return false;
      if (typeof p === 'string' && p.endsWith('history.json')) return true;
      if (p === '/path/to/available.mp3') return true;
      if (p === '/path/to/missing.mp3') return false;
      return actualFsExistsSync(p);
    });

    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((p, enc) => {
      if (typeof p === 'string' && p.endsWith('history.json')) return JSON.stringify(mockJobs);
      return actualFsReadFileSync(p, enc);
    });

    const converter = require('../converter.js');

    const history = converter.getHistory();

    const h1 = history.find(j => j.id === 'id1');
    const h2 = history.find(j => j.id === 'id2');
    const h3 = history.find(j => j.id === 'id3');
    const h4 = history.find(j => j.id === 'id4');

    expect(h3).toBeUndefined();
    expect(h4).toBeUndefined();

    expect(h1).toBeDefined();
    expect(h1.isAvailable).toBe(true);
    expect(h1).not.toHaveProperty('process');

    expect(h2).toBeDefined();
    expect(h2.isAvailable).toBe(false);
    expect(h2).not.toHaveProperty('process');

    const i1 = history.findIndex(j => j.id === 'id1');
    const i2 = history.findIndex(j => j.id === 'id2');
    expect(i2).toBeLessThan(i1);

    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrSpy.mockRestore();
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
  });

  it('should return an empty array if there are no completed jobs', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.resetModules();

    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
      if (!p) return false;
      if (typeof p === 'string' && p.endsWith('history.json')) return true;
      return actualFsExistsSync(p);
    });

    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((p, enc) => {
      if (typeof p === 'string' && p.endsWith('history.json')) return JSON.stringify([
         { id: 'id1', status: 'downloading' }
      ]);
      return actualFsReadFileSync(p, enc);
    });

    const converter = require('../converter.js');

    const history = converter.getHistory();
    expect(history).toEqual([]);

    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrSpy.mockRestore();
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
  });
});
