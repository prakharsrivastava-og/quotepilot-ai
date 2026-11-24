import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { subscribeBusiness, subscribeCollection } from '../services/firestoreService';
import { getMonthKey, PLAN_LIMITS } from '../utils/formatters';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [leads, setLeads] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAiModel, setSelectedAiModel] = useState(
    () => localStorage.getItem('qp_ai_model') || 'gemini-3.8-flash'
  );

  useEffect(() => {
    localStorage.setItem('qp_ai_model', selectedAiModel);
  }, [selectedAiModel]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setEmailVerified(Boolean(firebaseUser?.emailVerified));
      if (!firebaseUser) {
        setUserProfile(null);
        setBusiness(null);
        setLeads([]);
        setQuotations([]);
        setFollowups([]);
        setCustomers([]);
        setInteractions([]);
        setTeam([]);
        setLoading(false);
      } else if (!firebaseUser.emailVerified) {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !emailVerified || !db) return;
    setLoading(true);
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setUserProfile(snap.exists() ? snap.data() : null);
      if (!snap.exists()) {
        setBusiness(null);
        setLoading(false);
      }
    });
    return () => unsubUser();
  }, [user, emailVerified]);

  useEffect(() => {
    const businessId = userProfile?.businessId;
    if (!businessId || !emailVerified) return;

    const unsubs = [
      subscribeBusiness(businessId, (b) => { setBusiness(b); setLoading(false); }),
      subscribeCollection(businessId, 'leads', setLeads),
      subscribeCollection(businessId, 'quotations', setQuotations),
      subscribeCollection(businessId, 'followups', setFollowups, 'dueDate'),
      subscribeCollection(businessId, 'customers', setCustomers),
      subscribeCollection(businessId, 'interactions', setInteractions),
      subscribeCollection(businessId, 'team', setTeam)
    ];

    return () => unsubs.forEach((fn) => fn && fn());
  }, [userProfile?.businessId, emailVerified]);

  const refreshUser = async () => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const verified = Boolean(auth.currentUser.emailVerified);
    setEmailVerified(verified);
    return verified;
  };

  const currentMonth = getMonthKey();
  const planKey = business?.plan || 'starter';
  const planLimits = PLAN_LIMITS[planKey] || PLAN_LIMITS.starter;
  const aiCallsUsed = business?.usage?.aiCallsMonthKey === currentMonth ? (business?.usage?.aiCallsCount || 0) : 0;
  const quotesUsed = business?.usage?.quotesMonthKey === currentMonth ? (business?.usage?.quotesCount || 0) : 0;
  const logout = () => (auth ? signOut(auth) : Promise.resolve());

  return (
    <AuthContext.Provider
      value={{
        user, emailVerified, refreshUser, userProfile, business, leads, quotations, followups,
        customers, interactions, team, loading, isFirebaseConfigured,
        selectedAiModel, setSelectedAiModel, planLimits, aiCallsUsed, quotesUsed, logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
