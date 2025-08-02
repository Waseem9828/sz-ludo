
import Image from 'next/image';

export const SplashScreen = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background">
      <div className="animate-flip">
        <Image 
          src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png" 
          alt="SZ LUDO Logo" 
          width={100} 
          height={100} 
        />
      </div>
      <p className="mt-4 text-lg font-semibold animate-pulse">Loading...</p>
    </div>
  );
};
