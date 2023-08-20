import React from 'react'
import LoadingBar from 'react-top-loading-bar'
import { FixedCropper, ImageRestriction } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
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
import { ScaledImage } from './ScaledImage';

export default function App() {
  if (supported) {
    console.log('Using the File System Access API.');
  } else {
    console.log('Using the fallback implementation.');
  }
  const [progress, setProgress] = React.useState(0);
  const [originalImage, setOriginalImage] = React.useState(null);
  const [croppedImage, setCroppedImage] = React.useState(null);
  const cropperRef = React.useRef(null);

  const openFile = async () => {
    const imageBlob = await fileOpen({
      extensions: ['.png', '.jpg', '.jpeg', '.webp'],
      description: 'Image file',
    })
    setOriginalImage(URL.createObjectURL(imageBlob));
  };

  const cropImage = async () => {
    if (cropperRef.current) {
        setCroppedImage(cropperRef.current.getCanvas()?.toDataURL());
        console.log(cropperRef.current.getCanvas()?.toDataURL());
    }
  };

  return (
    <div>
      <LoadingBar
        color='#f11946'
        progress={progress}
      />
      <button onClick={() => openFile()}>Select an Image</button>
      <br />
      <FixedCropper
        src={originalImage}
        ref={cropperRef}
        style={{width: 400}}
        stencilProps={{
          handlers: false,
          lines: false,
          movable: false,
          resizable: false,
          aspectRatio: 1 / 1,
        }}
        stencilSize={{
          width: 400,
          height: 400
        }}
        imageRestriction={ImageRestriction.stencil}
      />
      <button onClick={() => cropImage()}>Accept Image Boundaries</button>
      <div>
        <ScaledImage croppedImage={croppedImage} setProgress={setProgress} />
      </div>
    </div>
  );
}
