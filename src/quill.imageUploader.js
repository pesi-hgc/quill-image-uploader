// eslint-disable-next-line import/extensions
import LoadingImage from './blots/image.js';
import ImageLink from './blots/imageLink.js';

import './quill.imageUploader.css';

class ImageUploader {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;
    this.range = null;

    if (typeof this.options.upload !== 'function') {
      // eslint-disable-next-line no-console
      console.warn(
        '[Missing config] upload function that returns a promise is required',
      );
    }

    const toolbar = this.quill.getModule('toolbar');
    toolbar.addHandler('image', this.selectLocalImage.bind(this));

    this.handleDrop = this.handleDrop.bind(this);
    this.handlePaste = this.handlePaste.bind(this);

    this.quill.root.addEventListener('drop', this.handleDrop, false);
    this.quill.root.addEventListener('paste', this.handlePaste, false);
  }

  selectLocalImage() {
    this.range = this.quill.getSelection();
    this.fileHolder = document.createElement('input');
    this.fileHolder.setAttribute('type', 'file');
    this.fileHolder.setAttribute('accept', 'image/*');
    this.fileHolder.setAttribute('style', 'visibility:hidden');

    this.fileHolder.onchange = this.fileChanged.bind(this);

    document.body.appendChild(this.fileHolder);

    this.fileHolder.click();

    window.requestAnimationFrame(() => {
      document.body.removeChild(this.fileHolder);
    });
  }

  handleDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if (
      evt.dataTransfer
            && evt.dataTransfer.files
            && evt.dataTransfer.files.length
    ) {
      if (document.caretRangeFromPoint) {
        const selection = document.getSelection();
        const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
        if (selection && range) {
          selection.setBaseAndExtent(
            range.startContainer,
            range.startOffset,
            range.startContainer,
            range.startOffset,
          );
        }
      } else {
        const selection = document.getSelection();
        const range = document.caretPositionFromPoint(evt.clientX, evt.clientY);
        if (selection && range) {
          selection.setBaseAndExtent(
            range.offsetNode,
            range.offset,
            range.offsetNode,
            range.offset,
          );
        }
      }

      this.range = this.quill.getSelection();
      const file = evt.dataTransfer.files[0];

      setTimeout(() => {
        this.range = this.quill.getSelection();
        this.readAndUploadFile(file);
      }, 0);
    }
  }

  handlePaste(evt) {
    const clipboard = evt.clipboardData || window.clipboardData;

    // IE 11 is .files other browsers are .items
    if (clipboard && (clipboard.items || clipboard.files)) {
      const items = clipboard.items || clipboard.files;
      const IMAGE_MIME_REGEX = /^image\/(jpe?g|gif|png|svg|webp)$/i;

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < items.length; i++) {
        if (IMAGE_MIME_REGEX.test(items[i].type)) {
          const file = items[i].getAsFile ? items[i].getAsFile() : items[i];

          if (file) {
            this.range = this.quill.getSelection();
            evt.preventDefault();
            setTimeout(() => {
              this.range = this.quill.getSelection();
              this.readAndUploadFile(file);
            }, 0);
          }
        }
      }
    }
  }

  readAndUploadFile(file) {
    let isUploadReject = false;

    const fileReader = new FileReader();

    fileReader.onload = () => {
      if (!isUploadReject) {
        const base64ImageSrc = fileReader.result;
        this.insertBase64Image(base64ImageSrc);
      }
    };

    if (file) {
      fileReader.readAsDataURL(file);
    }

    this.options.upload(file).then(
      (imageInfo) => {
        this.insertToEditor(imageInfo.imageUrl, imageInfo.imageId, imageInfo.imageKey);
      },
      (error) => {
        isUploadReject = true;
        this.removeBase64Image();
        // eslint-disable-next-line no-console
        console.warn(error);
      },
    );
  }

  fileChanged() {
    const file = this.fileHolder.files[0];
    this.readAndUploadFile(file);
  }

  insertBase64Image(url) {
    const { range } = this;
    this.quill.insertEmbed(
      range.index,
      LoadingImage.blotName,
      `${url}`,
      'user',
    );
  }

  insertToEditor(url, imageId, imageKey) {
    const { range } = this;
    // Delete the placeholder image
    this.quill.deleteText(range.index, 3, 'user');
    // Insert the server saved image
    this.quill.insertEmbed(range.index, ImageLink.blotName, {
      src: `${url}`, // any url
      imageId: `${imageId}`,
      imageKey: `${imageKey}`,
    }, 'user');

    // eslint-disable-next-line no-plusplus
    range.index++;
    this.quill.setSelection(range, 'user');
  }

  removeBase64Image() {
    const { range } = this;
    this.quill.deleteText(range.index, 3, 'user');
  }
}

window.ImageUploader = ImageUploader;
export default ImageUploader;
