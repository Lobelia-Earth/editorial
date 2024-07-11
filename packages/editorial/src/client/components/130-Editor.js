// @flow

/* eslint-env browser */
/* eslint-disable jsx-a11y/alt-text */

import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Prompt } from 'react-router-dom';
import { set as timmSet } from 'timm';
import classnames from 'classnames';
import css from 'styled-jsx/css';
import {
  TextInput,
  NumberInput,
  Checkbox,
  DateInput,
  ColorInput,
  Select,
  LIST_SEPARATOR,
  simplifyString,
  isRequired,
  Icon,
  DropDownMenu,
  cancelEvent,
} from 'giu';
import ReactMde, { ReactMdeCommands } from 'react-mde';
import ReactMarkdown from 'react-markdown';
import { Translator } from 'mady-client-components';
import _t from '../gral/mady';
import * as actions from '../actions';
import { getSchema, getItems, getFiles, getConfig } from '../reducers';
import { notifyResult } from './helpers';
import { getNewRank } from '../gral/helpers';
import { NEW_ITEM_ID } from '../gral/constants';
import InvalidRoute from './920-InvalidRoute';
import FilePicker from './125-FilePicker';
import MarkdownCustomBlockPreview from './940-MarkdownCustomBlockPreview';

const DEFAULT_MARKDOWN_HEIGHT = 70;

const REGEX_MULTIPLE_LIST = /\s*,\s*/;

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  schema: getSchema(state),
  items: getItems(state),
  files: getFiles(state),
  config: getConfig(state),
});

type Props = {
  itemType: string,
  itemId: string,
  // From Redux
  schema: Object,
  items: Object,
  files: Array<Object>,
  config: Object,
  updateItem: Function,
  // withRouter
  history: Object,
};

type State = {
  hasChanged: boolean,
  isSaving: boolean,
  curValues: Object,
};

// ================================================
// Editor
// ================================================
class Editor extends React.Component<Props, State> {
  isNew: boolean;
  inputRefs = {};
  isUnmounted = false;

  constructor(props: Props) {
    super(props);
    const { items, itemType, itemId } = props;
    this.isNew = itemId === NEW_ITEM_ID;
    const curValues = this.isNew
      ? this.createItem(props.schema, items, itemType)
      : (items[itemType] || {})[itemId];
    this.state = {
      hasChanged: false,
      isSaving: false,
      curValues,
    };
  }

  createItem(schema, items, itemType) {
    const out = {};
    const { allowManualSorting, singleton } = schema[itemType];
    out.id = singleton ? 'default' : '';
    if (allowManualSorting) out.rank = getNewRank(items, itemType);
    return out;
  }

