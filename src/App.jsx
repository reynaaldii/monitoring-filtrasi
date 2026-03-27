import React, { useState, useEffect } from 'react';
import { Calendar, Save, Download, AlertCircle, Clock, Filter, CheckCircle, XCircle } from 'lucide-react';

export default function App() {
  const bays = ['1', '2', '3', '4'];
  const jalurs = ['PERTAMAX', 'PERTALITE', 'BIO SOLAR'];
  const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const [selectedBay, setSelectedBay] = useState('1');
  const [selectedJalur, setSelectedJalur] = useState('PERTAMAX');
  const [selectedBulan, setSelectedBulan] = useState('Januari');

  // State untuk custom notifikasi (menggantikan alert)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const generateInitialWeeks = () => [
    { id: 1, minggu: 'Minggu 1', tanggal: '', deltaP: '', flowrate: '', kondisi: 'Bersih', indikasi: 'Normal', tindakan: '-', pic: '', keterangan: '', tanggalService: '' },
    { id: 2, minggu: 'Minggu 2', tanggal: '', deltaP: '', flowrate: '', kondisi: 'Mulai kotor', indikasi: 'Monitoring', tindakan: '-', pic: '', keterangan: '', tanggalService: '' },
    { id: 3, minggu: 'Minggu 3', tanggal: '', deltaP: '', flowrate: '', kondisi: 'Kotor', indikasi: 'Warning', tindakan: 'Persiapan cleaning', pic: '', keterangan: '', tanggalService: '' },
    { id: 4, minggu: 'Minggu 4', tanggal: '', deltaP: '', flowrate: '', kondisi: 'Clogging', indikasi: 'Kritis', tindakan: 'Wajib cleaning', pic: '', keterangan: '', tanggalService: '' }
  ];

  // MENGAMBIL DATA DARI MEMORI BROWSER (Bukan Server)
  const [allData, setAllData] = useState(() => {
    try {
      const savedData = localStorage.getItem('dataMonitoringFiltrasi');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (e) {
      console.warn('Gagal membaca Local Storage', e);
    }
    
    // Jika memori kosong, buat data template baru
    const initialData = {};
    bays.forEach(b => {
      jalurs.forEach(j => {
        bulanList.forEach(bln => {
          initialData[`${b}-${j}-${bln}`] = generateInitialWeeks();
        });
      });
    });
    return initialData;
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentKey = `${selectedBay}-${selectedJalur}-${selectedBulan}`;
  const currentData = allData[currentKey] || generateInitialWeeks();

  const kondisiOptions = ['Bersih', 'Mulai kotor', 'Kotor', 'Clogging'];
  const indikasiOptions = ['Normal', 'Monitoring', 'Warning', 'Kritis'];
  const tindakanOptions = ['-', 'Persiapan cleaning', 'Wajib cleaning', 'Ganti Filter'];

  const handleInputChange = (id, field, value) => {
    setAllData(prev => ({
      ...prev,
      [currentKey]: prev[currentKey].map(row => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    }));
  };

  const getIndikasiColor = (indikasi) => {
    switch(indikasi) {
      case 'Normal': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Monitoring': return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Warning': return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Kritis': return 'bg-red-100 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-black border-gray-300';
    }
  };

  // MENYIMPAN DATA KE MEMORI BROWSER
  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('dataMonitoringFiltrasi', JSON.stringify(allData));
      showNotification(`Data untuk Bulan ${selectedBulan} berhasil disimpan!`, 'success');
    } catch (error) {
      showNotification('Gagal menyimpan data ke memori perangkat.', 'error');
    }
    setIsSaving(false);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => {
      const XLSX = window.XLSX;
      const wsData = [
        ['MONITORING SISTEM FILTRASI FILLING SHED - MESH 60'],
        [`Bay Area: ${selectedBay}`, '', '', `Jalur: ${selectedJalur}`, '', '', `Bulan: ${selectedBulan}`],
        [],
        ['Minggu', 'Tanggal', 'ΔP Rata-rata (bar)', 'Flowrate Rata-rata (L/m)', 'Kondisi Filter', 'Indikasi', 'Tindakan', 'PIC', 'Keterangan', 'Tanggal Service Terakhir']
      ];

      currentData.forEach(row => {
        wsData.push([
          row.minggu,
          row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-',
          row.deltaP || '-',
          row.flowrate || '-',
          row.kondisi,
          row.indikasi,
          row.tindakan,
          row.pic || '-',
          row.keterangan || '-',
          row.tanggalService ? new Date(row.tanggalService).toLocaleDateString('id-ID') : '-'
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];
      ws['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 28 }, { wch: 15 }, 
        { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 25 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${selectedBulan} - B${selectedBay} ${selectedJalur}`);
      XLSX.writeFile(wb, `Monitoring_Filtrasi_Bay${selectedBay}_${selectedJalur}_${selectedBulan}.xlsx`);
      setIsExporting(false);
      showNotification('File Excel berhasil diunduh!', 'success');
    };
    
    script.onerror = () => {
      showNotification('Gagal memuat sistem pembuat Excel. Periksa koneksi internet.', 'error');
      setIsExporting(false);
    };
    document.body.appendChild(script);
  };

  const inputClassName = "w-full min-w-[120px] border border-gray-300 rounded-md shadow-sm text-sm p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white";

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
          .font-poppins {
            font-family: 'Poppins', sans-serif;
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8 font-poppins text-gray-800 relative pb-24">
        
        {/* Toast Notification */}
        {notification.show && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl text-white font-medium transition-all transform translate-y-0 opacity-100 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {notification.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
            {notification.message}
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          
          {/* Header Section */}
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-700"></div>
            <div className="pl-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-900 tracking-tight uppercase leading-snug">
                Monitoring Sistem Filtrasi <br className="hidden md:block"/> Filling Shed
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-2 font-medium flex items-center gap-2">
                <Filter size={16} /> Log Inspeksi Mingguan (Mesh 60)
              </p>
            </div>
            
            <div className="flex items-center self-end sm:self-auto bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Pertamina_Logo.svg" 
                alt="Pertamina Patra Niaga" 
                className="h-10 sm:h-12 md:h-14 object-contain"
              />
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row w-full gap-5 lg:gap-8">
              
              {/* Bulan Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pilih Bulan</span>
                <select
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-blue-900 text-base font-bold rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block px-4 py-2.5 outline-none cursor-pointer shadow-sm min-w-[150px]"
                >
                  {bulanList.map(bln => (
                    <option key={bln} value={bln}>{bln}</option>
                  ))}
                </select>
              </div>

              {/* Bay Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pilih Bay</span>
                <div className="flex flex-wrap gap-2">
                  {bays.map(bay => (
                    <button
                      key={bay}
                      onClick={() => setSelectedBay(bay)}
                      className={`w-12 h-12 flex items-center justify-center text-base font-extrabold rounded-xl transition-all shadow-sm border-2 ${selectedBay === bay ? 'bg-blue-700 text-white border-blue-700 shadow-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                    >
                      {bay}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jalur Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pilih Jalur</span>
                <div className="flex flex-wrap gap-2">
                  {jalurs.map(jalur => {
                    let btnClass = '';
                    if (jalur === 'PERTAMAX') {
                      btnClass = selectedJalur === jalur ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200';
                    } else if (jalur === 'PERTALITE') {
                      btnClass = selectedJalur === jalur ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
                    } else if (jalur === 'BIO SOLAR') { 
                      btnClass = selectedJalur === jalur ? 'bg-slate-700 text-white border-slate-700 shadow-md' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300';
                    }
                    
                    return (
                      <button
                        key={jalur}
                        onClick={() => setSelectedJalur(jalur)}
                        className={`px-5 py-2.5 text-sm font-extrabold rounded-xl transition-all border-2 ${btnClass}`}
                      >
                        {jalur}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-900 text-white p-4 px-6 flex justify-between items-center">
              <h3 className="font-bold text-sm md:text-base tracking-wide flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                Data Sheet: <span className="text-blue-400">Bay {selectedBay}</span> | <span className="text-emerald-400">{selectedJalur}</span> | {selectedBulan}
              </h3>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap">Minggu</th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-44">Tanggal</th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-32">ΔP Rata-rata <br/><span className="text-[10px] font-normal text-gray-400 normal-case">(bar)</span></th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-36">Flowrate Rata <br/><span className="text-[10px] font-normal text-gray-400 normal-case">(L/m)</span></th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-40">Kondisi Filter</th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-36">Indikasi</th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-44">Tindakan</th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-32">PIC</th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-56">Keterangan</th>
                    <th className="px-5 py-4 font-extrabold whitespace-nowrap w-44">Tgl Service <br/><span className="text-[10px] font-normal text-gray-400 normal-case">Terakhir</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3 font-extrabold text-blue-900 whitespace-nowrap text-sm">{row.minggu}</td>
                      <td className="px-5 py-3"><input type="date" value={row.tanggal} onChange={(e) => handleInputChange(row.id, 'tanggal', e.target.value)} className={inputClassName} /></td>
                      <td className="px-5 py-3"><input type="number" step="0.01" placeholder="0.00" value={row.deltaP} onChange={(e) => handleInputChange(row.id, 'deltaP', e.target.value)} className={inputClassName} /></td>
                      <td className="px-5 py-3"><input type="number" step="0.1" placeholder="0.0" value={row.flowrate} onChange={(e) => handleInputChange(row.id, 'flowrate', e.target.value)} className={inputClassName} /></td>
                      <td className="px-5 py-3">
                        <select value={row.kondisi} onChange={(e) => handleInputChange(row.id, 'kondisi', e.target.value)} className={inputClassName}>
                          {kondisiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <select value={row.indikasi} onChange={(e) => handleInputChange(row.id, 'indikasi', e.target.value)} className={`w-full min-w-[120px] border rounded-md shadow-sm text-sm p-2 font-bold focus:outline-none transition-all ${getIndikasiColor(row.indikasi)}`}>
                          {indikasiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <select value={row.tindakan} onChange={(e) => handleInputChange(row.id, 'tindakan', e.target.value)} className={inputClassName}>
                          {tindakanOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3"><input type="text" placeholder="Nama PIC" value={row.pic} onChange={(e) => handleInputChange(row.id, 'pic', e.target.value)} className={inputClassName} /></td>
                      <td className="px-5 py-3"><input type="text" placeholder="Catatan..." value={row.keterangan} onChange={(e) => handleInputChange(row.id, 'keterangan', e.target.value)} className={inputClassName} /></td>
                      <td className="px-5 py-3"><input type="date" value={row.tanggalService} onChange={(e) => handleInputChange(row.id, 'tanggalService', e.target.value)} className={inputClassName} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Action Buttons */}
            <div className="bg-gray-50 p-5 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-4">
              <button onClick={handleExportExcel} disabled={isExporting} className={`flex justify-center items-center gap-2 w-full sm:w-auto px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:shadow-md transition-all font-bold text-sm ${isExporting ? 'opacity-70 cursor-wait' : ''}`}>
                <Download size={20} />
                {isExporting ? 'Memproses Excel...' : 'Unduh Excel'}
              </button>
              <button onClick={handleSave} disabled={isSaving} className={`flex justify-center items-center gap-2 w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}>
                <Save size={20} />
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 pt-4">
             <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5 md:p-6 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
               <div className="bg-blue-100 p-3 rounded-xl h-fit">
                 <Clock className="text-blue-700" size={24} />
               </div>
               <div>
                  <h4 className="font-extrabold text-blue-900 text-base md:text-lg mb-1">Siklus Cleaning</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Pemantauan mingguan memastikan filter dibersihkan tepat waktu sebelum mencapai status <span className="font-bold text-gray-800">"Clogging" (Kritis)</span> yang dapat menghentikan aliran operasi (flowrate drop).</p>
               </div>
             </div>
             
             <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-5 md:p-6 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
               <div className="bg-amber-100 p-3 rounded-xl h-fit">
                 <AlertCircle className="text-amber-600" size={24} />
               </div>
               <div>
                  <h4 className="font-extrabold text-amber-900 text-base md:text-lg mb-1">Peringatan ΔP (Pressure Drop)</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Jika ΔP meningkat tajam meskipun flowrate stabil atau menurun, segera ubah status ke <strong className="text-red-600 bg-red-100 px-2 py-0.5 rounded">Warning</strong> dan siapkan jadwal pembersihan.</p>
               </div>
             </div>
          </div>

          {/* Footer dengan Teks Merah Sesuai Permintaan */}
          <div className="mt-16 text-center pb-8 border-t border-gray-200 pt-8">
            <p className="text-red-600 font-extrabold text-sm md:text-base tracking-wide uppercase">
              &copy; 2026 Fuel Terminal Tuban. All Rights Reserved
            </p>
          </div>

        </div>
      </div>
    </>
  );
}