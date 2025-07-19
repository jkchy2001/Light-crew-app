
'use client';

export function SplashScreen() {
  return (
    <div className="flex w-full h-full flex-col items-center justify-center gap-4 overflow-hidden text-center fixed inset-0">
      <div className="relative h-48 w-48">
        {/* Clapperboard Animation */}
        <div className="absolute left-1/2 top-1/2 h-32 w-full -translate-x-1/2 -translate-y-1/2">
          {/* Top part */}
          <div className="absolute top-0 left-0 h-8 w-full origin-bottom-left animate-clap-top">
            <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-950 p-1 flex items-center overflow-hidden shadow-md">
               <div className="flex h-full w-full items-center justify-between gap-1">
                    <div className="h-full w-1/5 -skew-x-12 bg-neutral-900 ml-1"></div>
                    <div className="h-full w-1/5 -skew-x-12 bg-primary/80"></div>
                    <div className="h-full w-1/5 -skew-x-12 bg-neutral-900"></div>
                    <div className="h-full w-1/5 -skew-x-12 bg-primary/80"></div>
                    <div className="h-full w-1/5 -skew-x-12 bg-neutral-900"></div>
                    <div className="h-full w-1/5 -skew-x-12 bg-primary/80 mr-1"></div>
               </div>
            </div>
          </div>
          {/* Bottom part */}
          <div className="absolute bottom-0 left-0 h-24 w-full animate-clap-bottom bg-gradient-to-t from-neutral-800 via-neutral-900 to-black p-2 text-foreground shadow-lg">
             <div className="w-full h-full border border-neutral-700/50 rounded-sm flex flex-col text-left p-2 gap-1 animate-board-text-appear opacity-0 shadow-inner shadow-black/50">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wider text-primary/80">SCENE</p>
                    <div className="flex-grow border-b border-dashed border-neutral-600/50 mx-2"></div>
                    <p className="text-xs font-mono">01A</p>
                </div>
                 <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wider text-primary/80">TAKE</p>
                    <div className="flex-grow border-b border-dashed border-neutral-600/50 mx-2"></div>
                    <p className="text-xs font-mono">03</p>
                </div>
                 <div className="flex items-center justify-between text-xs">
                    <p className="font-semibold tracking-wider text-primary/80">DIRECTOR:</p>
                    <p className="opacity-70 font-mono">J.K</p>
                </div>
             </div>
          </div>
        </div>
        {/* Light Flash */}
        <div className="absolute left-1/2 top-1/2 h-1 w-1 animate-light-flash rounded-full bg-primary/0"></div>
      </div>
      <div className="animate-text-appear opacity-0">
        <h1 className="text-3xl font-bold tracking-wider text-primary">Light Crew</h1>
        <p className="text-sm text-muted-foreground">Setting the Scene...</p>
      </div>
    </div>
  );
}
