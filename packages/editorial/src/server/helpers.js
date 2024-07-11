/* eslint-disable no-await-in-loop */

import fs from 'fs-extra';
import { mainStory, chalk } from 'storyboard';
import { exec, execCancel } from './exec';

const COMPONENT_HELP_TAG = '_EDITORIAL_';

// =======================================
// Helpers
// =======================================
const runScript = async (
  script0,
  { res, respondIfSuccess, user, cancelable } = {}
) => {
  try {
    // If script doesn't exist, ignore
    const raw = await fs.readFile('package.json');
    const pkg = JSON.parse(raw);
    const script = `editorial:${script0}`;
    if (!pkg || !pkg.scripts || !pkg.scripts[script]) {
      mainStory.info('editorial', `Skipped hook ${chalk.cyan(script)}`);
      return 0;
    }

    // If it does, run it!
    if (user) process.env.EDITORIAL_USER = user;
    const { code, stderr } = await exec(
      'npm',
      ['run', script, '--scripts-prepend-node-path'],
      {
        story: mainStory,
        storySrc: script0,
        ignoreErrorCode: true,
        id: cancelable ? script0 : undefined,
      }
    );
    if (code !== 0) {
      if (res) res.json({ result: 'nok', error: stderr });
      return -1;
    }
    if (respondIfSuccess) res.json({ result: 'ok' });
    return 0;
  } catch (err) {
    mainStory.error('editorial', 'Error running script', { attach: err });
    if (res) res.json({ result: 'nok', error: err.message });
    return -1;
  }
};

const cancelScript = (script) => execCancel({ id: script, story: mainStory });

const loadComponentHelp = async (componentIndex) => {
  if (!componentIndex) return {};
  const out = {};
  const names = Object.keys(componentIndex);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const componentPath = componentIndex[name];
    const help = [];
    mainStory.debug(
      'editorial',
      `Parsing component help from ${componentPath}...`
    );
    const lines = (await fs.readFile(componentPath, 'utf8')).split('\n');
    const offset = COMPONENT_HELP_TAG.length;
    for (let k = 0; k < lines.length; k++) {
      const line = lines[k];
      const pos = line.indexOf(COMPONENT_HELP_TAG);
      if (pos < 0) continue;
      help.push(line.slice(pos + offset).trim());
    }
    out[name] = help;
  }
  return out;
};

// =======================================
// Public
// =======================================
export { runScript, cancelScript, loadComponentHelp };
