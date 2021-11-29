import Quill from "quill";

const InlineBlot = Quill.import('blots/block');

class ImageLink extends InlineBlot {
  static create(data) {
      console.log(data);
      const node = super.create(data);

      if (data && data.src) {
        const image = document.createElement('img');
        image.setAttribute('src', data.src);
        image.setAttribute('data-imageid', data.imageId);
        image.setAttribute('data-imagekey', data.imageKey);
        console.log(image);
        node.appendChild(image);
      }

      return node;
  }
  static value(domNode) {
    const { src, imageId, imageKey } = domNode.dataset;
    return { src, imageId, imageKey };
  }
}

ImageLink.blotName = 'imageLink';
ImageLink.className = 'image-link';
ImageLink.tagName = 'span';
Quill.register({ 'formats/imageLink': ImageLink });

export default ImageLink;
