import { useState } from 'react';
import Learn from './screens/Learn.jsx';

export default function App() {
  const [lang, setLang] = useState('km');
  return (
    <>
      <div style={{ padding: 8, textAlign: 'center' }}>
        <button onClick={() => setLang('km')} disabled={lang === 'km'}>ខ្មែរ</button>{' '}
        <button onClick={() => setLang('en')} disabled={lang === 'en'}>English</button>
      </div>
      <Learn lang={lang} />
    </>
  );
}