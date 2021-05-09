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
  openPipIcon.classList.add('buttonicon-open-pip', 'note-list-action-bar-item-icon"');
  openPipIcon.textContent = '⧉';
  openPipButton.appendChild(openPipIcon);

  openPipButton.addEventListener('click', () => {
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

    const src = `https://app.box.com/notes_embedded/${fileId}?isReadonly=1&is_preview=1`;
    const object = document.createElement('object');
    object.type = 'text/html';
    object.data = src;
    pipWindow.appendChild(object);

    const headerBar = document.createElement('header');
    pipWindow.appendChild(headerBar);

    const noteUrls = document.querySelectorAll('a.note-list-item-link-wrapper[href]');
    const noteList = headerBar.appendChild(document.createElement('select'));
    noteList.addEventListener('change', (event) => {
      event.preventDefault();
      object.data = event.target.value;
    });
    Array.from(noteUrls).reduce((noteList, a) => {
      const href = a.href;
      const fileId = href.substring(href.lastIndexOf('/') + 1);

      const option = noteList.appendChild(document.createElement('option'));
      option.value = `https://app.box.com/notes_embedded/${fileId}?isReadonly=1&is_preview=1`;
      option.textContent = a.querySelector('.note-list-item-title').textContent;
      option.selected = option.value === src;
      return noteList;
    }, noteList);

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
