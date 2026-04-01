import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Heart, Camera, Upload, Trash2, Pill, Clock, BellRing, Volume2, ShieldCheck } from 'lucide-react';
import Login from './Login';

const styles = `
  :root { --primary: #6b8e6b; --danger: #e63946; --text: #2f3e33; --bg: #fdfcfb; }
  body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: var(--bg); }
  .app-container { min-height: 100vh; padding: 40px 20px; color: var(--text); }
  
  .alarm-overlay { 
    position: fixed; inset: 0; background: var(--danger); 
    display: flex; flex-direction: column; align-items: center; justify-content: center; 
    z-index: 9999; color: white; text-align: center; animation: pulse-bg 0.5s infinite;
  }
  @keyframes pulse-bg { 0% { background: #e63946; } 50% { background: #b91c1c; } 100% { background: #e63946; } }
  
  .header { max-width: 1000px; margin: 0 auto 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 30px; max-width: 1000px; margin: 0 auto; }
  .card { background: white; border-radius: 28px; padding: 35px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); border: 1px solid #eee; min-height: 520px; display: flex; flex-direction: column; }
  
  .med-input-large { width: 100%; padding: 20px; margin: 15px 0; border: 2px solid #eee; border-radius: 16px; font-size: 1.2rem; outline: none; }
  .camera-box { width: 100%; flex-grow: 1; background: #000; border-radius: 20px; overflow: hidden; border: 3px solid var(--primary); margin-bottom: 15px; position: relative; }
  video { width: 100%; height: 100%; object-fit: cover; }
  
  .btn-primary { background: var(--primary); color: white; border: none; padding: 18px; border-radius: 16px; cursor: pointer; font-weight: 700; width: 100%; margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1.1rem; }
  .btn-dismiss { background: white; color: var(--danger); border: none; padding: 20px 60px; border-radius: 50px; font-size: 1.5rem; font-weight: 900; cursor: pointer; margin-top: 30px; }
  
  .time-row { display: flex; gap: 10px; margin: 20px 0; }
  .time-select-large { flex: 1; padding: 15px; border-radius: 12px; border: 2px solid #eee; font-weight: bold; font-size: 1.1rem; }
  .med-item { display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #f1f5f1; gap: 15px; }
  
  .cam-status { position: absolute; top: 10px; right: 10px; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 900; color: white; }
`;

const soundLibrary = {
  "Digital Beep": "https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3",
  "Gentle Chime": "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  "Nature Alert": "https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3"
};

