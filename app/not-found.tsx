import Link from 'next/link'
import { GraduationCap, Compass, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </span>
        <span className="text-xl font-bold text-foreground">Mnemo</span>
      </Link>

      <Card className="max-w-sm w-full p-6 text-center">
        <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Compass size={20} className="text-muted-foreground" />
        </div>
        <h1 className="text-base font-semibold text-foreground mb-1.5">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Nothing lives at this address. It may have moved, or the link was mistyped.
        </p>
        <Button asChild className="gap-2 w-full">
          <Link href="/dashboard">
            Back to Dashboard <ArrowRight size={14} />
          </Link>
        </Button>
      </Card>
    </div>
  )
}
