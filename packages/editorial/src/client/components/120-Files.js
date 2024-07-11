// @flow

import React from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { getFiles, getConfig, getIsPreviewAllFiles } from '../reducers';
import FileTree from './121-FileTree';

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  files: getFiles(state),
  config: getConfig(state),
  isPreviewAllFiles: getIsPreviewAllFiles(state),
});

type Props = {
  // From Redux
  files: Array<{ name: string, url: ?string }>,
  config: Object,
  setPreviewAllFiles: Function,
};
type State = {};

// ================================================
// Files
// ================================================
class Files extends React.Component<Props, State> {
  // ================================================
  render() {
    const { config, setPreviewAllFiles } = this.props;
    if (!config) return null;
    const { alwaysShowFileThumbnails } = config;
    if (!this.props.files) return null;

    const files = this.props.files.filter((el) => el.type === 'file');
    files.sort(byName);

    if (alwaysShowFileThumbnails) {
      setPreviewAllFiles(true);
    }

    const tree = this.getFilesTree();

    return (
      <div className="files">
        <FileTree tree={tree} />
      </div>
    );
  }

  // ================================================

  getFilesTree() {
    const { files: paths } = this.props;

    const dirs = paths.filter((el) => el.type === 'dir');

    const result = [];
    const level = { result };

    // https://stackoverflow.com/a/57344801/154922
    dirs.forEach((dir) => {
      dir.name.split('/').reduce((r, name) => {
        if (!r[name]) {
          r[name] = { result: [] }; // eslint-disable-line
          r.result.push({ name, type: 'dir', children: r[name].result });
        }

        return r[name];
      }, level);
    });

    const tree = [
      {
        name: 'root',
        type: 'dir',
        children: result,
      },
    ];

    const files = paths.filter((el) => el.type === 'file');

    files.forEach((file) => {
      const path = file.name.split('/').slice(0, -1);
      const filename = file.name.split('/').slice(-1)[0];

      this.addFileInTree(filename, file.url, path, tree[0].children);
    });

    return tree;
  }

  addFileInTree(filename, url, path, tree0) {
    if (path.length === 0) {
      tree0.push({
        name: filename,
        url,
        type: 'file',
      });
    } else {
      const item = tree0.find((el) => el.name === path[0]);
      if (item) {
        this.addFileInTree(filename, url, path.slice(1), item.children);
      } else {
        console.warn(`Directory ${path[0]} not found (${filename}, ${url})}.`);
      }
    }
  }
}

// ================================================
const byName = (a, b) => {
  const aName = a.name;
  const bName = b.name;
  if (aName < bName) return -1;
  if (aName > bName) return +1;
  return 0;
};

// ================================================
// Public
// ================================================
export default connect(mapStateToProps, actions)(Files);
