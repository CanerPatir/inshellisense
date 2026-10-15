// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { ISTerm } from "../../isterm/pty.js";
import type { SuggestionBlob } from "../../runtime/model.js";
import { getConfig } from "../../utils/config.js";
import { Shell } from "../../utils/shell.js";
import { SuggestionManager } from "../../ui/suggestionManager.js";

const enter = { name: "return", sequence: "\r", shift: false, ctrl: false };
const typeKey = (key: string) => ({ name: key, sequence: key, shift: false, ctrl: false });
const down = { name: "down", sequence: "\u001b[B", shift: false, ctrl: false };
const folders: SuggestionBlob["suggestions"] = [
  { name: "src", allNames: ["src"], icon: "*", priority: 50, insertValue: "src/" },
  { name: "docs", allNames: ["docs"], icon: "*", priority: 50, insertValue: "docs/" },
];

const createManager = async (suggestionBlob: SuggestionBlob) => {
  const writes: string[] = [];
  let clearCalls = 0;
  const terminal = {
    cwd: process.cwd(),
    cols: 80,
    write: (data: string) => writes.push(data),
    clearCommand: () => {
      clearCalls += 1;
    },
    getCommandState: () => ({ commandText: "git check", cursorTerminated: true, hasOutput: false }),
    getCursorState: () => ({ cursorX: 0 }),
  } as unknown as ISTerm;
  const runtime = Promise.resolve({ getSuggestions: async () => suggestionBlob });
  const manager = new SuggestionManager(terminal, Shell.Zsh, runtime);
  await manager.exec();
  return { manager, writes, clearCalls: () => clearCalls };
};

const originalAccept = getConfig().bindings.acceptSuggestion;

beforeEach(() => {
  getConfig().bindings.acceptSuggestion = { key: "return" };
});

afterEach(() => {
  getConfig().bindings.acceptSuggestion = originalAccept;
});

test("enter accepting a suggestion keeps the active command so the next suggestions load", async () => {
  const { manager, writes, clearCalls } = await createManager({
    suggestions: [{ name: "checkout", allNames: ["checkout"], icon: "*", priority: 50 }],
    activeToken: { token: "check", tokenLength: 5, complete: false, isOption: false },
  });

  manager.update(typeKey("k"));
  expect(manager.update(enter)).toBe(true);
  expect(writes).toEqual(["out "]);
  expect(clearCalls()).toBe(0);
});

test("enter on an already complete suggestion reaches the shell and clears the command", async () => {
  const { manager, writes, clearCalls } = await createManager({
    suggestions: [{ name: "checkout", allNames: ["checkout"], icon: "*", priority: 50 }],
    activeToken: { token: "checkout", tokenLength: 8, complete: false, isOption: false },
  });

  manager.update(typeKey("t"));
  expect(manager.update(enter)).toBe(false);
  expect(writes).toEqual([]);
  expect(clearCalls()).toBe(1);
});

test("enter without visible suggestions clears the command", async () => {
  const { manager, clearCalls } = await createManager({ suggestions: [] });

  expect(manager.update(enter, false)).toBe(false);
  expect(clearCalls()).toBe(1);
});

test("enter right after accepting a folder runs the command instead of drilling into subfolders", async () => {
  const { manager, writes, clearCalls } = await createManager({
    suggestions: folders,
    activeToken: { token: "sr", tokenLength: 2, complete: false, isOption: false, isPath: true },
  });

  manager.update(typeKey("r"));
  expect(manager.update(enter)).toBe(true);
  expect(manager.update(enter)).toBe(false);
  expect(writes).toEqual(["\u007F\u007Fsrc/"]);
  expect(clearCalls()).toBe(1);
});

test("enter on an empty token runs the command", async () => {
  const { manager, writes } = await createManager({ suggestions: folders });

  manager.update(typeKey(" "));
  expect(manager.update(enter)).toBe(false);
  expect(writes).toEqual([]);
});

test("enter on a path ending with a slash runs the command", async () => {
  const { manager, writes } = await createManager({
    suggestions: folders,
    activeToken: { token: "src/", tokenLength: 4, complete: false, isOption: false, isPath: true },
  });

  manager.update(typeKey("/"));
  expect(manager.update(enter)).toBe(false);
  expect(writes).toEqual([]);
});

test("enter accepts a suggestion picked with the arrow keys", async () => {
  const { manager, writes } = await createManager({ suggestions: folders });

  manager.update(down);
  expect(manager.update(enter)).toBe(true);
  expect(writes).toEqual(["docs/"]);
});
