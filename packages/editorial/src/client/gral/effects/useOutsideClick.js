/* eslint-env browser */

import { useEffect } from 'react';

const useOutsideClick = (ref, callback) => {
  const handleClick = (e: any) => {
    // Clicks in modals are not considered outside clicks.
    const modals = document.querySelector('.giu-modals');
    if (modals && modals.contains(e.target)) {
      return;
    }

    if (ref.current && !ref.current.contains(e.target)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  });
};

export default useOutsideClick;
