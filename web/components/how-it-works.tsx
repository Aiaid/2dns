import { ArrowRight, Server, Globe, Shield, Key } from "lucide-react"

export default function HowItWorks({ dict }: { dict: any }) {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-background text-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{dict.title}</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl">{dict.subtitle}</p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          {dict.steps.map((step: any, index: number) => (
            <div key={index} className="mb-12 flex flex-col md:flex-row items-start gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {index === 0 && <Server className="h-6 w-6" />}
                {index === 1 && <Globe className="h-6 w-6" />}
                {index === 2 && <Shield className="h-6 w-6" />}
                {index === 3 && <Key className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
              {index < dict.steps.length - 1 && (
                <div className="hidden md:flex h-8 items-center justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
