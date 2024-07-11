// @flow

import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import css from 'styled-jsx/css';
import { Spinner, notify } from 'giu';

import _t from '../gral/mady';
import * as actions from '../actions';

import IconButton from './930-IconButton';

// ================================================
// Declarations
// ================================================
type Props = {
  basePath: string,
  onCreated: Function,
  // From Redux
  createDir: Function,
};

// ================================================
// Component
// ================================================
const CreateDir = (props: Props) => {
  const { basePath, createDir, onCreated } = props;

  const inputRef = useRef();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  const onCreate = async () => {
    if (!name) return;
    setIsCreating(true);
    try {
      await createDir(name, basePath);
      notify({
        msg: _t('files_Directory created'),
        type: 'success',
        icon: 'check',
      });
      setName('');
      onCreated && onCreated();
    } catch (err) {
      notify({
        msg: _t('files_Error creating directory'),
        type: 'error',
        icon: 'exclamation',
      });
      setIsCreating(false);
      // throw err;
    }

    setIsCreating(false);
  };

  const render = () => {
    if (isCreating) return <Spinner size="2x" />;
    return (
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          onCreate();
        }}
        className="button-row"
      >
        <input
          ref={inputRef}
          type="text"
          value={name}
          placeholder={_t('files_Folder name')}
          onChange={(ev) => {
            setName(ev.target.value.replace(/[^\w-]/g, '-').toLowerCase());
          }}
        />
        &nbsp;&nbsp;
        <IconButton
          icon="folder-plus"
          label={_t('files_Create')}
          onClick={onCreate}
          disabled={name.length === 0}
        />
        <style jsx>{STYLES_UPLOAD}</style>
      </form>
    );
  };

  return render();
};

export default connect(null, actions)(CreateDir);

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
