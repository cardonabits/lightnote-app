import React from 'react';
import LoadingBar from 'react-top-loading-bar'
import {
  // fileOpen,
  directoryOpen,
  //fileSave,
  supported,
} from 'browser-fs-access';
// import Jimp from 'jimp';
// See https://github.com/jimp-dev/jimp/issues/1194
import 'jimp'

import './App.css';

var bmpJs = require('bmp-js');
var bit1Encoder = require('./encoder');

const ScaledImage = props => {
  const { Jimp } = window;
  const [imageData, setImageData] = React.useState("");
  React.useEffect(() => {
    let prog = 25 * (props.index + 1) / props.numFiles;
    props.setProgress(prog);
    console.log('progress: ' + prog);
    let file_url = URL.createObjectURL(props.file);
    // First we read the image with Jimp, do initial processing
    // and convert to 1bpp.  The 1bpp image is then read again
    // with Jimp so we can convert to Base64 to be used
    // by the 'img' element.
    Jimp.read(file_url)
      .then((f) => {
        return f
          .resize(100, 100)
          .background(0xFFFFFFFF)
          .flip(false, true)
          .getBufferAsync(Jimp.MIME_BMP)
      })
      .then(data => {
        var bmpData = bmpJs.decode(data);
        const bit1bmp = bit1Encoder.bmp(bmpData, 1);
        return Jimp.read(bit1bmp.data)
      })
      .then((f) => {
        return f.getBase64Async(Jimp.MIME_BMP)
      })
      .then(buffer => {
        setImageData(buffer);
        let prog = 100 * (props.index + 1) / props.numFiles;
        props.setProgress(prog);
        console.log('progress: ' + prog);
      })
      .catch((err) => {
        console.error(err);
      })
  }, [props.file]);
  return <img alt="" style={imageData !== "" ? {} : { display: 'none' }} src={imageData} />
}

export default function App() {
  if (supported) {
    console.log('Using the File System Access API.');
  } else {
    console.log('Using the fallback implementation.');
  }
  const [files, setFiles] = React.useState([]);
  const [progress, setProgress] = React.useState(0);

  const openDirectory = async () => {
    const blobsInDirectory = await directoryOpen({
      recursive: true,
    })
    setFiles(blobsInDirectory.sort((a, b) => { return collator.compare(a.name, b.name) }));
    setProgress(10);
  };

  const generateROM = async () => {
    const newHandle = await window.showSaveFilePicker({ suggestedName: "lightnote.rom" });
    const writableStream = await newHandle.createWritable();
    setProgress(10);

    const { Jimp } = window;
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

  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  return (
    <div>
      <LoadingBar
        color='#f11946'
        progress={progress}
      />
      <button onClick={() => openDirectory()}>Select Images Directory</button>
      <button onClick={() => generateROM()} disabled={files.length === 0 || progress !== 100}>Generate ROM</button>
      <br />
      {files.map((file, index) => (
        <ScaledImage key={index} index={index} file={file} setProgress={setProgress} numFiles={files.length} />
      ))}
    </div>
  );
}
