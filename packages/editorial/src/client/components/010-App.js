// @flow

/* eslint-env browser */

import React from 'react';
import { connect } from 'react-redux';
import { Giu, Floats, Notifications, Modals, LargeMessage } from 'giu';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import css from 'styled-jsx/css';
import _t from '../gral/mady';
import * as actions from '../actions';
import { getLoginStatus, getItems, getFiles, getConfig } from '../reducers';
import Sidebar from './020-Sidebar';
import ItemsAndFiles from './110-ItemsAndFiles';
import Editor from './130-Editor';
import FilesModal from './111-FilesModal';
import Previewer from './150-Previewer';
import Spinner from './910-Spinner';
import InvalidRoute from './920-InvalidRoute';
// import Files from './120-Files';
import './010-App.css';

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  loginStatus: getLoginStatus(state),
  config: getConfig(state),
  items: getItems(state),
  files: getFiles(state),
});

type Props = {
  // From Redux
  loginStatus: ?string,
  config: ?Object,
  items: ?Object,
  files: ?Array<string>,
  startUp: Function,
  shutDown: Function,
};

// ================================================
// Top-level
// ================================================
class App extends React.Component<Props, {}> {
  componentDidMount() {
    this.props.startUp();
  }

  componentWillUnmount() {
    this.props.shutDown();
  }

  // ================================================
  render() {
    const { loginStatus, config, items, files } = this.props;
    let message;
    if (loginStatus && loginStatus !== 'LOGGED_IN') {
      message = _t('main_Please log in first');
    } else if (!loginStatus || !config || !items || files == null) {
      message = (
        <span>
          <Spinner /> {_t('main_Loading')}
        </span>
      );
    }
    return (
      <Giu>
        <Floats />
        <Notifications />
        <Modals />
        <FilesModal />
        <BrowserRouter>
          <div className="app">
            <Sidebar />
            <div className="contents">
              {message ? (
                <LargeMessage>{message}</LargeMessage>
              ) : (
                this.renderSwitch()
              )}
            </div>
            {/* {files && <Files />} */}
          </div>
        </BrowserRouter>
        <style jsx>{STYLES}</style>
      </Giu>
    );
  }

  renderSwitch() {
    return (
      <Switch>
        <Route exact path="/editorial" component={ItemsAndFiles} />
        <Route exact path="/editorial/translate" component={Translator} />
        <Route exact path="/editorial/preview" component={Previewer} />
        <Route exact path="/editorial/error" component={ErrorMessage} />
        <Route path="/editorial/:itemType/:itemId" component={ItemEditor} />
        <Route component={InvalidRoute} />
      </Switch>
    );
  }
}

// ================================================
// Page-specific
// ================================================
const Translator = () => (
  <iframe className="editorial-iframe" src="/mady?theme=bw" title="translate" />
);

const ErrorMessage = ({ location }) => (
  <div>
    <LargeMessage>
      {_t(
        'error_The following error was returned. Please contact the Web Development Team'
      )}
    </LargeMessage>
    <pre>{location.state.error || ''}</pre>
  </div>
);

const ItemEditor = ({ match }) => {
  const { itemType, itemId } = match.params;
  return <Editor itemType={itemType} itemId={itemId} />;
};

// ================================================
const STYLES = css`
  .app {
    display: flex;
    min-height: 100vh;
  }
  .contents {
    flex: 1 1 0px;
    min-width: 0;
  }
`;

// ================================================
// Public
// ================================================
export default connect(mapStateToProps, actions)(App);
