export default function Footer({
  dict,
  brand,
}: {
  dict: any
  brand: string
}) {
  return (
    <footer className="border-t py-6 md:py-0 bg-background text-foreground">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © 2025 {brand}. {dict.rights}
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            {dict.privacy}
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            {dict.terms}
          </a>
        </div>
      </div>
    </footer>
  )
}
