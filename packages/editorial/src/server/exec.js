// @flow

/* eslint-disable no-underscore-dangle */

import execa from 'execa';
import split from 'split';
import treeKill from 'tree-kill';

// ====================================
// State
// ====================================
const _children = {};

// ====================================
// Main
// ====================================
type ExecOptions = {|
  id?: string, // in case we want to be able to cancel execution
  story: Object,
  storySrc?: string,
  createChildStory?: boolean,
  logLevel?: *,
  errorLogLevel?: string,
  ignoreErrorCode?: boolean,
  cwd?: string,
  onLog?: Function,
|};

type ExecResult = {
  code: number,
  stdout: string,
  stderr: string,
};

const exec = async (
  cmd: string,
  cmdArgs: Array<*>,
  {
    id,
    story,
    storySrc,
    createChildStory = true,
    logLevel = 'info',
    errorLogLevel = 'error',
    ignoreErrorCode = false,
    cwd,
    onLog,
  }: ExecOptions
): Promise<ExecResult> => {
  let title = `Run cmd ${story.chalk.green.bold(
    [cmd, ...(cmdArgs || [])].join(' ')
  )}`;
  if (cwd) title += ` at ${story.chalk.green(cwd)}`;
  const ownStory = createChildStory
    ? story.child({ title, src: storySrc || story.src, level: logLevel })
    : story;
  try {
    return await _exec(cmd, cmdArgs, {
      id,
      story: ownStory,
      logLevel,
      errorLogLevel,
      ignoreErrorCode,
      cwd,
      onLog,
    });
  } finally {
    if (createChildStory) ownStory.close();
  }
};

const _exec = async (
  cmd,
  cmdArgs,
  { id, story, logLevel, errorLogLevel, ignoreErrorCode, cwd, onLog }
) => {
  try {
    const src = story.src || cmd.split(' ')[0].slice(0, 10);
    const child = execa(cmd, cmdArgs, {
      cwd: cwd || '.',
      // Workaround for Node.js bug: https://github.com/nodejs/node/issues/10836
      // See also: https://github.com/yarnpkg/yarn/issues/2462
      stdio:
        process.platform === 'win32' ? ['ignore', 'pipe', 'pipe'] : undefined,
    });
    child.stdout.pipe(split()).on('data', (line) => {
      story[logLevel](src, line);
      if (onLog) onLog(line);
    });
    child.stderr.pipe(split()).on('data', (line) => {
      if (line) story[errorLogLevel](src, line);
    });
    if (id) _children[id] = child;
    const { stdout, stderr } = await child;
    if (id) _children[id] = null;
    return { code: 0, stdout, stderr };
  } catch (err) {
    story.error(story.src, err.message);
    const { exitCode: code, stdout, stderr } = err;
    if (code && ignoreErrorCode) return { code, stdout, stderr };
    throw err;
  }
};

const execCancel = ({ id, story }) => {
  story.info(story.src, `Canceling child ${id}`);
  const child = _children[id];
  if (!child) {
    story.warn('common', `Child ${id} could not be found`);
    return;
  }
  try {
    treeKill(child.pid);
  } catch (err) {
    story.error(`Error canceling`, { attach: err });
  }
};

// =========================================
// Public
// =========================================
export { exec, execCancel };
