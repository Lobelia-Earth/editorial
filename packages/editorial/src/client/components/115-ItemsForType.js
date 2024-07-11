// @flow

/* eslint-env browser */
import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Link, withRouter } from 'react-router-dom';
import css from 'styled-jsx/css';
import { Icon, cancelEvent, DataTable, SORT_MANUALLY } from 'giu';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import _t from '../gral/mady';
import * as actions from '../actions';
import { getSchema, getItems } from '../reducers';
import { launchWarningModal, notifyResult } from './helpers';
import { NEW_ITEM_ID } from '../gral/constants';
import IconButton from './930-IconButton';

const COLOR_NULL = '#ddd';
const COLORS = [
  'rgb(31, 119, 180)',
  'rgb(174, 199, 232)',
  'rgb(255, 127, 14)',
  'rgb(255, 187, 120)',
  'rgb(44, 160, 44)',
  'rgb(152, 223, 138)',
  'rgb(214, 39, 40)',
  'rgb(255, 152, 150)',
  'rgb(148, 103, 189)',
  'rgb(197, 176, 213)',
  'rgb(140, 86, 75)',
  'rgb(196, 156, 148)',
  'rgb(227, 119, 194)',
  'rgb(247, 182, 210)',
  'rgb(127, 127, 127)',
  'rgb(199, 199, 199)',
  'rgb(188, 189, 34)',
  'rgb(219, 219, 141)',
  'rgb(23, 190, 207)',
  'rgb(158, 218, 229)',
];

// ================================================
// Declarations
// ================================================
const mapStateToProps = (state) => ({
  schema: getSchema(state),
  items: getItems(state),
});

type Props = {
  itemType: string,
  // From Redux
  schema: Object,
  items: Object,
  updateItem: Function,
  // withRouter
  history: Object,
};
type State = {};

// ================================================
// ItemsForType
// ================================================
class ItemsForType extends React.Component<Props, State> {
  manuallyOrderedIds: ?Array<string>;

  // ================================================
  render() {
    const { itemType, schema, items } = this.props;
    const { singleton } = schema[itemType];
    const itemsForType = items[itemType] || {};
    const canCreate = !singleton || !Object.keys(itemsForType).length;
    return (
      <div className="items-for-type">
        <a className="anchor" id={itemType}>
          {itemType}
        </a>
        <h2>{this.props.schema[itemType].displayName}</h2>
        {this.renderDescription()}
        <div className="item-list">
          <div className="item-list-inner">
            {this.renderTable()}
            {canCreate && (
              <div className="create-item" onClick={this.onCreate}>
                {_t('pages_Create…')}
              </div>
            )}
          </div>
        </div>
        <style jsx>{STYLES}</style>
      </div>
    );
  }

  renderDescription() {
    const { description } = this.props.schema[this.props.itemType];
    if (!description) return null;
    return (
      <div className="description">
        <ReactMarkdown source={description} />
        <style jsx>{`
          .description {
            color: gray;
          }
        `}</style>
      </div>
    );
  }

  renderTable() {
    const { schema, items, itemType } = this.props;
    const itemTypeSchema = schema[itemType];
    const { singleton, linesPerRow } = itemTypeSchema;
    const itemsById = items[itemType] || {};
    const allowManualSorting = !!schema[itemType].allowManualSorting;
    if (allowManualSorting) {
      const ids = Object.keys(itemsById);
      this.manuallyOrderedIds = ids
        .map((id) => itemsById[id])
        .sort(byRank)
        .map((o) => o.id);
    }
    return (
      <div
        className={classnames('editorial-datatable-outer', {
          'lines-per-row-1': linesPerRow === 1,
          'lines-per-row-2': linesPerRow === 2 || linesPerRow == null,
          'lines-per-row-3': linesPerRow === 3,
        })}
      >
        <DataTable
          className="editorial-datatable"
          itemsById={itemsById}
          shownIds={Object.keys(itemsById)}
          cols={this.getCols()}
          allowSelect={false}
          allowManualSorting={allowManualSorting}
          sortBy={
            singleton ? undefined : allowManualSorting ? SORT_MANUALLY : 'id'
          }
          manuallyOrderedIds={this.manuallyOrderedIds}
          onChangeManualOrder={this.onChangeManualOrder}
          onRowDoubleClick={this.onRowDoubleClick}
          emptyIndicator={singleton ? <span /> : undefined}
          height={-1}
        />
        <style jsx global>
          {STYLES_TABLE}
        </style>
      </div>
    );
  }

