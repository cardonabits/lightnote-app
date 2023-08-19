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


var bmpJs = require('bmp-js');
var bit1Encoder = require('./encoder');

export default function App() {
  if (supported) {
    console.log('Using the File System Access API.');
  } else {
    console.log('Using the fallback implementation.');
  }
  const [file, setFile] = React.useState("");
  const [progress, setProgress] = React.useState(0);

  const openFile = async () => {
    const imageBlob = await fileOpen({
      extensions: ['.png', '.jpg', '.jpeg', '.webp'],
      description: 'Image file',
    })
    setFile(imageBlob);
  };

  const generateROM = async () => {
    const { Jimp } = window;
    const newHandle = await window.showSaveFilePicker({ suggestedName: "lightnote.rom" });
    const writableStream = await newHandle.createWritable();
    setProgress(10);

    let files = [];
    let promises = files.map((file, index) => {
      return Jimp.read(URL.createObjectURL(file))
        .then(f => {
          return f
            .resize(200, 200)
            .background(0xFFFFFFFF)
            .flip(false, true)
            .getBufferAsync(Jimp.MIME_BMP)
        })
        .then(data => {
          var bmpData = bmpJs.decode(data);
          const bit1bmp = bit1Encoder.raw(bmpData, 1);
          let prog = 100 * (index + 1) / files.length;
          setProgress(prog);
          console.log('progress: ' + prog);
          return writableStream.write({
            type: "write",
            data: bit1bmp.data,
          })
        })
        .catch((err) => {
          console.error(err);
        })
    });
    console.log(promises);
    Promise.all(promises)
      .then(res => {
        var config_sector = Buffer.alloc(12);
        var pos = 0;
        config_sector.writeUInt32LE(0x23571113, pos); pos += 4;
        config_sector.writeUInt16LE(5000, pos); pos += 2;
        config_sector.writeUInt32LE(files.length, pos); pos += 4;
        config_sector.writeUInt8(0x2, pos); pos += 1;
        config_sector.writeUInt8(0x2, pos); pos += 1;
        return writableStream.write({
          type: "write",
          data: config_sector,
          position: 16777216 - 0x1000,
        })
      })
      .then(res => {
        return writableStream.write({
          type: "write",
          data: 0,
          position: 16777216 - 1,
        })
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
      <ScaledImage file={file} setProgress={setProgress} />
      </div>
    </div>
  );
}
