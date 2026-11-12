export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#0ea5e9" />
        <path 
          d="M16 7v18M11 11v10M21 11v10M7 14v4M25 14v4" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
      </svg>
      <span className="font-bold text-xl tracking-tight text-slate-800">
        Git<span className="text-sky-500">Voice</span>
      </span>
    </div>
  );
}
