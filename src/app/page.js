'use client';

import { useState, useEffect, useRef } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { format, isAfter } from 'date-fns';
import gsap from 'gsap';
// Import ikon dari Lucide React
import { MoonStar, Sunrise, Sun, SunDim, Sunset, Moon } from 'lucide-react';

const daftarKota = [
  { nama: 'Bogor, Indonesia', lat: -6.5971, lng: 106.7995 },
  { nama: 'Sukabumi, Indonesia', lat: -6.9228, lng: 106.9222 },
  { nama: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456 },
  { nama: 'Jayapura, Indonesia', lat: -2.5337, lng: 140.7181 },
  { nama: 'Tokyo, Jepang', lat: 35.6762, lng: 139.6503 },
  { nama: 'London, Inggris', lat: 51.5074, lng: -0.1278 },
];

// Fungsi untuk memilih ikon berdasarkan nama waktu sholat
const getIkonSholat = (nama, isNext) => {
  const className = `w-7 h-7 transition-colors duration-500 ${isNext ? 'text-emerald-400' : 'text-slate-400'}`;
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
  const [waktuSekarang, setWaktuSekarang] = useState(new Date());
  const [loading, setLoading] = useState(false);
  
  const listRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setWaktuSekarang(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const coordinates = new Coordinates(lokasi.lat, lokasi.lng);
    const date = new Date();
    const params = CalculationMethod.Singapore(); 
    const prayerTimes = new PrayerTimes(coordinates, date, params);
    
    const timesArray = [
      { nama: 'Imsak', waktu: new Date(prayerTimes.fajr.getTime() - 10 * 60000) },
      { nama: 'Subuh', waktu: prayerTimes.fajr },
      { nama: 'Dzuhur', waktu: prayerTimes.dhuhr },
      { nama: 'Ashar', waktu: prayerTimes.asr },
      { nama: 'Maghrib', waktu: prayerTimes.maghrib },
      { nama: 'Isya', waktu: prayerTimes.isha },
    ];

    setJadwal(timesArray);
  }, [lokasi]);

  useEffect(() => {
    gsap.fromTo(headerRef.current, 
      { opacity: 0, y: -20 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  useEffect(() => {
    if (jadwal.length > 0 && listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, x: -20, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, stagger: 0.1, duration: 0.6, ease: 'back.out(1.5)' }
      );
    }
  }, [jadwal]);

  const sholatBerikutnya = jadwal.find(j => isAfter(j.waktu, waktuSekarang)) || null;

  const deteksiLokasi = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLokasi({
            nama: '📍 Lokasi Anda Saat Ini',
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

  return (
    // Latar belakang gradasi elegan
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 p-4 md:p-8 flex justify-center font-sans overflow-hidden relative">
      
      {/* Efek Cahaya Latar (Glow Background) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full mt-4 md:mt-8 relative z-10">
        
        <header ref={headerRef} className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-tight mb-4 drop-shadow-sm">
            Waktu Sholat
          </h1>
          <div className="inline-flex items-center gap-3 bg-slate-800/60 backdrop-blur-md px-5 py-2 rounded-2xl border border-slate-700/50 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-emerald-300 font-mono text-xl tracking-widest font-semibold">
              {format(waktuSekarang, 'HH:mm:ss')}
            </p>
          </div>
        </header>
        
        <div className="space-y-4 mb-10">
          <div className="relative group">
            <select 
              className="w-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white text-base rounded-2xl p-4 pl-5 outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 appearance-none shadow-lg cursor-pointer transition-all duration-300 group-hover:border-slate-600"
              value={lokasi.nama}
              onChange={(e) => {
                const kotaTerpilih = daftarKota.find(k => k.nama === e.target.value);
                if (kotaTerpilih) setLokasi(kotaTerpilih);
              }}
            >
              <option disabled value="📍 Lokasi Anda Saat Ini" className="bg-slate-900 text-white">
                📍 Lokasi Anda Saat Ini
              </option>
              {daftarKota.map((kota) => (
                <option key={kota.nama} value={kota.nama} className="bg-slate-900 text-white py-2">
                  {kota.nama}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-400 group-hover:text-emerald-400 transition-colors">
              <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          <button 
            onClick={deteksiLokasi}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-emerald-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Mencari Sinyal GPS...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Gunakan Lokasi Saat Ini</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col items-center mb-6 bg-slate-800/40 backdrop-blur-sm py-3 px-6 rounded-2xl border border-slate-700/50">
           <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
             {lokasi.nama}
           </h2>
           <p className="text-emerald-400/80 text-sm mt-1 font-medium">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>

        {jadwal.length > 0 ? (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-4 shadow-2xl border border-slate-700/50 relative overflow-hidden">
            {/* Dekorasi kilauan halus di sudut kartu */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>

            <ul ref={listRef} className="space-y-3 relative z-10">
              {jadwal.map((item) => {
                const isNext = sholatBerikutnya?.nama === item.nama;
                return (
                  <li 
                    key={item.nama} 
                    className={`flex justify-between items-center p-4 md:p-5 rounded-2xl transition-all duration-500 ${
                      isNext 
                        ? 'bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] transform scale-[1.02]' 
                        : 'bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-4 md:gap-5">
                      {/* Kontainer Ikon */}
                      <div className={`p-3 rounded-xl transition-colors duration-500 ${isNext ? 'bg-emerald-500/20 shadow-inner' : 'bg-slate-700/30'}`}>
                        {getIkonSholat(item.nama, isNext)}
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={`text-xl font-bold tracking-wide ${isNext ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {item.nama}
                        </span>
                        {isNext ? (
                          <span className="text-xs text-emerald-400 font-semibold mt-0.5 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Waktu Selanjutnya
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 mt-0.5 tracking-wide">Terjadwal</span>
                        )}
                      </div>
                    </div>
                    
                    <span className={`text-3xl font-extrabold font-mono ${isNext ? 'text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-slate-400'}`}>
                      {format(item.waktu, 'HH:mm')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex justify-center p-12">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}