  // ================================================
  getCols() {
    const { itemType, schema } = this.props;
    const itemTypeSchema = schema[itemType];
    const { singleton, fields } = schema[itemType];
    const cols = [];

    // ID
    cols.push({
      attr: 'id',
      label: 'ID',
      minWidth: 150,
      render: ({ item }) => (
        <Link className="item-id" to={`/editorial/${itemType}/${item.id}`}>
          {item.id}
          {item._draft && <span className="draft">DRAFT</span>}
          <style jsx>{`
            .item-id {
              color: gray;
            }
            .draft {
              display: inline-block;
              font-size: 0.7rem;
              background-color: gray;
              color: white;
              padding: 0 6px;
              border-radius: 6px;
              margin-left: 0.5em;
            }
          `}</style>
        </Link>
      ),
      sortable: !singleton,
    });

    // Specific item fields
    Object.keys(fields).forEach((attr) => {
      const field = fields[attr];
      if (!field.showInSummary) return;
      const isBoolean = field.type === 'boolean';
      const isDate = field.type === 'date';
      const isExternalUrl = !!field.isExternalUrl;
      const linesPerRow = itemTypeSchema.linesPerRow;
      const { colorCode } = field;
      let render;
      if (isBoolean) {
        render = ({ item }) => (
          <Icon icon="square" family={item[attr] ? 'fa' : 'far'} />
        );
      } else if (isDate) {
        render = ({ item }) =>
          item[attr] != null ? moment.utc(item[attr]).format('DD/MM/YYYY') : '';
      } else if (isExternalUrl) {
        render = ({ item }) =>
          item[attr] != null ? (
            <a href={item[attr]} target="_blank" rel="noopener noreferrer">
              <Icon className="editorial-url-button" icon="external-link-alt" />{' '}
              {item[attr]}
            </a>
          ) : (
            ''
          );
      } else if (linesPerRow != null || colorCode) {
        render = ({ item }) => {
          const value = item[attr];
          const title = linesPerRow != null ? value : undefined;
          return (
            <span title={title}>
              {colorCode && (
                <span
                  className="editorial-color-code-value"
                  style={{ backgroundColor: getColorForValue(value) }}
                >
                  &nbsp;
                </span>
              )}
              {value}
            </span>
          );
        };
      }
      cols.push({
        attr,
        className: isBoolean ? 'editorial-boolean-col' : undefined,
        label: field.displayName,
        labelLevel: isBoolean ? field.labelLevel || 1 : field.labelLevel,
        sortable: !singleton,
        sortValue: isDate
          ? (item) =>
              item[attr] != null
                ? new Date(item[attr]).toISOString()
                : undefined
          : undefined,
        render,
      });
    });

    // Delete button
    if (!singleton) {
      cols.push({
        attr: 'operations',
        label: () => _t('col_Operations'),
        render: ({ item }) => (
          <IconButton
            icon="times"
            label={_t('pages_Delete')}
            onClick={(ev) => this.onDelete(ev, item.id)}
          />
        ),
        sortable: false,
      });
    }
    return cols;
  }

  // ================================================
  onRowDoubleClick = (ev, id) => {
    this.props.history.push(`/editorial/${this.props.itemType}/${id}`);
  };

  onDelete(ev, id) {
    const { itemType, schema } = this.props;
    const { singleton, displayName } = schema[itemType];
    const message = (
      <div>
        <div style={{ paddingRight: 10 }}>
          Delete item <b>{singleton ? displayName : id}</b>?
        </div>
        <div style={{ paddingRight: 10 }}>
          {_t('pages_Deleted items cannot be recovered')}
        </div>
      </div>
    );
    launchWarningModal(
      _t('pages_Confirm deletion'),
      message,
      _t('pages_Cancel'),
      _t('pages_Delete'),
      () => this.doDelete(this.props.itemType, id)
    );
    cancelEvent(ev);
  }

  async doDelete(itemType, id) {
    try {
      await this.props.updateItem(itemType, id, null);
      notifyResult('ok');
    } catch (err) {
      notifyResult('nok');
      throw err;
    }
  }

