'use client';

import { useState, useEffect, useRef } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Qibla } from 'adhan';
import { format } from 'date-fns';
import gsap from 'gsap';
import { MoonStar, Sunrise, Sun, SunDim, Sunset, Moon, Volume2, VolumeX, BookOpen, X, MapPin, AlertCircle, Clock, ChevronRight, CalendarDays, Compass, Star, Heart, Sparkles } from 'lucide-react';

const daftarKota = [
  { nama: 'Cigombong, Bogor', lat: -6.7645, lng: 106.8163 },
  { nama: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456 },
  { nama: 'Bandung, Indonesia', lat: -6.9175, lng: 107.6191 },
  { nama: 'Sukabumi, Indonesia', lat: -6.9228, lng: 106.9222 },
  { nama: 'Tokyo, Jepang', lat: 35.6762, lng: 139.6503 },
  { nama: 'London, Inggris', lat: 51.5074, lng: -0.1278 },
];

// Data Kalender 2026 Sesuai Fakta & SKB Nasional
const daftarHariBesar = [
  { event: "Isra' Mi'raj 1447 H", date: "16 Januari 2026", y: 2026, m: 0, d: 16, desc: "27 Rajab 1447 H, Perjalanan suci Nabi Muhammad SAW" },
  { event: "Awal Ramadhan 1447 H", date: "18 Februari 2026", y: 2026, m: 1, d: 18, desc: "1 Ramadhan 1447 H, Hari pertama ibadah puasa" },
  { event: "Nuzulul Qur'an", date: "6 Maret 2026", y: 2026, m: 2, d: 6, desc: "17 Ramadhan 1447 H, Malam diturunkannya Al-Qur'an" },
  { event: "Idul Fitri 1447 H", date: "21 Maret 2026", y: 2026, m: 2, d: 21, desc: "1 Syawal 1447 H, Hari Raya Kemenangan" },
  { event: "Idul Adha 1447 H", date: "27 Mei 2026", y: 2026, m: 4, d: 27, desc: "10 Dzulhijjah 1447 H, Hari Raya Kurban" },
  { event: "Tahun Baru Islam", date: "16 Juni 2026", y: 2026, m: 5, d: 16, desc: "1 Muharram 1448 H" },
  { event: "Maulid Nabi", date: "25 Agustus 2026", y: 2026, m: 7, d: 25, desc: "12 Rabiul Awal 1448 H, Kelahiran Nabi SAW" },
];

const BULAN_HIJRIYAH = [
  "Muharram", "Shafar", "Rabi'ul Awal", "Rabi'ul Akhir",
  "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
  "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
];

const getIkonSholat = (nama, warnaClass) => {
  const className = `w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 ${warnaClass}`;
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

const getHariBesarTerdekat = () => {
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);

  for (let i = 0; i < daftarHariBesar.length; i++) {
    const item = daftarHariBesar[i];
    const tanggalEvent = new Date(item.y, item.m, item.d);
    
    if (tanggalEvent >= hariIni) {
      const selisihWaktu = Math.abs(tanggalEvent - hariIni);
      const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));
      return { ...item, sisaHari: selisihHari };
    }
  }
  return null; 
};

