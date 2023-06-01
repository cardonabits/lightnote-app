import React from 'react';
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
    let file_url = URL.createObjectURL(props.file);
    // First we read the image with Jimp, do initial processing
    // and convert to 1bpp.  The 1bpp image is then read again
    // with Jimp so we can convert to Base64 to be used
    // by the 'img' element.
    Jimp.read(file_url)
      .then((f) => {
        return f
          .resize(200, 200)
          .background(0xFFFFFFFF)
          .flip(false, true)
          .getBufferAsync(Jimp.MIME_BMP)
      })
      .then(data => {
        var bmpData = bmpJs.decode(data);
        const bit1bmp = bit1Encoder(bmpData, 1);
        console.log('bit1bmp size: ' + bit1bmp.data.length)
        return Jimp.read(bit1bmp.data)
      })
      .then((f) => {
        return f.getBase64Async(Jimp.MIME_BMP)
      })
      .then(buffer => {
        setImageData(buffer);
      })
      .catch((err) => {
        console.error(err);
      })
  }, [props.file]);
  return <img alt={props.file.name} src={imageData}></img>
}

export default function App() {
  if (supported) {
    console.log('Using the File System Access API.');
  } else {
    console.log('Using the fallback implementation.');
  }
  const [files, setFiles] = React.useState([]);

  const openDirectory = async () => {
    const blobsInDirectory = await directoryOpen({
      recursive: true,
    })
    setFiles(blobsInDirectory.sort((a, b) => { return collator.compare(a.name, b.name) }));
  };

  const generateROM = async () => {
    const newHandle = await window.showSaveFilePicker({ suggestedName: "lightnote.rom" });
    const writableStream = await newHandle.createWritable();

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
          const bit1bmp = bit1Encoder(bmpData, 1);
          console.log("file size: ", bit1bmp);
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
    Promise.all(promises).then(res => { writableStream.close(); });
  };

  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  return (
    <div>
      <button onClick={() => openDirectory()}>Select Images Directory</button>
      <button onClick={() => generateROM()}>Generate ROM</button>
      <br />
      {files.map((file, index) => (
        <ScaledImage key={index} file={file} />
      ))}
    </div>
  );
}