  componentDidMount() {
    // This only covers the user refreshing the page or navigating away from
    // it, not client-side route changes -- these are handled by
    // react-router's Prompt component, see below
    window.addEventListener('beforeunload', this.onLeavePage);
    window.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onLeavePage);
    window.removeEventListener('keydown', this.onKeyDown);
    this.isUnmounted = true;
  }

  // ================================================
  render() {
    if (this.state.curValues == null) return <InvalidRoute />;
    return (
      <div className="editor">
        {this.renderHeader()}
        {this.renderFields()}
        <Prompt
          when={this.state.hasChanged}
          message={_t('message_You will lose your changes!')}
        />
        {this.renderTranslator()}
        <style jsx global>
          {STYLES}
        </style>
      </div>
    );
  }

  renderHeader() {
    const disabled = !this.state.hasChanged || this.state.isSaving;
    const { schema, itemType } = this.props;
    const { singleton, displayName } = schema[itemType];
    return (
      <div className="editor-header">
        <h2>
          {singleton ? (
            <span>{displayName}</span>
          ) : (
            <>
              <span
                className="item-type"
                onClick={() => this.props.history.goBack()}
              >
                {displayName}
              </span>{' '}
              <span className="id">{this.state.curValues.id || ''}</span>
            </>
          )}{' '}
          <Icon
            className={classnames('editor-save-button', { enabled: !disabled })}
            disabled={disabled}
            onClick={() => this.onSaveChanges()}
            icon="save"
          />
        </h2>
        <style jsx>{STYLES_HEADER}</style>
      </div>
    );
  }

  renderFields() {
    return this.getFields().map(this.renderField);
  }

  renderField = ([attr, spec]: any) => (
    <div key={attr} className="field-row">
      {this.renderFieldTitle(attr, spec)}
      {/* {this.renderFileSelect(attr, spec)} */}
      {this.renderValueSelect(attr, spec)}
      {this.renderFieldValue(attr, spec)}
      <style jsx>{STYLES_FIELD}</style>
    </div>
  );

  renderFieldTitle(attr, spec) {
    const { placeholder } = spec;
    const { config, schema, itemType } = this.props;
    const { singleton } = schema[itemType];
    const { curValues } = this.state;
    const extras = [];
    if (spec.type === 'markdown' && spec.isRequired && !curValues[attr]) {
      extras.push(
        <div key={`${attr}-required`} className="instructions-required">
          {_t('editor_This is a required field')}
        </div>
      );
    }
    if (spec.type === 'markdown' && placeholder) {
      extras.push(
        <div key={`${attr}-example`} className="instructions">
          {_t('editor_Example:')} {placeholder}
        </div>
      );
    }
    if (spec.displayExtra) {
      extras.push(
        <div key={`${attr}-user-instructions`} className="instructions">
          {spec.displayExtra}
        </div>
      );
    }
    if (attr === 'id' && !singleton) {
      extras.push(
        <div key={`${attr}-instructions`} className="instructions">
          {_t(
            'editor_Choose a descriptive ID, since it will be part of the URL. Example: lobelias-story'
          )}
        </div>
      );
    }
    if (spec.allowCustomBlocks) {
      const help = config.componentHelp;
      if (help != null) {
        const supportedBlocks =
          spec.allowCustomBlocks === true
            ? Object.keys(help)
            : spec.allowCustomBlocks;
        supportedBlocks.sort();
        extras.push(
          <div
            key={`${attr}-instructions-custom-blocks`}
            className="instructions"
          >
            {_t('editor_Custom blocks you can use:')}
            <br />
            {supportedBlocks.map((blockName) => (
              <React.Fragment key={blockName}>
                <span>- {blockName}</span>
                <br />
              </React.Fragment>
            ))}
          </div>
        );
      }
    }
    return (
      <div className="field-title">
        <b>
          {spec.displayName}
          {this.renderRequiredFlag(spec)}
        </b>{' '}
        {extras.length ? <>{extras}</> : null}
        <style jsx>{STYLES_FIELD_TITLE}</style>
      </div>
    );
  }

  renderRequiredFlag(spec) {
    if (!spec.isRequired) return null;
    return (
      <span
        className="is-required"
        title={_t("tooltip_Required. Don't forget to fill it in!")}
      >
        *<style jsx>{STYLES_IS_REQUIRED}</style>
      </span>
    );
  }

  renderFileSelect(attr, spec) {
    if (!spec.isUploadedFile) return null;
    return <FilePicker value="" placeholder={spec.placeholder} />;

    // const items = this.props.files.map((d) => ({
    //   label: d.name,
    //   value: d.url || d.name,
    // }));
    // items.sort(choiceComparator);
    // return (
    //   <DropDownMenu
    //     className="file-select-drop-down"
    //     items={items}
    //     onClickItem={(ev, value) => this.onChangeAttr(attr, value)}
    //   >
    //     <Icon family="far" icon="copy" />
    //   </DropDownMenu>
    // );
  }

  renderValueSelect(attr, spec) {
    if (spec.type === 'select') return null;
    if (!spec.choicesFixed && !spec.choicesPreviousValues) return null;
    const { isMultiple } = spec;
    const { itemType } = this.props;
    const items = getSelectChoices(attr, spec, this.props.items[itemType]);
    return (
      <DropDownMenu
        className="value-select-drop-down"
        items={items}
        onClickItem={(ev, value) =>
          isMultiple
            ? this.onAddItemToMultipleAttr(attr, value)
            : this.onChangeAttr(attr, value)
        }
      >
        <Icon icon="bars" />
      </DropDownMenu>
    );
  }

  renderFieldValue(attr, spec) {
    const { items, itemType, itemId } = this.props;
    const invalidIds = Object.keys(items[itemType] || {}).filter(
      (o) => o !== itemId
    );
    const validators =
      attr === 'id' || spec.isRequired
        ? [
            isRequired(),
            (val) =>
              invalidIds.indexOf(val) >= 0
                ? _t('editor_already used')
                : undefined,
          ]
        : [];
    const value = this.state.curValues[attr];
    const options = { value, spec, attr, validators };
    switch (spec.type) {
      case 'string':
        if (spec.isUploadedFile) {
          return this.renderFileField(options);
        }
        return this.renderTextField(options);
      case 'number':
        return this.renderNumberField(options);
      case 'boolean':
        return this.renderCheckboxField(options);
      case 'date':
        return this.renderDateField(options);
      case 'color':
        return this.renderColorField(options);
      case 'select':
        return this.renderSelectField(options);
      case 'markdown':
        return this.renderMarkdownField(options);
      default:
        throw new Error(`Unknown field type ${spec.type} (field: ${attr})`);
    }
  }

  renderFileField({ value, spec, attr, validators }) {
    return (
      <FilePicker
        value={value}
        placeholder={spec.placeholder}
        validators={validators}
        onChange={(newValue) => this.onChangeAttr(attr, newValue)}
      />
    );
  }

  renderTextField({ value, spec, attr, validators }) {
    const { schema, itemType } = this.props;
    const { singleton } = schema[itemType];
    const disabled = attr === 'id' && singleton;
    return (
      <div className="text-input-wrapper">
        <TextInput
          ref={(c) => {
            this.inputRefs[attr] = c;
          }}
          value={value}
          placeholder={spec.placeholder}
          onChange={(ev, newValue) => this.onChangeAttr(attr, newValue)}
          cleanUpOnChange={attr === 'id' ? cleanUpId : undefined}
          cleanUpOnValidate={spec.isMultiple ? cleanUpMultiple : undefined}
          validators={validators}
          disabled={disabled}
        />
        {spec.isExternalUrl && !!value && (
          <a href={value} target="_blank" rel="noopener noreferrer">
            <Icon icon="external-link-alt" />
          </a>
        )}
        <style jsx>{STYLES_TEXT_FIELD}</style>
      </div>
    );
  }

  renderNumberField({ value, spec, attr, validators }) {
    return (
      <NumberInput
        ref={(c) => {
          this.inputRefs[attr] = c;
        }}
        value={value}
        placeholder={spec.placeholder}
        onChange={(ev, newValue) => this.onChangeAttr(attr, newValue)}
        validators={validators}
      />
    );
  }

  renderCheckboxField({ value, spec, attr, validators }) {
    return (
      <Checkbox
        ref={(c) => {
          this.inputRefs[attr] = c;
        }}
        value={value}
        placeholder={spec.placeholder}
        onChange={(ev, newValue) => this.onChangeAttr(attr, newValue)}
        validators={validators}
      />
    );
  }

  renderDateField({ value, spec, attr, validators }) {
    return (
      <DateInput
        ref={(c) => {
          this.inputRefs[attr] = c;
        }}
        type="native"
        date
        time={false}
        value={value}
        placeholder={spec.placeholder}
        onChange={(ev, newValue) => this.onChangeAttr(attr, newValue)}
        validators={validators}
      />
    );
  }

  renderColorField({ value, attr, validators }) {
    return (
      <ColorInput
        ref={(c) => {
          this.inputRefs[attr] = c;
        }}
        value={value}
        onChange={(ev, newValue) => this.onChangeAttr(attr, newValue)}
        validators={validators}
      />
    );
  }

  renderSelectField({ value, spec, attr, validators }) {
    const { itemType } = this.props;
    const choices = getSelectChoices(attr, spec, this.props.items[itemType]);
    return (
      <>
        <Select
          ref={(c) => {
            this.inputRefs[attr] = c;
          }}
          className={value ? undefined : 'empty'}
          type={spec.inlineSelect ? 'inlinePicker' : 'dropDownPicker'}
          value={value}
          onChange={(ev, newValue) => this.onChangeAttr(attr, newValue)}
          items={choices}
          validators={validators}
          required={spec.isRequired}
          twoStageStyle
        />
        <style jsx global>
          {STYLES_SELECT}
        </style>
      </>
    );
  }

  renderMarkdownField({ value, spec, attr }) {
    const height = spec.height || DEFAULT_MARKDOWN_HEIGHT;
    return (
      <div className="markdown-field-value">
        <div className="textarea-panel">
          <ReactMde
            value={{ text: value, selection: null }}
            placeholder={spec.placeholder}
            onChange={(v) => this.onChangeAttr(attr, v.text)}
            commands={ReactMdeCommands.getDefaultCommands()}
            visibility={{ preview: false }}
            textAreaProps={{ style: style.textarea(height) }}
          />
        </div>
        <div className="preview-panel">
          <div className="preview-title">
            {_t('editor_Preview').toUpperCase()}
          </div>
          <div className="preview-field">
            <ReactMarkdown
              source={this.preProcessMarkdown(value)}
              renderers={{
                code: this.renderMarkdownCode,
                image: this.renderMarkdownImage,
              }}
            />
          </div>
        </div>
        <style jsx>{`
          .markdown-field-value {
            flex: 1 0 0px;
            display: flex;
          }
          .textarea-panel {
            width: 50%;
          }
          .preview-panel {
            width: 50%;
            max-width: 600px;
            overflow-x: inherit;
            padding-left: 10px;
          }
          .preview-title {
            height: 33px;
            font-weight: 900;
            padding: 8px 0;
            letter-spacing: 3px;
            color: #aaa;
          }
          .preview-field {
            height: ${height}px;
            overflow-y: auto;
            margin-top: -4px;
          }
        `}</style>
      </div>
    );
  }

  renderMarkdownCode = ({ language, value }) => (
    <MarkdownCustomBlockPreview
      name={language}
      contents={value}
      config={this.props.config}
    />
  );

  /* eslint-disable react/jsx-props-no-spreading */
  renderMarkdownImage = ({ src, ...props }) => (
    <img
      src={/^http/.test(src) ? src : `/editorial/_file/${src}`}
      width="100%"
      {...props}
    />
  );
  /* eslint-enable react/jsx-props-no-spreading */

  renderTranslator() {
    if (this.props.config.noTranslation) return null;
    const scope = `${this.props.itemType}-${this.props.itemId}`;
    return (
      <>
        <h3>{_t('editor_Translations')}</h3>
        {this.state.hasChanged && !this.state.isSaving && (
          <p className="instructions">
            <button type="button" onClick={this.onSaveChanges}>
              Save changes
            </button>{' '}
            to update the translation table:
          </p>
        )}
        <Translator key={scope} scope={scope} apiUrl="/mady-api" height={-1} />
        <style jsx>{`
          h3 {
            font-size: 1.2rem;
            margin-top: 25px;
          }
          :global(.mady-toolbar) {
            background-color: #eeeeee;
            font-size: inherit;
          }
          :global(.mady-translator) {
            margin-bottom: 20px;
          }
          :global(.mady-toolbar-title) {
            color: #aaa;
          }
        `}</style>
      </>
    );
  }

  // ================================================
  /* eslint-disable no-param-reassign */
  onLeavePage = (ev) => {
    if (this.isUnmounted || !this.state.hasChanged) return undefined;
    const msg = 'You will lose your changes!';
    if (ev) ev.returnValue = msg;
    else if (window.event) window.event.returnValue = msg;
    return msg;
  };
  /* eslint-enable no-param-reassign */

  onChangeAttr(attr, value) {
    const curValues0 = this.state.curValues;
    const curValues = timmSet(curValues0, attr, value);
    if (curValues === curValues0) return;
    this.setState({ hasChanged: true, curValues });
  }

  onAddItemToMultipleAttr(attr, item) {
    let { curValues } = this.state;
    const curValue = this.state.curValues[attr] || '';
    const curItems = curValue.split(REGEX_MULTIPLE_LIST).filter((o) => !!o);
    if (curItems.indexOf(item) >= 0) return;
    curItems.push(item);
    const value = curItems.join(', ');
    curValues = timmSet(curValues, attr, value);
    this.setState({ hasChanged: true, curValues });
  }

  onKeyDown = (ev) => {
    if (ev.key === 's' && (ev.metaKey || ev.ctrlKey) && !ev.altKey) {
      this.onSaveChanges();
      cancelEvent(ev);
    }
  };

  onSaveChanges = async () => {
    // Validate Giu inputs
    try {
      const refs = Object.keys(this.inputRefs)
        .map((o) => this.inputRefs[o])
        .filter((o) => o != null);
      await Promise.all(refs.map(async (ref) => ref.validateAndGetValue()));
    } catch (err) {
      return;
    }

    // Validate Markdown inputs
    const { curValues } = this.state;
    const { schema, itemType } = this.props;
    const { fields = {} } = schema[itemType];
    let isValid = true;
    Object.keys(fields).forEach((attr) => {
      const spec = fields[attr];
      if (!spec) return;
      if (spec.isRequired && !curValues[attr]) isValid = false;
    });
    if (!isValid) return;

    // Proceed with saving!
    this.setState({ isSaving: true });
    try {
      const { itemId } = this.props;
      await this.props.updateItem(itemType, itemId, curValues);
      notifyResult('ok');
      this.setState({ hasChanged: false, isSaving: false }, () => {
        const { history } = this.props;
        if (curValues.id !== itemId) {
          history.replace(`/editorial/${itemType}/${curValues.id}`);
        }
      });
    } catch (err) {
      notifyResult('nok');
      if (!this.isUnmounted) this.setState({ isSaving: false });
      console.error(err); // eslint-disable-line
    }
  };

  // ================================================
  // Substitute line breaks
  preProcessMarkdown(value) {
    if (!value) return null;
    return (
      value
        .replace(/^[\r\n][\r\n]/gm, '\n&#8203;  \n')
        // We support this custom markdown for line-breaks: ¶\n or ¶
        .replace(/¶\n/g, '¶') // We allow ¶ + \n for clarity
        .replace(/¶/g, '  \n')
    ); // Markdown for <br />: two spaces at the end
  }

  // Add fields which are not in the schema: id, rank, _draft, _noTranslation
  getFields() {
    const { schema, itemType } = this.props;
    const fields = Object.entries(schema[itemType].fields);
    if (!this.props.config.noTranslation) {
      fields.unshift([
        '_noTranslation',
        {
          type: 'boolean',
          displayName: _t('editor_Not translated'),
        },
      ]);
    }
    fields.unshift([
      '_draft',
      {
        type: 'boolean',
        displayName: _t('editor_Draft'),
        displayExtra: _t("editor_Updates won't be published"),
      },
    ]);
    fields.unshift([
      'id',
      {
        type: 'string',
        displayName: _t('editor_Identifier'),
        placeholder: 'Id',
      },
    ]);
    return fields;
  }
}

