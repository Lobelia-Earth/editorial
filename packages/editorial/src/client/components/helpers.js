// @flow

import React from 'react';
import { Icon, modalPop, modalPush, notify, flexContainer } from 'giu';
import _t from '../gral/mady';

const launchWarningModal = (
  title: string,
  message: any,
  cancelBtnLabel: string,
  confirmBtnLabel: string,
  confirmedAction: Function
) => {
  const children = (
    <div style={style.warning}>
      <div style={{ padding: '20px 10px' }}>
        <Icon icon="exclamation-triangle" fixedWidth size="3x" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{message}</div>
    </div>
  );

  const buttons = [
    {
      label: confirmBtnLabel,
      onClick: () => {
        modalPop();
        confirmedAction();
      },
      plain: true,
      style: style.btnDelete,
      left: true,
    },
    { label: cancelBtnLabel, onClick: modalPop, plain: true },
  ];
  modalPush({ title, children, buttons, onEsc: modalPop });
};

const notifyResult = (result: string) => {
  if (result === 'ok') {
    notify({ msg: _t('saving_Data saved'), type: 'success', icon: 'check' });
  } else {
    notify({
      msg: _t('saving_Server error'),
      type: 'error',
      icon: 'exclamation',
    });
  }
};

// ===============================================
// Styles
// ===============================================
const style = {
  warning: flexContainer('row', {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgb(251, 233, 231)',
    color: 'rgb(213, 0, 0)',
    minWidth: 400,
  }),
  btnDelete: {
    color: 'rgb(213, 0, 0)',
  },
};

export { launchWarningModal, notifyResult };
