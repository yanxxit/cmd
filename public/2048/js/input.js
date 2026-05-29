// Input bindings for keyboard, touch and buttons.
export function bindGameInput({ refs, onMove, onRestart, onUndo }) {
  refs.restartButtons.forEach((button) => {
    button.addEventListener('click', onRestart);
  });

  refs.undoButtons.forEach((button) => {
    button.addEventListener('click', onUndo);
  });

  refs.moveButtons.forEach((button) => {
    button.addEventListener('click', () => onMove(button.dataset.direction));
  });

  const keyMap = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  };

  const handleKeydown = (event) => {
    if (keyMap[event.key]) {
      event.preventDefault();
      onMove(keyMap[event.key]);
      return;
    }

    if ((event.key === 'z' || event.key === 'Z') && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      onUndo();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault();
      onUndo();
    }
  };

  let touchStartX = null;
  let touchStartY = null;

  const handleTouchStart = (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null || touchStartY === null) {
      return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) {
        onMove('right');
      } else if (dx < -30) {
        onMove('left');
      }
    } else if (dy > 30) {
      onMove('down');
    } else if (dy < -30) {
      onMove('up');
    }

    touchStartX = null;
    touchStartY = null;
  };

  document.addEventListener('keydown', handleKeydown);
  refs.gameContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
  refs.gameContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
}