// ================================================
// Clean up id for URL
const cleanUpId = (id) => {
  if (id == null) return id;
  return simplifyString(id)
    .replace(/_/gi, '-')
    .replace(/\s/gi, '-')
    .replace(/[^a-z0-9-]/gi, '');
};

const cleanUpMultiple = (value) =>
  (value || '')
    .split(REGEX_MULTIPLE_LIST)
    .filter((o) => !!o)
    .join(', ');

const getSelectChoices = (attr, spec, items) => {
  const { choicesFixed = [], choicesPreviousValues } = spec;
  let out = [];
  const usedKeys = {};
  for (let i = 0; i < choicesFixed.length; i++) {
    const choice = choicesFixed[i];
    if (usedKeys[choice]) continue;
    usedKeys[choice] = true;
    out.push({ label: choice, value: choice });
  }
  if (choicesPreviousValues) {
    const choices2 = getPreviousChoices(usedKeys, attr, spec, items);
    if (out.length && choices2.length) {
      out.push(LIST_SEPARATOR);
    }
    out = out.concat(choices2);
  }
  return out;
};

const previousItems = {};
const previousChoices = {};

/* eslint-disable no-param-reassign */
const getPreviousChoices = (usedKeys, attr, spec, items) => {
  if (previousItems[attr] === items) return previousChoices[attr];
  previousItems[attr] = items;
  const ids = Object.keys(items);
  const out = [];
  const { isMultiple } = spec;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const item = items[id];
    let attrValue = item[attr];
    if (!attrValue) continue;
    attrValue = String(attrValue);
    const values = isMultiple
      ? attrValue.split(REGEX_MULTIPLE_LIST)
      : [attrValue];
    for (let k = 0; k < values.length; k++) {
      const value = values[k];
      if (usedKeys[value]) continue;
      usedKeys[value] = true;
      out.push({ label: value, value });
    }
  }
  out.sort(choiceComparator);
  previousChoices[attr] = out;
  return out;
};
/* eslint-enable no-param-reassign */

