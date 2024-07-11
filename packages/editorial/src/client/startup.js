/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import { library as faLibrary } from '@fortawesome/fontawesome-svg-core';
import { far as farIcons } from '@fortawesome/free-regular-svg-icons';
import { fas as fasIcons } from '@fortawesome/free-solid-svg-icons';
import '@fortawesome/fontawesome-svg-core/styles.css';
import 'react-mde/lib/styles/css/react-mde-all.css';
import 'giu/lib/css/reset.css';
import 'giu/lib/css/giu.css';
import 'mady-client-components/lib/css/mady-components.css';
import Root from './components/000-Root';
import initFirebase from './gral/firebase';

faLibrary.add(farIcons, fasIcons);

moment.locale('en-gb');
initFirebase();

ReactDOM.render(<Root />, document.getElementById('app'));
