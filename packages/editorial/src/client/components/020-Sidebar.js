// @flow

/* eslint-env browser */

import React from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import css from 'styled-jsx/css';
import { Icon, modalPush, modalPop, notify } from 'giu';
import classnames from 'classnames';
import _t from '../gral/mady';
import * as actions from '../actions';
import {
  getLoginStatus,
  getWebName,
  getConfig,
  getCurUsers,
  getUser,
  getRoles,
  getVersion,
  getIsJustSaved,
} from '../reducers';
// import { resetPassword } from '../gral/firebase';
import Login from './100-Login';
import Spinner from './910-Spinner';

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  loginStatus: getLoginStatus(state),
  webName: getWebName(state),
  config: getConfig(state),
  curUsers: getCurUsers(state),
  user: getUser(state),
  roles: getRoles(state),
  version: getVersion(state),
  isJustSaved: getIsJustSaved(state),
});

type Props = {
  // From Redux
  loginStatus: ?string,
  webName: string,
  config: ?Object,
  curUsers: Array<string>,
  user: ?string,
  roles: Array<string>,
  version: string,
  isJustSaved: boolean,
  buildAndDeploy: Function,
  pullFromRepo: Function,
  pushToRepo: Function,
  restartServer: Function,
  logOut: Function,
  openFilesDrawer: Function,
  // withRouter
  history: Object,
};
type State = {};

// ================================================
// Component
// ================================================
class Sidebar extends React.Component<Props, State> {
  render() {
    const isLoggedIn = this.props.loginStatus === 'LOGGED_IN';
    const { config, webName } = this.props;
    if (!config) return null;
    const name = config.name || webName || 'Editorial';
    return (
      <div className="sidebar">
        <div className="sidebar-inner">
          <NavLink to="/editorial">
            <div className="web-name">{name}</div>
          </NavLink>
          {this.renderVisitButton()}
          {isLoggedIn ? this.renderNav() : this.renderLogin()}
        </div>
        <style jsx>{STYLES}</style>
      </div>
    );
  }

