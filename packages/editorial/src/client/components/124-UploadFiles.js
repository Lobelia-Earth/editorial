// @flow

import React, { useState } from 'react';
import { connect } from 'react-redux';
import css from 'styled-jsx/css';
import { Icon, Spinner, FileInput, notify } from 'giu';

import _t from '../gral/mady';
import * as actions from '../actions';

import IconButton from './930-IconButton';

// ================================================
// Declarations
// ================================================
type Props = {
  basePath: string,
  onUploaded: Function,
  // From Redux
  uploadFiles: Function,
};

// ================================================
// Component
// ================================================
const UploadFiles = (props: Props) => {
  const { basePath, uploadFiles, onUploaded } = props;

  const [isUploading, setIsUploading] = useState(false);
  const [fileInputValue, setFileInputValue] = useState(null);

  const onSelectFile = (fileList) => {
    const val = fileList && fileList.length === 0 ? null : fileList;
    setFileInputValue(val);
  };

  const onUpload = async () => {
    if (!fileInputValue) return;
    setIsUploading(true);
    try {
      await uploadFiles(fileInputValue, basePath);
      notify({
        msg: _t('files_File uploaded'),
        type: 'success',
        icon: 'check',
      });
      onUploaded && onUploaded();
    } catch (err) {
      notify({
        msg: _t('files_Error uploading file'),
        type: 'error',
        icon: 'exclamation',
      });
      setIsUploading(false);
      throw err;
    }

    setIsUploading(false);
    setFileInputValue(null);
  };

  const render = () => {
    if (isUploading) return <Spinner size="2x" />;
    return (
      <div className="button-row">
        <FileInput
          className="upload-file-input"
          onChange={(ev, fileList) => onSelectFile(fileList)}
          value={fileInputValue}
          multiple
        >
          <Icon
            className="editorial-file-upload-icon"
            family="far"
            icon="copy"
          />{' '}
          {_t('files_Select files...')}
        </FileInput>
        &nbsp;&nbsp;
        <IconButton
          icon="upload"
          label={_t('files_Upload')}
          onClick={onUpload}
          disabled={!fileInputValue}
        />
        <style jsx>{STYLES_UPLOAD}</style>
      </div>
    );
  };

  return render();
};

export default connect(null, actions)(UploadFiles);

const STYLES_UPLOAD = css`
  :global(.upload-file-input) {
    font-size: 13px;
  }
  :global(.editorial-file-upload-icon) {
    margin-right: 6px;
  }
  .button-row {
    margin-left: 0.5em;
    display: flex;
    align-items: center;
  }
`;
