// @flow

import React from 'react';
import { LargeMessage } from 'giu';
import _t from '../gral/mady';

const InvalidRoute = () => (
  <LargeMessage>
    {_t('notfound_Oops, sorry, the requested page has not been found')}
  </LargeMessage>
);

export default InvalidRoute;
