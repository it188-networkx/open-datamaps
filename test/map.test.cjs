const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');

function fixture(t) {
  const dom = new JSDOM('<div id="map"></div>', {runScripts: 'outside-only'});
  t.after(() => dom.window.close());
  for (const path of ['node_modules/d3/d3.js', 'node_modules/topojson/build/topojson.js', 'dist/datamaps.all.js']) {
    dom.window.eval(fs.readFileSync(path, 'utf8'));
  }
  const map = new dom.window.Datamap({
    element: dom.window.document.getElementById('map'),
    width: 800,
    height: 400,
    fills: {defaultFill: '#eeeeee', alert: '#ff0000'},
    data: {CHN: {fillKey: 'alert', count: 3}}
  });
  return {map, document: dom.window.document};
}

test('built world map renders country geometry and monitoring data', t => {
  const {document} = fixture(t);
  assert.ok(document.querySelectorAll('.datamaps-subunit').length > 150);
  const china = document.querySelector('.CHN');
  assert.ok(china.getAttribute('d').startsWith('M'));
  assert.equal(JSON.parse(china.getAttribute('data-info')).count, 3);
  assert.equal(china.style.fill, '#ff0000');
});

test('choropleth updates retain existing fields and isolate other countries', t => {
  const {map, document} = fixture(t);
  map.updateChoropleth({CHN: {count: 5}, USA: {fillKey: 'alert', count: 1}});
  assert.deepEqual(JSON.parse(document.querySelector('.CHN').getAttribute('data-info')),
    {fillKey: 'alert', count: 5});
  assert.equal(JSON.parse(document.querySelector('.USA').getAttribute('data-info')).count, 1);
});

test('coordinate bubbles render and removing data clears stale nodes', async t => {
  const {map, document} = fixture(t);
  map.bubbles([{name: 'Shanghai', latitude: 31.2, longitude: 121.5, radius: 6, fillKey: 'alert'}]);
  const bubble = document.querySelector('.datamaps-bubble');
  assert.ok(bubble);
  assert.ok(Number.isFinite(Number(bubble.getAttribute('cx'))));
  assert.ok(Number.isFinite(Number(bubble.getAttribute('cy'))));
  map.bubbles([]);
  // Removal finishes after the library's D3 exit transition.
  const deadline = Date.now() + 2000;
  while (document.querySelector('.datamaps-bubble') && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.equal(document.querySelectorAll('.datamaps-bubble').length, 0);
});
