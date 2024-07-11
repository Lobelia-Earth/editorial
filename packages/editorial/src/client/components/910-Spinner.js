// @flow

import React from 'react';
import { Icon } from 'giu';

type Props = Object;

const Spinner = ({ size }: Props) => (
  <Icon icon="circle-notch" spin size={size} />
);

export default Spinner;
