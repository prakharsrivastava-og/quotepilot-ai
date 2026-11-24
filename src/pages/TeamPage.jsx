import React, { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addTeamMember, deleteTeamMember } from '../services/firestoreService';
import { AlertBanner, Badge, Button, Card, Modal } from '../components/UI';

export default function TeamPage() {
  const { business, team, leads, planLimits } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Sales Rep');
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (team.length >= planLimits.maxTeamMembers) {
      setError('Team limit reached (' + planLimits.maxTeamMembers + ' members on ' + planLimits.name + '). Upgrade your plan to add more.');
      return;
    }
    await addTeamMember(business.id, { name: name.trim(), email: email.trim(), role });
    setShowAdd(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team & Lead Assignment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage team seats ({team.length}/{planLimits.maxTeamMembers} used) and track assigned inquiries.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned Leads</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {team.map((m) => {
              const assignedCount = leads.filter((l) => l.assignedToUid === (m.uid || m.id)).length;
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{m.role}</td>
                  <td className="px-4 py-3">
                    <Badge className={m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                      {m.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{assignedCount}</td>
                  <td className="px-4 py-3 text-right">
                    {m.role !== 'Owner' && (
                      <button
                        onClick={() => deleteTeamMember(business.id, m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Team Member">
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jordan@company.com" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option>Sales Rep</option>
              <option>Estimator</option>
              <option>Operations Manager</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Note: Added members appear immediately in Lead Assignment dropdowns.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit"><UserPlus className="w-4 h-4" /> Add Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
