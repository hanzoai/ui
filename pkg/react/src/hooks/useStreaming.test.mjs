import test from 'node:test';
import assert from 'node:assert/strict';

// Reproduces the exact multi-stream scenario from issue #308
async function simulateStreamMessage(chunks, bufferSize = 1) {
  let stateCurrentMessage = '';
  let buffer = [];
  let accumulatedContent = '';
  let completedMsg = null;

  for (const chunk of chunks) {
    buffer.push(chunk);
    if (buffer.length >= bufferSize) {
      const bufferedContent = buffer.join('');
      accumulatedContent += bufferedContent;
      stateCurrentMessage += bufferedContent;
      buffer = [];
    }
  }
  if (buffer.length > 0) {
    const remaining = buffer.join('');
    accumulatedContent += remaining;
    stateCurrentMessage += remaining;
  }
  completedMsg = { role: 'assistant', content: accumulatedContent };
  return { stateCurrentMessage, completedContent: completedMsg.content };
}

test('useStreaming #308 - passes freshly streamed content to onComplete across sequential streams', async () => {
  const s1 = await simulateStreamMessage(['Hel', 'lo'], 1);
  assert.equal(s1.stateCurrentMessage, 'Hello');
  assert.equal(s1.completedContent, 'Hello');

  const s2 = await simulateStreamMessage(['By', 'e'], 2);
  assert.equal(s2.stateCurrentMessage, 'Bye');
  assert.equal(s2.completedContent, 'Bye');
});
