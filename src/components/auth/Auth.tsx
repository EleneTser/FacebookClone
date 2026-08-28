import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { LoginView } from './LoginView';
import { SignupView } from './SignupView';
import type { SignupData } from './SignupView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { VerifyEmailView } from './VerifyEmailView';

export const Auth: React.FC = () => {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      if (!user.emailVerified) {
        setPendingEmail(user.email ?? loginEmail);
        navigate('/verify');
        return;
      }
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data: SignupData) => {
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.contact, data.pass);
      
      await updateProfile(user, {
        displayName: data.displayName,
      });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        displayName: data.displayName,
        email: data.contact,
        createdAt: new Date().toISOString(),
      });

      await sendEmailVerification(user);
      setPendingEmail(data.contact);
      setResendCooldown(60);
      navigate('/verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (resetContact: string) => {
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetContact);
    } catch (err: any) {
      setError(
        err.code === 'auth/user-not-found'
          ? "There's no account with that email or mobile number."
          : err.message
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser || resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/"
        element={
          <LoginView
            onLogin={handleLogin}
            onGoToSignup={() => { navigate('/signup'); setError(''); }}
            onGoToForgot={() => { navigate('/forgot'); setError(''); }}
            loading={loading}
            error={error}
          />
        }
      />

      {/* Signup Route */}
      <Route
        path="/signup"
        element={
          <SignupView
            onBack={() => { navigate('/'); setError(''); }}
            onSignup={handleSignup}
            loading={loading}
            error={error}
          />
        }
      />

      {/* Forgot Password Route */}
      <Route
        path="/forgot"
        element={
          <ForgotPasswordView
            onBack={() => { navigate('/'); setError(''); }}
            onSubmitReset={handleForgotPassword}
            loading={loading}
            error={error}
          />
        }
      />

      {/* Verify Email Route */}
      <Route
        path="/verify"
        element={
          <VerifyEmailView
            contact={pendingEmail}
            loading={loading}
            error={error}
            onResend={handleResendVerification}
            onBack={async () => {
              try {
                await signOut(auth);
              } catch (e) {
                // ignore
              }
              navigate('/signup');
              setError('');
            }}
          />
        }
      />
      {/* Catch-all: any unmatched path (e.g. leftover /home after logout) goes to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default Auth;