import { ShortsFeed } from "@/components/ShortsFeed";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ShortsPage() {
  return (
    <div className="flex-1 relative -m-3 md:-m-6 h-[calc(100vh-100px)] overflow-hidden bg-black rounded-xl">
      <Link 
        href="/shorts/upload" 
        className={`${buttonVariants({ variant: 'glass' })} absolute top-4 right-4 z-50 text-white border-white/20`}
      >
        <i className="fas fa-plus mr-2" /> Загрузить
      </Link>
      <ShortsFeed />
    </div>
  );
}
