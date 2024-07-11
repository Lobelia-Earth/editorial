// @flow

/* eslint-env browser */

import React, { useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import css from 'styled-jsx/css';
import { Icon } from 'giu';

import _t from '../gral/mady';
import * as actions from '../actions';
import {
  getIsFilesDrawerOpen,
  getIsPreviewAllFiles,
  getConfig,
} from '../reducers';

import Files from './120-Files';
import IconButton from './930-IconButton';

import useOutsideClick from '../gral/effects/useOutsideClick';

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  closeFilesDrawer: Function,
  isOpen: getIsFilesDrawerOpen(state),
  isPreviewAllFiles: getIsPreviewAllFiles(state),
  config: getConfig(state),
});

type Props = {
  // From Redux
  config: Object,
  isOpen: boolean,
  isPreviewAllFiles: boolean,
  setPreviewAllFiles: Function,
};

// ================================================
// Files Modal
// ================================================
const FilesModal = (props: Props) => {
  const {
    isOpen,
    closeFilesDrawer,
    config,
    isPreviewAllFiles,
    setPreviewAllFiles,
  } = props;
  if (!config) return null;
  const { alwaysShowFileThumbnails } = config;

  if (!isOpen) return null;

  const modalRef = useRef(null);

  useOutsideClick(modalRef, () => {
    closeFilesDrawer();
  });

  const [isShowingFiles, setIsShowingFiles] = useState(false);

  useEffect(() => {
    setIsShowingFiles(true);
  }, []);

  return (
    <div className="outer">
      <div className="modal" ref={modalRef}>
        <div className="title">
          <h2>{_t('files_Files')}</h2>
          <Icon size="lg" onClick={closeFilesDrawer} icon="times" />
        </div>
        <div className="tools">
          {!alwaysShowFileThumbnails && (
            <span title="Toggle thumbnails">
              <IconButton
                label={_t('files_Toggle thumbnails')}
                className="preview-button"
                onClick={() => {
                  setPreviewAllFiles(!isPreviewAllFiles);
                }}
                icon={isPreviewAllFiles ? 'eye' : 'eye-slash'}
              />
            </span>
          )}
          <div className="instructions">
            Files marked <span className="unused">in red</span> seem to be
            unused.
          </div>
        </div>
        <div className="payload">{isShowingFiles && <Files />}</div>
      </div>
      <style jsx>{STYLES}</style>
    </div>
  );
};

// ================================================
const STYLES = css`
  .outer {
    position: fixed;
    z-index: 10;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff99;
  }

  .modal {
    background-color: white;

    width: 90vw;
    max-width: 1000px;
    padding: 1em;
    box-shadow: 0 3px 6px rgb(0 0 0 / 16%), 0 3px 6px rgb(0 0 0 / 23%);
  }

  .title {
    display: flex;
    justify-content: space-between;
  }

  .tools {
    display: flex;
    margin-bottom: 1em;
    align-items: center;
  }

  .instructions {
    color: gray;
    margin-left: 1em;
  }
  .unused {
    color: #bb0000;
  }

  .payload {
    height: calc(90vh - 100px);
    overflow-y: auto;
  }
`;

// ================================================
// Public
// ================================================
export default connect(mapStateToProps, actions)(FilesModal);
