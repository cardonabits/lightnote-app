import React from 'react';
import {
  // fileOpen,
  directoryOpen,
  fileSave,
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
        f
          .resize(20, 20)
          .background(0xFFFFFFFF)
          .flip(false, true)
          .getBuffer(Jimp.MIME_BMP, (err, data) => {
            if (err) throw err;
            var bmpData = bmpJs.decode(data);
            const bit1bmp = bit1Encoder(bmpData, 1);
            console.log('bit1bmp size: ' + bit1bmp.data.length)
            Jimp.read(bit1bmp.data)
              .then((f) => {
                f.getBase64Async(Jimp.MIME_BMP)
                  .then(buffer => {
                    setImageData(buffer);
                  })
              })
          });
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
    const { Jimp } = window;
    let read_files = files.map((file, index) => {
      return Jimp.read(URL.createObjectURL(file))
        .then(f => {
          f
            .resize(20, 20)
            .background(0xFFFFFFFF)
            .flip(false, true)
            .getBuffer(Jimp.MIME_BMP, (err, data) => {
              if (err) throw err;
              var bmpData = bmpJs.decode(data);
              const bit1bmp = bit1Encoder(bmpData, 1);
              console.log('bit1bmp size: ' + bit1bmp.data.length)
              return Jimp.read(bit1bmp.data);
            })
            .then((f) => {
              f.getBase64Async(Jimp.MIME_BMP)
                .then(buffer => {
                  return buffer;
                })
            })
        })
        .catch((err) => {
          console.error(err);
        })
    });

    console.log(read_files);
    // await fileSave(files[0], {
    //   fileName: 'lightnote.rom',
    //   extensions: ['.rom'],
    // });
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
