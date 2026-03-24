import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  requireString,
  requireNumber,
  requireArray,
  optString,
  optNumber,
  optBoolean,
  optArray,
  requireStringArray,
  optStringArray,
  requireEmailOrPhone,
} from '../src/validation.js';

describe('requireString', () => {
  it('returns string value', () => {
    assert.equal(requireString({ name: 'hello' }, 'name'), 'hello');
  });

  it('throws on missing key', () => {
    assert.throws(() => requireString({}, 'name'), /Missing or invalid required parameter: name/);
  });

  it('throws on empty string', () => {
    assert.throws(() => requireString({ name: '  ' }, 'name'), /Missing or invalid/);
  });

  it('throws on non-string', () => {
    assert.throws(() => requireString({ name: 123 }, 'name'), /Missing or invalid/);
  });

  it('throws on null', () => {
    assert.throws(() => requireString({ name: null }, 'name'), /Missing or invalid/);
  });
});

describe('requireNumber', () => {
  it('returns number value', () => {
    assert.equal(requireNumber({ count: 42 }, 'count'), 42);
  });

  it('returns zero', () => {
    assert.equal(requireNumber({ count: 0 }, 'count'), 0);
  });

  it('throws on NaN', () => {
    assert.throws(() => requireNumber({ count: NaN }, 'count'), /Missing or invalid/);
  });

  it('throws on string', () => {
    assert.throws(() => requireNumber({ count: '42' }, 'count'), /Missing or invalid/);
  });

  it('throws on missing', () => {
    assert.throws(() => requireNumber({}, 'count'), /Missing or invalid/);
  });
});

describe('requireArray', () => {
  it('returns array', () => {
    const arr = [1, 2, 3];
    assert.deepEqual(requireArray({ items: arr }, 'items'), arr);
  });

  it('returns empty array', () => {
    assert.deepEqual(requireArray({ items: [] }, 'items'), []);
  });

  it('throws on non-array', () => {
    assert.throws(() => requireArray({ items: 'not array' }, 'items'), /expected array/);
  });
});

describe('optString', () => {
  it('returns string when present', () => {
    assert.equal(optString({ name: 'hello' }, 'name'), 'hello');
  });

  it('returns undefined when missing', () => {
    assert.equal(optString({}, 'name'), undefined);
  });

  it('returns undefined for null', () => {
    assert.equal(optString({ name: null }, 'name'), undefined);
  });

  it('returns undefined for non-string', () => {
    assert.equal(optString({ name: 123 }, 'name'), undefined);
  });
});

describe('optNumber', () => {
  it('returns number when present', () => {
    assert.equal(optNumber({ count: 5 }, 'count'), 5);
  });

  it('returns undefined when missing', () => {
    assert.equal(optNumber({}, 'count'), undefined);
  });

  it('returns undefined for non-number', () => {
    assert.equal(optNumber({ count: '5' }, 'count'), undefined);
  });
});

describe('optBoolean', () => {
  it('returns boolean when present', () => {
    assert.equal(optBoolean({ flag: true }, 'flag'), true);
    assert.equal(optBoolean({ flag: false }, 'flag'), false);
  });

  it('returns undefined when missing', () => {
    assert.equal(optBoolean({}, 'flag'), undefined);
  });

  it('returns undefined for non-boolean', () => {
    assert.equal(optBoolean({ flag: 'true' }, 'flag'), undefined);
  });
});

describe('optArray', () => {
  it('returns array when present', () => {
    assert.deepEqual(optArray({ items: [1, 2] }, 'items'), [1, 2]);
  });

  it('returns undefined when missing', () => {
    assert.equal(optArray({}, 'items'), undefined);
  });

  it('returns undefined for non-array', () => {
    assert.equal(optArray({ items: 'nope' }, 'items'), undefined);
  });
});

describe('requireStringArray', () => {
  it('returns string array', () => {
    assert.deepEqual(requireStringArray({ tags: ['a', 'b'] }, 'tags'), ['a', 'b']);
  });

  it('throws on mixed types', () => {
    assert.throws(() => requireStringArray({ tags: ['a', 1] }, 'tags'), /must be an array of strings/);
  });

  it('throws on missing', () => {
    assert.throws(() => requireStringArray({}, 'tags'), /expected array/);
  });
});

describe('optStringArray', () => {
  it('returns string array when valid', () => {
    assert.deepEqual(optStringArray({ tags: ['a', 'b'] }, 'tags'), ['a', 'b']);
  });

  it('returns undefined when missing', () => {
    assert.equal(optStringArray({}, 'tags'), undefined);
  });

  it('returns undefined for mixed types', () => {
    assert.equal(optStringArray({ tags: ['a', 1] }, 'tags'), undefined);
  });
});

describe('requireEmailOrPhone', () => {
  it('returns email when only email provided', () => {
    const result = requireEmailOrPhone({ email: 'user@example.com' });
    assert.equal(result.email, 'user@example.com');
    assert.equal(result.phoneNumbers, undefined);
  });

  it('returns phoneNumbers when only phone provided', () => {
    const result = requireEmailOrPhone({ phoneNumbers: ['+15551234567'] });
    assert.equal(result.email, undefined);
    assert.deepEqual(result.phoneNumbers, ['+15551234567']);
  });

  it('returns both when both provided', () => {
    const result = requireEmailOrPhone({ email: 'user@example.com', phoneNumbers: ['+15551234567'] });
    assert.equal(result.email, 'user@example.com');
    assert.deepEqual(result.phoneNumbers, ['+15551234567']);
  });

  it('throws when neither provided', () => {
    assert.throws(() => requireEmailOrPhone({}), /At least one of email or phoneNumbers must be provided/);
  });

  it('throws when phoneNumbers is empty array and no email', () => {
    assert.throws(() => requireEmailOrPhone({ phoneNumbers: [] }), /At least one of email or phoneNumbers must be provided/);
  });
});
