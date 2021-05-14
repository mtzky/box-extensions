((delay, repetitions, callback) => {
  let count = 0;
  const intervalID = setInterval(() => {
    const initialized = callback(count++);
    if (initialized || count === repetitions) {
      clearInterval(intervalID);
    }
  }, delay);
})(500, 6, () => {
  const container = document.querySelector('.note-list-action-bar-items-container');
  if (!container) {
    return false;
  }

  const openPipButton = document.createElement('div');
  openPipButton.classList.add('note-list-action-bar-item', 'open-pip-btn');
  openPipButton.title = 'Open a picture-in-picture window';

  const openPipIcon = document.createElement('span');
  openPipIcon.classList.add('buttonicon-open-pip', 'note-list-action-bar-item-icon');
  openPipIcon.insertAdjacentHTML(
    'beforeend',
    `<svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="40%" dominant-baseline="central" text-anchor="middle" font-size="20">⧉</text>
    </svg>`
  );
  openPipButton.appendChild(openPipIcon);

  openPipButton.addEventListener('click', () => {
    const appHost = document.querySelector('a.options-menu-breadcrumbs[href]')?.host;
    const fileId = document.querySelector('.pad[data-file-id]')?.dataset.fileId;
    const zIndex = Array.from(document.querySelectorAll('.notes-pip-window'))
      .map((e) => e.style.zIndex)
      .reduce((a, b) => Math.max(a, b), 100);

    const pipWindow = document.createElement('div');
    pipWindow.classList.add('notes-pip-window');
    pipWindow.style.zIndex = zIndex + 2;
    pipWindow.draggable = true;
    pipWindow.addEventListener('dragstart', (event) => {
      event.stopPropagation();
      event.dataTransfer.setData('application/json', `{ "x": ${event.offsetX}, "y": ${event.offsetY} }`);
      const pipWindow = event.target;

      const dropareaZIndex = zIndex + 1;
      const dropareaId = `notes-pip-droparea-${dropareaZIndex}`;
      if (document.getElementById(dropareaId)) {
        return;
      }

      const droparea = document.createElement('div');
      droparea.classList.add('notes-pip-droparea');
      droparea.id = dropareaId;
      droparea.style.zIndex = dropareaZIndex;
      droparea.addEventListener('dragenter', (event) => {
        event.preventDefault();
        pipWindow.style.display = 'none';
      });
      droparea.addEventListener('dragover', (event) => event.preventDefault());
      const finish = (event) => {
        event.preventDefault();
        document.body.removeChild(event.target);
        pipWindow.style.display = '';
      };
      droparea.addEventListener('dragend', finish);
      droparea.addEventListener('dragexit', finish);
      droparea.addEventListener('dragleave', finish);
      droparea.addEventListener('drop', (event) => {
        finish(event);

        const json = event.dataTransfer.getData('application/json');
        const offset = JSON.parse(json);

        pipWindow.style.top = `${event.y - offset.y}px`;
        pipWindow.style.left = `${event.x - offset.x}px`;
      });
      droparea.addEventListener('click', finish);

      document.body.appendChild(droparea);
    });

    const createNoteUrl = (appHost, fileId) => {
      return `//${appHost}/notes_embedded/${fileId}?isReadonly=1&is_preview=1`;
    };

    const src = createNoteUrl(appHost, fileId);
    const object = document.createElement('object');
    object.type = 'text/html';
    object.data = src;
    pipWindow.appendChild(object);

    const headerBar = document.createElement('header');
    pipWindow.appendChild(headerBar);

    const noteList = headerBar.appendChild(document.createElement('select'));
    noteList.addEventListener('change', (event) => {
      event.preventDefault();
      object.data = event.target.value;
    });

    for (const sourceList of ['inbox-list', 'favorite-notes-list']) {
      const listContainer = document.querySelector(`.${sourceList}`);
      if (!listContainer) {
        continue;
      }

      const optgroup = noteList.appendChild(document.createElement('optgroup'));
      optgroup.label = listContainer.parentElement?.querySelector('.note-list-title')?.textContent;

      const noteUrls = listContainer.querySelectorAll('a.note-list-item-link-wrapper[href]');
      for (const a of noteUrls) {
        const appHost = a.host;
        const fileId = a.href.split('/').pop();

        const option = optgroup.appendChild(document.createElement('option'));
        option.value = createNoteUrl(appHost, fileId);
        option.textContent = a.querySelector('.note-list-item-title').textContent;
        option.selected = option.value === src;
      }
    }

    headerBar.appendChild(document.createElement('span'));

    const close = headerBar.appendChild(document.createElement('a'));
    close.textContent = '⊠';
    close.title = 'Close the pip window';
    close.addEventListener('click', (event) => {
      event.preventDefault();
      document.body.removeChild(pipWindow);
    });

    document.body.appendChild(pipWindow);
  });

  const openNoteButton = container.querySelector('.open-note-btn');
  container.insertBefore(openPipButton, openNoteButton);

  return true;
});
