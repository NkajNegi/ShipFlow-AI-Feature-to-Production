import Link from "next/link";
import { ChevronRight, Terminal, BookOpen, GitPullRequest, Rocket, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "Documentation - ShipFlow AI",
  description: "Learn how to use ShipFlow AI, the AI operator for software delivery.",
};

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-[#000000] text-foreground overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#c084fc]/5 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-[#60a5fa]/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1400px] flex flex-col md:flex-row gap-8 px-6 py-12 pt-32">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          <div className="sticky top-32 bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 px-2">Getting Started</h3>
            <nav className="space-y-1">
              <Link href="#introduction" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-[#c084fc]/20 to-transparent border-l-2 border-[#c084fc]">
                <BookOpen className="h-4 w-4 text-[#c084fc]" /> Introduction
              </Link>
              <Link href="#quickstart" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                <Zap className="h-4 w-4" /> Quickstart
              </Link>
            </nav>

            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mt-8 mb-4 px-2">Core Concepts</h3>
            <nav className="space-y-1">
              <Link href="#the-loop" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                <Terminal className="h-4 w-4" /> The AI Loop
              </Link>
              <Link href="#prds" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                <BookOpen className="h-4 w-4" /> PRD Generation
              </Link>
              <Link href="#reviews" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                <ShieldCheck className="h-4 w-4" /> Automated Reviews
              </Link>
            </nav>

            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mt-8 mb-4 px-2">Integration</h3>
            <nav className="space-y-1">
              <Link href="#github" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                <GitPullRequest className="h-4 w-4" /> GitHub App
              </Link>
              <Link href="#slack" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                <Rocket className="h-4 w-4" /> Slack Bot
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-[#0c0c0c]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <span>Docs</span> <ChevronRight className="h-4 w-4" /> <span className="text-white">Introduction</span>
          </div>

          <article className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-white max-w-4xl">
            <h1 id="introduction" className="text-4xl font-extrabold tracking-tight mb-4">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c084fc] to-[#60a5fa]">ShipFlow AI</span>
            </h1>
            <p className="text-lg leading-relaxed mb-8">
              ShipFlow AI is not just a code generator—it is a fully autonomous <strong>AI Operator</strong> for your software delivery lifecycle. It sits in your codebase, clarifies requirements, writes Product Requirements Documents (PRDs), plans engineering tasks, and stringently reviews pull requests before they hit production.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                   <Terminal className="h-5 w-5 text-[#c084fc]" /> Developer First
                </h3>
                <p className="text-sm text-muted-foreground">ShipFlow integrates natively with GitHub. It comments on PRs, requests changes, and enforces architectural standards just like a Senior Staff Engineer.</p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-[#4ade80]" /> Spec-Driven
                </h3>
                <p className="text-sm text-muted-foreground">Everything starts with a PRD. ShipFlow generates the spec from your rough ideas, and ensures every line of code written strictly adheres to it.</p>
              </div>
            </div>

            <hr className="border-white/10 my-12" />

            <h2 id="quickstart" className="text-2xl font-bold mb-4">Quickstart</h2>
            <p className="mb-6">Get up and running with ShipFlow AI in less than two minutes. Follow these steps to connect your workspace.</p>
            
            <ol className="space-y-6 list-decimal list-inside text-muted-foreground marker:text-[#c084fc] marker:font-bold">
              <li className="pl-2">
                <strong className="text-white">Create a Workspace:</strong> Sign up and create your first workspace. This acts as the command center for your engineering team.
              </li>
              <li className="pl-2">
                <strong className="text-white">Install the GitHub App:</strong> Navigate to your workspace settings and click <em>Install GitHub App</em>. Select the repositories you want ShipFlow to operate on.
              </li>
              <li className="pl-2">
                <strong className="text-white">Write your first idea:</strong> Go to the Projects tab and submit a rough feature idea. Watch as ShipFlow clarifies it and drafts a technical PRD!
              </li>
            </ol>

            <div className="my-8 p-4 rounded-xl border border-[#c084fc]/30 bg-[#c084fc]/10 text-white flex gap-4 items-start">
               <Zap className="h-6 w-6 text-[#c084fc] shrink-0 mt-0.5" />
               <div>
                 <strong className="block mb-1 text-[15px]">Pro Tip</strong>
                 <span className="text-[14px] text-muted-foreground">You can invoke ShipFlow directly from a GitHub issue by commenting <code>@shipflow-ai plan this</code>. The AI will instantly read the issue context and begin drafting a PRD.</span>
               </div>
            </div>

            <hr className="border-white/10 my-12" />

            <h2 id="the-loop" className="text-2xl font-bold mb-4">The AI Loop</h2>
            <p className="mb-6">ShipFlow operates on a deterministic, 5-step autonomous loop. It never jumps straight to code without understanding the requirements first.</p>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors flex gap-4">
                 <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                 <div>
                   <strong className="text-white block mb-1">Clarify</strong>
                   <span className="text-sm">ShipFlow ingests your rough feature request and asks clarifying questions if requirements are ambiguous.</span>
                 </div>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors flex gap-4">
                 <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                 <div>
                   <strong className="text-white block mb-1">Plan</strong>
                   <span className="text-sm">Once clarified, it authors a highly technical Product Requirements Document (PRD) and breaks it down into actionable tasks.</span>
                 </div>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors flex gap-4">
                 <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                 <div>
                   <strong className="text-white block mb-1">Build</strong>
                   <span className="text-sm">ShipFlow (or your human engineers) executes the tasks and opens Pull Requests against the repository.</span>
                 </div>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors flex gap-4">
                 <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">4</div>
                 <div>
                   <strong className="text-white block mb-1">Review</strong>
                   <span className="text-sm">Every PR is intensely reviewed against the original PRD spec, best practices, and security guidelines.</span>
                 </div>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors flex gap-4">
                 <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm shrink-0">5</div>
                 <div>
                   <strong className="text-white block mb-1">Release</strong>
                   <span className="text-sm">Once the code passes the AI Quality Gates, it is safely merged and released to production.</span>
                 </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Last updated on May 20, 2025</p>
              <div className="flex gap-4">
                <button className="text-sm font-medium text-white hover:text-[#c084fc] transition-colors">Edit this page</button>
              </div>
            </div>
          </article>
        </main>

      </div>
    </div>
  );
}
