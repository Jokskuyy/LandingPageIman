import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('dashboard thumbnail is landscape 16:9', () => {
  const png = fs.readFileSync(path.resolve(__dirname, '..', 'imgs', 'dashboard-upnvj.png'));

  // PNG signature check
  assert.ok(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'not a PNG');

  // IHDR chunk starts at offset 8 (4-byte length + 4-byte type), data at 16
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const bitDepth = png[24];

  assert.ok(bitDepth > 0, 'invalid bit depth');
  assert.ok(width > height, `expected landscape, got ${width}x${height}`);

  const ratio = width / height;
  const target = 16 / 9;
  assert.ok(Math.abs(ratio - target) < 0.01, `aspect ratio ${ratio.toFixed(4)} not within 0.01 of 16/9 (${target.toFixed(4)})`);
});
