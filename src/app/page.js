'use client';

import { useState, useEffect, useRef } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Qibla } from 'adhan';
import { format } from 'date-fns';
import gsap from 'gsap';
import { MoonStar, Sunrise, Sun, SunDim, Sunset, Moon, Volume2, VolumeX, BookOpen, X, MapPin, AlertCircle, Clock, ChevronRight, CalendarDays, Compass, Navigation } from 'lucide-react';

const daftarKota = [
  { nama: 'Cigombong, Bogor', lat: -6.7645, lng: 106.8163 },
  { nama: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456 },
  { nama: 'Bandung, Indonesia', lat: -6.9175, lng: 107.6191 },
  { nama: 'Sukabumi, Indonesia', lat: -6.9228, lng: 106.9222 },
  { nama: 'Tokyo, Jepang', lat: 35.6762, lng: 139.6503 },
  { nama: 'London, Inggris', lat: 51.5074, lng: -0.1278 },
];

const daftarHariBesar = [
  { event: "Isra' Mi'raj 1447 H", date: "16 Januari 2026", desc: "Perjalanan suci Nabi Muhammad SAW" },
  { event: "Awal Ramadhan 1447 H", date: "18 Februari 2026", desc: "Hari pertama ibadah puasa Ramadhan" },
  { event: "Nuzulul Qur'an", date: "6 Maret 2026", desc: "Malam diturunkannya Al-Qur'an (17 Ramadhan)" },
  { event: "Idul Fitri 1447 H", date: "20 Maret 2026", desc: "1 Syawal, Hari Raya Kemenangan" },
  { event: "Idul Adha 1447 H", date: "26 Mei 2026", desc: "10 Dzulhijjah, Hari Raya Kurban" },
  { event: "Tahun Baru Islam", date: "16 Juni 2026", desc: "1 Muharram 1448 H" },
  { event: "Maulid Nabi", date: "25 Agustus 2026", desc: "12 Rabiul Awal 1448 H, Kelahiran Nabi SAW" },
];

const getIkonSholat = (nama, warnaClass) => {
  const className = `w-6 h-6 md:w-7 md:h-7 transition-colors duration-500 ${warnaClass}`;
  switch (nama) {
    case 'Imsak': return <MoonStar className={className} />;
    case 'Subuh': return <Sunrise className={className} />;
    case 'Dzuhur': return <Sun className={className} />;
    case 'Ashar': return <SunDim className={className} />;
    case 'Maghrib': return <Sunset className={className} />;
    case 'Isya': return <Moon className={className} />;
    default: return <Sun className={className} />;
  }
};

