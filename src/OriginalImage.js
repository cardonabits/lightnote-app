import React from 'react';

export const OriginalImage = props => {
  const { Jimp } = window;
  const [imageData, setImageData] = React.useState("");
  let file = props.file;
  React.useEffect(() => {
    if (file === "")
      return;
    let file_url = URL.createObjectURL(file);
    Jimp.read(file_url)
      .then((f) => {
        return f
          .resize(400, Jimp.AUTO)
          .getBase64Async(Jimp.MIME_JPEG);
      })
      .then(buffer => {
        setImageData(buffer);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [file, Jimp]);
  return <img alt="" style={imageData !== "" ? {} : { display: 'none' }} src={imageData} />;
};
