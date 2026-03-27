import React, { useState, useEffect } from 'react';
import { Calendar, Save, Download, AlertCircle, Clock, Filter } from 'lucide-react';

export default function App() {
  const bays = ['1', '2', '3', '4'];
  const jalurs = ['PERTAMAX', 'PERTALITE', 'B40'];
  const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const [selectedBay, setSelectedBay] = useState('1');
  const [selectedJalur, setSelectedJalur] = useState('PERTAMAX');
  const [selectedBulan, setSelectedBulan] = useState('Januari');

  const generateInitialWeeks = () => [
    { id: 1, minggu: 'Minggu 1', tanggal: '', deltaP: '', flowrate: '', kondisi: 'Bersih', indikasi: 'Normal', tindakan: '-', pic: '', keterangan: '', tanggalService: '' },
    { id: 2, minggu: 'Minggu 2', tanggal: '', deltaP: '', flowrate: '', kondisi: 'Mulai kotor', indikasi: 'Monitoring', tindakan: '-', pic: '', keterangan: '', tanggalService: '' },
    { id: 3, minggu: 'Minggu 3', tanggal: '', deltaP: '', flowrate: '', kondisi: 'Kotor', indikasi: 'Warning', tindakan: 'Persiapan cleaning', pic: '', keterangan: '', tanggalService: '' },
    { id: 4, minggu: 'Minggu 4', tanggal: '', deltaP: '', flowrate: '', kondisi: 'Clogging', indikasi: 'Kritis', tindakan: 'Wajib cleaning', pic: '', keterangan: '', tanggalService: '' }
  ];

  const [allData, setAllData] = useState(() => {
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

  // === FITUR BARU: Mengambil data dari Backend saat web pertama kali dibuka ===
  useEffect(() => {
    fetch('http://localhost:5000/api/data')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          setAllData(data); // Timpa data kosong dengan data dari database
        }
      })
      .catch(err => console.log("Gagal terhubung ke server backend lokal", err));
  }, []);

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

  // === FITUR BARU: Mengirim data ke Backend Node.js ===
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(allData)
      });
      
      if (response.ok) {
        alert(`Data monitoring untuk Bulan ${selectedBulan} berhasil direkam ke Database!`);
      } else {
        alert('Gagal menyimpan ke server.');
      }
    } catch (error) {
      alert('Error: Pastikan Server Node.js (Backend) sedang berjalan!');
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
    };
    
    script.onerror = () => {
      alert('Gagal memuat sistem pembuat Excel. Pastikan koneksi internet Anda aktif.');
      setIsExporting(false);
    };
    document.body.appendChild(script);
  };

  const inputClassName = "w-full min-w-[120px] border border-gray-300 rounded-md shadow-sm text-sm p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all";

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

      <div className="min-h-screen bg-[#F8FAFC] p-3 sm:p-4 md:p-8 font-poppins text-black relative pb-24">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          
          {/* Header Responsif */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-lg sm:text-xl md:text-3xl font-extrabold text-black tracking-tight uppercase leading-snug">
                MONITORING SISTEM FILTRASI FILLING SHED
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1 font-medium">Log Inspeksi Mingguan (Mesh 60)</p>
            </div>
            
            <div className="flex items-center self-end sm:self-auto">
              <img 
                src="/image_ff3349.png" 
                alt="Pertamina Patra Niaga" 
                className="h-10 sm:h-12 md:h-16 object-contain"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Pertamina_Logo.svg' }}
              />
            </div>
          </div>

          {/* Filter Area Responsif */}
          <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row items-start lg:items-center gap-5 lg:gap-8">
            <div className="flex items-center gap-2 text-black font-semibold">
              <Filter size={20} className="text-blue-600" />
              <span className="text-sm md:text-base whitespace-nowrap">Filter Area:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4 lg:gap-8">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-600 w-12 md:w-auto">Bulan:</span>
                <select
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(e.target.value)}
                  className="bg-white border border-gray-300 text-black text-sm font-bold rounded-md focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none cursor-pointer shadow-sm w-full sm:w-auto"
                >
                  {bulanList.map(bln => (
                    <option key={bln} value={bln}>{bln}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                <span className="text-sm font-bold text-gray-600 w-12 md:w-auto">Bay:</span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {bays.map(bay => (
                    <button
                      key={bay}
                      onClick={() => setSelectedBay(bay)}
                      className={`flex-1 sm:flex-none px-4 md:px-6 py-2 text-xs md:text-sm font-extrabold rounded-md transition-all shadow-sm border ${selectedBay === bay ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                    >
                      {bay}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                <span className="text-sm font-bold text-gray-600 w-12 md:w-auto">Jalur:</span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {jalurs.map(jalur => {
                    let btnClass = '';
                    if (jalur === 'PERTAMAX') {
                      btnClass = selectedJalur === jalur ? 'bg-[#2563EB] text-white shadow-md border-[#2563EB]' : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
                    } else if (jalur === 'PERTALITE') {
                      btnClass = selectedJalur === jalur ? 'bg-[#16A34A] text-white shadow-md border-[#16A34A]' : 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
                    } else if (jalur === 'B40') {
                      btnClass = selectedJalur === jalur ? 'bg-[#64748B] text-white shadow-md border-[#64748B]' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300';
                    }
                    
                    return (
                      <button
                        key={jalur}
                        onClick={() => setSelectedJalur(jalur)}
                        className={`flex-1 sm:flex-none px-3 md:px-6 py-2 text-xs md:text-sm font-extrabold rounded-md transition-all border ${btnClass}`}
                      >
                        {jalur}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Table Section Responsif */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#F8FAFC] border-b border-gray-200 p-3 md:p-4 px-4 md:px-5">
              <h3 className="font-bold text-[#1E3A8A] text-xs md:text-sm tracking-wide">Data Sheet Aktif: Bay {selectedBay} - Jalur {selectedJalur} - Bulan {selectedBulan}</h3>
            </div>
            {/* Wrapper table dengan overflow-x-auto untuk geser horizontal di HP */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-black text-white text-[10px] md:text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap">MINGGU</th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-44">TANGGAL</th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-32">ΔP RATA-RATA<br/><span className="text-[9px] md:text-[10px] font-normal text-gray-400 normal-case">(bar)</span></th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-36">FLOWRATE RATA<br/><span className="text-[9px] md:text-[10px] font-normal text-gray-400 normal-case">(L/m)</span></th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-40">KONDISI FILTER</th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-36">INDIKASI</th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-44">TINDAKAN</th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-32">PIC</th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-56">KETERANGAN</th>
                    <th className="px-3 md:px-5 py-3 md:py-4 font-extrabold whitespace-nowrap w-44">TANGGAL SERVICE<br/><span className="text-[9px] md:text-[10px] font-normal text-gray-400 normal-case">TERAKHIR</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 md:px-5 py-2 md:py-3 font-extrabold text-black whitespace-nowrap text-xs md:text-sm">{row.minggu}</td>
                      <td className="px-3 md:px-5 py-2 md:py-3"><input type="date" value={row.tanggal} onChange={(e) => handleInputChange(row.id, 'tanggal', e.target.value)} className={inputClassName} /></td>
                      <td className="px-3 md:px-5 py-2 md:py-3"><input type="number" step="0.01" placeholder="0.00" value={row.deltaP} onChange={(e) => handleInputChange(row.id, 'deltaP', e.target.value)} className={inputClassName} /></td>
                      <td className="px-3 md:px-5 py-2 md:py-3"><input type="number" step="0.1" placeholder="0.0" value={row.flowrate} onChange={(e) => handleInputChange(row.id, 'flowrate', e.target.value)} className={inputClassName} /></td>
                      <td className="px-3 md:px-5 py-2 md:py-3">
                        <select value={row.kondisi} onChange={(e) => handleInputChange(row.id, 'kondisi', e.target.value)} className={inputClassName}>
                          {kondisiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="px-3 md:px-5 py-2 md:py-3">
                        <select value={row.indikasi} onChange={(e) => handleInputChange(row.id, 'indikasi', e.target.value)} className={`w-full min-w-[120px] border rounded-md shadow-sm text-sm p-2 font-bold focus:outline-none transition-all ${getIndikasiColor(row.indikasi)}`}>
                          {indikasiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="px-3 md:px-5 py-2 md:py-3">
                        <select value={row.tindakan} onChange={(e) => handleInputChange(row.id, 'tindakan', e.target.value)} className={inputClassName}>
                          {tindakanOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="px-3 md:px-5 py-2 md:py-3"><input type="text" placeholder="PIC" value={row.pic} onChange={(e) => handleInputChange(row.id, 'pic', e.target.value)} className={inputClassName} /></td>
                      <td className="px-3 md:px-5 py-2 md:py-3"><input type="text" placeholder="Catatan..." value={row.keterangan} onChange={(e) => handleInputChange(row.id, 'keterangan', e.target.value)} className={inputClassName} /></td>
                      <td className="px-3 md:px-5 py-2 md:py-3"><input type="date" value={row.tanggalService} onChange={(e) => handleInputChange(row.id, 'tanggalService', e.target.value)} className={inputClassName} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer Action Buttons Responsif */}
            <div className="bg-white p-4 md:p-5 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={handleExportExcel} disabled={isExporting} className={`flex justify-center items-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-white border border-[#16A34A] text-[#16A34A] rounded-md hover:bg-green-50 transition-all font-bold text-sm shadow-sm ${isExporting ? 'opacity-70 cursor-wait' : ''}`}>
                <Download size={18} />
                {isExporting ? 'Memproses Excel...' : 'Export Excel'}
              </button>
              <button onClick={handleSave} disabled={isSaving} className={`flex justify-center items-center gap-2 w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-bold text-sm transition-all shadow-sm ${isSaving ? 'opacity-70 cursor-wait' : ''}`}>
                <Save size={18} />
                {isSaving ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </div>

          {/* Info Box Responsif */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
             <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-5 flex gap-3 md:gap-4 shadow-sm">
               <Clock className="text-blue-600 shrink-0 mt-0.5" size={24} />
               <div>
                  <h4 className="font-bold text-blue-900 text-sm md:text-base">Siklus Cleaning</h4>
                  {/* Margin atas (mt) diperbesar di sini */}
                  <p className="text-xs md:text-sm text-blue-800 mt-2 md:mt-3 leading-relaxed">Pemantauan mingguan memastikan filter dibersihkan tepat waktu sebelum mencapai status "Clogging" (Kritis) yang dapat menghentikan aliran operasi (flowrate drop).</p>
               </div>
             </div>
             
             <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5 flex gap-3 md:gap-4 shadow-sm">
               <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={24} />
               <div>
                  <h4 className="font-bold text-amber-900 text-sm md:text-base">Peringatan ΔP (Pressure Drop)</h4>
                  {/* Margin atas (mt) diperbesar di sini */}
                  <p className="text-xs md:text-sm text-amber-800 mt-2 md:mt-3 leading-relaxed">Jika ΔP meningkat tajam meskipun flowrate stabil atau menurun, segera ubah status ke <strong className="text-red-600">Warning</strong> dan siapkan jadwal pembersihan.</p>
               </div>
             </div>
          </div>

          {/* Copyright Footer */}
          <div className="mt-[60px] md:mt-[80px] text-center pb-8">
            <p className="text-xs md:text-sm font-bold text-gray-500">
              &copy; 2026 Fuel Terminal Tuban. All Rights Reserved
            </p>
          </div>

        </div>
      </div>
    </>
  );
}