'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signInWithEmail } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    if (!error) router.push('/dashboard');
    else setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">DataLive</h1>
          <p className="mt-2 text-gray-600">API Documentation Platform</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
        <Button onClick={handleGoogleSignIn} disabled={loading} className="w-full" variant="outline">
          Continue with Google
        </Button>
        <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or with email</span></div></div>
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign in'}</Button>
        </form>
      </div>
    </div>
  );
}
