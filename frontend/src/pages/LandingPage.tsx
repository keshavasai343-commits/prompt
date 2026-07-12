import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Wand2, Copy, History, Star, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const FEATURES = [
  { icon: Wand2, title: 'AI-Powered Enhancement', desc: 'Transform simple ideas into detailed, optimized prompts in seconds' },
  { icon: Zap, title: 'Multi-Model Support', desc: 'GPT-4o, Claude, Gemini, Grok and more — use the best AI for each task' },
  { icon: Copy, title: 'One-Click Copy', desc: 'Copy your enhanced prompt instantly and paste into any AI tool' },
  { icon: History, title: 'Prompt History', desc: 'Never lose a great prompt — all your generations saved automatically' },
  { icon: Star, title: 'Favorites & Templates', desc: 'Save your best prompts and reuse proven templates' },
  { icon: Sparkles, title: '9 Categories', desc: 'Coding, UI/UX, Writing, Marketing, Business, Image Gen and more' },
]

const EXAMPLES = [
  { input: 'Build login page', output: 'Act as a senior full-stack engineer. Create a production-ready login page using React 19, TypeScript, Tailwind CSS, and shadcn/ui. Include: email/password validation with Zod, JWT token handling...' },
  { input: 'Write blog about AI', output: 'Act as an expert content writer and SEO specialist. Write a comprehensive 2000-word blog article about artificial intelligence trends in 2025. Include: compelling H1, structured H2 sections, real statistics...' },
  { input: 'Fantasy landscape painting', output: 'Mystical fantasy landscape, ancient floating islands, bioluminescent waterfalls, ethereal golden light, crystal formations, 8K ultra-detailed, cinematic composition, volumetric fog --ar 16:9 --v 6 --q 2' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/8 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-indigo-600/8 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground">PromptCraft AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button variant="gradient" size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-400 mb-8">
            <Sparkles className="h-3 w-3" />
            Powered by GPT-4o, Claude, Gemini, and more
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-6 leading-tight">
            Turn Simple Ideas Into{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Powerful Prompts
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Transform a few words into detailed, high-quality AI prompts optimized for ChatGPT, Claude, Gemini, Cursor, Midjourney, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="gradient" size="xl" className="gap-2">
                Start Generating Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl">Sign In</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Demo */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="space-y-4">
          {EXAMPLES.map((example, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">Input</span>
                  <span className="text-sm font-medium text-foreground">"{example.input}"</span>
                </div>
                <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              </div>
              <div className="rounded-lg bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border border-violet-500/10 px-4 py-3">
                <p className="text-sm text-foreground/80 line-clamp-2">{example.output}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Everything you need</h2>
          <p className="text-muted-foreground">A complete toolkit for AI prompt engineering</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card/40 p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Start crafting better prompts today</h2>
          <p className="text-muted-foreground mb-8">Free forever. No credit card required.</p>
          <Link to="/register">
            <Button variant="gradient" size="xl" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
