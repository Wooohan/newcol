
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Link as LinkIcon, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { ApprovedLink, ApprovedMedia } from '../../types';

const MediaLibrary: React.FC = () => {
  const { approvedLinks, addApprovedLink, removeApprovedLink, approvedMedia, addApprovedMedia, removeApprovedMedia } = useApp();
  const [activeTab, setActiveTab] = useState<'links' | 'media'>('links');
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/png') {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newMedia: ApprovedMedia = {
          id: `media-${Date.now()}`,
          title: mediaTitle || file.name,
          url: reader.result as string,
          type: 'image',
          isLocal: true
        };
        await addApprovedMedia(newMedia);
        setShowAddModal(false);
        setMediaTitle('');
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select a valid PNG file.");
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLink: ApprovedLink = { 
      id: `link-${Date.now()}`, 
      title: linkTitle, 
      url: linkUrl, 
      category: 'General' 
    };
    await addApprovedLink(newLink);
    setShowAddModal(false);
    setLinkTitle(''); setLinkUrl('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Media & Link Control</h2>
          <p className="text-slate-500 text-sm mt-1">Authorized communication assets only. Agents cannot send non-library content.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          <Plus size={20} /> New {activeTab === 'links' ? 'Link' : 'Asset'}
        </button>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-100 flex gap-1 w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('links')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'links' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <LinkIcon size={18} /> Verified Links
        </button>
        <button 
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'media' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ImageIcon size={18} /> PNG Assets
        </button>
      </div>

      {activeTab === 'links' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedLinks.map(link => (
            <div key={link.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group">
              <div className="flex justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><LinkIcon size={20} /></div>
                <button onClick={() => removeApprovedLink(link.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
              <h4 className="font-bold text-slate-800">{link.title}</h4>
              <p className="text-xs text-blue-500 mt-1 truncate">{link.url}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
           {approvedMedia.map(media => (
             <div key={media.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                <div className="aspect-square bg-slate-50 relative">
                   <img src={media.url} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                      <button onClick={() => removeApprovedMedia(media.id)} className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform"><Trash2 size={20} /></button>
                   </div>
                </div>
                <div className="p-3">
                   <h4 className="text-[10px] font-bold text-slate-800 truncate uppercase tracking-widest">{media.title}</h4>
                </div>
             </div>
           ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">New {activeTab === 'links' ? 'Link' : 'PNG Asset'}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={24} /></button>
              </div>

              {activeTab === 'links' ? (
                <form onSubmit={handleAddLink} className="space-y-4">
                  <input type="text" placeholder="Title" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
                  <input type="url" placeholder="URL (e.g. https://messengerflow.io)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
                  <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl">Verify & Save Link</button>
                </form>
              ) : (
                <div className="space-y-6">
                   <input type="text" placeholder="Asset Name" value={mediaTitle} onChange={e => setMediaTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" />
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all"
                   >
                      <Upload className="text-blue-500" size={32} />
                      <div className="text-center">
                         <p className="text-sm font-bold text-slate-700">Click to Select PNG</p>
                         <p className="text-[10px] text-slate-400 uppercase font-black mt-1">Max size 2MB</p>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/png" className="hidden" onChange={handleFileUpload} />
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
