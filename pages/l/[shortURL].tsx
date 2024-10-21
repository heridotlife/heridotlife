import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const RedirectPage = () => {
  const router = useRouter();
  const { shortURL } = router.query; // Use shortURL to match the file name
  const [loading, setLoading] = useState(true);

  console.log('router.isReady:', router.isReady); // Debugging log
  console.log('router.query:', router.query); // Debugging log

  // Function to redirect based on the short URL
  const redirectToOriginalUrl = async () => {
    if (typeof shortURL === 'string') {
      console.log('shortURL:', shortURL); // Debugging log
      const response = await fetch(`/api/redirect?shortUrl=${encodeURIComponent(shortURL)}`);
      if (response.ok) {
        const originalUrl = await response.text();
        console.log('originalUrl:', originalUrl); // Debugging log
        window.location.assign(originalUrl); // Perform the redirection
      } else {
        console.error('Failed to redirect:', await response.json());
      }
    }
  };

  // Use useEffect to call the redirection function when router is ready and shortURL is available
  useEffect(() => {
    if (router.isReady && shortURL) {
      redirectToOriginalUrl();
      setLoading(false);
    }
  }, [router.isReady, shortURL]);

  if (loading) {
    return <p>Loading...</p>; // Message while waiting for the router to be ready
  }

  return <p>Redirecting...</p>; // Message while redirecting
};

export default RedirectPage;
