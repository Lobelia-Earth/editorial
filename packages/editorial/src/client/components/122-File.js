// @flow
/* eslint-env browser */

import React, { useState, useRef } from 'react';
import css from 'styled-jsx/css';
import { connect } from 'react-redux';
import { Icon, notify } from 'giu';
import classnames from 'classnames';

import _t from '../gral/mady';

import { launchWarningModal } from './helpers';

import { getItems, getIsPreviewAllFiles } from '../reducers';
import * as actions from '../actions';

import IconButton from './930-IconButton';

// File extensions that have thumbnail
const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'svg',
  'webp',
  'avif',
];

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  items: getItems(state),
  isPreviewAllFiles: getIsPreviewAllFiles(state),
});

type Props = {
  file: Object,
  basePath: string,
  // From Redux
  items: Object,
  isPreviewAllFiles: boolean,
  deleteFile: Function,
};

const File = (props: Props) => {
  const { file, basePath, deleteFile, items, isPreviewAllFiles } = props;

  const [isShowingPreview, setIsShowingPreview] = useState(false);
  const inputEl = useRef(null);

  const onDelete = (f) => {
    const message = (
      <div>
        <div style={{ paddingRight: 10 }}>{_t('files_Delete file?')}</div>
        <div style={{ paddingRight: 10 }}>{f.url || f.name}</div>
        <div style={{ paddingRight: 10 }}>
          {_t('files_Deleted files cannot be recovered')}
        </div>
      </div>
    );
    launchWarningModal(
      _t('pages_Confirm file deletion'),
      message,
      _t('pages_Cancel'),
      _t('pages_Delete'),
      () => doDelete(f)
    );
  };

  const doDelete = async (f) => {
    try {
      await deleteFile(f);
      notify({
        msg: _t('files_File deleted'),
        type: 'success',
        icon: 'check',
      });
    } catch (err) {
      notify({
        msg: _t('files_Server error'),
        type: 'error',
        icon: 'exclamation',
      });
      throw err;
    }
  };

  const copyName = () => {
    inputEl.current.select();
    document.execCommand('copy');
    notify({
      msg: _t('files_Name copied'),
      type: 'success',
      icon: 'check',
    });
  };

  const unused = isUnused(
    file.url || `${basePath}${file.name}`,
    items._stringified
  );

  const url = file.url || `/editorial/_file/${basePath}${file.name}`;

  return (
    <div className="entry">
      <Icon
        className={classnames('icon', { unused })}
        icon={isImage(file.name) ? 'file-image' : 'file'}
        family="far"
      />
      {file.url && <span className="large">{_t('files_Large')}</span>}
      <a href={url} target="_blank" rel="noreferrer noopener" className="name">
        {file.name}
      </a>
      {(isPreviewAllFiles || isShowingPreview) && (
        <div className="thumbnailWrapper">
          {isImage(file.name) && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="name"
            >
              <img className="thumbnail" src={url} alt={file.name} />
            </a>
          )}
        </div>
      )}
      <div className="actions">
        {!(isShowingPreview || isPreviewAllFiles) && isImage(file.name) && (
          <IconButton
            onClick={() => setIsShowingPreview(true)}
            label={_t('files_Preview')}
            icon="eye"
          />
        )}{' '}
        <IconButton
          onClick={() => copyName()}
          label={_t('files_Copy name')}
          icon="copy"
        />{' '}
        <IconButton
          onClick={() =>
            onDelete({ name: `${basePath}${file.name}`, url: file.url })
          }
          label={_t('files_Delete')}
          icon="times"
        />
        <input
          type="text"
          className="nameInput"
          ref={inputEl}
          readOnly
          value={file.url || `${basePath}${file.name}`}
        />
      </div>
      <style jsx>{STYLES_ENTRY}</style>
    </div>
  );
};

const isImage = (filename) => {
  const extension = filename.split('.').pop();
  return IMAGE_EXTENSIONS.indexOf(extension.toLowerCase()) !== -1;
};

const isUnused = (filename, itemsString) => {
  const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`("|\\(\\/?)(${escapedFilename})("|\\))`, 'i');
  return !itemsString.match(re);
};

export default connect(mapStateToProps, actions)(File);

const STYLES_ENTRY = css`
  .entry {
    padding: 0.5em;
    display: flex;
    align-items: center;
  }

  .entry:hover {
    background-color: #f0f0f0;
  }

  .name {
    margin-left: 0.5em;
    flex-grow: 1;
    flex-shrink: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.entry .unused) {
    color: #bb0000;
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

  .thumbnail {
    height: 4em;
    width: 7em;
    object-fit: contain;
  }

  .nameInput {
    // Off-view, only for copyong to clipboard
    position: absolute;
    top: 10em;
  }

  .large {
    display: inline-block;
    font-size: 0.7rem;
    text-transform: uppercase;
    background-color: gray;
    color: white;
    padding: 0 6px 1px;
    border-radius: 5px;
    margin-left: 0.5em;
  }
`;
