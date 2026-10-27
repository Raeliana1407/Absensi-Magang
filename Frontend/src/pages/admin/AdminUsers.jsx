import React, { useState, useEffect } from 'react';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua'); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Edit / Approve
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    status: 'aktif',
    role: 'magang',
    divisi: '',
    pembimbing_id: ''
  });

  const token = localStorage.getItem('token');

  // Ambil data user dari backend
  const fetchUsers = async () => {
    try {
      const response = await fetch('https://absensi-magang-beta.vercel.app/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const listPembimbing = users.filter(u => u.role === 'pembimbing');

  // LOGIKA PENCARIAN & FILTER
  const filteredUsers = users.filter(u => {
    const userStatus = u.status || 'aktif'; 
    const matchSearch = u.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'semua' ? true : userStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  // Buka Modal Edit
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      status: user.status || 'aktif',
      role: user.role || 'magang',
      divisi: user.divisi || '',
      pembimbing_id: user.pembimbing_id || ''
    });
    setIsModalOpen(true);
  };

  // Submit Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://absensi-magang-beta.vercel.app/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Data berhasil diupdate!');
        setIsModalOpen(false);
        fetchUsers(); 
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Gagal update:", error);
      alert('Terjadi kesalahan server.');
    }
  };

  // ==========================================
  // FITUR BARU: HAPUS USER
  // ==========================================
  const handleDelete = async (id, nama) => {
    // Beri peringatan sebelum menghapus
    const confirmDelete = window.confirm(`⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus akun "${nama}" secara permanen?\nSemua data presensi dan logbook yang terkait dengan akun ini mungkin akan ikut terhapus.`);
    
    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://absensi-magang-beta.vercel.app/api/admin/users/${id}`, {
        method: 'DELETE', // Method DELETE ke backend
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Akun berhasil dihapus dari database.');
        fetchUsers(); // Refresh tabel setelah dihapus
      } else {
        alert(result.message || 'Gagal menghapus pengguna.');
      }
    } catch (error) {
      console.error("Gagal menghapus:", error);
      alert('Terjadi kesalahan server saat mencoba menghapus data.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 relative">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-full">Data Master</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">Manajemen Pengguna</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">Kelola akses akun magang, pembimbing, dan administrator sistem.</p>
        </div>
      </div>

      {/* PENCARIAN & TOMBOL FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="w-full md:w-1/3 flex items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus-within:border-slate-400 transition-colors">
            <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-700" 
            />
         </div>

         <div className="w-full md:w-auto flex overflow-x-auto gap-2 pb-1 md:pb-0 hide-scrollbar">
            <button 
              onClick={() => setFilterStatus('semua')}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full transition-colors ${filterStatus === 'semua' ? 'bg-[#1E40AF] text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              Semua ({users.length})
            </button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 ${filterStatus === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              {users.filter(u => u.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
              Pending ({users.filter(u => u.status === 'pending').length})
            </button>
            <button 
              onClick={() => setFilterStatus('aktif')}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full transition-colors ${filterStatus === 'aktif' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              Aktif ({users.filter(u => (u.status || 'aktif') === 'aktif').length})
            </button>
            <button 
              onClick={() => setFilterStatus('nonaktif')}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full transition-colors ${filterStatus === 'nonaktif' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              Nonaktif ({users.filter(u => u.status === 'nonaktif').length})
            </button>
         </div>
      </div>

      {/* TABEL DATA USER */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[850px]">
          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-5">Pengguna</th>
              <th className="p-5">Status</th>
              <th className="p-5">Role & Divisi</th>
              <th className="p-5">Pembimbing</th>
              <th className="p-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="p-5 text-center text-sm text-slate-500">Memuat data...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="5" className="p-5 text-center text-sm text-slate-500">
                {filterStatus !== 'semua' ? `Tidak ada pengguna dengan status ${filterStatus}.` : 'Data tidak ditemukan.'}
              </td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${user.role === 'admin' ? 'bg-amber-500' : user.role === 'pembimbing' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                        {user.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{user.nama}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      user.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      user.status === 'nonaktif' ? 'bg-rose-100 text-rose-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {user.status || 'aktif'}
                    </span>
                  </td>
                  <td className="p-5">
                     <p className="text-sm font-bold text-slate-700 capitalize">{user.role}</p>
                     <p className="text-xs text-slate-500">{user.divisi || '-'}</p>
                  </td>
                  <td className="p-5 text-sm font-medium text-slate-600">
                    {user.nama_pembimbing || '-'}
                  </td>
                  <td className="p-5 text-right">
                    
                    {/* BUTTONS GROUP (EDIT & DELETE) */}
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Edit
                      </button>
                      
                      {/* TOMBOL HAPUS (Merah) */}
                      <button 
                        onClick={() => handleDelete(user.id, user.nama)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Hapus
                      </button>
                    </div>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg">Edit Pengguna</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Akun</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50">
                  <option value="pending">Pending (Menunggu Approve)</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Akses</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50">
                  <option value="magang">Anak Magang</option>
                  <option value="pembimbing">Pembimbing / Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Divisi / Penempatan</label>
                <input type="text" value={formData.divisi} onChange={(e) => setFormData({...formData, divisi: e.target.value})} placeholder="Contoh: Frontend Web" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50" />
              </div>

              {formData.role === 'magang' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Pembimbing</label>
                  <select value={formData.pembimbing_id} onChange={(e) => setFormData({...formData, pembimbing_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 outline-none bg-slate-50">
                    <option value="">-- Belum ada pembimbing --</option>
                    {listPembimbing.map(p => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="h-10 md:hidden"></div>
    </div>
  );
}