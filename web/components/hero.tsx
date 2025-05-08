import Link from "next/link"
import Image from "next/image"
import { getImagePath } from "@/lib/utils"

export default function Hero({ dict }: { dict: any }) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background text-foreground">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">{dict.title}</h1>
              <p className="text-xl text-muted-foreground">{dict.subtitle}</p>
            </div>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">{dict.description}</p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link
                href="#demo"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {dict.cta}
              </Link>
              <Link
                href="#features"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {dict.secondaryCta}
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Image
              src={getImagePath("/image.png")}
              width={600}
              height={400}
              alt="2DNS Global Network"
              className="rounded-lg object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
