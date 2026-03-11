import { useRef, useState } from 'react';

import Tesseract from 'tesseract.js';
import Webcam from 'react-webcam';

function App() {
  const webcamRef = useRef<Webcam>(null);

  const [cropped, setCropped] = useState<string | null>(null);
  const [text, setText] = useState<string>('');

  const cropImage = (imageSrc: string) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.src = imageSrc;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const cropWidth = 500;
        const cropHeight = 120;

        const x = img.width / 2 - cropWidth / 2;
        const y = img.height / 2 - cropHeight / 2;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx?.drawImage(
          img,
          x,
          y,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  };

  const runOCR = async (image: string) => {
    const worker = await Tesseract.createWorker('eng');

    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    });

    const result = await worker.recognize(image);

    await worker.terminate();

    return result.data.text;
  };

  const capture = async () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) return;

    const croppedImage = await cropImage(screenshot);
    setCropped(croppedImage);

    const detectedText = await runOCR(croppedImage);
    setText(detectedText);
  };

  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-center gap-6 bg-gray-900 text-white">
      <h1 className="text-lg">Scanner</h1>

      <div className="h-28 w-80 overflow-hidden rounded-lg border-2 border-green-400">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'environment',
            width: 1280,
            height: 720
          }}
          className="h-full w-full object-cover"
        />
      </div>

      <button onClick={capture} className="rounded bg-blue-500 px-6 py-3">
        Capturar
      </button>

      {cropped && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm">Área escaneada</p>
          <img
            src={cropped}
            alt="cropped"
            className="w-80 rounded border border-green-400"
          />
        </div>
      )}

      {text && (
        <div className="rounded bg-white p-3 text-black">
          <p className="text-sm font-semibold">Texto detectado</p>
          <p>{text}</p>
        </div>
      )}
    </div>
  );
}

export default App;
