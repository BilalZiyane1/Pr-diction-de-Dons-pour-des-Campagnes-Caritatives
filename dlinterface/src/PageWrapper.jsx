import React from 'react';

const PageWrapper = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    backgroundImage: 'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1350&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}>
    {children}
  </div>
);

export default PageWrapper;