export default function Home() {
  const [lokasi, setLokasi] = useState(daftarKota[0]);
  const [jadwalHarian, setJadwalHarian] = useState([]);
  const [semuaJadwal, setSemuaJadwal] = useState([]);
  const [waktuSekarang, setWaktuSekarang] = useState(new Date());
  const [arahKiblat, setArahKiblat] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [suaraAktif, setSuaraAktif] = useState(false);
  const [showDoa, setShowDoa] = useState(false);
  const [showKalender, setShowKalender] = useState(false);
  const [showKompas, setShowKompas] = useState(false);
  const [showPopupEvent, setShowPopupEvent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [heading, setHeading] = useState(null);
  
  const audioRef = useRef(null);
  const takbiranRef = useRef(null); // Ref Khusus untuk Audio Takbiran
  const listRef = useRef(null);
  const headerRef = useRef(null);

  const eventTerdekat = getHariBesarTerdekat();

  useEffect(() => {
    setIsMounted(true);
    const savedLokasi = localStorage.getItem('lokasiSholatTerakhir');
    if (savedLokasi) setLokasi(JSON.parse(savedLokasi));

    if (eventTerdekat && eventTerdekat.sisaHari <= 14) {
      const timerPopup = setTimeout(() => setShowPopupEvent(true), 1500);
      return () => clearTimeout(timerPopup);
    }
  }, []);

  // LOGIKA SMART AUDIO TAKBIRAN (Berbasis Waktu 00:00 - 08:00)
  useEffect(() => {
    if (!eventTerdekat || !takbiranRef.current) return;

    const isHariRaya = eventTerdekat.event.includes('Idul'); // Pastikan ini event Idul Adha/Fitri
    const isHariH = eventTerdekat.sisaHari === 0; // Pastikan ini tepat Hari H
    const jamSekarang = waktuSekarang.getHours();
    
    // Rentang waktu: Lebih dari sama dengan jam 00 (tengah malam) dan kurang dari jam 8 pagi
    const isWaktuTakbiran = jamSekarang >= 0 && jamSekarang < 8;

    if (isHariRaya && isHariH && isWaktuTakbiran && suaraAktif) {
      // Mainkan takbiran, tangkap error jika browser menolak autoplay
      const playPromise = takbiranRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay Takbiran ditolak browser, menunggu interaksi pengguna.", error);
        });
      }
    } else {
      // Jeda takbiran jika waktu habis atau tombol Suara dimatikan
      takbiranRef.current.pause();
    }
  }, [waktuSekarang.getHours(), eventTerdekat?.sisaHari, suaraAktif, eventTerdekat?.event]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setWaktuSekarang(now);
      semuaJadwal.forEach(sholat => {
        const diffMs = sholat.waktu.getTime() - now.getTime();
        // Adzan otomatis menyala jika batas waktu terlewati & suara aktif
        if (diffMs <= 0 && diffMs > -1000 && sholat.nama !== 'Imsak') {
          if (suaraAktif && audioRef.current) audioRef.current.play().catch(e => console.log(e));
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
    
    setArahKiblat(Qibla(coordinates));
    
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
    gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    if (jadwalHarian.length > 0 && listRef.current) {
      gsap.fromTo(listRef.current.children, { opacity: 0, y: 20, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' });
    }
  }, [jadwalHarian]);

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

  let progressPersen = 0;
  if (waktuTarget) {
    let waktuMulai = new Date();
    waktuMulai.setHours(0, 0, 0, 0); 
    if (modeIqomah && sholatTerakhir) waktuMulai = sholatTerakhir.waktu; 
    else if (sholatTerakhir) waktuMulai = new Date(sholatTerakhir.waktu.getTime() + (sholatTerakhir.iqomah * 60000));
    
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

  const getTanggalMasehi = () => {
    try { return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(waktuSekarang); } 
    catch (e) { return format(waktuSekarang, 'dd MMMM yyyy'); }
  };

  const getTanggalHijriyah = () => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
      const parts = formatter.formatToParts(waktuSekarang);
      let day, month, year;
      parts.forEach(p => {
        if (p.type === 'day') day = p.value;
        if (p.type === 'month') month = p.value;
        if (p.type === 'year') year = p.value;
      });
      const namaBulan = BULAN_HIJRIYAH[parseInt(month) - 1] || month;
      return `${day} ${namaBulan} ${year} H`;
    } catch (e) {
      return '';
    }
  };

  const deteksiLokasi = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setLokasi({ nama: '📍 Lokasi GPS Anda', lat: position.coords.latitude, lng: position.coords.longitude }); setLoading(false); },
        () => { alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.'); setLoading(false); }
      );
    }
  };

  const handleOrientation = (event) => {
    let compassHeading = null;
    if (event.webkitCompassHeading !== undefined) compassHeading = event.webkitCompassHeading; 
    else if (event.absolute === true && event.alpha !== null) compassHeading = 360 - event.alpha; 
    else if (event.alpha !== null) compassHeading = 360 - event.alpha; 

    if (compassHeading !== null) {
      let screenOrientation = window.screen?.orientation?.angle || window.orientation || 0;
      let finalHeading = (compassHeading + screenOrientation) % 360;
      if (finalHeading < 0) finalHeading += 360;
      setHeading(finalHeading);
    }
  };

  const mulaiKompas = async () => {
    setShowKompas(true);
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') window.addEventListener('deviceorientation', handleOrientation, true);
        else alert('Izin sensor kompas ditolak.');
      } catch (error) { console.error(error); }
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

  let diffKiblat = heading !== null ? Math.abs(heading - arahKiblat) : null;
  if (diffKiblat > 180) diffKiblat = 360 - diffKiblat;
  const isMenghadapKiblat = heading !== null && diffKiblat <= 3;

  useEffect(() => { if (isMenghadapKiblat && navigator.vibrate) navigator.vibrate([50, 50, 50]); }, [isMenghadapKiblat]);

  // LOGIKA RENDER GRAFIS EVENT POP-UP (Emoji di H-Minus, Gambar Custom saat Hari H)
