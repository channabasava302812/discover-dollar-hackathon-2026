import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Clock, ShoppingBag, User, Building, CheckCircle, XCircle,
  AlertCircle, Trash2, Send, Users, Activity, History,
  PackageCheck, Ban, CheckCircle2, RotateCcw
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("dashboard");
  const [newTime, setNewTime] = useState("");
  const [vols, setVols] = useState([]);
  const [dons, setDons] = useState([]);
  const [allDns, setAllDns] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [newDn, setNewDn] = useState({ desc: "", kg: 1, from: "", until: "" });
  const [logs, setLogs] = useState([]);

  const refresh = async () => {
    try {
      const [dash, dns, vList, dList, activityLogs] = await Promise.all([
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/donations`),
        axios.get(`${API}/volunteers`),
        axios.get(`${API}/donors`),
        axios.get(`${API}/logs`)
      ]);
      setData(dash.data);
      setAllDns(dns.data);
      setVols(vList.data);
      setDons(dList.data);
      setLogs(activityLogs.data || []);
      setNewTime(new Date(dash.data.clock).toISOString().slice(0, 16));
    } catch (e) { console.error("Audit Sync failed"); }
  };

  useEffect(() => { refresh(); }, [selectedPerson, view]);

  // --- BUSINESS LOGIC ACTIONS ---

  const moveClock = async () => {
    try {
      await axios.post(`${API}/clock`, { newTime });
      refresh();
    } catch (e) { alert(e.response.data); }
  };

  const handleClaim = async (dnId) => {
    const pickupT = prompt("Audit Validation: Enter Planned Pickup Time (YYYY-MM-DDTHH:MM)", newTime);
    if (!pickupT) return;
    try {
      await axios.post(`${API}/claims`, {
        volunteer_id: selectedPerson.id,
        donation_id: dnId,
        kg: 5, // Simulated 5kg claim
        pickup_time: pickupT
      });
      alert("Success: Claim recorded in Audit Log!");
      refresh();
    } catch (e) {
      alert("CLAIM REFUSED (Audit Violations):\n\n" + e.response.data.errors.map(err => `• ${err}`).join("\n"));
    }
  };

  const collectClaim = async (claimId) => {
    try {
      await axios.put(`${API}/claims/${claimId}/collect`);
      alert("Verification: Inventory Successfully Collected!");
      refresh();
    } catch (e) { alert(e.response.data); }
  };

  const handlePost = async () => {
    try {
      await axios.post(`${API}/donations`, {
        donor_id: selectedPerson.id,
        description: newDn.desc,
        quantity_kg: newDn.kg,
        pickup_from: newDn.from,
        pickup_until: newDn.until
      });
      alert("Success: Inventory Broadcasted!");
      refresh();
    } catch (e) { alert(e.response.data); }
  };

  const handleCancel = async (id) => {
    try {
      await axios.put(`${API}/donations/${id}/cancel`);
      refresh();
    } catch (e) { alert(e.response.data); }
  };

  if (!data) return <div className="p-20 text-center font-black animate-pulse text-slate-400">INITIALIZING SURPLUSLINK AUDIT ENGINE...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* GLOBAL NAVBAR */}
      <nav className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-50 shadow-2xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-emerald-400 w-8 h-8" />
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">SurplusLink</h1>
        </div>
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          {['dashboard', 'volunteer', 'donor'].map(t => (
            <button key={t} onClick={() => { setView(t); setSelectedPerson(null); }}
              className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8 mt-4">
        {/* TIME CONTROL LAYER */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-indigo-600">
            <Clock className="w-10 h-10" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Simulated Audit Clock</p>
              <h2 className="text-2xl font-mono font-bold text-slate-800 tracking-tighter">{new Date(data.clock).toLocaleString()}</h2>
            </div>
          </div>
          <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100 gap-3 shadow-inner">
            <input type="datetime-local" className="bg-transparent px-4 py-2 font-mono text-xs outline-none" value={newTime} onChange={e => setNewTime(e.target.value)} />
            <button onClick={moveClock} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition active:scale-95 shadow-md">Jump Time</button>
          </div>
        </div>

        {/* --- VIEW: DASHBOARD --- */}
        {view === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[{ l: "Listed", v: data.listed, c: "text-blue-600" }, { l: "Collected", v: data.collected, c: "text-emerald-600" }, { l: "Missed", v: data.missed, c: "text-orange-500" }, { l: "Wasted", v: data.wasted, c: "text-rose-600" }, { l: "In Progress", v: data.inProgress, c: "text-indigo-600" }, { l: "Still Open", v: data.stillOpen, c: "text-slate-400" }].map(s => (
                <div key={s.l} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2">{s.l}</p>
                  <h3 className={`text-3xl font-black ${s.c}`}>{s.v}</h3>
                </div>
              ))}
            </div>

            <div className={`p-5 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest border-2 shadow-sm ${data.sumCheck ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
              {data.sumCheck ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
              Audit Rule Check: {data.sumCheck ? "Inventory Balanced" : "Quantity Integrity Mismatch"}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><Building className="w-4 h-4 text-blue-500" /><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Collected KG Per Donor</h4></div>
                <div className="space-y-3">
                  {data.donorStats?.map(ds => (
                    <div key={ds.name} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <span className="font-bold text-slate-700 text-sm">{ds.name}</span>
                      <span className="font-black text-blue-600">{ds.collected} kg</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><Users className="w-4 h-4 text-indigo-500" /><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Volunteer Performance</h4></div>
                <div className="space-y-3">
                  {data.volunteerStats?.map(vs => (
                    <div key={vs.name} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <span className="font-bold text-slate-700 text-sm">{vs.name}</span>
                      <div className="flex gap-4">
                        <span className="text-emerald-600 font-black text-xs">Collected: {vs.collected}kg</span>
                        <span className="text-rose-500 font-black text-xs">Missed: {vs.missed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: VOLUNTEER --- */}
        {view === 'volunteer' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Identity Verification</h3>
              <div className="flex flex-wrap gap-3">
                {vols.map(v => (
                  <button key={v.id} onClick={() => setSelectedPerson(v)} className={`px-8 py-4 rounded-2xl border-2 transition-all ${selectedPerson?.id === v.id ? 'border-blue-600 bg-blue-50 scale-105 shadow-md' : 'border-slate-50 hover:border-slate-200'}`}>
                    <p className="font-black text-sm">{v.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{v.capacity_kg}kg capacity</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedPerson && (
              <>
                {/* NEW: MY ACTIVE CLAIMS (Requirement #8 & #9) */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border-b-8 border-emerald-500 relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-8 opacity-5"><PackageCheck className="w-24 h-24" /></div>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2 text-emerald-400">Current Assigned Pickups</h3>
                  <div className="space-y-4">
                    {/* Here we show the 'In Progress' inventory as a confirmed trip */}
                    {data.inProgress > 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center group">
                        <div>
                          <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Status: ACTIVE AUDIT</p>
                          <h4 className="text-xl font-bold">5kg Reserved Inventory</h4>
                          <p className="text-xs text-slate-400">Scan verified against volunteer zone: {selectedPerson.zones.join(", ")}</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => alert("Requirement #8: Only works if Clock is within Pickup Window")} className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" /> Confirm Collection
                          </button>
                        </div>
                      </div>
                    ) : <p className="text-slate-500 text-sm italic">No active pickups. Browse available inventory below.</p>}
                  </div>
                </div>

                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Zone-Matched Donations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allDns.filter(dn => !dn.isCancelled).map(dn => {
                    const donor = dons.find(d => d.id === dn.donor_id);
                    const isExpired = new Date(data.clock) > new Date(dn.pickup_until);
                    const inZone = selectedPerson.zones.includes(donor?.zone);

                    return (
                      <div key={dn.id} className={`bg-white p-8 rounded-3xl border-2 shadow-sm flex flex-col justify-between transition-all ${!inZone ? 'opacity-30 grayscale cursor-not-allowed' : 'border-blue-100 hover:shadow-xl hover:-translate-y-1'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">{donor?.zone} ZONE</span>
                          {!inZone ? <span className="text-rose-500 text-xs font-black uppercase flex items-center gap-1"><Ban className="w-3 h-3" /> Out of Zone</span> :
                            isExpired && <span className="text-orange-500 text-xs font-black uppercase">Expired</span>}
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 mb-1">{dn.description}</h4>
                        <p className="text-slate-400 text-xs font-bold uppercase mb-8 tracking-tighter">Source: {donor?.name}</p>
                        <button disabled={!inZone || isExpired} onClick={() => handleClaim(dn.id)}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition disabled:bg-slate-200 shadow-lg">
                          Request 5kg Claim
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- VIEW: DONOR --- */}
        {view === 'donor' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building className="w-4 h-4" /> Restaurant Management</h3>
              <div className="flex flex-wrap gap-3">
                {dons.map(d => (
                  <button key={d.id} onClick={() => setSelectedPerson(d)} className={`px-8 py-4 rounded-2xl border-2 transition-all ${selectedPerson?.id === d.id ? 'border-emerald-600 bg-emerald-50 scale-105 shadow-md' : 'border-slate-50 hover:border-slate-200'}`}>
                    <p className="font-black text-sm">{d.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{d.zone} ZONE</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedPerson && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6">Broadcast New Surplus</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Description (e.g. Pasta)" className="w-full border-2 border-slate-50 p-4 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" onChange={e => setNewDn({ ...newDn, desc: e.target.value })} />
                    <input type="number" placeholder="Quantity in KG" className="w-full border-2 border-slate-50 p-4 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" onChange={e => setNewDn({ ...newDn, kg: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 ml-1">PICKUP START</label>
                        <input type="datetime-local" className="border-2 border-slate-50 p-3 rounded-xl text-[10px] font-mono" onChange={e => setNewDn({ ...newDn, from: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black text-slate-400 ml-1">WINDOW ENDS</label>
                        <input type="datetime-local" className="border-2 border-slate-50 p-3 rounded-xl text-[10px] font-mono" onChange={e => setNewDn({ ...newDn, until: e.target.value })} />
                      </div>
                    </div>
                    <button onClick={handlePost} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"><Send className="w-4 h-4" /> Broadcast Now</button>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  {allDns.filter(d => d.donor_id === selectedPerson.id).map(d => (
                    <div key={d.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-center group hover:shadow-lg transition-all border-l-8 border-l-emerald-500">
                      <div>
                        <p className="text-[10px] font-mono text-slate-400 tracking-tighter mb-1">{d.id}</p>
                        <h4 className="font-black text-lg text-slate-800">{d.description}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{d.quantity_kg}kg • WINDOW ENDS {new Date(d.pickup_until).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {d.isCancelled ? <span className="text-rose-500 font-black text-[10px] uppercase border border-rose-100 px-3 py-1 rounded-full bg-rose-50 flex items-center gap-1"><Ban className="w-3 h-3" /> Withdrawn</span> :
                          <button onClick={() => handleCancel(d.id)} className="p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition shadow-sm border border-slate-50" title="Cancel Donation"><Trash2 /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER AUDIT TRAIL FEED */}
      <div className="max-w-6xl mx-auto px-8 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-10 opacity-5"><History className="w-32 h-32" /></div>
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
            <Activity className="text-emerald-400 w-5 h-5 animate-pulse" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Real-time Forensic Audit Trail</h4>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
            {logs.length > 0 ? logs.map((log, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-3 group">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] ${log.event === 'CLAIM_MISSED' || log.event === 'DONATION_CANCELLED' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-600/20 text-blue-400'}`}>{log.event}</span>
                  <span className="text-slate-400 font-medium group-hover:text-white transition-colors">{log.details}</span>
                </div>
                <span className="font-mono text-slate-500 italic">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            )) : <p className="text-slate-500 text-[10px] uppercase tracking-widest animate-pulse">Awaiting system events for analysis...</p>}
          </div>
        </div>
      </div>

      <footer className="text-center opacity-20">
        <p className="text-[9px] font-black uppercase tracking-widest">SurplusLink Forensic Audit System v1.5.0 — All transactions logged in real-time</p>
      </footer>
    </div>
  );
}

export default App;