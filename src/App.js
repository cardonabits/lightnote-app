import React from 'react';
import { useFilePicker } from 'use-file-picker';
// import Jimp from 'jimp';
// See https://github.com/jimp-dev/jimp/issues/1194
import 'jimp'

import './App.css';

const ScaledImage = props => {
  const { Jimp } = window;
  const [imageData, setImageData] = React.useState("");
  React.useEffect(() => {
    const processImage = (file) => {
            Jimp.read(file.content)
            .then((f) => {
              f 
                .resize(256, 256) // resize
                .quality(60) // set JPEG quality
                .greyscale() // set greyscale
                .getBase64Async(Jimp.MIME_JPEG)
                .then(buffer => {
                  setImageData(buffer);
                  console.log('buffer len: ' + buffer.length)
                });
            })
            .catch((err) => {
              console.error(err);
            })
          }
          processImage(props.file);
        }, [Jimp, props.file]);
  return <>
          <h2>{props.file.name}</h2>
          <img alt={props.file.name} src={imageData}></img>
          <br />
          </>
}

export default function App() {
  const [openFileSelector, { filesContent, loading, errors }] = useFilePicker({
    readAs: 'DataURL',
    accept: 'image/*',
    multiple: true,
    limitFilesConfig: { max: 10 },
    // minFileSize: 0.1, // in megabytes
    maxFileSize: 50,
    imageSizeRestrictions: {
      maxHeight: 5000, // in pixels
      maxWidth: 5000,
      minHeight: 200,
      minWidth: 200,
    },
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (errors.length) {
    return <div>{errors}</div>;
  }

  return (
    <div>
      <button onClick={() => openFileSelector()}>Select files </button>
      <br />
      {filesContent.map((file, index) => (
        <div key={index}>
          <ScaledImage file={file} />
        </div>
      ))}
    </div>
  );
}
