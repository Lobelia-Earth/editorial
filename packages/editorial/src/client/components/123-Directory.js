// @flow

import React, { useState } from 'react';
import { connect } from 'react-redux';

import css from 'styled-jsx/css';
import { Icon, notify } from 'giu';

import _t from '../gral/mady';

import * as actions from '../actions';

import IconButton from './930-IconButton';
import File from './122-File';
import UploadFiles from './124-UploadFiles';
import CreateDir from './126-CreateDir';

// ================================================
// Declarations
// ================================================
type Props = {
  name: string,
  contents: Array,
  basePath: string,
  // From Redux
  deleteDir: Function,
};

// ================================================
// Component
// ================================================
const Directory = (props: Props) => {
  const { name, contents, basePath, deleteDir } = props;

  const isEmpty = contents.length === 0;
  const isRoot = basePath === '';

  const [isOpen, setIsOpen] = useState(isRoot);
  const [isAdding, setIsAdding] = useState(null);

  const doDelete = async (fileName) => {
    try {
      await deleteDir(fileName);
      notify({
        msg: _t('files_Folder deleted'),
        type: 'success',
        icon: 'check',
      });
    } catch (e) {
      notify({
        msg: _t('files_Server error'),
        type: 'error',
        icon: 'exclamation',
      });
    }
  };

  return (
    <>
      <div className="entry">
        <div
          className="unfold-toggle"
          onClick={() => {
            if (isRoot) return;

            if (isOpen) {
              setIsAdding(null);
            }
            setIsOpen(!isOpen);
          }}
        >
          <Icon
            className="icon"
            icon={isOpen ? 'folder-open' : 'folder'}
            family="far"
          />
          <span className="name">{name}</span>
        </div>

        <div className="actions">
          <IconButton
            label={_t('files_Add folder')}
            icon="folder-plus"
            onClick={() => {
              setIsAdding('dir');
              setIsOpen(true);
            }}
          />{' '}
          <IconButton
            label={_t('files_Add files')}
            icon="file-upload"
            onClick={() => {
              setIsAdding('files');
              setIsOpen(true);
            }}
          />{' '}
          <IconButton
            label={_t('files_Delete')}
            icon="times"
            onClick={() => {
              doDelete(basePath);
            }}
            disabled={!isEmpty || isRoot}
          />
        </div>
      </div>
      {isOpen && (
        <div className="children">
          {isAdding === 'files' && (
            <div className="entry form">
              <div className="">
                <UploadFiles
                  basePath={basePath}
                  onUploaded={() => {
                    setIsAdding(null);
                  }}
                />
              </div>
              <div className="actions">
                <IconButton
                  label={_t('files_Close')}
                  icon="times-circle"
                  onClick={() => {
                    setIsAdding(null);
                  }}
                />
              </div>
            </div>
          )}
          {isAdding === 'dir' && (
            <div className="entry form">
              <div className="">
                <CreateDir
                  basePath={basePath}
                  onCreated={() => {
                    setIsAdding(null);
                  }}
                />
              </div>
              <div className="actions">
                <IconButton
                  label={_t('files_Close')}
                  icon="times-circle"
                  onClick={() => {
                    setIsAdding(null);
                  }}
                />
              </div>
            </div>
          )}
          {renderContents(contents, basePath, deleteDir)}
        </div>
      )}
      <style jsx>{STYLES_ENTRY}</style>
    </>
  );
};

const renderContents = (items, basePath, deleteDir) =>
  items.sort(byTypeAndName).map((item) => {
    if (item.type === 'file') {
      return (
        <File
          key={`file-${basePath}${item.name}`}
          file={item}
          basePath={basePath}
        />
      );
    }
    return (
      <Directory
        key={`dir-${basePath}${item.name}`}
        name={item.name}
        contents={item.children}
        basePath={`${basePath}${item.name}/`}
        deleteDir={deleteDir}
      />
    );
  });

const byTypeAndName = (a, b) => {
  const aType = a.type;
  const bType = b.type;
  const aName = a.name;
  const bName = b.name;

  if (aType === 'dir' && bType !== 'dir') return -1;
  if (aType !== 'dir' && bType === 'dir') return 1;

  if (aName < bName) return -1;
  if (aName > bName) return +1;
  return 0;
};

export default connect(null, actions)(Directory);

const STYLES_ENTRY = css`
  .entry {
    padding: 0.5em;
    display: flex;
    align-items: center;
  }

  .form {
    justify-content: space-between;
  }

  .entry:hover {
    background-color: #f0f0f0;
  }

  .children {
    padding-left: 1.5em;
  }

  .unfold-toggle {
    flex-grow: 1;
    flex-shrink: 1;
    cursor: pointer;
  }

  .name {
    margin-left: 0.5em;
    font-weight: bold;
    flex-grow: 1;
    flex-shrink: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions {
    opacity: 0;
    padding-left: 1em;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
  }

  .entry:hover .actions {
    opacity: 1;
  }

  .actionLabel {
    margin-left: 0.5em;
  }
`;
