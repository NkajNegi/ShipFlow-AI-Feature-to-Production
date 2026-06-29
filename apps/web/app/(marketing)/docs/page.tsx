import Link from "next/link";
import { ChevronRight, Terminal, BookOpen, GitPullRequest, Rocket, ShieldCheck, Zap, Search, ArrowLeft, ArrowRight, ListTree } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";

export const metadata = {
  title: "Documentation - MetroFlow AI",
  description: "Learn how to use MetroFlow AI, the AI operator for software delivery.",
};

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-[#000000] text-foreground overflow-hidden">
      <MarketingHeader />
      
      {/* Background Radial Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#c084fc]/5 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-[#60a5fa]/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-[1500px] flex flex-col md:flex-row gap-8 px-4 sm:px-6 py-12 pt-32">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          <div className="sticky top-32 bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search docs..." 
                className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-[#c084fc]/50 transition-colors"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/5 text-muted-foreground border border-white/10">
                ⌘K
              </div>
            </div>

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
        <main className="flex-1 min-w-0 bg-[#0c0c0c]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <span>Docs</span> <ChevronRight className="h-4 w-4" /> <span className="text-white">Getting Started</span> <ChevronRight className="h-4 w-4" /> <span className="text-white">Introduction</span>
          </div>

          <article className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-white max-w-none">
            <h1 id="introduction" className="text-4xl font-extrabold tracking-tight mb-4">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c084fc] to-[#60a5fa]">MetroFlow AI</span>
            </h1>
            <p className="text-lg leading-relaxed mb-8 text-white/80">
              MetroFlow AI is not just a code generator—it is a fully autonomous <strong>AI Operator</strong> for your software delivery lifecycle. It sits in your codebase, clarifies requirements, writes Product Requirements Documents (PRDs), plans engineering tasks, and stringently reviews pull requests before they hit production.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent hover:border-[#c084fc]/50 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                   <Terminal className="h-5 w-5 text-[#c084fc]" /> Developer First
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">MetroFlow integrates natively with GitHub. It comments on PRs, requests changes, and enforces architectural standards just like a Senior Staff Engineer.</p>
              </div>
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent hover:border-[#4ade80]/50 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-[#4ade80]" /> Spec-Driven
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Everything starts with a PRD. MetroFlow generates the spec from your rough ideas, and ensures every line of code written strictly adheres to it.</p>
              </div>
            </div>

            <hr className="border-white/10 my-12" />

            <h2 id="quickstart" className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Zap className="h-6 w-6 text-[#facc15]" /> Quickstart
            </h2>
            <p className="mb-6">Get up and running with MetroFlow AI in less than two minutes. Follow these steps to connect your workspace.</p>
            
            <div className="space-y-6">
              <div className="pl-6 border-l-2 border-white/10 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#111] border-2 border-[#c084fc]" />
                <h3 className="text-lg font-bold text-white mb-2">1. Create a Workspace</h3>
                <p className="text-sm text-muted-foreground mb-4">Sign up and create your first workspace. This acts as the command center for your engineering team.</p>
              </div>
              
              <div className="pl-6 border-l-2 border-white/10 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#111] border-2 border-[#c084fc]" />
                <h3 className="text-lg font-bold text-white mb-2">2. Install the GitHub App</h3>
                <p className="text-sm text-muted-foreground mb-4">Navigate to your workspace settings and click <em>Install GitHub App</em>. Select the repositories you want MetroFlow to operate on.</p>
                <div className="bg-[#111] border border-white/10 rounded-lg p-4 font-mono text-sm text-[#4ade80]">
                  $ metroflow connect --repo my-org/my-repo
                </div>
              </div>
              
              <div className="pl-6 border-l-2 border-transparent relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#111] border-2 border-[#c084fc]" />
                <h3 className="text-lg font-bold text-white mb-2">3. Write your first idea</h3>
                <p className="text-sm text-muted-foreground mb-4">Go to the Projects tab and submit a rough feature idea. Watch as MetroFlow clarifies it and drafts a technical PRD!</p>
              </div>
            </div>

            <div className="my-10 p-5 rounded-2xl border border-[#c084fc]/30 bg-gradient-to-br from-[#c084fc]/10 to-transparent text-white flex gap-4 items-start shadow-[inset_0_0_20px_rgba(192,132,252,0.1)]">
               <Zap className="h-6 w-6 text-[#c084fc] shrink-0 mt-0.5" />
               <div>
                 <strong className="block mb-2 text-[16px] text-[#c084fc]">Pro Tip: Issue Invocation</strong>
                 <p className="text-[14px] text-white/80 leading-relaxed">
                   You can invoke MetroFlow directly from a GitHub issue by commenting <code className="bg-black/50 text-[#c084fc] px-1.5 py-0.5 rounded border border-[#c084fc]/20 font-mono text-xs">@metroflow-ai plan this</code>. The AI will instantly read the issue context and begin drafting a PRD directly in your dashboard.
                 </p>
               </div>
            </div>

            <hr className="border-white/10 my-12" />

            <h2 id="the-loop" className="text-2xl font-bold mb-4">The Core Loop</h2>
            <p className="mb-8">The most important part of the product implementation is: <strong>Feature Request → PRD → Tasks → Code → AI Review → Fixes → Re-Review → Human Approval → Ship</strong>. Humans remain the final decision makers.</p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)]">1</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">Feature Request</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">MetroFlow ingests your raw feature request and clarifies missing requirements.</span>
                 </div>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)]">2</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">PRD</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">The AI Agent generates a rigorous Product Requirements Document including edge cases and success metrics.</span>
                 </div>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">3</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">Tasks</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">The PRD is broken down into engineering tasks and tracked on a Kanban board.</span>
                 </div>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">4</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">Code</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">Developers implement the feature and open a Pull Request linked to the tasks.</span>
                 </div>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.15)]">5</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">AI Review</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">The QA Agent reviews the code against the PRD, categorizing issues as Blocking or Non-blocking.</span>
                 </div>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.15)]">6</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">Fixes</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">If blocking issues are found, the feature is sent back to the developer to implement fixes.</span>
                 </div>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.15)]">7</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">Re-Review</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">The QA Agent performs another code review cycle until the feature is ready.</span>
                 </div>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.15)]">8</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">Human Approval</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">A human reviewer verifies the PRD, tasks, PR, and AI review history, then approves the release.</span>
                 </div>
              </div>
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all hover:-translate-y-0.5 flex gap-5">
                 <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.15)]">9</div>
                 <div>
                   <strong className="text-white block mb-1 text-lg">Ship</strong>
                   <span className="text-sm text-muted-foreground leading-relaxed block">The approved feature is safely merged and released to production.</span>
                 </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link href="#" className="w-full sm:w-1/2 p-4 rounded-xl border border-white/10 bg-[#111] hover:bg-white/5 transition-colors flex items-center gap-4 group">
                <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Previous</div>
                  <div className="text-sm font-semibold text-white">Installation Guide</div>
                </div>
              </Link>
              <Link href="#" className="w-full sm:w-1/2 p-4 rounded-xl border border-[#c084fc]/30 bg-gradient-to-r from-transparent to-[#c084fc]/10 hover:to-[#c084fc]/20 transition-colors flex items-center justify-end gap-4 group text-right">
                <div>
                  <div className="text-xs text-[#c084fc] uppercase font-bold tracking-wider mb-1">Next</div>
                  <div className="text-sm font-semibold text-white">PRD Generation</div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#c084fc] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="mt-8 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Last updated on May 20, 2025</p>
              <button className="text-xs font-medium text-white hover:text-[#c084fc] transition-colors underline underline-offset-4">Edit this page on GitHub</button>
            </div>
          </article>
        </main>

        {/* Right TOC Sidebar */}
        <aside className="hidden xl:block w-56 shrink-0 pt-8">
          <div className="sticky top-32">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-white mb-4">
              <ListTree className="h-4 w-4" /> On this page
            </h3>
            <nav className="space-y-2 border-l border-white/10 ml-2 pl-4">
              <Link href="#introduction" className="block text-sm text-[#c084fc] font-medium hover:text-[#c084fc] transition-colors">
                Introduction
              </Link>
              <Link href="#quickstart" className="block text-sm text-muted-foreground hover:text-white transition-colors">
                Quickstart
              </Link>
              <Link href="#the-loop" className="block text-sm text-muted-foreground hover:text-white transition-colors">
                The AI Loop
              </Link>
            </nav>
          </div>
        </aside>

      </div>
    </div>
  );
}
