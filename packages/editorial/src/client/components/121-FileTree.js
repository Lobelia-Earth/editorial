// @flow

import React from 'react';
import css from 'styled-jsx/css';

import Directory from './123-Directory';

type Props = {
  tree: Object,
};

const FileTree = (props: Props) => {
  const { tree } = props;

  return (
    <div className="treeWrapper">
      <Directory name={tree[0].name} contents={tree[0].children} basePath="" />
      <style jsx>{STYLES_TREE}</style>
    </div>
  );
};

export default FileTree;

const STYLES_TREE = css`
   {
    .treeWrapper {
      margin-top: 1em;
      margin-bottom: 4em;
    }
  }
`;
