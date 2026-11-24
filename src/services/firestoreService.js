import {
  addDoc, collection, deleteDoc, doc, getDocs, increment,
  onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getMonthKey } from '../utils/formatters';

export async function createBusinessProfile({ user, businessData }) {
  const businessRef = doc(collection(db, 'businesses'));
  const businessId = businessRef.id;
  const monthKey = getMonthKey();

  await setDoc(businessRef, {
    id: businessId,
    ownerUid: user.uid,
    name: businessData.name,
    industry: businessData.industry || 'Residential Cleaning',
    phone: businessData.phone || '',
    email: businessData.email || user.email,
    address: businessData.address || '',
    website: businessData.website || '',
    currency: businessData.currency || 'USD',
    taxRate: Number(businessData.taxRate || 0),
    quotePrefix: businessData.quotePrefix || 'QP-',
    quoteValidityDays: Number(businessData.quoteValidityDays || 14),
    terms: businessData.terms || '50% deposit upon booking, balance due upon completion. 24-hour satisfaction guarantee.',
    services: businessData.services || [],
    plan: 'starter',
    usage: {
      aiCallsMonthKey: monthKey,
      aiCallsCount: 0,
      quotesMonthKey: monthKey,
      quotesCount: 0
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: businessData.ownerName || user.displayName || user.email.split('@')[0],
    businessId,
    role: 'Owner',
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, 'businesses', businessId, 'team'), {
    uid: user.uid,
    name: businessData.ownerName || user.displayName || user.email.split('@')[0],
    email: user.email,
    role: 'Owner',
    status: 'Active',
    createdAt: serverTimestamp()
  });

  return businessId;
}

export async function updateBusinessProfile(businessId, updates) {
  await updateDoc(doc(db, 'businesses', businessId), { ...updates, updatedAt: serverTimestamp() });
}

export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, 'users', uid), updates);
}

