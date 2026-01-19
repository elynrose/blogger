export function Footer() {
  return (
    <footer className="py-6 px-4 sm:px-6 lg:px-8 mt-12 border-t border-border/50 bg-background">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AISaaS Explorer. All rights reserved.</p>
        <p className="mt-2">Discover the future of AI-powered software.</p>
      </div>
    </footer>
  );
}
