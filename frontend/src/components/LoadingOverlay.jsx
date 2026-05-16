import { useAuthStore } from "../store/useAuthStore.js";
const LoadingOverlay = () => {
  const { isOnline, loadingProgress, isCheckingAuth } = useAuthStore();

  if (!isCheckingAuth && isOnline) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900">
      <div className="w-full max-w-md px-10">
        <div className="flex justify-between mb-2 text-xs font-mono text-cyan-400 uppercase tracking-tighter">
          <span>{isOnline ? "Syncing Modules..." : <></>}</span>
          {isOnline ? (
            <span>{Math.round(loadingProgress)}%</span>
          ) : (
            <div className="p-5 bg-slate-900 rounded-lg border-2">
              <p>🌐 Please check your internet connection and try again</p>
            </div>
          )}
        </div>

        {/* Background Bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          {isOnline ? <div
            className="h-full bg-primary transition-all duration-100 ease-out"
            style={{ width: `${loadingProgress}%` }}
          /> :
            <></>
          }
          
        </div>
      </div>
    </div>
    
  );
};

export { LoadingOverlay };
