// Start fake timers before requiring converter.js to capture its setInterval
jest.useFakeTimers();

const { spawn, execFile } = require('child_process');
const { getJob, startConversion } = require('./converter');

// Mock child_process to prevent actual spawning of yt-dlp or ffmpeg
jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn()
  })),
  execFile: jest.fn()
}));

afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('getJob function', () => {
  it('should return null for an unknown job ID', () => {
    const job = getJob('non-existent-id');
    expect(job).toBeNull();
  });

  it('should return the job state without the process object', () => {
    const jobId = 'test-job-123';
    const testUrl = 'https://youtube.com/watch?v=12345';

    // Create a job
    startConversion({ url: testUrl, jobId });

    // Retrieve the job
    const job = getJob(jobId);

    // Assertions
    expect(job).not.toBeNull();
    expect(job.id).toBe(jobId);
    expect(job.url).toBe(testUrl);
    expect(job.status).toBe('starting');

    // The main assertion for the sanitization requirement
    expect(job).not.toHaveProperty('process');
    expect(job.process).toBeUndefined();
  });
});
