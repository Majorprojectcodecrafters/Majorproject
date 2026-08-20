import { useState } from 'react';
import apiClient from '../lib/api';

const variants = {
  small: { image: 'h-10 w-10', fallback: 'h-10 min-w-10 text-sm' },
  large: { image: 'h-20 w-20', fallback: 'h-20 min-w-20 text-2xl' },
};

const apiBaseUrl = apiClient.defaults.baseURL || 'http://localhost:5000/api';
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
const logoUrl = `${apiOrigin}/assets/logo.jpg`;

export default function Logo({ variant = 'small', showName = true, className = '' }) {
  const styles = variants[variant] || variants.small;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {failed ? (
        <span className={`${styles.fallback} inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 font-bold text-slate-500`}>
          Q
        </span>
      ) : (
        <span className={`${styles.image} relative block shrink-0`}>
          {!loaded && <span className="absolute inset-0 animate-pulse rounded-full bg-slate-200" aria-label="Loading logo" />}
          <img
            src={logoUrl}
            alt="College logo"
            loading="eager"
            decoding="async"
            className="h-full w-full object-contain transition-opacity"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </span>
      )}
      {showName && <span className="text-xl font-bold tracking-tight text-slate-950">QPGen</span>}
    </span>
  );
}
