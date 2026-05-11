'use client';

import { useState, useEffect, useRef } from 'react';
import { Coordinates, CalculationMethod, CalculationParameters, PrayerTimes, Madhab } from 'adhan';
import { format, isAfter } from 'date-fns';
import gsap from 'gsap';
import { MoonStar, Sunrise, Sun, SunDim, Sunset, Moon, Timer, Bell, BellOff, BookOpen, X, MapPin } from 'lucide-react';

// Daftar kota dengan tambahan daerah lokal
const daftarKota = [
  { nama: 'Cigombong, Bogor', lat: -6.7645, lng: 106.8163 },
  { nama: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456 },
  { nama: 'Bandung, Indonesia', lat: -6.9175, lng: 107.6191 },
  { nama: 'Sukabumi, Indonesia', lat: -6.9228, lng: 106.9222 },
  { nama: 'Tokyo, Jepang', lat: 35.6762, lng: 139.6503 },
  { nama: 'London, Inggris', lat: 51.5074, lng: -0.1278 },
];

const getIkonSholat = (nama, isNext) => {
  const className = `w-6 h-6 md:w-7 md:h-7 transition-colors duration-500 ${isNext ? 'text-emerald-300' : 'text-slate-400'}`;
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
  const [jadwal, setJadwal] = useState([]);
  const [imsakBesok, setImsakBesok] = useState(null);
  const [waktuSekarang, setWaktuSekarang] = useState(new Date());
  const [loading, setLoading] = useState(false);
  
  const [suaraAktif, setSuaraAktif] = useState(false);
  const [showDoa, setShowDoa] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef(null);
  
  const listRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    const savedLokasi = localStorage.getItem('lokasiSholatTerakhir');
    if (savedLokasi) {
      setLokasi(JSON.parse(savedLokasi));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setWaktuSekarang(now);
      
      if (sholatBerikutnya && suaraAktif && audioRef.current) {
        const diffMs = sholatBerikutnya.waktu.getTime() - now.getTime();
        if (diffMs <= 0 && diffMs > -1000 && sholatBerikutnya.nama !== 'Imsak') {
          audioRef.current.play().catch(e => console.log('Autoplay error', e));
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  });

  useEffect(() => {
    const coordinates = new Coordinates(lokasi.lat, lokasi.lng);
    const dateToday = new Date();
    const params = new CalculationParameters(20, 18);
    params.madhab = Madhab.Shafi; 
    params.adjustments = { fajr: 2, dhuhr: 2, asr: 2, maghrib: 2, isha: 2 }; 
    
    const prayerTimesToday = new PrayerTimes(coordinates, dateToday, params);
    const dateTomorrow = new Date();
    dateTomorrow.setDate(dateTomorrow.getDate() + 1);
    const prayerTimesTomorrow = new PrayerTimes(coordinates, dateTomorrow, params);

    const timesArray = [
      { nama: 'Imsak', waktu: new Date(prayerTimesToday.fajr.getTime() - 10 * 60000) },
      { nama: 'Subuh', waktu: prayerTimesToday.fajr },
      { nama: 'Dzuhur', waktu: prayerTimesToday.dhuhr },
      { nama: 'Ashar', waktu: prayerTimesToday.asr },
      { nama: 'Maghrib', waktu: prayerTimesToday.maghrib },
      { nama: 'Isya', waktu: prayerTimesToday.isha },
    ];

    setJadwal(timesArray);
    setImsakBesok({ nama: 'Imsak', waktu: new Date(prayerTimesTomorrow.fajr.getTime() - 10 * 60000) });
  }, [lokasi]);

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    if (jadwal.length > 0 && listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [jadwal]);

  let sholatBerikutnya = jadwal.find(j => isAfter(j.waktu, waktuSekarang));
  if (!sholatBerikutnya && imsakBesok) sholatBerikutnya = imsakBesok;

  const getCountdown = () => {
    if (!sholatBerikutnya) return "Menghitung...";
    const diffMs = sholatBerikutnya.waktu.getTime() - waktuSekarang.getTime();
    if (diffMs <= 0) return "00:00:00";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTanggalHijriyah = () => {
    try {
      return new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(waktuSekarang) + ' ';
    } catch (e) {
      return '';
    }
  };

  const getSapaan = () => {
    const jam = waktuSekarang.getHours();
    if (jam >= 3 && jam < 11) return 'Selamat Pagi';
    if (jam >= 11 && jam < 15) return 'Selamat Siang';
    if (jam >= 15 && jam < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const handlePilihLokasi = (kotaTerpilih) => {
    setLokasi(kotaTerpilih);
    localStorage.setItem('lokasiSholatTerakhir', JSON.stringify(kotaTerpilih));
  };

  const deteksiLokasi = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lokasiBaru = {
            nama: '📍 Lokasi GPS Anda',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          handlePilihLokasi(lokasiBaru);
          setLoading(false);
        },
        () => {
          alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
          setLoading(false);
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 p-4 md:p-8 flex justify-center font-sans">
      <audio ref={audioRef} src="/adzan.mp3" preload="auto" />
      
      {/* Background Glow */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-md w-full relative z-10">
        
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-8 mt-2">
          <button 
            onClick={() => setShowDoa(true)}
            className="flex items-center gap-2 text-xs font-medium bg-[#1e293b]/80 hover:bg-[#334155] text-emerald-300 px-4 py-2.5 rounded-full transition-all border border-slate-700/60 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" /> Doa Adzan
          </button>
          
          <button 
            onClick={() => setSuaraAktif(!suaraAktif)}
            className={`flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full transition-all border shadow-sm ${
              suaraAktif 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' 
              : 'bg-[#1e293b]/80 text-slate-400 border-slate-700/60 hover:bg-[#334155]'
            }`}
          >
            {suaraAktif ? <Bell className="w-3.5 h-3.5 animate-pulse" /> : <BellOff className="w-3.5 h-3.5" />}
            {suaraAktif ? 'Alarm Aktif' : 'Alarm Mati'}
          </button>
        </div>

        {/* Header Section */}
        <header ref={headerRef} className="mb-10">
          <div className="text-center mb-6">
            <h2 suppressHydrationWarning className="text-slate-400 text-sm font-medium tracking-wider uppercase mb-1">
              {isMounted ? getSapaan() : 'Memuat...'}
            </h2>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Waktu <span className="text-emerald-400">Sholat</span>
            </h1>
          </div>
          
          {/* Main Time Card */}
          <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-xl flex flex-col items-center">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p suppressHydrationWarning className="text-emerald-300 font-mono text-lg tracking-widest font-semibold">
                  {isMounted ? format(waktuSekarang, 'HH:mm:ss') : '--:--:--'}
                </p>
             </div>

             {sholatBerikutnya && (
               <div className="w-full flex flex-col items-center">
                 <p className="text-slate-400 text-sm mb-1">Menuju <span className="text-emerald-400 font-semibold">{sholatBerikutnya.nama}</span></p>
                 <span suppressHydrationWarning className="font-mono font-bold text-3xl md:text-4xl text-white tracking-tight drop-shadow-md">
                   {isMounted ? getCountdown() : '--:--:--'}
                 </span>
                 {/* Progress Bar Visual Line */}
                 <div className="w-full h-1 bg-slate-800 rounded-full mt-5 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-1/2 animate-[pulse_3s_ease-in-out_infinite] rounded-full opacity-70"></div>
                 </div>
               </div>
             )}
          </div>
        </header>
        
        {/* Location Selector */}
        <div className="space-y-3 mb-8">
          <div className="relative group">
            <select 
              className="w-full bg-[#1e293b]/90 border border-slate-700 text-white text-sm md:text-base rounded-2xl p-4 pl-12 outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer transition-all duration-300"
              value={lokasi.nama}
              onChange={(e) => {
                const kotaTerpilih = daftarKota.find(k => k.nama === e.target.value);
                if (kotaTerpilih) handlePilihLokasi(kotaTerpilih);
              }}
            >
              <option disabled value="📍 Lokasi GPS Anda" className="bg-slate-900 text-slate-300">
                Lokasi GPS Anda
              </option>
              {daftarKota.map((kota) => (
                <option key={kota.nama} value={kota.nama} className="bg-slate-900 text-white py-2">
                  {kota.nama}
                </option>
              ))}
            </select>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          <button 
            onClick={deteksiLokasi}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.25)] active:scale-[0.98] text-sm md:text-base"
          >
            {loading ? 'Mencari Sinyal GPS...' : 'Gunakan GPS Saat Ini'}
          </button>
        </div>

        {/* Date Section */}
        <div className="flex flex-col items-center mb-6 py-2">
           <p suppressHydrationWarning className="text-white text-base font-medium">
             {isMounted ? format(waktuSekarang, 'EEEE, dd MMMM yyyy') : 'Memuat tanggal...'}
           </p>
           <p suppressHydrationWarning className="text-emerald-400 text-sm font-medium mt-1">
             {isMounted ? getTanggalHijriyah() : ''}
           </p>
        </div>

        {/* Schedule List */}
        {jadwal.length > 0 && (
          <div className="bg-[#1e293b]/40 rounded-[2rem] p-3 md:p-4 border border-slate-800/60 shadow-lg">
            <ul ref={listRef} className="space-y-2 relative z-10">
              {jadwal.map((item) => {
                const isNext = sholatBerikutnya?.nama === item.nama;
                return (
                  <li key={item.nama} className={`flex justify-between items-center p-4 rounded-2xl transition-all duration-300 ${isNext ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-transparent border border-transparent hover:bg-slate-800/50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 md:p-3 rounded-xl transition-colors ${isNext ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                        {getIkonSholat(item.nama, isNext)}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-lg md:text-xl font-bold tracking-wide ${isNext ? 'text-emerald-400' : 'text-slate-200'}`}>{item.nama}</span>
                        {isNext && <span className="text-[10px] md:text-xs text-emerald-400 font-semibold mt-0.5 uppercase tracking-wider">Selanjutnya</span>}
                      </div>
                    </div>
                    <span suppressHydrationWarning className={`text-2xl md:text-3xl font-extrabold font-mono ${isNext ? 'text-white' : 'text-slate-400'}`}>
                      {isMounted ? format(item.waktu, 'HH:mm') : '--:--'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Doa Modal */}
      {showDoa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0f172a] border border-emerald-500/30 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative">
            <button onClick={() => setShowDoa(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl md:text-2xl font-bold text-emerald-400 mb-6 text-center">Doa Setelah Adzan</h3>
            
            <div className="text-center space-y-6">
              <p className="text-2xl md:text-3xl font-bold text-white leading-loose font-serif" dir="rtl">
                اللّٰهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدَانِ الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودَانِ الَّذِي وَعَدْتَهُ
              </p>
              <p className="text-emerald-100/70 text-sm italic leading-relaxed">
                "Allaahumma robba haadzihid da'watit taammah, washsholaatil qoo-imah, aati muhammadanil wasiilata wal fadhilah, wab'atshu maqoomam mahmuudanil ladzii wa'adtah."
              </p>
              <div className="w-full h-px bg-slate-800 my-4"></div>
              <p className="text-slate-300 text-sm text-left leading-relaxed">
                <span className="font-bold text-emerald-500">Artinya:</span> "Ya Allah, Tuhan yang memiliki seruan yang sempurna dan shalat yang tetap didirikan, karuniailah Nabi Muhammad wasilah dan keutamaan, dan bangkitkanlah beliau pada kedudukan yang terpuji yang telah Engkau janjikan."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}