const choiceComparator = (a, b) => {
  const aLabel = simplifyString(a.label);
  const bLabel = simplifyString(b.label);
  if (aLabel < bLabel) return -1;
  if (aLabel > bLabel) return +1;
  return 0;
};

// ================================================
const STYLES = css.global`
  .editor {
    padding: 0 15px 30px;
  }
  .giu-input,
  .giu-text-input,
  .giu-number-input,
  .giu-date-input input {
    width: 100%;
    border: none;
  }
  .file-select-drop-down,
  .value-select-drop-down {
    margin-left: -4px;
  }
`;

const STYLES_HEADER = css`
  .editor-header {
    position: sticky;
    top: 0;
    margin-bottom: 10px;
    z-index: 2;
    background-color: white;
    box-shadow: 0 10px 15px rgba(255, 255, 255, 0.8),
      0 3px 6px rgba(255, 255, 255, 0.8);
  }
  .item-type {
    color: #ccc;
    cursor: pointer;
  }
  .item-type:hover {
    text-decoration: underline;
  }
  .id:before {
    content: '>';
    color: #ccc;
    margin: 0 9px 0 6px;
  }
  :global(.editor-save-button) {
    margin-left: 20px;
  }
  :global(.editor-save-button.enabled) {
    color: #800000;
    animation: 0.5s infinite alternate pulse;
  }
`;

