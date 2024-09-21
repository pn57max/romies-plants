"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { identifyPlant } from './utils/gemini';
import { Camera } from 'lucide-react';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; description: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!image) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const identification = await identifyPlant(image);
      setResult(identification);
    } catch (error) {
      console.error('Error identifying plant:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
    setLoading(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMessage("Unable to access camera. Please make sure you've granted the necessary permissions.");
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
          processImage(file);
        }
      }, 'image/jpeg');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-green-800">Roomies Plants</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload a plant image
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300"
                >
                  Choose File
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
                >
                  Use Camera
                </button>
              </div>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {!preview && (
              <div className="mt-4">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                <button
                  type="button"
                  onClick={captureImage}
                  className="mt-2 w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 transition duration-300"
                >
                  Capture Image
                </button>
              </div>
            )}
            {preview && (
              <div className="mt-4">
                <Image src={preview} alt="Preview" width={300} height={300} className="w-full rounded-lg object-cover" />
              </div>
            )}
            <button
              type="submit"
              disabled={!image || loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Identifying...' : 'Identify Plant'}
            </button>
          </form>
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error:</p>
              <p>{errorMessage}</p>
            </div>
          )}
          {result && (
            <div className="mt-8 p-6 bg-green-50 rounded-lg">
              <h2 className="text-2xl font-semibold mb-2 text-green-800">{result.name}</h2>
              <p className="text-gray-600">{result.description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}