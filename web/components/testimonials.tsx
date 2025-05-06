import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Quote } from "lucide-react"

export default function Testimonials({ dict }: { dict: any }) {
  return (
    <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{dict.title}</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl">{dict.subtitle}</p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-12">
          {dict.list.map((testimonial: any, index: number) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <Quote className="h-8 w-8 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex h-full flex-col justify-between">
                <p className="text-muted-foreground">{testimonial.quote}</p>
                <div className="mt-4 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                    <span className="text-lg font-bold">{testimonial.author.charAt(0)}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
