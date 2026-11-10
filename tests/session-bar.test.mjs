import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/session-bar.js', import.meta.url), 'utf8');
async function render(sessions, { embedded = false, logoutOK = true } = {}) {
  const elements = [], requests = [], destinations = [];
  const window = { location: { assign: url => destinations.push(url) } };
  window.self = window; window.top = embedded ? {} : window;
  const document = {
    createElement: tag => ({ tag, children: [], setAttribute() {}, append(...items) { this.children.push(...items); } }),
    body: { prepend: element => elements.push(element) },
  };
  await vm.runInNewContext(source, { window, document, fetch: async (url, options) => {
    requests.push({ url, options });
    return { ok: url === '/api/session-status' || logoutOK, json: async () => sessions };
  } });
  return { elements, requests, destinations };
}

test('public visitors and embedded games have no duplicate sign-out bar', async () => {
  assert.equal((await render({ learner: false, instructor: false })).elements.length, 0);
  const embedded = await render({ learner: true }, { embedded: true });
  assert.equal(embedded.elements.length, 0);
  assert.equal(embedded.requests.length, 0);
});
for (const role of ['learner', 'instructor']) {
  test(`${role} sign-out uses the matching session endpoint and destination`, async () => {
    const view = await render({ [role]: true });
    await view.elements[0].children[2].onclick();
    assert.equal(view.requests[1].url, role === 'learner' ? '/api/logout' : '/api/instruct/logout');
    assert.equal(view.requests[1].options.method, 'POST');
    assert.equal(view.destinations[0], role === 'learner' ? '/join' : '/instruct/login');
  });
}
test('failed sign-out keeps the page open and permits retry', async () => {
  const view = await render({ learner: true }, { logoutOK: false });
  await view.elements[0].children[2].onclick();
  assert.equal(view.destinations.length, 0);
  assert.equal(view.elements[0].children[2].disabled, false);
  assert.match(view.elements[0].children[1].textContent, /try again/);
});
test('standalone student game preserves a coexisting instructor session', async () => {
  const view = await render({ learner: true, instructor: true });
  await view.elements[0].children[2].onclick();
  assert.equal(view.requests[1].url, '/api/logout');
});
