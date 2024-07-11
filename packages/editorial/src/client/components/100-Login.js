// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Icon, TextInput, PasswordInput, Button, isEmail, KEYS } from 'giu';
import _t from '../gral/mady';
import * as actions from '../actions';
import { getLoginStatus } from '../reducers';
import Spinner from './910-Spinner';

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  loginStatus: getLoginStatus(state),
});

type Props = {
  // From Redux
  loginStatus: ?string,
  logIn: Function,
};
type State = {};

// ================================================
// Component
// ================================================
// $FlowFixMe
class Login extends React.Component<Props, State> {
  ref_email: ?Object;
  ref_password: ?Object;

  render() {
    const { loginStatus } = this.props;
    const isLoggingIn = !loginStatus || loginStatus === 'LOGGING_IN';
    return (
      <div className="login">
        <div>{_t('login_Please log in with your email:')}</div>
        <TextInput
          ref={(c) => {
            this.ref_email = c;
          }}
          required
          validators={[isEmail()]}
          onKeyUp={this.onKeyUp}
        />
        <div>{_t('login_…and password:')}</div>
        <PasswordInput
          ref={(c) => {
            this.ref_password = c;
          }}
          required
          onKeyUp={this.onKeyUp}
        />
        <div className="button-row">
          <Button onClick={isLoggingIn ? undefined : this.onSubmit}>
            <span>
              {isLoggingIn ? <Spinner /> : <Icon icon="sign-in-alt" />}{' '}
              {isLoggingIn ? _t('button_Logging in…') : _t('button_Log in')}
            </span>
          </Button>
        </div>
        <style jsx>{`
          .button-row {
            text-align: right;
          }
          .login :global(input) {
            padding: 3px 8px;
            background: transparent;
            border: 1px solid white;
            border-radius: 10px;
            width: 200px;
            margin-top: 8px;
            margin-bottom: 20px;
          }
        `}</style>
      </div>
    );
  }

  // ================================================
  onKeyUp = (ev: Object) => {
    const { which } = ev;
    if (which === KEYS.return) this.onSubmit();
  };

  // May throw
  onSubmit = async () => {
    const { ref_email, ref_password } = this;
    if (!ref_email || !ref_password) return;
    const [email, password] = await Promise.all(
      [ref_email, ref_password].map((ref) => ref.validateAndGetValue())
    );
    this.props.logIn(email, password);
  };
}

// ================================================
// Public
// ================================================
export default connect(mapStateToProps, actions)(Login);