  onCreate = async () => {
    this.props.history.push(`/editorial/${this.props.itemType}/${NEW_ITEM_ID}`);
  };

  onChangeManualOrder = async (orderedIds, { draggedId }) => {
    if (draggedId == null) return;
    const { itemType } = this.props;
    const { items } = this.props;
    const itemsById = items[itemType];
    const newIndex = orderedIds.indexOf(draggedId);
    if (this.manuallyOrderedIds == null) return;
    const oldIndex = this.manuallyOrderedIds.indexOf(draggedId);
    if (newIndex === oldIndex) return;
    const len = orderedIds.length;
    let rank;
    if (newIndex === 0) {
      rank = len > 1 ? itemsById[orderedIds[1]].rank - 10 : 0;
    } else if (newIndex === len - 1) {
      rank = len > 1 ? itemsById[orderedIds[len - 2]].rank + 10 : 0;
    } else {
      const rankBefore = itemsById[orderedIds[newIndex - 1]].rank;
      const rankAfter = itemsById[orderedIds[newIndex + 1]].rank;
      rank = (rankBefore + rankAfter) / 2;
    }
    try {
      const item = itemsById[draggedId];
      await this.props.updateItem(itemType, draggedId, { ...item, rank });
      notifyResult('ok');
    } catch (err) {
      notifyResult('nok');
      throw err;
    }
  };
}

// ================================================
const byRank = (a, b) => {
  const { rank: rankA } = a;
  const { rank: rankB } = b;
  if (rankA < rankB) return -1;
  if (rankA > rankB) return +1;
  // In any case, we have to return something stable
  return a.id < b.id ? -1 : +1;
};

const colors = {};
let idxColor = 0;
const getColorForValue = (value) => {
  let color = colors[value];
  if (color) return color;
  color = value ? COLORS[idxColor] : COLOR_NULL;
  idxColor += 1;
  colors[value] = color;
  return color;
};

// ================================================
const style = {
  col: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

// ================================================
const STYLES = css`
  .items-for-type {
    margin-bottom: 40px;
    position: relative;
  }
  .anchor {
    position: absolute;
    top: -35px;
    opacity: 0;
    pointer-events: none;
  }
  .item-list {
    padding-bottom: 4px;
    border-bottom: 1px solid #ccc;
  }
  .item-list-inner {
    min-width: 630px;
  }
  .create-item {
    background-color: #f0f0f0;
    color: #999;
    border-radius: 5px;
    margin: 4px 0;
    padding: 4px 10px;
    text-align: center;
    cursor: pointer;
  }
  .create-item:hover {
    background-color: #e0e0e0;
  }
`;

const STYLES_TABLE = css.global`
  .editorial-datatable {
    line-height: 1.4;
    border-top: 1px solid #ccc;
  }
  .editorial-datatable .giu-large-message {
    color: #ccc;
  }
  .giu-data-table-header {
    border-bottom: 1px solid #ccc;
    padding-top: 4px;
    padding-bottom: 4px;
    color: #aaa;
  }
  .giu-data-table-row .giu-data-table-cell:not(.giu-data-table-col-id) {
    text-overflow: ellipsis;
    overflow-x: hidden;
  }
  .lines-per-row-1
    .giu-data-table-row
    .giu-data-table-cell:not(.giu-data-table-cell-hidden):not(.giu-data-table-col-id) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow-y: hidden;
  }
  .lines-per-row-2
    .giu-data-table-row
    .giu-data-table-cell:not(.giu-data-table-cell-hidden):not(.giu-data-table-col-id) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow-y: hidden;
  }
  .lines-per-row-3
    .giu-data-table-row
    .giu-data-table-cell:not(.giu-data-table-cell-hidden):not(.giu-data-table-col-id) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow-y: hidden;
  }
  .giu-data-table-col-id:not(.giu-data-table-header-cell) {
    color: #aaa;
  }
  .giu-data-table-col-operations {
    flex: 0 0 150px;
  }
  .editorial-boolean-col {
    flex: 0 0 45px;
    max-width: 45px;
  }
  .editorial-url-button {
    color: #999;
  }
  .editorial-color-code-value {
    display: inline-block;
    margin-right: 4px;
    width: 6px;
    color: transparent;
  }
`;

// ================================================
// Public
// ================================================
export default withRouter(connect(mapStateToProps, actions)(ItemsForType));
