import { Shield, Globe, Code, Server } from "lucide-react"

export default function Features({ dict }: { dict: any }) {
  const icons = [Shield, Globe, Code, Server]

  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{dict.title}</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl">{dict.subtitle}</p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:gap-12">
          {dict.list.map((feature: any, index: number) => {
            const Icon = icons[index % icons.length]
            return (
              <div
                key={index}
                className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm bg-card text-card-foreground"
              >
                <div className="rounded-full bg-primary p-2 text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-center text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