function App() {
  const videoRef = useRef(null);
  const [activeAlarm, setActiveAlarm] = useState(null);
  
  // Audio State
  const [selectedSound, setSelectedSound] = useState(localStorage.getItem('userSound') || "Digital Beep");
  const [alarmAudio, setAlarmAudio] = useState(new Audio(soundLibrary[selectedSound]));

  // Camera Power State
  const [cameraOn, setCameraOn] = useState(true);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('medAuth') === 'true');
  const [activeUser, setActiveUser] = useState(() => JSON.parse(localStorage.getItem('currentUser')) || null);
  
  // Meds State
  const [meds, setMeds] = useState(() => JSON.parse(localStorage.getItem('myMeds')) || []);
  const [currentTime, setCurrentTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", hr: "08", min: "00", ampm: "AM" });

  useEffect(() => {
    const newAudio = new Audio(soundLibrary[selectedSound] || selectedSound);
    setAlarmAudio(newAudio);
    localStorage.setItem('userSound', selectedSound);
  }, [selectedSound]);

  useEffect(() => {
    localStorage.setItem('myMeds', JSON.stringify(meds));
  }, [meds]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const manageCamera = async () => {
      if (!cameraOn) {
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { console.error("Camera Error:", err); }
    };
    
    manageCamera();

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      const timeCheck = now.toTimeString().split(' ')[0];
      
      meds.forEach(med => {
        if (med.time === timeCheck && !med.notified) handleTrigger(med);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn, meds, cameraOn]);

  const handleTrigger = (med) => {
    setActiveAlarm(med);
    alarmAudio.loop = true;
    alarmAudio.play().catch(e => console.log("Audio play blocked"));
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Healthy welcome! Time for your ${med.name}`));
  };

  const dismissAlarm = (id) => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    setActiveAlarm(null);
    setMeds(prev => prev.map(m => m.id === id ? { ...m, notified: true } : m));
  };

  const processOCR = (src) => {
    setLoading(true);
    Tesseract.recognize(src, 'eng').then(({ data: { text } }) => {
      setLoading(false);
      const cleaned = text.toUpperCase();
      const detectedName = ["AMOXICILLIN", "PARACETAMOL", "IBUPROFEN", "ASPIRIN"].find(m => cleaned.includes(m)) || "New Med";
      
      const name = window.prompt("Verify Medicine Name:", detectedName);
      if (!name) return;

      const timeInput = window.prompt(`Set time for ${name} (HH:MM AM/PM):`, "08:00 AM");
      if (!timeInput) return;

      try {
        const [time, ampm] = timeInput.split(' ');
        let [h, m] = time.split(':');
        let hrs = parseInt(h);
        if (ampm === "PM" && hrs < 12) hrs += 12;
        if (ampm === "AM" && hrs === 12) hrs = 0;
        const finalTime = `${String(hrs).padStart(2, '0')}:${m.padStart(2, '0')}:00`;

        setMeds(prev => [...prev, { id: Date.now(), name, image: src, time: finalTime, notified: false }]);
      } catch (e) { alert("Format error. Use 09:30 AM"); }
    });
  };

  const handleCustomSound = (e) => {
    const file = e.target.files[0];
    if (file) {
      const customUrl = URL.createObjectURL(file);
      setSelectedSound(customUrl);
      alert("Custom ringtone set!");
    }
  };

  const onLogin = (user) => {
    localStorage.setItem('medAuth', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    setActiveUser(user);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) return <><style>{styles}</style><Login onLoginSuccess={onLogin} /></>;

  return (
    <div className="app-container">
      <style>{styles}</style>

      {activeAlarm && (
        <div className="alarm-overlay">
          <BellRing size={80} />
          <h1 style={{fontSize:'3rem'}}>MEDICINE TIME</h1>
          <h2>{activeAlarm.name}</h2>
          <button className="btn-dismiss" onClick={() => dismissAlarm(activeAlarm.id)}>DISMISS</button>
        </div>
      )}

      <header className="header">
        <div><h2><Heart color="#6b8e6b" style={{display:'inline', marginRight:'10px'}}/> MedSmart</h2><span>HEALTHY welcome <b>{activeUser?.name}</b></span></div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'1.5rem', fontWeight:'900'}}>{currentTime}</div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>Logout</button>
        </div>
      </header>

      <div className="grid">
        {/* Card 1: AI Scanner with Toggle */}
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3><Camera size={20}/> AI Scanner</h3>
            <button onClick={() => setCameraOn(!cameraOn)} style={{background: cameraOn ? '#6b8e6b' : '#ccc', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '20px', cursor:'pointer', fontSize:'0.7rem', fontWeight:'bold'}}>
              {cameraOn ? "CAMERA ON" : "CAMERA OFF"}
            </button>
          </div>
          <div className="camera-box">
            {cameraOn ? <video ref={videoRef} autoPlay playsInline muted /> : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#666', background:'#111'}}>Camera Disabled</div>}
            <div className="cam-status" style={{background: cameraOn ? '#6b8e6b' : '#e63946'}}>{cameraOn ? "LIVE" : "IDLE"}</div>
          </div>
          {cameraOn && (
            <button className="btn-primary" onClick={() => {
              const canvas = document.createElement('canvas');
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
              processOCR(canvas.toDataURL());
            }}>CAPTURE LABEL</button>
          )}
          <input type="file" id="f" hidden onChange={e => {
            const r = new FileReader(); r.onload = () => processOCR(r.result); r.readAsDataURL(e.target.files[0]);
          }} />
          <label htmlFor="f" style={{textAlign:'center', display:'block', marginTop:'15px', color:'var(--primary)', cursor:'pointer'}}><b>UPLOAD IMAGE</b></label>
          {loading && <p style={{textAlign:'center'}}>AI is reading...</p>}
        </div>

        {/* Card 2: Manual Add & Audio Settings */}
        <div className="card">
          <h3><Clock size={20}/> Manual Add</h3>
          <input className="med-input-large" placeholder="Medicine Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <div className="time-row">
            <select className="time-select-large" value={form.hr} onChange={e => setForm({...form, hr: e.target.value})}>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map(h => <option key={h}>{h}</option>)}
            </select>
            <select className="time-select-large" value={form.min} onChange={e => setForm({...form, min: e.target.value})}>
              {Array.from({length:60}, (_,i)=>String(i).padStart(2,'0')).map(m => <option key={m}>{m}</option>)}
            </select>
            <select className="time-select-large" value={form.ampm} onChange={e => setForm({...form, ampm: e.target.value})}><option>AM</option><option>PM</option></select>
          </div>
          <button className="btn-primary" onClick={() => {
            if(!form.name) return;
            let hrs = parseInt(form.hr);
            if(form.ampm === "PM" && hrs < 12) hrs += 12;
            if(form.ampm === "AM" && hrs === 12) hrs = 0;
            const t = `${String(hrs).padStart(2,'0')}:${form.min}:00`;
            setMeds([...meds, { id: Date.now(), name: form.name, time: t, notified: false }]);
            setForm({name: "", hr: "08", min: "00", ampm: "AM"});
          }}>SAVE ALARM</button>

          <hr style={{margin: '30px 0', opacity: 0.1}}/>

          <h3><Volume2 size={20}/> Audio Settings</h3>
          <select className="time-select-large" style={{width: '100%'}} value={Object.keys(soundLibrary).includes(selectedSound) ? selectedSound : "Custom"} onChange={(e) => e.target.value !== "Custom" && setSelectedSound(e.target.value)}>
            {Object.keys(soundLibrary).map(name => <option key={name} value={name}>{name}</option>)}
            {!Object.keys(soundLibrary).includes(selectedSound) && <option value="Custom">Custom Ringtone</option>}
          </select>
          <button className="btn-primary" style={{background: '#f0f4f0', color: '#6b8e6b', border: '1px solid #6b8e6b'}} onClick={() => {
            alarmAudio.play();
            setTimeout(() => { alarmAudio.pause(); alarmAudio.currentTime = 0; }, 3000);
          }}>🔊 PREVIEW</button>
          <input type="file" id="customAudio" hidden accept="audio/*" onChange={handleCustomSound} />
          <label htmlFor="customAudio" style={{textAlign:'center', display:'block', marginTop:'10px', color:'#999', fontSize:'0.7rem', cursor:'pointer'}}>+ UPLOAD CUSTOM MP3</label>
        </div>
      </div>

      <div className="med-list" style={{maxWidth:'1000px', margin:'30px auto', background:'white', borderRadius:'20px', padding:'20px'}}>
        <h3 style={{borderBottom:'1px solid #eee', paddingBottom:'10px'}}>Active Alarms</h3>
        {meds.map(m => (
          <div key={m.id} className="med-item">
            <div style={{width:'50px', height:'50px', background:'#f0f4f0', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              {m.image ? <img src={m.image} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Pill color="#6b8e6b" />}
            </div>
            <div style={{flex:1}}><b>{m.name}</b><br/>{m.time}</div>
            <button onClick={() => setMeds(meds.filter(x => x.id !== m.id))} style={{border:'none', background:'none', color:'red', cursor:'pointer'}}><Trash2 size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
