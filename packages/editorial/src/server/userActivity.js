import { mainStory } from 'storyboard';
import { runScript, cancelScript } from './helpers';

// User activity detector -- when there's activity, the
// editorial:onEditStart is triggered (e.g. launch a
// dev server). While user is active,
// the external process is respected.

const DELAY_UNTIL_SIGKILL = 10 * 60 * 1e3; // [ms]
const SRC = 'activity';

// =======================================
// State
// =======================================
let _isActive = false;
let _timer = null;

// =======================================
// Main
// =======================================
const onUserActivity = () => {
  // Implement retriggerable monostable
  if (_timer != null) {
    clearTimeout(_timer);
    _timer = null;
  }
  _timer = setTimeout(kill, DELAY_UNTIL_SIGKILL);

  // On initial trigger, call editorial:onEditStart hook
  if (!_isActive) {
    _isActive = true;
    mainStory.info(SRC, 'User activity ON');
    runScript('onEditStart', { cancelable: true });
  }
};

const kill = () => {
  _timer = null;
  _isActive = false;
  mainStory.info(SRC, 'User activity OFF');
  cancelScript('onEditStart');
};

// =======================================
// Public
// =======================================
export { onUserActivity };
