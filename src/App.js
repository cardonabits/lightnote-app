import React from 'react';
import LoadingBar from 'react-top-loading-bar'
import {
  fileOpen,
  // directoryOpen,
  //fileSave,
  supported,
} from 'browser-fs-access';
import Jimp from 'jimp';

import './App.css';

var bmpJs = require('bmp-js');
var bit1Encoder = require('./encoder');

const ScaledImage = props => {
  const [imageData, setImageData] = React.useState("");
  const [imageDataNext, setImageDataNext] = React.useState("");
  React.useEffect(() => {
    if (props.file === "")
      return;
    let file_url = URL.createObjectURL(props.file);
    // First we read the image with Jimp, do initial processing
    // and convert to 1bpp.  The 1bpp image is then read again
    // with Jimp so we can convert to Base64 to be used
    // by the 'img' element.
    Jimp.read(file_url)
      .then((f) => {
        let ff = f.clone();
        ff
          .blur(10)
          .getBase64(Jimp.MIME_JPEG, (_, buffer) => setImageDataNext(buffer));
        return f
          .resize(400, Jimp.AUTO)
          .grayscale()
          .getBase64Async(Jimp.MIME_JPEG)
      })
      // .then(data => {
      //   var bmpData = bmpJs.decode(data);
      //   const bit1bmp = bit1Encoder.bmp(bmpData, 1);
      //   return Jimp.read(bit1bmp.data)
      // })
      // .then((f) => {
      //   return f.getBase64Async(Jimp.MIME_BMP)
      // })
      .then(buffer => {
        setImageData(buffer);
      })
      .catch((err) => {
        console.error(err);
      })
      props.setProgress(100);
  }, [props.file]);
  return <div>
        <img alt="" style={imageData !== "" ? {} : { display: 'none' }} src={imageData} />
        <img alt="" style={imageDataNext !== "" ? {} : { display: 'none' }} src={imageDataNext} />
        </div>
}

const OriginalImage = props => {
  const [imageData, setImageData] = React.useState("");
  React.useEffect(() => {
    if (props.file === "")
      return;
    let file_url = URL.createObjectURL(props.file);
    Jimp.read(file_url)
      .then((f) => {
        return f
          .resize(400, Jimp.AUTO)
          .getBase64Async(Jimp.MIME_JPEG)
      })
      .then(buffer => {
        setImageData(buffer);
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
  const [file, setFile] = React.useState("");
  const [progress, setProgress] = React.useState(0);

  const openFile = async () => {
    const imageBlob = await fileOpen({
      extensions: ['.png', '.jpg', '.jpeg', '.webp'],
      description: 'Image file',
    })
    setFile(imageBlob);
    setProgress(100);
  };

  const generateROM = async () => {
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
