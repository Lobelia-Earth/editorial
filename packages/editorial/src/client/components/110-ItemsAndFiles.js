// @flow

/* eslint-env browser */
import React from 'react';
import { connect } from 'react-redux';
import css from 'styled-jsx/css';
import * as actions from '../actions';
import { getSchema } from '../reducers';
import ItemsForType from './115-ItemsForType';

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  schema: getSchema(state),
});

type Props = {
  // From Redux
  schema: Object,
};
type State = {};

// ================================================
// Items
// ================================================
class Items extends React.Component<Props, State> {
  render() {
    return (
      <div className="items-and-files">
        {this.renderToc()}
        {Object.keys(this.props.schema).map((itemType) => (
          <ItemsForType key={itemType} itemType={itemType} />
        ))}
        <style jsx>{STYLES}</style>
      </div>
    );
  }

  renderToc() {
    const itemTypes = Object.keys(this.props.schema);
    return (
      <div className="toc">
        <span className="toc-title">Quick links:</span>
        {itemTypes.map((itemType) => (
          <span key={itemType} className="toc-item">
            <a className="toc-link" href={`#${itemType}`}>
              {this.props.schema[itemType].displayName}
            </a>
          </span>
        ))}
        <style jsx>{STYLES_TOC}</style>
      </div>
    );
  }
}

// ================================================
const STYLES = css`
  .items-and-files {
    padding: 0px 15px;
  }
`;

const STYLES_TOC = css`
  .toc {
    position: sticky;
    top: 0;
    padding: 10px 15px;
    background-color: rgb(255, 244, 200);
    margin-bottom: 15px;
    z-index: 2;
  }
  .toc-title {
    font-weight: bold;
    margin-right: 1em;
  }
  .toc-item + .toc-item {
    margin-left: 0.7em;
  }
  .toc-item + .toc-item::before {
    content: '·';
    margin-right: 0.7em;
    color: gray;
  }
  .toc-link:hover {
    text-decoration: underline;
  }
`;

// ================================================
// Public
// ================================================
export default connect(mapStateToProps, actions)(Items);
