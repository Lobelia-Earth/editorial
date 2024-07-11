// @flow

/* eslint-disable jsx-a11y/alt-text */

import React from 'react';
import { Icon } from 'giu';
import classnames from 'classnames';
import ReactMarkdown from 'react-markdown';
import css from 'styled-jsx/css';

// ================================================
// Declarations
// ================================================
type Props = {
  name: string,
  contents: string,
  config: Object,
};

type State = {
  isShowingHelp: boolean,
};

// ================================================
// MarkdownCustomBlockPreview
// ================================================
class MarkdownCustomBlockPreview extends React.Component<Props, State> {
  state = {
    isShowingHelp: true,
  };

  // ================================================
  render() {
    const { name, config } = this.props;
    const help = config.componentHelp ? config.componentHelp[name] : null;
    return (
      <div className="md-code">
        <div className="md-code-lang">
          {this.props.name}
          {help && (
            <Icon
              className={classnames('help-icon', {
                'is-showing-help': this.state.isShowingHelp,
              })}
              icon="info-circle"
              onClick={this.onClickHelp}
            />
          )}
        </div>
        <div className="editorial-help">{this.renderHelp(help)}</div>
        <pre className="md-code-value">{this.props.contents}</pre>
        <style jsx>{STYLES}</style>
      </div>
    );
  }

  renderHelp(help: ?Array<string>) {
    if (!this.state.isShowingHelp || !help) return null;
    return <ReactMarkdown source={help.join('\n')} />;
  }

  // ================================================
  onClickHelp = () => {
    const { isShowingHelp } = this.state;
    this.setState({ isShowingHelp: !isShowingHelp });
  };
}

// ================================================
const STYLES = css`
  .md-code {
    margin-top: 5px;
    background-color: #e0e0e0;
    padding: 10px;
  }
  .md-code-lang {
    margin: 0 0 5px -10px;
    padding-left: 4px;
    border-left: 6px solid gray;
    font-weight: bold;
    text-transform: uppercase;
  }
  .md-code-value {
    overflow-x: auto;
  }
  :global(.help-icon) {
    margin: 0 0.6em;
  }
  :global(.help-icon.is-showing-help) {
    color: var(--color-accent-on-light);
  }
  :global(.editorial-help) {
    color: #0087cc;
  }
  :global(.editorial-help) p,
  :global(.editorial-help) ul {
    margin: 0;
  }
`;

// ================================================
// Public
// ================================================
export default MarkdownCustomBlockPreview;
