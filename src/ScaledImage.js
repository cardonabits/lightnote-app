import React from 'react';
var floydSteinberg = require('floyd-steinberg');
var bmpJs = require('bmp-js');
var bit1Encoder = require('./encoder');

// input is a rectangular image, output is the
// image cropped to the largest square contained in
// it
function center_square(image) {
  if (image.bitmap.width > image.bitmap.height) {
    image.crop((image.bitmap.width - image.bitmap.height) / 2, 0, image.bitmap.height, image.bitmap.height);
  } else {
    image.crop(0, (image.bitmap.height - image.bitmap.width) / 2, image.bitmap.width, image.bitmap.width);
  }
}
export const ScaledImage = props => {
  const { Jimp } = window;
  const [imageData, setImageData] = React.useState("");
  let setProgress = props.setProgress;
  let croppedImage = props.croppedImage;
  React.useEffect(() => {
    if (croppedImage === null)
      return;
    // First we read the image with Jimp, do initial processing
    // and convert to 1bpp.  The 1bpp image is then read again
    // with Jimp so we can convert to Base64 to be used
    // by the 'img' element.
    Jimp.read(croppedImage)
      .then((f) => {
        // resize, grayscale and clone
        f.resize(400, Jimp.AUTO)
          .grayscale();

        // crop square around center
        center_square(f);

        // resize
        f.resize(200, 200);
        setProgress(25);

        // There is no jimp plugin for dithering, using a different
        // package
        f.bitmap = floydSteinberg(f.bitmap);
        return f
          // The decode/encode process flips the image.
          // Undo that in advance
          .flip(false, true)
          .getBufferAsync(Jimp.MIME_BMP);
      })
      .then(data => {
        var bmpData = bmpJs.decode(data);
        const bit1bmp = bit1Encoder.bmp(bmpData, 1);
        const bit1raw = bit1Encoder.raw(bmpData, 1);
        const buffer = new Uint8Array(8192);
        buffer.set(bit1raw.data)
        // make it available outside of React
        window.imageBuffer = buffer;
        setProgress(50);
        return Jimp.read(bit1bmp.data);
      })
      .then((f) => {
        setProgress(75);
        return f
          .getBase64Async(Jimp.MIME_BMP);
      })
      .then(buffer => {
        setProgress(100);
        setImageData(buffer);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [imageData, croppedImage, setProgress, Jimp]);
  return <div>
    <img alt="" style={imageData !== "" ? {} : { display: 'none' }} src={imageData} />
  </div>;
};
