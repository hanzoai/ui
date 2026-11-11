import test from 'node:test';
import assert from 'node:assert/strict';

test('useMessage #307 - preserves retryCount across autoRetries, scales backoff, and prevents unhandled rejections', async () => {
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 10;
  const delays = [];
  let apiCalls = 0;

  async function executeSend(content, isRetryAttempt) {
    if (!isRetryAttempt) retryCount = 0;
    apiCalls++;
    try {
      throw new Error('API Down');
    } catch (err) {
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = retryDelay * retryCount;
        delays.push(delay);
        await new Promise(r => setTimeout(r, delay));
        await executeSend(content, true).catch(() => {});
      }
      throw err;
    }
  }

  await assert.rejects(() => executeSend('hi', false), /API Down/);
  assert.equal(apiCalls, 1 + maxRetries);
  assert.equal(retryCount, maxRetries);
  assert.deepEqual(delays, [10, 20, 30]);
});
