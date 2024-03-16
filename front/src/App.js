import React, { useRef, useState } from 'react';
import axios from "./api";
import html2canvas from 'html2canvas';

import './App.css'

const DrawingCanvas = () => {
  const canvasRef = useRef(null); // Utwórz referencję do elementu <canvas>
  const [isDrawing, setIsDrawing] = useState(false); // Stan do śledzenia, czy użytkownik rysuje
  const [clearCanvas, setClearCanvas] = useState(false); // Stan do śledzenia, czy płótno jest wyczyszczone
  const [topValues, setTopValues] = useState([]); // Stan do przechowywania 5 najwyższych wartości

  const handleMouseDown = (e) => {
    setIsDrawing(true); // Ustaw stan na "rysowanie rozpoczęte"
    const canvas = canvasRef.current; // Pobierz element <canvas>
    const context = canvas.getContext('2d'); // Pobierz kontekst 2D płótna
    context.beginPath(); // Rozpocznij nową ścieżkę rysowania
    context.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop); // Ustaw punkt początkowy rysowania
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return; // Jeśli nie rysujemy, zakończ funkcję
    const canvas = canvasRef.current; // Pobierz element <canvas>
    const context = canvas.getContext('2d'); // Pobierz kontekst 2D płótna
    context.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop); // Ustaw punkt końcowy rysowania
    context.lineWidth = 10; // Zwiększ grubość linii (możesz dostosować)
    context.stroke(); // Narysuj linię
  };

  const handleMouseUp = () => {
    setIsDrawing(false); // Ustaw stan na "rysowanie zakończone"
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current; // Pobierz element <canvas>
    const context = canvas.getContext('2d'); // Pobierz kontekst 2D płótna
    context.clearRect(0, 0, canvas.width, canvas.height); // Wyczyść całe płótno
    setClearCanvas(true); // Ustaw stan na "płótno wyczyszczone"
  };

  const handleDownloadImage = async () => {
    
    const canvas = canvasRef.current;
    // Pobierz dane obrazu z canvasu
    const dataURL = canvas.toDataURL("image/jpg");

    html2canvas(canvas).then((canvasImage) => {
      //const link = document.createElement('a');
      //link.href = canvasImage.toDataURL('image/jpg');
      const dataURL2 = canvasImage.toDataURL('image/jpg');
      //link.download = 'my_drawing.jpg';
      //link.click();

       // Usuń prefix "data:image/jpeg;base64," z danych obrazu
    const base64Data = dataURL2.substring("data:image/jpg;base64,".length);

    // Przekonwertuj dane obrazu na tablicę bajtów
    const bytes = Array.from(atob(base64Data)).map(char => char.charCodeAt(0));

    // Zakoduj dane obrazu w formacie base64
    const encodedData = btoa(String.fromCharCode(...bytes));

    // Wyświetl zakodowane dane
    console.log(encodedData); 


    // Funkcja do wysyłania danych na serwer
    const sendImageData = async (encodedData) => {
  try {
    
    // Wyślij dane na serwer
    const response = await axios.post('/upload-image', { image: encodedData });

    // Obsłuż odpowiedź z serwera (np. wyświetl komunikat o sukcesie)
    console.log('Odpowiedź z serwera:', response.data);
    const data = response.data;
    console.log('Odpowiedź z serwera:', data);
    setTopValues(data.classes);
  } catch (error) {
    console.error('Błąd podczas wysyłania danych:', error);
  }
};

// Wywołaj funkcję z zakodowanymi danymi
sendImageData(encodedData);
  })

   
  };


  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
  
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);

    const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target.result; // DataURL obrazu

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0); // Narysowanie obrazu na płótnie
    };
    image.src = imageData;

    setClearCanvas(false); // Zapobiegnięcie czyszczeniu płótna
  };
  reader.readAsDataURL(file);
  
    try {
      const response = await axios.post('/predict', formData);
      const data = response.data;
      console.log('Odpowiedź z serwera:', data);
      setTopValues(data.classes);
    } catch (error) {
      console.error('Błąd podczas przesyłania obrazu na serwer:', error);
    }
  };
  
  return (
    <div className="canvas-container">
      <canvas
        id="myCanvas"
        ref={canvasRef}
        width={400}
        height={400}
        className="drawing-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <div className="buttons-container">
        <button className="button" onClick={handleClearCanvas}>Wyczyść</button>
        <button className="button" onClick={handleDownloadImage}>Wyślij</button>
        <input
          type="file"
          id="image-upload"
          accept="image/jpeg,image/png"
          onChange={handleUploadImage}
        />
      </div>
      <div className="top-values-container">
        <h3>5 najwyższych wartości:</h3>
        <ol>
          {topValues.map((value, index) => (
            <li key={index}>{value}</li>
          ))}
        </ol>
      </div>
    </div>
  );
  };
  
  export default DrawingCanvas;