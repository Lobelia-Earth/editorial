// @flow

import React from 'react';
import { Icon, Button } from 'giu';
import css from 'styled-jsx/css';

// ================================================
// Component
// ================================================
const IconButton = ({
  icon,
  label,
  disabled,
  onClick,
  primary,
}: {
  icon: string,
  label: any,
  disabled?: boolean,
  onClick: Function,
  primary?: boolean,
}) => (
  <Button
    className="icon-button"
    disabled={disabled}
    primary={primary}
    onClick={onClick}
  >
    <Icon className="icon-button-icon" icon={icon} />
    {label}
    <style jsx global>
      {STYLES}
    </style>
  </Button>
);

// ================================================
const STYLES = css.global`
  .giu-button.icon-button {
    font-size: 13px;
    padding: 1px 6px;
    white-space: nowrap;
  }
  .icon-button-icon {
    margin-right: 6px;
  }
`;

// ================================================
// Public
// ================================================
export default IconButton;