export default function Home() {
  const [lokasi, setLokasi] = useState(daftarKota[0]);
  const [jadwalHarian, setJadwalHarian] = useState([]);
  const [semuaJadwal, setSemuaJadwal] = useState([]);
  const [waktuSekarang, setWaktuSekarang] = useState(new Date());
  const [arahKiblat, setArahKiblat] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // State untuk Modal & Interaksi
  const [suaraAktif, setSuaraAktif] = useState(false);
  const [showDoa, setShowDoa] = useState(false);
  const [showKalender, setShowKalender] = useState(false);
  const [showKompas, setShowKompas] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // State untuk Sensor Kompas
  const [heading, setHeading] = useState(null);
  
  const audioRef = useRef(null);
  const listRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    const savedLokasi = localStorage.getItem('lokasiSholatTerakhir');
    if (savedLokasi) setLokasi(JSON.parse(savedLokasi));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setWaktuSekarang(now);
      
      semuaJadwal.forEach(sholat => {
        const diffMs = sholat.waktu.getTime() - now.getTime();
        if (diffMs <= 0 && diffMs > -1000 && sholat.nama !== 'Imsak') {
          if (suaraAktif && audioRef.current) {
            audioRef.current.play().catch(e => console.log('Autoplay ditolak', e));
          }
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [semuaJadwal, suaraAktif]);

  useEffect(() => {
    const coordinates = new Coordinates(lokasi.lat, lokasi.lng);
    const params = CalculationMethod.Singapore();
    params.fajrAngle = 20;
    params.ishaAngle = 18;
    params.madhab = Madhab.Shafi; 
    params.adjustments = { fajr: 2, dhuhr: 2, asr: 2, maghrib: 2, isha: 2 }; 
    
    // Perbaikan Kalkulasi Arah Kiblat (Tanpa 'new')
    const qiblaCalc = Qibla(coordinates);
    setArahKiblat(qiblaCalc);
    
    const buatJadwal = (tanggal) => {
      const pt = new PrayerTimes(coordinates, tanggal, params);
      return [
        { nama: 'Imsak', waktu: new Date(pt.fajr.getTime() - 10 * 60000), iqomah: 0 },
        { nama: 'Subuh', waktu: pt.fajr, iqomah: 10 },
        { nama: 'Dzuhur', waktu: pt.dhuhr, iqomah: 10 },
        { nama: 'Ashar', waktu: pt.asr, iqomah: 10 },
        { nama: 'Maghrib', waktu: pt.maghrib, iqomah: 7 },
        { nama: 'Isya', waktu: pt.isha, iqomah: 10 },
      ];
    };

    const dateToday = new Date();
    const dateTomorrow = new Date(dateToday);
    dateTomorrow.setDate(dateTomorrow.getDate() + 1);

    const jadwalHariIni = buatJadwal(dateToday);
    const jadwalBesok = buatJadwal(dateTomorrow);

    setJadwalHarian(jadwalHariIni);
    setSemuaJadwal([...jadwalHariIni, ...jadwalBesok]);
    
  }, [lokasi, waktuSekarang.getDate()]); 

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    if (jadwalHarian.length > 0 && listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.08, duration: 0.5, ease: 'back.out(1.2)' }
      );
    }
  }, [jadwalHarian]);

  // LOGIKA STATUS WAKTU SHOLAT
  let modeIqomah = false;
  let sholatBerikutnya = semuaJadwal.find(j => j.waktu.getTime() > waktuSekarang.getTime());
  let currentIndex = semuaJadwal.findIndex(j => j.waktu.getTime() > waktuSekarang.getTime()) - 1;
  let sholatTerakhir = currentIndex >= 0 ? semuaJadwal[currentIndex] : null;

  let namaTarget = sholatBerikutnya?.nama;
  let waktuTarget = sholatBerikutnya?.waktu;

  if (sholatTerakhir && sholatTerakhir.iqomah > 0) {
    const waktuBatasIqomah = new Date(sholatTerakhir.waktu.getTime() + sholatTerakhir.iqomah * 60000);
    if (waktuSekarang.getTime() < waktuBatasIqomah.getTime()) {
      modeIqomah = true;
      namaTarget = `Iqomah ${sholatTerakhir.nama}`;
      waktuTarget = waktuBatasIqomah;
    }
  }

  // KALKULASI PROGRESS (TANPA ANGKA DESIMAL DI UI)
  let progressPersen = 0;
  if (waktuTarget) {
    let waktuMulai = new Date();
    waktuMulai.setHours(0, 0, 0, 0); 
    if (modeIqomah && sholatTerakhir) {
      waktuMulai = sholatTerakhir.waktu; 
    } else if (sholatTerakhir) {
      waktuMulai = new Date(sholatTerakhir.waktu.getTime() + (sholatTerakhir.iqomah * 60000));
    }
    const durasiTotal = waktuTarget.getTime() - waktuMulai.getTime();
    const waktuBerjalan = waktuSekarang.getTime() - waktuMulai.getTime();
    progressPersen = Math.min(100, Math.max(0, (waktuBerjalan / durasiTotal) * 100));
  }

  const getCountdown = () => {
    if (!waktuTarget) return "--:--:--";
    const diffMs = waktuTarget.getTime() - waktuSekarang.getTime();
    if (diffMs <= 0) return "00:00:00";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTanggalHijriyah = () => {
    try {
      return new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(waktuSekarang) + ' H';
    } catch (e) {
      return '';
    }
  };

  const deteksiLokasi = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLokasi({
            nama: '📍 Lokasi GPS Anda',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        () => {
          alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
          setLoading(false);
        }
      );
    }
  };

  // FUNGSI KOMPAS (SENSOR HP)
  const handleOrientation = (event) => {
    let compassHeading = null;
    if (event.webkitCompassHeading !== undefined) {
      compassHeading = event.webkitCompassHeading; // iOS
    } else if (event.alpha !== null) {
      compassHeading = 360 - event.alpha; // Android approximation
    }
    if (compassHeading !== null) {
      setHeading(compassHeading);
    }
  };

  const mulaiKompas = async () => {
    setShowKompas(true);
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          alert('Izin sensor kompas ditolak.');
        }
      } catch (error) {
        console.error('Error meminta izin kompas:', error);
      }
    } else if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  const tutupKompas = () => {
    setShowKompas(false);
    window.removeEventListener('deviceorientation', handleOrientation, true);
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    setHeading(null);
  };

  // Cek apakah HP menghadap kiblat (Toleransi kemiringan 4 derajat)
  const isMenghadapKiblat = heading !== null && 
    (Math.abs((heading - arahKiblat) % 360) <= 4 || Math.abs((heading - arahKiblat) % 360) >= 356);

  // Vibrate saat menghadap kiblat
  useEffect(() => {
    if (isMenghadapKiblat && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [isMenghadapKiblat]);

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-200 p-4 md:p-8 flex justify-center font-sans relative overflow-hidden">
      <audio ref={audioRef} src="/adzan.mp3" preload="auto" />
      
      {/* AMBIENT BACKGROUND GLOW */}
      <div className={`absolute top-0 left-1/4 w-[50vw] h-[40vh] blur-[140px] rounded-full pointer-events-none transition-colors duration-[2000ms] ease-in-out opacity-40 ${modeIqomah ? 'bg-amber-900/40' : 'bg-emerald-900/30'}`}></div>
      <div className={`absolute bottom-0 right-1/4 w-[40vw] h-[30vh] blur-[120px] rounded-full pointer-events-none transition-colors duration-[2000ms] ease-in-out opacity-30 ${modeIqomah ? 'bg-orange-800/20' : 'bg-teal-900/20'}`}></div>

      <div className="max-w-md w-full relative z-10 flex flex-col pt-2 pb-10">
        
        {/* NAVIGASI ATAS */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button onClick={() => setShowDoa(true)} className="flex items-center gap-2 text-xs font-semibold bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md text-emerald-400 px-4 py-2.5 rounded-full transition-all border border-white/5 shadow-md">
            <BookOpen className="w-4 h-4" /> Doa Adzan
          </button>
          
          <button onClick={() => setShowKalender(true)} className="flex items-center gap-2 text-xs font-semibold bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md text-emerald-400 px-4 py-2.5 rounded-full transition-all border border-white/5 shadow-md">
            <CalendarDays className="w-4 h-4" /> Hari Besar
          </button>

          <button onClick={() => setSuaraAktif(!suaraAktif)} className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-full transition-all backdrop-blur-md border shadow-md ${suaraAktif ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/[0.03] text-slate-400 border-white/5 hover:bg-white/[0.08]'}`}>
            {suaraAktif ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {suaraAktif ? 'Suara ON' : 'Mute'}
          </button>
        </div>

        {/* HEADER & MAIN WAKTU CARD */}
        <header ref={headerRef} className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              Waktu <span className={`bg-clip-text bg-gradient-to-r ${modeIqomah ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-400'}`}>Sholat</span>
            </h1>
          </div>
          
          <div className={`relative rounded-3xl p-6 md:p-8 backdrop-blur-xl border transition-all duration-700 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
            modeIqomah ? 'bg-amber-950/10 border-amber-500/20' : 'bg-white/[0.02] border-white/10'
          }`}>
             <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

             <div className="flex justify-center mb-6">
               <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-black/40 border border-white/5 shadow-inner">
                  <Clock className={`w-3.5 h-3.5 ${modeIqomah ? 'text-amber-500' : 'text-emerald-500'}`} />
                  <p suppressHydrationWarning className={`font-mono text-base font-bold tracking-widest ${modeIqomah ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isMounted ? format(waktuSekarang, 'HH:mm:ss') : '--:--:--'}
                  </p>
               </div>
             </div>

             {waktuTarget && (
               <div className="w-full flex flex-col items-center">
                 <p className="text-slate-300 text-sm mb-1 flex items-center gap-1.5 font-medium tracking-wide">
                   {modeIqomah && <AlertCircle className="w-4 h-4 text-amber-500" />}
                   Menuju <span className={`font-bold drop-shadow-md ${modeIqomah ? 'text-amber-400' : 'text-emerald-400'}`}>{namaTarget}</span>
                 </p>
                 <span suppressHydrationWarning className="font-mono font-black text-5xl md:text-6xl text-white tracking-tighter my-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                   {isMounted ? getCountdown() : '--:--:--'}
                 </span>
                 
                 {/* PROGRESS BAR BERSIH TANPA ANGKA DESIMAL */}
                 <div className="w-full flex justify-start items-end mt-6 mb-2">
                    <span className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">Progres Waktu</span>
                 </div>
                 <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-r relative ${modeIqomah ? 'from-amber-700 to-amber-400' : 'from-emerald-700 to-emerald-400'}`}
                      style={{ width: `${progressPersen}%` }}
                    >
                      <div className="absolute top-0 right-0 w-8 h-full bg-white/40 blur-[2px] rounded-full animate-pulse"></div>
                    </div>
                 </div>
               </div>
             )}
          </div>
        </header>
        
        {/* PILIH LOKASI & TOMBOL BUKA KOMPAS KIBLAT */}
        <div className="space-y-3 mb-10">
          <div className="relative group">
            <select 
              className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-white text-sm md:text-base rounded-2xl p-4 pl-12 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] appearance-none cursor-pointer transition-all shadow-lg"
              value={lokasi.nama}
              onChange={(e) => {
                const kota = daftarKota.find(k => k.nama === e.target.value);
                if (kota) {
                  setLokasi(kota);
                  localStorage.setItem('lokasiSholatTerakhir', JSON.stringify(kota));
                }
              }}
            >
              <option disabled value="📍 Lokasi GPS Anda" className="bg-slate-900 text-slate-400">Pilih Lokasi...</option>
              {daftarKota.map((kota) => <option key={kota.nama} value={kota.nama} className="bg-slate-800 text-white">{kota.nama}</option>)}
            </select>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"><ChevronRight className="w-5 h-5 rotate-90" /></div>
          </div>

          <div className="flex gap-2">
            <button onClick={deteksiLokasi} disabled={loading} className="flex-1 bg-[#1e293b] hover:bg-[#334155] text-white font-semibold py-4 px-3 rounded-2xl transition-all shadow-sm active:scale-[0.98] text-xs md:text-sm border border-white/10">
              {loading ? 'Mencari...' : 'Gunakan GPS'}
            </button>
            
            <button onClick={mulaiKompas} className="flex-[1.5] flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] active:scale-[0.98] text-xs md:text-sm border border-emerald-500/20">
              <Compass className="w-4 h-4" /> Buka Kompas
            </button>
          </div>
        </div>

        {/* TANGGAL AREA */}
        <div className="flex flex-col items-center mb-6 py-2">
           <p suppressHydrationWarning className="text-white text-base font-semibold tracking-wide drop-shadow-sm">
             {isMounted ? format(waktuSekarang, 'EEEE, dd MMMM yyyy') : 'Memuat...'}
           </p>
           <p suppressHydrationWarning className="text-emerald-400 text-sm font-semibold mt-1.5 bg-emerald-500/10 px-4 py-1 rounded-full border border-emerald-500/20 shadow-sm">
             {isMounted ? getTanggalHijriyah() : ''}
           </p>
        </div>

        {/* DAFTAR JADWAL SHOLAT */}
        {jadwalHarian.length > 0 && (
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-[2rem] p-3 md:p-4 border border-white/5 shadow-2xl">
            <ul ref={listRef} className="space-y-2">
              {jadwalHarian.map((item) => {
                const isNext = sholatBerikutnya?.nama === item.nama && !modeIqomah;
                const isIqomahThis = modeIqomah && sholatTerakhir?.nama === item.nama;
                
                let liClass = 'bg-transparent border border-transparent hover:bg-white/[0.04]';
                let iconColorClass = 'text-slate-400';
                let textColor = 'text-slate-300';
                let timeColor = 'text-slate-300';
                let badge = null;

                if (isIqomahThis) {
                  liClass = 'bg-amber-500/10 border border-amber-500/30 shadow-[0_4px_15px_rgba(245,158,11,0.1)]';
                  iconColorClass = 'text-amber-400';
                  textColor = 'text-amber-300';
                  timeColor = 'text-white';
                  badge = <span className="text-[10px] md:text-xs text-amber-400 font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-md mt-1">Iqomah</span>;
                } else if (isNext) {
                  liClass = 'bg-emerald-500/10 border border-emerald-500/30 shadow-[0_4px_15px_rgba(16,185,129,0.1)]';
                  iconColorClass = 'text-emerald-400';
                  textColor = 'text-emerald-300';
                  timeColor = 'text-white';
                  badge = <span className="text-[10px] md:text-xs text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-md mt-1">Berikutnya</span>;
                }

                return (
                  <li key={item.nama} className={`flex justify-between items-center p-4 rounded-2xl transition-all duration-300 cursor-default ${liClass}`}>
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className={`p-2.5 md:p-3 rounded-xl shadow-inner transition-colors ${isIqomahThis ? 'bg-amber-500/20' : isNext ? 'bg-emerald-500/20' : 'bg-black/30'}`}>
                        {getIkonSholat(item.nama, iconColorClass)}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className={`text-lg md:text-xl font-bold tracking-wide ${textColor}`}>{item.nama}</span>
                        {badge}
                      </div>
                    </div>
                    <span suppressHydrationWarning className={`text-2xl md:text-3xl font-extrabold font-mono drop-shadow-sm ${timeColor}`}>
                      {isMounted ? format(item.waktu, 'HH:mm') : '--:--'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* MODAL KOMPAS KIBLAT VISUAL REAL-TIME */}
      {showKompas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050a]/95 backdrop-blur-xl transition-opacity">
          <div className="bg-[#0b1120] border border-white/10 rounded-3xl max-w-sm w-full shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative flex flex-col items-center p-8">
            <button onClick={tutupKompas} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/40 p-2 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">Arah Kiblat</h3>
            <p className="text-slate-400 text-sm text-center mb-8">Posisikan HP Anda mendatar seperti melihat peta.</p>
            
            {/* Indikator "Menghadap Kiblat" */}
            <div className={`px-4 py-1.5 rounded-full mb-6 font-bold text-sm tracking-wider transition-colors duration-300 ${isMenghadapKiblat ? 'bg-emerald-500 text-black shadow-[0_0_20px_#10b981]' : 'bg-slate-800 text-slate-400'}`}>
              {isMenghadapKiblat ? 'LURUS MENGHADAP KIBLAT' : 'PUTAR HP ANDA'}
            </div>

            {/* Lingkaran Kompas Interaktif */}
            <div className="relative w-64 h-64 border-[6px] border-slate-800 bg-black/50 rounded-full flex items-center justify-center shadow-inner overflow-hidden">
               {heading === null ? (
                 <div className="text-slate-500 text-xs text-center px-4 animate-pulse">Menunggu sensor...<br/>(Gunakan HP, bukan Laptop)</div>
               ) : (
                 <>
                   {/* Piringan Kompas Berputar (Menjaga Utara selalu di tempat yang benar) */}
                   <div 
                     className="absolute inset-0 transition-transform duration-200 ease-out" 
                     style={{ transform: `rotate(${-heading}deg)` }}
                   >
                      {/* Penanda Mata Angin */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-red-500 font-bold text-sm">U</div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-500 font-bold text-sm">S</div>
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">B</div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">T</div>
                      
                      {/* Garis Pembantu */}
                      <div className="absolute top-1/2 left-0 w-full h-px bg-white/10"></div>
                      <div className="absolute top-0 left-1/2 w-px h-full bg-white/10"></div>

                      {/* Jarum Penunjuk Kiblat (Rotasi statis dari Utara menuju derajat Kiblat) */}
                      <div 
                        className="absolute inset-0 flex items-start justify-center"
                        style={{ transform: `rotate(${arahKiblat}deg)` }}
                      >
                        <div className="w-1.5 h-[50%] flex flex-col items-center justify-end origin-bottom">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center -mt-4 transition-colors duration-300 ${isMenghadapKiblat ? 'bg-emerald-500 shadow-[0_0_20px_#10b981]' : 'bg-emerald-500/50'}`}>
                             <Navigation className="w-5 h-5 text-white fill-white" />
                           </div>
                           <div className={`w-1 h-full rounded-t-full transition-colors duration-300 ${isMenghadapKiblat ? 'bg-emerald-500' : 'bg-emerald-500/50'}`}></div>
                        </div>
                      </div>
                   </div>
                   
                   {/* Penanda "Maju/Depan" HP yang Statis */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-white z-20 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"></div>
                   
                   {/* Titik Tengah */}
                   <div className="absolute w-4 h-4 bg-white rounded-full z-20 border-2 border-slate-900 shadow-md"></div>
                 </>
               )}
            </div>

            <p className="text-slate-500 text-xs mt-8 font-mono">Derajat Kiblat: {arahKiblat.toFixed(1)}°</p>
          </div>
        </div>
      )}

      {/* MODAL DOA ADZAN */}
      {showDoa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050a]/80 backdrop-blur-md transition-opacity">
          <div className="bg-[#0b1120]/90 backdrop-blur-xl border border-white/10 rounded-3xl max-w-lg w-full shadow-[0_10px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            <div className="p-6 md:p-8 pb-4 flex justify-between items-center sticky top-0 bg-transparent border-b border-white/5">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-400 flex items-center gap-2"><BookOpen className="w-5 h-5 md:w-6 md:h-6" /> Doa Adzan</h3>
              <button onClick={() => setShowDoa(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/40 p-2 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8 pt-6 overflow-y-auto custom-scrollbar text-center space-y-8">
              <p className="text-2xl md:text-3xl font-bold text-white font-serif leading-loose" dir="rtl" style={{ lineHeight: '2.4' }}>
                اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَالشَّرَفَ وَالدَّرَجَةَ الْعَالِيَةَ الرَّفِيعَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ، إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ
              </p>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                <p className="text-emerald-300/90 text-sm md:text-base italic leading-relaxed font-medium">"Allaahumma robba haadzihid da'watit taammah, washsholaatil qoo-imah, aati muhammadanil wasiilata wal fadhilah, wasy-syarafa wad-darajatal 'aaliyatar rafii'ah, wab'atshu maqoomam mahmuudanil ladzii wa'adtah, innaka laa tukhliful mii'aad."</p>
              </div>
              <div className="text-left bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/10">
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  <span className="font-bold text-emerald-500 block mb-1.5 uppercase tracking-wider text-xs">Terjemahan</span>
                  "Ya Allah, Tuhan yang memiliki seruan yang sempurna dan shalat yang tetap didirikan, karuniailah Nabi Muhammad wasilah, keutamaan, serta kemuliaan dan kedudukan yang tinggi. Bangkitkanlah beliau pada kedudukan yang terpuji yang telah Engkau janjikan. Sesungguhnya Engkau tidak menyalahi janji."
                </p>
              </div>
            </div>
            <div className="p-6 md:p-8 pt-4">
              <button onClick={() => setShowDoa(false)} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/10 shadow-sm">Tutup Doa</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KALENDER HARI BESAR ISLAM */}
      {showKalender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050a]/80 backdrop-blur-md transition-opacity">
          <div className="bg-[#0b1120]/90 backdrop-blur-xl border border-white/10 rounded-3xl max-w-lg w-full shadow-[0_10px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
            <div className="p-6 md:p-8 pb-4 flex justify-between items-center sticky top-0 bg-transparent border-b border-white/5">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-400 flex items-center gap-2"><CalendarDays className="w-5 h-5 md:w-6 md:h-6" /> Hari Besar Islam</h3>
              <button onClick={() => setShowKalender(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/40 p-2 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8 pt-6 overflow-y-auto custom-scrollbar space-y-4">
              <p className="text-slate-400 text-sm text-center mb-6">Jadwal peringatan hari besar Islam tahun 1447-1448 Hijriyah.</p>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:to-transparent">
                {daftarHariBesar.map((item, index) => (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0b1120] bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 z-10">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] ml-auto md:ml-0 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 p-4 rounded-2xl transition-colors shadow-sm">
                      <h4 className="font-bold text-emerald-300 text-base mb-1">{item.event}</h4>
                      <p className="text-white font-mono text-xs mb-2 bg-black/40 inline-block px-2 py-0.5 rounded-md border border-white/10">{item.date}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 md:p-8 pt-4 border-t border-white/5">
              <button onClick={() => setShowKalender(false)} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/10 shadow-sm">Tutup Kalender</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}