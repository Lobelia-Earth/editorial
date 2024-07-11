// @flow

import React from 'react';
import { Provider } from 'react-redux';
import createStore from '../gral/createStore';
import App from './010-App';

// ================================================
// Declarations
// ================================================
type Props = {};
type State = {
  store: Object,
};

// ================================================
// Component
// ================================================
class Root extends React.Component<Props, State> {
  state = {
    store: createStore(),
  };

  // ================================================
  render() {
    return (
      <Provider store={this.state.store}>
        <App />
      </Provider>
    );
  }
}

// ================================================
// Public
// ================================================
export default Root;
