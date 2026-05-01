import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHide(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`loading-screen ${hide ? 'hide' : ''}`}>
      <div className="loader" />
      <div className="loading-text">正在召唤精灵…</div>
    </div>
  );
}
