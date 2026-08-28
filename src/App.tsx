// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './components/Home/Home';
import { Auth } from './components/auth/Auth';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firebase doesn't push an update when the user clicks the verification link,
  // so poll while we're sitting on an unverified account and refresh once it flips.
  useEffect(() => {
    if (!user || user.emailVerified) return;

    const interval = setInterval(async () => {
      try {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          setUser({ ...auth.currentUser });
        }
      } catch (err) {
        // ignore transient reload errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-medium">Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        {!user || !user.emailVerified ? (
          // Unauthenticated or not-yet-verified: hand off everything to Auth (login / signup / forgot / verify)
          <Route path="/*" element={<Auth />} />
        ) : (
          // Authenticated: hand off everything to Home (/home, /friends, /groups, /reels, /profile/:userId)
          <Route
            path="/*"
            element={
              <Home
                userDisplayName={user.displayName || user.email?.split('@')[0] || 'Facebook User'}
                currentUserId={user.uid}
                onLogout={() => signOut(auth)}
              />
            }
          />
        )}
      </Routes>
    </div>
  );
}

export default App;