const renderEventGraphics = () => {
    if (!eventTerdekat) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(eventTerdekat.y, eventTerdekat.m, eventTerdekat.d);
    eventDate.setHours(0, 0, 0, 0);

    // 1. JIKA EVENT IDUL ADHA DAN HARI INI ADALAH HARI H: TAMPILKAN DESAIN GAMBAR KUSTOM
    if (eventTerdekat.event.includes('Adha') && today.getTime() === eventDate.getTime()) {
      return (
        // PERBAIKAN: Menghapus batas tinggi kaku (h-56) agar ruang gambar lebih fleksibel
        <div className="relative w-full flex flex-col items-center bg-[#0b1120] overflow-hidden rounded-t-[2rem]">
          <img 
            src="/desain-idul-adha.png"
            alt="Spesial Idul Adha" 
            // PERBAIKAN: Menggunakan object-contain & h-auto agar desain potrait/vertikal tidak terpotong sama sekali
            className="w-full h-auto max-h-[65vh] object-contain z-0 transition-transform duration-1000 hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none'; 
              console.log("Gambar desain-idul-adha.png tidak ditemukan.");
            }}
          />
          {/* PERBAIKAN: Gradasi dipusatkan di bagian bawah agar teks/tombol modal menyatu lebih halus */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent z-10 pointer-events-none"></div>
        </div>
      );
    } 
    
    // 2. JIKA EVENT LAIN, ATAU IDUL ADHA TAPI MASIH H-MINUS: TAMPILKAN EMOJI CERIA
    let emojis = (
      <div className="relative z-10 flex items-end drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]">
        <span className="text-[5rem] z-10 scale-110 hover:scale-125 transition-transform">🕌</span>
      </div>
    );

    if (eventTerdekat.event.includes('Adha')) {
      emojis = (
        <div className="relative z-10 flex items-end gap-3 md:gap-4 drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]">
          <span className="text-5xl transform -rotate-12 translate-y-3 hover:scale-110 transition-transform">🐄</span>
          <span className="text-7xl z-10 scale-110 hover:scale-125 transition-transform">🕌</span>
          <span className="text-5xl transform rotate-12 translate-y-3 hover:scale-110 transition-transform">🐐</span>
        </div>
      );
    } else if (eventTerdekat.event.includes('Fitri') || eventTerdekat.event.includes('Ramadhan')) {
      emojis = (
        <div className="relative z-10 flex items-end gap-3 md:gap-4 drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]">
          <span className="text-5xl transform -rotate-12 translate-y-3 hover:scale-110 transition-transform">🌙</span>
          <span className="text-7xl z-10 scale-110 hover:scale-125 transition-transform">🕌</span>
          <span className="text-5xl transform rotate-12 translate-y-3 hover:scale-110 transition-transform">✨</span>
        </div>
      );
    }

    return (
      <div className={`h-48 w-full rounded-t-[2rem] relative flex flex-col items-center justify-center overflow-hidden ${eventTerdekat.sisaHari === 0 ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-900' : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)] opacity-80"></div>
        {emojis}
        <Star className="absolute top-6 left-8 w-6 h-6 text-yellow-300 animate-pulse fill-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]" />
        <Star className="absolute bottom-8 right-8 w-4 h-4 text-yellow-300 animate-pulse fill-yellow-300 delay-200 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />
        {eventTerdekat.sisaHari === 0 && <Sparkles className="absolute top-1/2 left-1/4 w-5 h-5 text-white animate-pulse" />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex justify-center font-sans relative overflow-x-hidden">
      
      <style>{`
        @keyframes swing { 0% { transform: rotate(-3deg); } 100% { transform: rotate(3deg); } }
        .animate-swing { animation: swing 3s ease-in-out infinite alternate; transform-origin: top center; }
        @keyframes popupEnter { 0% { opacity: 0; transform: scale(0.8) translateY(30px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-popup { animation: popupEnter 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .glass-card { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.3); }
        .glass-popup { background: rgba(2, 44, 34, 0.85); backdrop-filter: blur(24px); border: 1px solid rgba(16, 185, 129, 0.3); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9), inset 0 2px 15px rgba(16, 185, 129, 0.2); }
      `}</style>

      <audio ref={audioRef} src="/adzan.mp3" preload="auto" />
      {/* ELEMEN AUDIO TAKBIRAN BARU */}
      <audio ref={takbiranRef} src="https://files.catbox.moe/hthe21.mp3" preload="auto" loop/>
      
      {/* BACKGROUND */}
      <svg className={`fixed inset-0 w-full h-full pointer-events-none z-0 transition-colors duration-1000 ${modeIqomah ? 'text-amber-500' : 'text-emerald-500'} opacity-[0.02]`} xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="islamic-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse"><g stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M40 0L45 35L80 40L45 45L40 80L35 45L0 40L35 35Z" /><rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" /></g></pattern></defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#islamic-pattern)" />
      </svg>
      <div className={`fixed top-[-10%] left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] blur-[150px] rounded-full pointer-events-none transition-all duration-[2000ms] opacity-40 z-0 ${modeIqomah ? 'bg-amber-700/30' : 'bg-emerald-700/30'}`}></div>
      
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[85vh] pointer-events-none z-0 overflow-visible">
         <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full drop-shadow-[0_-5px_25px_rgba(0,0,0,0.5)]">
            <path d="M 5 100 L 5 35 C 5 15, 40 25, 50 0 C 60 25, 95 15, 95 35 L 95 100 Z" className={`transition-colors duration-1000 ${modeIqomah ? 'fill-amber-950/20' : 'fill-emerald-950/10'}`} />
            <path d="M 5 100 L 5 35 C 5 15, 40 25, 50 0 C 60 25, 95 15, 95 35 L 95 100" fill="none" className={`transition-colors duration-1000 ${modeIqomah ? 'stroke-amber-500/40' : 'stroke-emerald-500/40'}`} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <path d="M 9 100 L 9 36 C 9 20, 40 28, 50 4 C 60 28, 91 20, 91 36 L 91 100" fill="none" className={`transition-colors duration-1000 ${modeIqomah ? 'stroke-amber-500/20' : 'stroke-emerald-500/20'}`} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
         </svg>
      </div>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-0 animate-swing">
         <div className={`w-0.5 h-16 md:h-24 bg-gradient-to-b transition-colors duration-1000 ${modeIqomah ? 'from-transparent to-amber-500' : 'from-transparent to-emerald-500'}`}></div>
         <div className={`w-4 h-8 md:w-5 md:h-10 rounded-b-full rounded-t-sm transition-all duration-1000 ${modeIqomah ? 'bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_15px_40px_rgba(251,191,36,0.6)]' : 'bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_15px_40px_rgba(52,211,153,0.6)]'}`}></div>
         <div className={`absolute top-20 w-32 h-32 rounded-full blur-[40px] opacity-40 transition-colors duration-1000 ${modeIqomah ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="max-w-md w-full relative z-20 flex flex-col pt-16 md:pt-20 pb-12 px-5 md:px-0">
        
        <div className="flex flex-wrap justify-center gap-3 mb-10 mt-6 md:mt-10">
          <button onClick={() => setShowDoa(true)} className="flex items-center gap-2 text-[11px] md:text-xs font-semibold bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-lg text-white px-5 py-2.5 rounded-full transition-all border border-white/5 shadow-md">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Doa Adzan
          </button>
          <button onClick={() => setShowKalender(true)} className="flex items-center gap-2 text-[11px] md:text-xs font-semibold bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-lg text-white px-5 py-2.5 rounded-full transition-all border border-white/5 shadow-md">
            <CalendarDays className="w-4 h-4 text-emerald-400" /> Hari Besar
          </button>
          <button onClick={() => setSuaraAktif(!suaraAktif)} className={`flex items-center gap-2 text-[11px] md:text-xs font-semibold px-5 py-2.5 rounded-full transition-all backdrop-blur-lg border shadow-md ${suaraAktif ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/[0.03] text-slate-300 border-white/5 hover:bg-white/[0.08]'}`}>
            {suaraAktif ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {suaraAktif ? 'Suara ON' : 'Mute'}
          </button>
        </div>

        <header ref={headerRef} className="mb-6">
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 mb-3 shadow-inner">
              <Clock className={`w-3.5 h-3.5 ${modeIqomah ? 'text-amber-400' : 'text-emerald-400'}`} />
              <p suppressHydrationWarning className="font-mono text-sm tracking-widest font-semibold text-slate-200">
                {isMounted ? format(waktuSekarang, 'HH:mm:ss') : '--:--:--'}
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Waktu <span className={`text-transparent bg-clip-text bg-gradient-to-r ${modeIqomah ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-400'}`}>Sholat</span>
            </h1>
          </div>
          
          <div className={`relative rounded-3xl p-8 glass-card transition-all duration-700 ${modeIqomah ? 'border-amber-500/20 bg-amber-950/10' : ''}`}>
             {waktuTarget && (
               <div className="w-full flex flex-col items-center">
                 <p className="text-slate-300 text-sm mb-1 flex items-center gap-1.5 font-medium tracking-wide">
                   {modeIqomah && <AlertCircle className="w-4 h-4 text-amber-400" />}
                   Menuju <span className={`font-bold uppercase tracking-wider ${modeIqomah ? 'text-amber-400' : 'text-emerald-400'}`}>{namaTarget}</span>
                 </p>
                 <span suppressHydrationWarning className="font-mono font-black text-6xl text-white tracking-tighter my-3 drop-shadow-lg">
                   {isMounted ? getCountdown() : '--:--:--'}
                 </span>
                 <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner mt-4">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-r relative ${modeIqomah ? 'from-amber-600 to-amber-400' : 'from-emerald-600 to-emerald-400'}`} style={{ width: `${progressPersen}%` }}>
                      <div className="absolute top-0 right-0 w-8 h-full bg-white/50 blur-[2px] rounded-full animate-pulse"></div>
                    </div>
                 </div>
               </div>
             )}
          </div>
        </header>

        {/* BANNER KECIL DI HALAMAN DEPAN */}
        {isMounted && eventTerdekat && (
          <div className={`mb-8 w-full glass-card p-4 rounded-2xl flex items-center justify-between relative overflow-hidden group transition-colors cursor-pointer ${eventTerdekat.sisaHari === 0 ? 'bg-gradient-to-r from-emerald-900/60 to-teal-900/40 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-gradient-to-r from-emerald-950/40 to-transparent border-emerald-500/20 hover:border-emerald-500/40'}`} onClick={() => setShowPopupEvent(true)}>
             <div className={`absolute top-0 right-0 w-32 h-full blur-[30px] ${eventTerdekat.sisaHari === 0 ? 'bg-emerald-400/20' : 'bg-emerald-500/10'}`}></div>
             <div className="flex items-center gap-3 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${eventTerdekat.sisaHari === 0 ? 'bg-emerald-400/30 border-emerald-400/50' : 'bg-emerald-500/20 border-emerald-500/20'}`}>
                  {eventTerdekat.sisaHari === 0 ? <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" /> : <Star className="w-5 h-5 text-yellow-400 fill-yellow-500/30" />}
                </div>
                <div>
                   <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${eventTerdekat.sisaHari === 0 ? 'text-emerald-300' : 'text-emerald-200/70'}`}>
                     {eventTerdekat.sisaHari === 0 ? 'Hari Ini Spesial' : 'Menjelang Hari Besar'}
                   </p>
                   <p className="text-white font-bold text-sm leading-tight drop-shadow-sm">{eventTerdekat.event}</p>
                </div>
             </div>
             <div className="text-right relative z-10">
                {eventTerdekat.sisaHari === 0 ? (
                  <span className="text-emerald-950 font-bold text-[10px] md:text-xs uppercase tracking-wider bg-gradient-to-r from-yellow-300 to-yellow-500 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(253,224,71,0.5)]">Tiba!</span>
                ) : (
                  <div className="flex flex-col items-end justify-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-yellow-400 leading-none drop-shadow-md">{eventTerdekat.sisaHari}</span>
                      <span className="text-xs text-yellow-300/80 font-bold uppercase">Hari</span>
                    </div>
                    <span className="text-[9px] text-yellow-400/60 uppercase tracking-widest font-bold mt-0.5">Lagi</span>
                  </div>
                )}
             </div>
          </div>
        )}
        
        <div className="space-y-3 mb-10">
          <div className="relative group">
            <select className="w-full glass-card text-white text-sm md:text-base rounded-2xl p-4 pl-12 outline-none focus:border-emerald-500/50 appearance-none cursor-pointer transition-all hover:bg-white/[0.04]" value={lokasi.nama} onChange={(e) => { const kota = daftarKota.find(k => k.nama === e.target.value); if (kota) { setLokasi(kota); localStorage.setItem('lokasiSholatTerakhir', JSON.stringify(kota)); }}}>
              <option disabled value="📍 Lokasi GPS Anda" className="bg-slate-900 text-slate-400">Pilih Lokasi...</option>
              {daftarKota.map((kota) => <option key={kota.nama} value={kota.nama} className="bg-slate-800 text-white">{kota.nama}</option>)}
            </select>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"><ChevronRight className="w-5 h-5 rotate-90" /></div>
          </div>

          <div className="flex gap-3">
            <button onClick={deteksiLokasi} disabled={loading} className="flex-1 glass-card hover:bg-white/[0.05] text-white font-semibold py-3.5 px-3 rounded-2xl transition-all shadow-sm active:scale-[0.98] text-xs md:text-sm">
              {loading ? 'Mencari...' : 'GPS Otomatis'}
            </button>
            <button onClick={mulaiKompas} className="flex-[1.5] flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-[0.98] text-xs md:text-sm border border-emerald-400/30">
              <Compass className="w-4 h-4" /> Arah Kiblat
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center mb-6 py-2">
           <p suppressHydrationWarning className="text-white text-base md:text-lg font-bold tracking-wide drop-shadow-md">
             {isMounted ? getTanggalMasehi() : 'Memuat...'}
           </p>
           <p suppressHydrationWarning className="text-emerald-400 text-sm font-semibold mt-1.5 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
             {isMounted ? getTanggalHijriyah() : ''}
           </p>
        </div>

        {jadwalHarian.length > 0 && (
          <div className="glass-card rounded-[2rem] p-3 border border-white/5 shadow-2xl relative z-10">
            <ul ref={listRef} className="space-y-1.5">
              {jadwalHarian.map((item) => {
                const isNext = sholatBerikutnya?.nama === item.nama && !modeIqomah;
                const isIqomahThis = modeIqomah && sholatTerakhir?.nama === item.nama;
                
                let liClass = 'bg-transparent border border-transparent hover:bg-white/[0.03]';
                let iconColorClass = 'text-slate-400';
                let textColor = 'text-slate-300';
                let timeColor = 'text-slate-400';
                let badge = null;

                if (isIqomahThis) {
                  liClass = 'bg-amber-500/10 border border-amber-500/30 shadow-[0_8px_20px_rgba(245,158,11,0.15)] scale-[1.02] z-10 relative';
                  iconColorClass = 'text-amber-400';
                  textColor = 'text-amber-400';
                  timeColor = 'text-white';
                  badge = <span className="text-[10px] md:text-xs text-amber-950 font-bold uppercase tracking-wider bg-amber-400 px-2 py-0.5 rounded-md mt-1">Sedang Iqomah</span>;
                } else if (isNext) {
                  liClass = 'bg-emerald-500/10 border border-emerald-500/30 shadow-[0_8px_20px_rgba(16,185,129,0.15)] scale-[1.02] z-10 relative';
                  iconColorClass = 'text-emerald-400';
                  textColor = 'text-emerald-400';
                  timeColor = 'text-white';
                  badge = <span className="text-[10px] md:text-xs text-emerald-950 font-bold uppercase tracking-wider bg-emerald-400 px-2 py-0.5 rounded-md mt-1">Berikutnya</span>;
                }

                return (
                  <li key={item.nama} className={`flex justify-between items-center p-4 rounded-2xl transition-all duration-300 cursor-default ${liClass}`}>
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className={`p-3 rounded-xl shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] transition-colors ${isIqomahThis ? 'bg-amber-950/80' : isNext ? 'bg-emerald-950/80' : 'bg-black/40'}`}>
                        {getIkonSholat(item.nama, iconColorClass)}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className={`text-lg md:text-xl font-bold tracking-wide ${textColor}`}>{item.nama}</span>
                        {badge}
                      </div>
                    </div>
                    <span suppressHydrationWarning className={`text-2xl md:text-3xl font-black font-mono drop-shadow-md ${timeColor}`}>
                      {isMounted ? format(item.waktu, 'HH:mm') : '--:--'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* MODAL POP-UP E-COMMERCE */}
      {showPopupEvent && eventTerdekat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md transition-opacity">
          
          <div className="glass-popup rounded-[2rem] max-w-sm w-full relative flex flex-col p-0 animate-popup overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.9)] border border-emerald-500/30">
            
            <button onClick={() => setShowPopupEvent(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 p-2.5 rounded-full transition-all z-30 backdrop-blur-md border border-white/10 shadow-lg">
              <X className="w-4 h-4" />
            </button>

            {/* AREA GAMBAR/VEKTOR: Dikelola oleh fungsi renderEventGraphics() */}
            {renderEventGraphics()}

            <div className="p-6 md:p-8 pt-6 text-center relative z-20 flex flex-col items-center bg-[#0b1120] rounded-b-[2rem]">
              
              {eventTerdekat.sisaHari === 0 ? (
                <>
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-950 text-[10px] md:text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-[0_5px_15px_rgba(250,204,21,0.4)] border border-yellow-300 flex items-center gap-1.5 mb-4 z-20 -mt-8">
                    <Sparkles className="w-3.5 h-3.5" /> ALHAMDULILLAH
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold font-serif italic text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 mb-2 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Selamat {eventTerdekat.event}!
                  </h3>
                  <p className="text-emerald-100/90 text-sm leading-relaxed mb-6 font-light">
                    Hari kemenangan dan keberkahan telah tiba. Semoga Allah SWT senantiasa menerima amal ibadah kita semua.
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-950 text-[10px] md:text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-[0_5px_15px_rgba(250,204,21,0.4)] border border-yellow-300 flex items-center gap-1.5 mb-4 z-20 -mt-8">
                    <Heart className="w-3.5 h-3.5 fill-yellow-950" /> Sambut Berkah
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold font-serif italic text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 mb-1 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Menjelang {eventTerdekat.event}
                  </h3>
                  <div className="text-emerald-100/90 text-sm leading-relaxed mb-6 font-light mt-2">
                    Momen suci tinggal <span className="font-extrabold text-yellow-400 text-base">{eventTerdekat.sisaHari} Hari Lagi</span>. Mari persiapkan keikhlasan dan ibadah terbaik kita.
                  </div>
                </>
              )}
              
              <button onClick={() => setShowPopupEvent(false)} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_5px_20px_rgba(16,185,129,0.4)] active:scale-[0.98] border border-emerald-300/40 uppercase tracking-widest text-[11px] md:text-xs">
                Lanjutkan ke Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KOMPAS */}
      {showKompas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl transition-opacity">
          <div className="glass-card rounded-3xl max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative flex flex-col items-center p-8 overflow-hidden">
            <div className={`absolute inset-0 opacity-20 transition-colors duration-500 ${isMenghadapKiblat ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
            <button onClick={tutupKompas} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/40 p-2 rounded-full transition-all z-20"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-wide z-10">Arah Kiblat</h3>
            {heading === null ? ( <p className="text-slate-400 text-sm text-center mb-8 z-10 animate-pulse">Menghubungkan ke sensor...</p> ) : ( <p className="text-slate-400 text-sm text-center mb-8 z-10">Putar HP hingga Ikon Ka'bah sejajar dengan panah Hijau.</p> )}
            {heading !== null && (
              <div className={`px-5 py-2.5 rounded-xl mb-6 font-bold text-sm tracking-widest text-center transition-all duration-300 z-10 ${isMenghadapKiblat ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-110' : 'bg-black/60 text-slate-400 border border-white/10'}`}>
                {isMenghadapKiblat ? 'LURUS MENGHADAP KIBLAT' : 'PUTAR HP ANDA'}
              </div>
            )}
            <div className="relative w-64 h-64 z-10 mb-8 mt-2">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_2px_5px_rgba(0,0,0,1)]"><div className={`w-0 h-0 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent transition-colors duration-300 ${isMenghadapKiblat ? 'border-t-emerald-400' : 'border-t-slate-300'}`}></div></div>
               <div className={`w-full h-full rounded-full border-4 flex items-center justify-center bg-black/80 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] transition-colors duration-500 overflow-hidden relative ${isMenghadapKiblat ? 'border-emerald-500' : 'border-slate-800'}`}>
                 {heading !== null && (
                   <div className="absolute inset-0 transition-transform duration-200 ease-out" style={{ transform: `rotate(${-heading}deg)` }}>
                      {[...Array(12)].map((_, i) => ( <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 30}deg)` }}><div className={`w-1 mx-auto mt-2 rounded-full ${i % 3 === 0 ? 'h-3 bg-slate-300' : 'h-1.5 bg-slate-600'}`}></div></div> ))}
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-red-500 font-bold text-sm">U</div>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 font-bold text-sm">S</div>
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">B</div>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">T</div>
                      <div className="absolute inset-0" style={{ transform: `rotate(${arahKiblat}deg)` }}>
                        <div className="w-0.5 h-[50%] bg-gradient-to-t from-transparent to-emerald-500/50 mx-auto opacity-70"></div>
                        <div className={`absolute top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-md bg-black border-2 border-yellow-600 flex items-center justify-center shadow-lg transition-transform duration-300 ${isMenghadapKiblat ? 'scale-125 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''}`}><div className="w-full h-px bg-yellow-600 absolute top-2"></div></div>
                      </div>
                   </div>
                 )}
                 <div className="absolute w-3 h-3 bg-white rounded-full z-20 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
               </div>
            </div>
            <div className="w-full flex justify-between items-center bg-black/60 px-5 py-3.5 rounded-2xl border border-white/10 z-10">
               <div className="flex flex-col"><span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Derajat Kiblat</span><span className="font-mono text-emerald-400 font-bold text-base">{arahKiblat.toFixed(1)}°</span></div>
               <div className="w-px h-8 bg-white/20"></div>
               <div className="flex flex-col items-end"><span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Arah HP Anda</span><span className="font-mono text-white font-bold text-base">{heading !== null ? `${heading.toFixed(1)}°` : '--°'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DOA ADZAN */}
      {showDoa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md transition-opacity">
          <div className="glass-card rounded-3xl max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            <div className="p-6 md:p-8 pb-4 flex justify-between items-center sticky top-0 bg-transparent border-b border-white/5 z-10">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-400 flex items-center gap-2"><BookOpen className="w-5 h-5 md:w-6 md:h-6" /> Doa Adzan</h3>
              <button onClick={() => setShowDoa(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/40 p-2 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 md:p-8 pt-6 overflow-y-auto custom-scrollbar text-center space-y-8">
              <p className="text-2xl md:text-3xl font-bold text-white font-serif leading-loose drop-shadow-md" dir="rtl" style={{ lineHeight: '2.4' }}>
                اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَالشَّرَفَ وَالدَّرَجَةَ الْعَالِيَةَ الرَّفِيعَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ، إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ
              </p>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                <p className="text-emerald-300/90 text-sm md:text-base italic leading-relaxed font-medium">"Allaahumma robba haadzihid da'watit taammah, washsholaatil qoo-imah, aati muhammadanil wasiilata wal fadhilah, wasy-syarafa wad-darajatal 'aaliyatar rafii'ah, wab'atshu maqoomam mahmuudanil ladzii wa'adtah, innaka laa tukhliful mii'aad."</p>
              </div>
              <div className="text-left bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/20">
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  <span className="font-bold text-emerald-500 block mb-1.5 uppercase tracking-wider text-xs">Terjemahan</span>
                  "Ya Allah, Tuhan yang memiliki seruan yang sempurna dan shalat yang tetap didirikan, karuniailah Nabi Muhammad wasilah, keutamaan, serta kemuliaan dan kedudukan yang tinggi. Bangkitkanlah beliau pada kedudukan yang terpuji yang telah Engkau janjikan. Sesungguhnya Engkau tidak menyalahi janji."
                </p>
              </div>
            </div>
            <div className="p-6 md:p-8 pt-4">
              <button onClick={() => setShowDoa(false)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all border border-white/10 shadow-sm">Tutup Doa</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KALENDER HARI BESAR ISLAM */}
      {showKalender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md transition-opacity">
          <div className="glass-card rounded-3xl max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
            <div className="p-6 md:p-8 pb-4 flex justify-between items-center sticky top-0 bg-transparent border-b border-white/5 z-10">
              <h3 className="text-xl md:text-2xl font-bold text-emerald-400 flex items-center gap-2"><CalendarDays className="w-5 h-5 md:w-6 md:h-6" /> Hari Besar Islam</h3>
              <button onClick={() => setShowKalender(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/40 p-2 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 md:p-8 pt-6 overflow-y-auto custom-scrollbar space-y-4">
              <p className="text-slate-400 text-sm text-center mb-6">Jadwal peringatan hari besar Islam tahun 1447-1448 Hijriyah.</p>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:to-transparent">
                {daftarHariBesar.map((item, index) => (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0b1120] bg-emerald-500 text-black shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 z-10">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] ml-auto md:ml-0 bg-black/40 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-colors shadow-inner">
                      <h4 className="font-bold text-emerald-400 text-base mb-1">{item.event}</h4>
                      <p className="text-white font-mono text-xs mb-2 bg-emerald-950/50 inline-block px-2.5 py-1 rounded-md border border-emerald-500/30">{item.date}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 md:p-8 pt-4 border-t border-white/5">
              <button onClick={() => setShowKalender(false)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all border border-white/10 shadow-sm">Tutup Kalender</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}