"use client";

export function GradientWave() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 transform rotate-12">
            <div className="h-[200%] w-full bg-gradient-to-r from-transparent via-blue-900/30 to-transparent animate-pulse" />
          </div>
        </div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 transform -rotate-45">
            <div className="h-[200%] w-full bg-gradient-to-r from-transparent via-gray-700/40 to-transparent animate-wave-slow" />
          </div>
        </div>
      </div>
    </div>
  );
}
