// @flow

import React, { useState, useRef, useEffect } from 'react';
import css from 'styled-jsx/css';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { Icon, TextInput } from 'giu';

import { getFiles } from '../reducers';

import useOutsideClick from '../gral/effects/useOutsideClick';

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
  files: getFiles(state),
});

type Props = {
  placeholder: string,
  value: string,
  validators: any,
  onChange: Function,
  // From Redux
  files: Array<{ name: string, url: ?string }>,
};

const FilePicker = (props: Props) => {
  const {
    value: initialValue,
    files,
    placeholder,
    validators,
    onChange,
  } = props;

  const submenuRef = useRef(null);
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [resultIndex, setResultIndex] = useState(0);

  useOutsideClick(submenuRef, () => setIsOpen(false));

  useEffect(() => {
    onChange(value);
  }, [value]);

  const sortedFiles = files.filter((el) => el.type === 'file').sort(byName);

  const filteredFiles = sortedFiles.filter(byValue(value)).slice(0, 10);

  const handleKeyDown = (e) => {
    switch (e.keyCode) {
      case 38: // up
        setResultIndex(
          resultIndex - 1 < 0 ? filteredFiles.length - 1 : resultIndex - 1
        );
        e.preventDefault();
        break;
      case 40: // down
        setResultIndex((resultIndex + 1) % filteredFiles.length);
        e.preventDefault();
        break;
      case 13: // enter
        if (filteredFiles.length > 0) {
          setValue(
            filteredFiles[resultIndex].url || filteredFiles[resultIndex].name
          );
          e.target.blur();
          setIsOpen(false);
        }
        e.preventDefault();
        break;
      default:
    }
  };

  return (
    <div className="picker" ref={submenuRef}>
      <Icon
        icon="copy"
        family="far"
        onClick={() => {
          inputRef.current && inputRef.current.focus();
        }}
      />
      <TextInput
        ref={inputRef}
        onFocus={(ev) => {
          ev.target.select();
          setIsOpen(true);
        }}
        // onBlur={() => setIsOpen(false)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onChange={(ev) => setValue(ev.target.value)}
        value={value}
        validators={validators}
      />
      {isOpen && (
        <div className="dropdown">
          {filteredFiles.map((f, idx) => (
            <div
              className={classnames('item', {
                selected: resultIndex === idx,
              })}
              key={f.name}
              onClick={() => {
                setIsOpen(false);
                setValue(f.url || f.name);
              }}
            >
              {f.name}
            </div>
          ))}
        </div>
      )}
      <style jsx>{STYLES_PICKER}</style>
    </div>
  );
};

// ================================================
const byName = (a, b) => {
  const aName = a.name;
  const bName = b.name;
  if (aName < bName) return -1;
  if (aName > bName) return +1;
  return 0;
};

const byValue = (value = '') => (el) => {
  const pattern = value.split('').join('.*?');
  const re = new RegExp(pattern, 'i');

  return el.name.match(re);
};

export default connect(mapStateToProps)(FilePicker);

const STYLES_PICKER = css`
  .picker {
    position: relative;
    display: flex;
    width: 100%;
  }

  .dropdown {
    position: absolute;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.15);
    box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.15);
    z-index: 10;
    top: 100%;
  }

  .item {
    cursor: pointer;
    padding: 0.5em;
    white-space: nowrap;
    max-width: 400px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .item:hover,
  .item.selected {
    background-color: #f0f0f0;
  }
`;