  renderVisitButton() {
    const { config } = this.props;
    if (!config || !config.publicUrl) return null;
    return (
      <a
        className="visit-web"
        href={config.publicUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon icon="external-link-alt" />
        <style jsx>{STYLES_VISIT_WEB}</style>
      </a>
    );
  }

  renderLogin() {
    return <Login />;
  }

  renderNav() {
    const { config, openFilesDrawer } = this.props;
    const isDev = this.props.roles.indexOf('developer') >= 0;
    return (
      <>
        <SidebarNavLink
          to="/editorial"
          label={_t('pages_Edit')}
          icon="pencil-alt"
        />
        <SidebarActionLink
          onClick={openFilesDrawer}
          label={_t('pages_Files')}
          icon="copy"
        />
        {!config.noTranslation && (
          <SidebarNavLink
            to="/editorial/translate"
            label={_t('pages_Translate')}
            icon="globe"
            pulse={this.props.isJustSaved}
          />
        )}
        <SidebarNavLink
          to="/editorial/preview"
          label={_t('pages_Preview')}
          icon="check"
        />
        <SidebarActionLink
          onClick={this.onPublish}
          label={_t('pages_Publish')}
          icon="cloud-upload-alt"
        />
        {isDev && (
          <>
            {this.renderSeparator()}
            <SidebarActionLink
              onClick={this.onPull}
              label={_t('pages_Pull from repo')}
              icon="arrow-down"
            />
            <SidebarActionLink
              onClick={this.onPush}
              label={_t('pages_Push to repo')}
              icon="arrow-up"
            />
            <SidebarActionLink
              onClick={this.onRestart}
              label={_t('pages_Restart server')}
              icon="redo"
            />
          </>
        )}
        {this.renderSeparator()}
        {!config.noHub && (
          <SidebarActionLink
            onClick={this.backToHub}
            label={_t('pages_Back to Hub')}
            icon="home"
          />
        )}
        {/* <SidebarActionLink
          onClick={this.onResetPassword}
          label={_t('pages_Reset password')}
          icon="key"
        /> */}
        <SidebarActionLink
          onClick={this.props.logOut}
          label={_t('pages_Log out')}
          icon="sign-out-alt"
        />
        {this.renderSeparator()}
        {this.renderCurrentUsers()}
        {this.renderLobelia()}
      </>
    );
  }

  renderCurrentUsers() {
    const { curUsers, user } = this.props;
    if (!curUsers.length) return null;
    const uniqueUsers = findUniqueUsers(curUsers);
    let activeEditors;
    if (uniqueUsers.length === 1 && uniqueUsers[0] === user) {
      activeEditors = 'just you';
    } else {
      const others = uniqueUsers.filter((o) => o !== user);
      activeEditors = others.map(getFriendlyName).join(', ');
      activeEditors += ' and you';
    }
    return (
      <>
        <div
          className={classnames('cur-users', {
            'multiple-users': curUsers.length > 1,
          })}
        >{`Active editors: ${activeEditors}`}</div>
        <style jsx>{STYLES_CURRENT_USERS}</style>
      </>
    );
  }

  renderLobelia() {
    const name = (this.props.config.name || this.props.webName).toLowerCase();
    return (
      <div className="logo-and-version">
        <a
          className="logo"
          href={`https://lobelia.earth?utm_source=editorial-${name}&utm_medium=web&utm_campaign=editorial`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/editorial/logo-lobelia.svg" alt="Lobelia" />
        </a>
        <div className="version">Editorial v{this.props.version}</div>
        <style jsx>{STYLES_LOBELIA}</style>
      </div>
    );
  }

  renderSeparator() {
    return (
      <div className="sep">
        <style jsx>{STYLES_SEP}</style>
      </div>
    );
  }

  // ================================================
  onPublish = () => {
    this.onAction({
      title: _t('pages_Building & deploying…'),
      contents: _t(
        'pages_Grab yourself a ☕️. This might take a while, depending on the site…'
      ),
      action: this.props.buildAndDeploy,
      msgSuccess: _t('pages_Build & deploy succeeded'),
      msgError: _t('pages_Build & deploy failed'),
      onSuccess: null,
      sticky: true,
    });
  };

  onPull = () => {
    this.onAction({
      title: _t('pages_Pulling from the repo…'),
      action: this.props.pullFromRepo,
      msgSuccess: _t('pages_Pull succeeded'),
      msgError: _t('pages_Pull failed'),
      onSuccess: null,
    });
  };

  onPush = () => {
    this.onAction({
      title: _t('pages_Pushing to the repo…'),
      action: this.props.pushToRepo,
      msgSuccess: _t('pages_Push succeeded'),
      msgError: _t('pages_Push failed'),
      onSuccess: null,
    });
  };

  onRestart = () => {
    this.onAction({
      title: _t('pages_Restarting the server…'),
      action: this.props.restartServer,
      msgSuccess: _t('pages_Restart succeeded — will automatically refresh'),
      msgError: _t('pages_Restart failed'),
      onSuccess: null,
    });
  };

  // onResetPassword = async () => {
  //   await resetPassword(this.props.user);
  //   notify({
  //     msg: _t('pages_Please check your inbox!'),
  //     type: 'success',
  //     icon: 'check',
  //   });
  // };

  onAction = async ({
    title,
    contents,
    action,
    msgSuccess,
    msgError,
    onSuccess,
    sticky,
  }: Object) => {
    modalPush({
      children: (
        <div>
          <h2>
            {title} <Spinner />
          </h2>
          <p>{contents}</p>
        </div>
      ),
    });
    try {
      await action();
      notify({ msg: msgSuccess, type: 'success', icon: 'check', sticky });
      if (onSuccess) onSuccess();
    } catch (err) {
      notify({ msg: msgError, type: 'error', icon: 'exclamation', sticky });
      this.props.history.push('/editorial/error', { error: err.message });
    } finally {
      modalPop();
    }
  };

  backToHub = () => {
    window.location.href = 'https://editorial.lobelia.earth';
  };
}

const SidebarNavLink = ({ to, label, icon, pulse }) => (
  <NavLink
    to={to}
    className="link-item"
    exact
    activeClassName="link-item-active"
  >
    <Icon
      className={pulse ? 'editorial-pulse-icon' : undefined}
      icon={icon}
      size="lg"
      fixedWidth
    />
    <span className="link-label"> {label}</span>
    <style jsx global>{`
      .link-item {
        display: flex;
        align-items: center;
        color: inherit;
        font-size: 18px;
        margin: 15px 0;
        text-decoration: none;
        cursor: pointer;
      }
      .link-item-active {
        color: var(--color-accent-bg);
      }
      .link-label {
        margin-left: 10px;
      }
      .editorial-pulse-icon {
        animation: 0.5s infinite alternate pulse;
      }
    `}</style>
  </NavLink>
);

const SidebarActionLink = ({ onClick, label, icon }) => (
  <div className="link-item" onClick={onClick}>
    <Icon icon={icon} size="lg" fixedWidth />
    <span className="link-label"> {label}</span>
  </div>
);

// ================================================
const findUniqueUsers = (users) => {
  const temp = {};
  for (let i = 0; i < users.length; i++) {
    temp[users[i]] = true;
  }
  return Object.keys(temp);
};

const getFriendlyName = (user) => {
  let out = user;
  out = out.split('@')[0];
  out = out.split('.')[0];
  out = out.charAt(0).toUpperCase() + out.slice(1);
  return out;
};

// ================================================
const STYLES = css`
  .sidebar {
    width: var(--sidebar-width);
    flex-shrink: 0;
  }
  .sidebar-inner {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1;
    width: var(--sidebar-width);
    padding: 10px 20px;
    background-color: #666;
    color: white;
  }
  .web-name {
    font-size: 24px;
    font-weight: bold;
    border-bottom: 1px solid white;
    padding-bottom: 5px;
    margin-bottom: 20px;
  }
`;

const STYLES_VISIT_WEB = css`
  .visit-web {
    position: absolute;
    top: 8px;
    right: 8px;
  }
`;

const STYLES_LOBELIA = css`
  .logo-and-version {
  }
  .logo {
    margin-top: 20px;
    display: inline-block;
    width: 90px;
  }
  .logo img {
    max-width: 100%;
  }
  .version {
    color: #999;
  }
`;

const STYLES_CURRENT_USERS = css`
  .cur-users {
    margin-top: 20px;
    color: #999;
  }
  .cur-users.multiple-users {
    color: var(--color-accent-bg);
  }
`;

const STYLES_SEP = css`
  .sep {
    border-bottom: 1px solid #999;
  }
`;

// ================================================
// Public
// ================================================
export default withRouter(connect(mapStateToProps, actions)(Sidebar));
