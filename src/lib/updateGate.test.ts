import { expect, test, vi } from 'vitest';
import { createUpdateGate } from './updateGate';

test('an update applies right away when nothing is being edited', () => {
  const gate = createUpdateGate();
  const apply = vi.fn();
  gate.setApply(apply);
  gate.updateReady();
  expect(apply).toHaveBeenCalledTimes(1);
});

test('an update waits while a thought is being written, then applies', () => {
  const gate = createUpdateGate();
  const apply = vi.fn();
  gate.setApply(apply);
  const done = gate.startEditing();
  gate.updateReady();
  expect(apply).not.toHaveBeenCalled();
  done();
  expect(apply).toHaveBeenCalledTimes(1);
});

test('two editors open at once: waits for both', () => {
  const gate = createUpdateGate();
  const apply = vi.fn();
  gate.setApply(apply);
  const a = gate.startEditing();
  const b = gate.startEditing();
  gate.updateReady();
  a();
  expect(apply).not.toHaveBeenCalled();
  b();
  expect(apply).toHaveBeenCalledTimes(1);
});

test('finishing the same edit twice does not unlock another editor', () => {
  const gate = createUpdateGate();
  const apply = vi.fn();
  gate.setApply(apply);
  const a = gate.startEditing();
  gate.startEditing();
  gate.updateReady();
  a();
  a();
  expect(apply).not.toHaveBeenCalled();
});

test('no update pending: finishing an edit does nothing', () => {
  const gate = createUpdateGate();
  const apply = vi.fn();
  gate.setApply(apply);
  gate.startEditing()();
  expect(apply).not.toHaveBeenCalled();
});

test('an update found before the service worker is wired applies once it is', () => {
  const gate = createUpdateGate();
  gate.updateReady();
  const apply = vi.fn();
  gate.setApply(apply);
  expect(apply).toHaveBeenCalledTimes(1);
});

test('applies only once even if signalled again', () => {
  const gate = createUpdateGate();
  const apply = vi.fn();
  gate.setApply(apply);
  gate.updateReady();
  gate.updateReady();
  expect(apply).toHaveBeenCalledTimes(1);
});
