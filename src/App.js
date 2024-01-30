import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import RecordRTC from "recordrtc";
import axios from "axios";
import { Toggle } from "./Toggle";

function App() {
  const [muted, setMuted] = useState(true);

  return (
    <div className="App">
      <header>
        <h1>Genius 🤖</h1>
        <Toggle
          label="Audio Mode"
          toggled={muted}
          onClick={() => {
            setMuted(!muted);
          }}
        />
      </header>
      <section>{<ChatRoom muted={muted} />}</section>
    </div>
  );
}

function ChatRoom({ muted }) {
  const API = "http://127.0.0.1:1880/app/chat";

  const dummy = useRef();
  const [messages, setMessages] = useState([]);

  const [formValue, setFormValue] = useState("");
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [synth, setSynth] = useState(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    setSynth(synth);
  }, []);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = RecordRTC(stream, { type: "audio" });
      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
      console.log(recorder);
    });
  };

  const stopRecording = async () => {
    return new Promise(async (resolve) => {
      if (recorderRef.current && isRecording) {
        recorderRef.current.stopRecording(async () => {
          const blob = recorderRef.current.getBlob();

          // Create a URL for the recorded audio blob
          const audioURL = URL.createObjectURL(blob);
          setRecording(audioURL);

          setIsRecording(false);
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    await stopRecording(); // Wait for recording to stop

    // Client side message
    const messageData = {
      text: formValue,
      audio: recording,
    };

    // Update messages state
    setMessages((prevMessages) => [
      ...prevMessages,
      { ...messageData, className: "sent" },
    ]);
    setFormValue("");

    // Server side message axios
    setIsLoading(true); // Start loading animation

    axios
      .get(API, { params: { message: formValue } })
      .then((res) => {
        console.log("from then", res.data);
        const serverMessageData = {
          text: res.data, // à remplacer par res.data.text
          audio: res.data.audio,
        };
        setMessages((prevMessages) => [
          ...prevMessages,
          { ...serverMessageData, className: "received" },
        ]);
        if (!muted) {
          const u = new SpeechSynthesisUtterance(res.data || "");
          u.voice = synth.getVoices()[6];
          synth.speak(u);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false); // Stop loading animation
      });

    setRecording(null);
    dummy.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        {messages &&
          messages.map((msg, index) => {
            if (msg.text && !msg.audio) {
              return <TextMessage key={index} message={msg} />;
            } else if (!msg.text && msg.audio) {
              return <AudioMessage key={index} message={msg} />;
            }
            return undefined; // In case of unknown message type
          })}
        {isLoading && (
          <div className="message received">
            <div className="typing-indicator"></div>
            <div className="typing-indicator"></div>
            <div className="typing-indicator"></div>
          </div>
        )}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder={
            recording
              ? "Send the voice message"
              : isRecording
              ? "Recording"
              : "How can Genius help you today!"
          }
          disabled={isRecording || recording}
        />
        <button type="submit" disabled={!formValue && !recording}>
          🕊️
        </button>
        <button
          type="button"
          onClick={startRecording}
          disabled={formValue || isRecording || recording}
        >
          🎤
        </button>
        <button type="button" onClick={stopRecording} disabled={!isRecording}>
          🛑
        </button>
      </form>
    </>
  );
}

function TextMessage({ message }) {
  const { text, className } = message;

  return (
    <div className={`message ${className}`}>
      <p>{text}</p>
    </div>
  );
}

function AudioMessage({ message }) {
  const { audio, className } = message;

  return (
    <div className={`message ${className}`}>
      {audio && <audio controls src={audio}></audio>}
    </div>
  );
}

export default App;
