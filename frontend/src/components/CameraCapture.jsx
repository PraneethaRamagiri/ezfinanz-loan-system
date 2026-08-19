import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Upload, AlertCircle } from 'lucide-react';

export default function CameraCapture({ onCapture, onFileSelect, previewUrl }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(previewUrl || null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [fileError, setFileError] = useState(null);

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

  // Bind MediaStream to video element once Mounted & Active
  useEffect(() => {
    if (stream && cameraActive && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Webcam playback error:', err);
        });
      }
    }
  }, [stream, cameraActive]);

  // Clean up media stream tracks when component unmounts or stream changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    setFileError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam access is not supported by your browser. Please use the photo upload option below.');
      return;
    }

    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });
      } catch (constraintErr) {
        console.warn('Ideal camera constraints rejected, falling back to basic video constraint:', constraintErr);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.warn('Webcam access error:', err);
      let errMsg = 'Webcam unavailable or permission denied. Please use the photo upload option below.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied in your browser settings. Please allow camera access and click Open Web Camera again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No webcam device detected on your system. Please use the photo upload option below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Webcam is currently occupied by another application. Please close other apps using the camera and retry.';
      }
      setCameraError(errMsg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setFileError(null);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Standardize canvas dimensions (max 1280 width)
    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / (video.videoWidth || 640));
    canvas.width = (video.videoWidth || 640) * scale;
    canvas.height = (video.videoHeight || 480) * scale;

    const ctx = canvas.getContext('2d');
    // Mirror horizontally to match webcam preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
        onCapture(file, dataUrl);
      }
    }, 'image/jpeg', 0.85);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    startCamera();
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError(null);

    // Client-side file size validation (10 MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`Selected file is too large (${fileSizeMB} MB). Maximum allowed size is 10 MB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result);
      stopCamera();
      onFileSelect(file, reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold">Live Identity Selfie Capture</h3>
        <p className="text-xs text-slate-400 mt-1">Center your face within the frame in a clear, well-lit room. Max upload: 10 MB.</p>
      </div>

      {fileError && (
        <div className="mb-4 p-3 bg-red-900/80 border border-red-500 text-red-100 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Main Viewport */}
      <div className="relative w-full max-w-md mx-auto aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover" />
        ) : cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Oval Face Guide Overlay */}
            <div className="absolute inset-0 border-[40px] border-slate-950/60 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-64 border-2 border-dashed border-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
            </div>
          </>
        ) : (
          <div className="p-6 text-center">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Webcam Inactive</p>
            {cameraError ? (
              <p className="text-xs text-amber-400 mt-2 max-w-xs">{cameraError}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Click below to open your camera or upload a saved photo (up to 10 MB).</p>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {capturedImage ? (
          <button
            type="button"
            onClick={retakePhoto}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-slate-700 text-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retake Photo</span>
          </button>
        ) : cameraActive ? (
          <button
            type="button"
            onClick={takeSnapshot}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all text-base cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            <span>Capture Photo Now</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Open Web Camera</span>
          </button>
        )}

        {/* Upload Fallback */}
        <label className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl cursor-pointer transition-all border border-slate-700 text-sm">
          <Upload className="w-4 h-4 text-emerald-400" />
          <span>Upload Image File</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
