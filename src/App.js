import React from 'react'
import LoadingBar from 'react-top-loading-bar'
import {
  fileOpen,
  // directoryOpen,
  //fileSave,
  supported,
} from 'browser-fs-access'
// import Jimp from 'jimp';
// See https://github.com/jimp-dev/jimp/issues/1194
import 'jimp'
import './App.css';
import { OriginalImage } from './OriginalImage';
import { ScaledImage } from './ScaledImage';


export default function App() {
  if (supported) {
    console.log('Using the File System Access API.');
  } else {
    console.log('Using the fallback implementation.');
  }
  const [file, setFile] = React.useState("");
  const [progress, setProgress] = React.useState(0);
  const [imageBuffer, setImageBuffer] = React.useState(null);

  const openFile = async () => {
    const imageBlob = await fileOpen({
      extensions: ['.png', '.jpg', '.jpeg', '.webp'],
      description: 'Image file',
    })
    setFile(imageBlob);
  };

  const generateROM = async () => {
    const newHandle = await window.showSaveFilePicker({ suggestedName: "lightnote.rom" });
    const writableStream = await newHandle.createWritable();
    setProgress(10);

    writableStream.write({
            type: "write",
            data: imageBuffer,
          })
        .catch((err) => {
          console.error(err);
        })
      .then(res => { writableStream.close(); });
  };

  return (
    <div>
      <LoadingBar
        color='#f11946'
        progress={progress}
      />
      <button onClick={() => openFile()}>Select an Image</button>
      <button onClick={() => generateROM()} disabled={progress !== 100}>Generate ROM</button>
      <br />
      <OriginalImage file={file} />
      <div>
      <ScaledImage file={file} setProgress={setProgress} setImageBuffer={setImageBuffer} />
      </div>
    </div>
  );
}
