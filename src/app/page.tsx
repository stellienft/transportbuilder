import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-white px-4">
      <div className="max-w-3xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Professional Websites for Transport Companies
          </h1>
          <p className="text-xl text-slate-400">
            Pick a template. Customise your content. Connect your domain. Go live in minutes — no developer needed.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
