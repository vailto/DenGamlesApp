'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();

  const handleEV2Click = () => {
    // TODO: Add authentication check
    router.push('/ev2');
  };

  const handleTrackerClick = () => {
    // TODO: Add authentication and redirect to tracker
    alert('Tracker kommer snart!');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f1629] via-[#1a1f3a] to-[#0f1629] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/onegamblingguru-logo.png"
              alt="den Gamle och Vadet"
              width={300}
              height={300}
              className="h-72 w-auto transform hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h1 className="text-8xl font-bold text-white mb-4 leading-tight">
            <span className="font-bold">den Gamle</span>{' '}
            <span className="font-light">och Vadet</span>
          </h1>
          <p className="text-gray-300 text-3xl italic mb-6">
            &quot;tur är för amatörer&quot;
          </p>

          <div className="max-w-3xl mx-auto space-y-4 text-gray-300 text-base leading-relaxed mb-8">
            <p className="italic">
              Ingen vet riktigt vem han är.<br />
              Vissa säger att han såg de första kupongerna rullas ut för många år sedan.<br />
              Andra säger att han kan höra hur oddsen rör sig, som om de viskar till honom i vinden.
            </p>

            <p className="font-semibold text-gray-200">
              Det enda som är säkert är detta:<br />
              När han lägger sina rader, skakar spelet till.<br />
              Han jagar inte tur. Han jagar värde.<br />
              Och han delar bara sina hemligheter med dem som vågar kliva in.
            </p>

            <p className="text-gray-400 text-sm">
              Bakom dörren finns två vägar:<br />
              <span className="text-blue-400">Analysen</span> – där siffror blir sanningar och sannolikhet blir kraft.<br />
              <span className="text-purple-400">Resan</span> – där varje spel loggas, följs och formar historien om den gamle och vadet.
            </p>

            <p className="text-white font-bold text-lg mt-6">
              Välj din väg.<br />
              Den gamle ser dig redan.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleEV2Click}
            className="group bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-2xl shadow-2xl border-2 border-blue-700/30 p-8 hover:border-blue-500/60 hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold text-white mb-3">EV2</h2>
              <p className="text-gray-300 text-lg mb-4">
                Expected Value Calculator
              </p>
              <p className="text-gray-400 text-sm">
                Analysera matcher, hämta odds från API,
                beräkna IP% och EV-index, och generera optimala radsystem.
              </p>
              <div className="mt-6 inline-flex items-center text-blue-400 font-semibold group-hover:text-blue-300 transition-colors">
                Starta analys
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={handleTrackerClick}
            className="group bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-2xl shadow-2xl border-2 border-purple-700/30 p-8 hover:border-purple-500/60 hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-3xl font-bold text-white mb-3">Tracker</h2>
              <p className="text-gray-300 text-lg mb-4">
                Betting Performance Tracker
              </p>
              <p className="text-gray-400 text-sm">
                Spåra dina spel, analysera resultat över tid,
                se ROI, vinst/förlust och få insikter om din spelstrategi.
              </p>
              <div className="mt-6 inline-flex items-center text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
                Öppna tracker
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-gradient-to-br from-[#1e2745] to-[#2a3256] rounded-xl shadow-xl border border-blue-700/30 p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Funktioner</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-white mb-1">Live Odds API</h4>
              <p className="text-sm text-gray-400">Hämta bästa odds automatiskt</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🧮</div>
              <h4 className="font-semibold text-white mb-1">Smart Matematik</h4>
              <p className="text-sm text-gray-400">IP%, EV-index och värdeanalys</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">📈</div>
              <h4 className="font-semibold text-white mb-1">Datadriven</h4>
              <p className="text-sm text-gray-400">Basera beslut på statistik</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 den Gamle och Vadet - Alla rättigheter förbehållna</p>
        </div>
      </div>
    </main>
  );
}
