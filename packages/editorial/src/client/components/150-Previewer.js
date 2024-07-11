/* eslint-env browser */

import React from 'react';
import { connect } from 'react-redux';
import { Icon } from 'giu';
import css from 'styled-jsx/css';
import * as actions from '../actions';
import { getConfig } from '../reducers';

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => {
  const config = getConfig(state);
  const previewUrl = config ? config.previewUrl : undefined;
  return { previewUrl };
};

type Props = {
  // From Redux
  previewUrl: ?string,
};
// ================================================
// Component
// ================================================
class Previewer extends React.Component<Props, {}> {
  now = new Date().toISOString();
  render() {
    const previewUrl = this.props.previewUrl || '/';
    const hasSearch = previewUrl.includes('?');
    return (
      <div className="iframe-wrapper">
        <a
          className="fullscreen"
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon="external-link-alt" />
        </a>
        <iframe
          className="editorial-iframe"
          src={`${previewUrl}${hasSearch ? '&' : '?'}no-caching-date=${
            this.now
          }`}
          title="preview"
        />
        <style jsx>{STYLES}</style>
      </div>
    );
  }
}

// ================================================
const STYLES = css`
  .iframe-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .fullscreen {
    position: absolute;
    display: block;
    top: 0;
    right: 0;
    background-color: #666;
    color: white;
    border-radius: 0 0 0 10px;
    padding: 7px 7px 10px 10px;
  }
`;

// ================================================
// Public
// ================================================
export default connect(mapStateToProps, actions)(Previewer);
