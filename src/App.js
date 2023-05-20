import React from 'react';
import {
  // fileOpen,
  directoryOpen,
  // fileSave,
  // supported,
} from 'browser-fs-access';
// import Jimp from 'jimp';
// See https://github.com/jimp-dev/jimp/issues/1194
import 'jimp'

import './App.css';

const ScaledImage = props => {
  const { Jimp } = window;
  const [imageData, setImageData] = React.useState("");
  React.useEffect(() => {
    const processImage = (file) => {
      let file_url = URL.createObjectURL(file);
      Jimp.read(file_url)
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
    {/* <h2>{props.file.name}</h2> */}
    <img alt={props.file.name} src={imageData}></img>
    <br />
  </>
}

export default function App() {
  const [ files, setFiles ] = React.useState([]);
  const openDirectory = async () => {
    const blobsInDirectory  = await directoryOpen({
      recursive: true,
    })
    setFiles(blobsInDirectory);
  };

  return (
    <div>
      <button onClick={() => openDirectory()}>Select Images Directory</button>
      <br />
      {files.map((file, index) => (
        <div key={index}>
          <ScaledImage file={file} />
        </div>
      ))}
    </div>
  );
}