export function subscribeBusiness(businessId, callback) {
  return onSnapshot(doc(db, 'businesses', businessId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function subscribeCollection(businessId, subcollection, callback, sortField = 'createdAt') {
  const q = query(collection(db, 'businesses', businessId, subcollection), orderBy(sortField, 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function upsertCustomer(businessId, customerData) {
  const customersRef = collection(db, 'businesses', businessId, 'customers');
  if (customerData.id) {
    await updateDoc(doc(customersRef, customerData.id), { ...customerData, updatedAt: serverTimestamp() });
    return customerData.id;
  }
  if (customerData.email) {
    const q = query(customersRef, where('email', '==', customerData.email.trim().toLowerCase()));
    const existing = await getDocs(q);
    if (!existing.empty) {
      const existingId = existing.docs[0].id;
      await updateDoc(doc(customersRef, existingId), {
        name: customerData.name,
        phone: customerData.phone || existing.docs[0].data().phone || '',
        address: customerData.address || existing.docs[0].data().address || '',
        propertySize: customerData.propertySize || existing.docs[0].data().propertySize || '',
        updatedAt: serverTimestamp()
      });
      return existingId;
    }
  }
  const created = await addDoc(customersRef, {
    businessId,
    name: customerData.name || 'Unnamed Customer',
    email: (customerData.email || '').trim().toLowerCase(),
    phone: customerData.phone || '',
    address: customerData.address || '',
    propertySize: customerData.propertySize || '',
    notes: customerData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return created.id;
}

export async function addInteraction(businessId, interaction) {
  return addDoc(collection(db, 'businesses', businessId, 'interactions'), {
    businessId,
    customerId: interaction.customerId || '',
    leadId: interaction.leadId || '',
    type: interaction.type || 'Note',
    title: interaction.title || 'Interaction',
    details: interaction.details || '',
    createdBy: interaction.createdBy || 'System',
    createdAt: serverTimestamp()
  });
}

export async function createLead(businessId, leadData, createdByName) {
  const customerId = await upsertCustomer(businessId, {
    name: leadData.customerName,
    email: leadData.customerEmail,
    phone: leadData.customerPhone,
    address: leadData.address,
    propertySize: leadData.propertySize
  });

  const docRef = await addDoc(collection(db, 'businesses', businessId, 'leads'), {
    businessId,
    customerId,
    customerName: leadData.customerName,
    customerEmail: (leadData.customerEmail || '').trim().toLowerCase(),
    customerPhone: leadData.customerPhone || '',
    address: leadData.address || '',
    propertySize: leadData.propertySize || '',
    serviceRequested: leadData.serviceRequested || '',
    source: leadData.source || 'Website Inquiry',
    rawInquiry: leadData.rawInquiry || '',
    desiredDate: leadData.desiredDate || '',
    stage: leadData.stage || 'New Inquiry',
    assignedToUid: leadData.assignedToUid || '',
    assignedToName: leadData.assignedToName || '',
    estimatedValue: Number(leadData.estimatedValue || 0),
    aiAnalysis: null,
    lostReason: '',
    lostNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await addInteraction(businessId, {
    customerId,
    leadId: docRef.id,
    type: 'Inquiry',
    title: 'New Inquiry Captured (' + (leadData.source || 'Manual') + ')',
    details: leadData.rawInquiry || leadData.serviceRequested || 'Lead added to pipeline.',
    createdBy: createdByName
  });

  return { leadId: docRef.id, customerId };
}

export async function updateLead(businessId, leadId, updates) {
  await updateDoc(doc(db, 'businesses', businessId, 'leads', leadId), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteLead(businessId, leadId) {
  await deleteDoc(doc(db, 'businesses', businessId, 'leads', leadId));
}

export async function createQuotation(businessId, quoteData, business) {
  const quoteRef = await addDoc(collection(db, 'businesses', businessId, 'quotations'), {
    businessId,
    ...quoteData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await incrementUsage(businessId, business, 'quotes');

  if (quoteData.customerId) {
    await addInteraction(businessId, {
      customerId: quoteData.customerId,
      leadId: quoteData.leadId || '',
      type: 'Quotation',
      title: 'Quotation ' + quoteData.quoteNumber + ' Created',
      details: 'Amount: ' + quoteData.total + ' (' + (quoteData.status || 'Draft') + ')',
      createdBy: quoteData.createdBy || 'Team'
    });
  }

  return quoteRef.id;
}

export async function updateQuotation(businessId, quoteId, updates) {
  await updateDoc(doc(db, 'businesses', businessId, 'quotations', quoteId), { ...updates, updatedAt: serverTimestamp() });
}

export async function createFollowUp(businessId, data) {
  return addDoc(collection(db, 'businesses', businessId, 'followups'), {
    businessId,
    leadId: data.leadId || '',
    customerId: data.customerId || '',
    leadName: data.leadName || '',
    quoteId: data.quoteId || '',
    customerEmail: data.customerEmail || '',
    customerPhone: data.customerPhone || '',
    channel: data.channel || 'Email',
    dueDate: data.dueDate,
    note: data.note || '',
    aiDraft: data.aiDraft || '',
    status: 'Pending',
    createdAt: serverTimestamp()
  });
}

export async function updateFollowUp(businessId, followupId, updates) {
  await updateDoc(doc(db, 'businesses', businessId, 'followups', followupId), updates);
}

export async function addTeamMember(businessId, member) {
  return addDoc(collection(db, 'businesses', businessId, 'team'), {
    businessId,
    uid: '',
    name: member.name,
    email: member.email.trim().toLowerCase(),
    role: member.role || 'Sales Rep',
    status: 'Invited',
    createdAt: serverTimestamp()
  });
}

export async function deleteTeamMember(businessId, memberId) {
  await deleteDoc(doc(db, 'businesses', businessId, 'team', memberId));
}

export async function incrementUsage(businessId, business, type) {
  const monthKey = getMonthKey();
  const usage = business?.usage || {};
  const businessRef = doc(db, 'businesses', businessId);

  if (type === 'ai') {
    if (usage.aiCallsMonthKey === monthKey) {
      await updateDoc(businessRef, { 'usage.aiCallsCount': increment(1) });
    } else {
      await updateDoc(businessRef, { 'usage.aiCallsMonthKey': monthKey, 'usage.aiCallsCount': 1 });
    }
  } else if (type === 'quotes') {
    if (usage.quotesMonthKey === monthKey) {
      await updateDoc(businessRef, { 'usage.quotesCount': increment(1) });
    } else {
      await updateDoc(businessRef, { 'usage.quotesMonthKey': monthKey, 'usage.quotesCount': 1 });
    }
  }
}