const STYLES_FIELD = css`
  .field-row {
    display: flex;
    border-bottom: 1px solid #e0e0e0;
    flex-wrap: nowrap;
    padding: 2px 0;
    align-items: baseline;
    min-height: 22px;
  }
`;

const STYLES_FIELD_TITLE = css`
  .field-title {
    width: 200px;
    flex: none;
    padding-right: 10px;
  }
  .field-title :global(.instructions) {
    color: #aaa;
  }
  .field-title :global(.instructions-required) {
    color: red;
  }
`;

const STYLES_IS_REQUIRED = css`
  .is-required {
    color: red;
    margin-left: 2px;
  }
`;

const STYLES_TEXT_FIELD = css`
  .text-input-wrapper {
    display: flex;
    width: 100%;
  }
  :global(.giu-text-input.giu-input-disabled) {
    color: gray;
  }
`;

const STYLES_SELECT = css.global`
  .giu-select-custom {
    border: none;
    min-width: 0px;
    padding: 0px 1px;
  }
  .giu-select-custom.empty .giu-select-custom-title-text {
    width: 0px;
  }
  .giu-select-custom.empty .giu-select-custom-caret {
    margin-left: 2px;
  }
  .giu-select-custom-wrapper .giu-list-picker {
    border: none;
    max-height: 200px;
    --color-accent-bg: #e0e0e0;
  }
  .giu-select-custom-wrapper .giu-list-item {
    padding-left: 1px;
    padding-right: 1px;
  }
`;

const style = {
  textarea: (height) => ({
    height,
    minHeight: height,
    resize: 'none',
  }),
};

// ================================================
// Public
// ================================================
export default withRouter(connect(mapStateToProps, actions)(Editor));
