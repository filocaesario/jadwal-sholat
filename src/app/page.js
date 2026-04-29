'use client';

import { useState, useEffect, useRef } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { format, isAfter } from 'date-fns';
import gsap from 'gsap';

// Mock data: Kombinasi daerah lokal dan luar negeri
const daftarKota = [
  { nama: 'Bogor, Indonesia', lat: -6.5971, lng: 106.7995 },
  { nama: 'Sukabumi, Indonesia', lat: -6.9228, lng: 106.9222 },
  { nama: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456 },
  { nama: 'Jayapura, Indonesia', lat: -2.5337, lng: 140.7181 },
  { nama: 'Tokyo, Jepang', lat: 35.6762, lng: 139.6503 },
  { nama: 'London, Inggris', lat: 51.5074, lng: -0.1278 },
];

export default function Home() {
  const [lokasi, setLokasi] = useState(daftarKota[0]);
  const [jadwal, setJadwal] = useState([]);
  const [waktuSekarang, setWaktuSekarang] = useState(new Date());
  const [loading, setLoading] = useState(false);
  
  const listRef = useRef(null);
  const headerRef = useRef(null);

  // Update waktu real-time
  useEffect(() => {
    const timer = setInterval(() => setWaktuSekarang(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hitung jadwal sholat lokal tanpa API eksternal
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

  // GSAP Animations
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
        { opacity: 0, x: -15 },
        { opacity: 1, x: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' }
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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 flex justify-center font-sans">
      <div className="max-w-md w-full mt-4 md:mt-10">
        
        {/* Header */}
        <header ref={headerRef} className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-wide mb-2">
            Jadwal <span className="text-emerald-500">Sholat</span>
          </h1>
          <p className="text-emerald-400/80 font-mono text-lg tracking-widest bg-emerald-900/20 inline-block px-4 py-1 rounded-full border border-emerald-800/30">
            {format(waktuSekarang, 'HH:mm:ss')}
          </p>
        </header>
        
        {/* Kontrol Interaktif */}
        <div className="space-y-4 mb-10">
          <div className="relative">
            <select 
              className="w-full bg-[#1e293b] border border-slate-700 text-white text-base rounded-xl p-4 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none shadow-sm cursor-pointer"
              value={lokasi.nama}
              onChange={(e) => {
                const kotaTerpilih = daftarKota.find(k => k.nama === e.target.value);
                if (kotaTerpilih) setLokasi(kotaTerpilih);
              }}
            >
              <option disabled value="📍 Lokasi Anda Saat Ini" className="bg-slate-800 text-white">
                📍 Lokasi Anda Saat Ini
              </option>
              {daftarKota.map((kota) => (
                <option key={kota.nama} value={kota.nama} className="bg-slate-800 text-white py-2">
                  {kota.nama}
                </option>
              ))}
            </select>
            {/* Custom Arrow Dropdown */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          <button 
            onClick={deteksiLokasi}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 shadow-[0_4px_14px_0_rgba(5,150,105,0.39)]"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Mendeteksi Koordinat...</span>
              </>
            ) : (
              <span>📍 Deteksi Lokasi Otomatis</span>
            )}
          </button>
        </div>

        <div className="text-center mb-6">
           <h2 className="text-xl font-medium text-slate-300">{lokasi.nama}</h2>
           <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'dd MMMM yyyy')}</p>
        </div>

        {/* Daftar Jadwal */}
        {jadwal.length > 0 ? (
          <div className="bg-[#1e293b]/80 backdrop-blur-sm rounded-3xl p-3 shadow-2xl border border-slate-700/50">
            <ul ref={listRef} className="space-y-1">
              {jadwal.map((item) => {
                const isNext = sholatBerikutnya?.nama === item.nama;
                return (
                  <li 
                    key={item.nama} 
                    className={`flex justify-between items-center p-4 rounded-2xl transition-colors duration-300 ${
                      isNext 
                        ? 'bg-emerald-500/20 border border-emerald-500/50' 
                        : 'bg-transparent border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-lg font-semibold tracking-wide ${isNext ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {item.nama}
                      </span>
                      {isNext && <span className="text-xs text-emerald-500 font-medium mt-0.5">Waktu Selanjutnya</span>}
                    </div>
                    <span className={`text-2xl font-bold ${isNext ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {format(item.waktu, 'HH:mm')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}