import React, { useMemo, useState } from 'react';
import { Mail, MapPin, Phone, Plus, Search, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addInteraction, upsertCustomer } from '../services/firestoreService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Badge, Button, Card, EmptyState, Modal } from '../components/UI';

export default function CustomersPage() {
  const { business, customers, leads, quotations, interactions, userProfile } = useAuth();
  const currency = business?.currency || 'USD';

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', propertySize: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const activeCustomer = customers.find((c) => c.id === selectedId) || filtered[0] || null;
  const customerLeads = activeCustomer ? leads.filter((l) => l.customerId === activeCustomer.id) : [];
  const customerQuotes = activeCustomer ? quotations.filter((q) => q.customerId === activeCustomer.id) : [];
  const customerTimeline = activeCustomer ? interactions.filter((i) => i.customerId === activeCustomer.id) : [];
  const wonTotal = customerQuotes
    .filter((q) => q.status === 'Accepted')
    .reduce((sum, q) => sum + Number(q.total || 0), 0);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const id = await upsertCustomer(business.id, form);
    setSelectedId(id);
    setShowAdd(false);
    setForm({ name: '', email: '', phone: '', address: '', propertySize: '' });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!activeCustomer || !noteText.trim()) return;
    await addInteraction(business.id, {
      customerId: activeCustomer.id,
      type: 'Note',
      title: 'Team Note Added',
      details: noteText.trim(),
      createdBy: userProfile?.displayName || 'User'
    });
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers & History</h1>
          <p className="text-sm text-slate-500 mt-1">Unified client profiles with inquiry, quotation, and follow-up timelines.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers recorded yet"
          description="Customers are automatically created when you capture a lead, or you can add one manually."
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Customer</Button>}
        />
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-5 p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {filtered.map((c) => {
                const isSelected = activeCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={'w-full text-left p-3 rounded-lg transition-colors ' + (isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50')}
                  >
                    <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email || c.phone || 'No contact info'}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {activeCustomer && (
            <div className="lg:col-span-7 space-y-5">
              <Card className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{activeCustomer.name}</h2>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      {activeCustomer.email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {activeCustomer.email}</p>}
                      {activeCustomer.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {activeCustomer.phone}</p>}
                      {activeCustomer.address && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {activeCustomer.address}</p>}
                      {activeCustomer.propertySize && <p>Property: {activeCustomer.propertySize}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Accepted Revenue</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(wonTotal, currency)}</p>
                    <p className="text-xs text-slate-500 mt-1">{customerLeads.length} leads • {customerQuotes.length} quotes</p>
                  </div>
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 pt-3 border-t border-slate-100">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log a call note or preference (e.g. prefers eco-friendly supplies)..."
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300"
                  />
                  <Button type="submit" size="sm">Log Note</Button>
                </form>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Interaction Timeline</h3>
                {customerTimeline.length === 0 ? (
                  <p className="text-xs text-slate-500">No interactions recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {customerTimeline.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-white text-slate-700 border-slate-300">{item.type}</Badge>
                            <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                          </div>
                          <span className="text-[11px] text-slate-400">{formatDate(item.createdAt)}</span>
                        </div>
                        {item.details && <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">{item.details}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Customer">
        <form onSubmit={handleAddCustomer} className="space-y-3">
          <input required placeholder="Customer Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input placeholder="Property Size (e.g. 2 bed / 1 bath)" value={form.propertySize} onChange={(e) => setForm({ ...form, propertySize: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Save Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
