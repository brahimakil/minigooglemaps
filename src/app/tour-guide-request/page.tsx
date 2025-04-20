'use client';

import { useState, FormEvent, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useTheme } from '@/lib/context/theme-context';
import { SunIcon, MoonIcon } from '@/components/icons';
import ReCAPTCHA from 'react-google-recaptcha';

export default function TourGuideRequest() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regions, setRegions] = useState<string[]>([]);
  const [region, setRegion] = useState('');
  const [idCard, setIdCard] = useState<File | null>(null);
  const [idCardBase64, setIdCardBase64] = useState<string>('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleRegionAdd = () => {
    if (region && !regions.includes(region)) {
      setRegions([...regions, region]);
      setRegion('');
    }
  };

  const handleRegionRemove = (index: number) => {
    setRegions(regions.filter((_, i) => i !== index));
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaVerified(!!token);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('ID card image must be less than 5MB');
        return;
      }
      setIdCard(file);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setIdCardBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!recaptchaVerified) {
      setError('Please verify that you are not a robot');
      setLoading(false);
      return;
    }

    if (!idCard) {
      setError('Please upload a photo of your ID card');
      setLoading(false);
      return;
    }

    if (regions.length === 0) {
      setError('Please add at least one region where you work');
      setLoading(false);
      return;
    }

    try {
      // Add tour guide request directly to Firestore with base64 image
      const docRef = await addDoc(collection(db, 'tourGuideRequests'), {
        fullName,
        email,
        phone,
        regions,
        bio,
        idCardUrl: idCardBase64,
        status: 'pending', // pending, approved, rejected
        createdAt: serverTimestamp(),
      });

      console.log('Tour guide request saved successfully with ID:', docRef.id);
      setSuccess(true);
      
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setRegions([]);
      setIdCard(null);
      setIdCardBase64('');
      setBio('');
      recaptchaRef.current?.reset();
      setRecaptchaVerified(false);

      // Redirect to success page after a delay
      setTimeout(() => {
        router.push('/tour-guide-request/success');
      }, 3000);
    } catch (err) {
      console.error('Error submitting tour guide request:', err);
      setError('An error occurred while submitting your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
        </button>
      </div>
      
      <div className="max-w-lg w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xl">TG</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Tour Guide Application
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Fill in the form below to apply as a tour guide
          </p>
        </div>
        
        {success ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-6 text-center">
            <p className="text-lg font-medium text-green-800 dark:text-green-200">
              Your application has been submitted successfully!
            </p>
            <p className="mt-2 text-sm text-green-700 dark:text-green-300">
              We will review your application and get back to you via email.
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600 mx-auto"></div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
              </div>
            )}
            
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  id="full-name"
                  name="full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                  placeholder="+123456789"
                />
              </div>
              
              <div>
                <label htmlFor="regions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Regions You Work In
                </label>
                <div className="mt-1 flex">
                  <input
                    id="region"
                    name="region"
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="appearance-none block flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                    placeholder="Add a region"
                  />
                  <button
                    type="button"
                    onClick={handleRegionAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add
                  </button>
                </div>
                {regions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {regions.map((reg, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                      >
                        {reg}
                        <button
                          type="button"
                          onClick={() => handleRegionRemove(index)}
                          className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="id-card" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID Card Photo
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF up to 5MB
                    </p>
                    {idCard && (
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">
                        {idCard.name} ({Math.round(idCard.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio / Experience
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white sm:text-sm"
                  placeholder="Tell us about your experience as a tour guide..."
                />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Replace with your actual reCAPTCHA site key
                onChange={handleRecaptchaChange}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !recaptchaVerified}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
            
            <div className="text-center">
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                ← Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 