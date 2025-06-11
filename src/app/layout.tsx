import "@/styles/global.css";
import "@/styles/prosemirror.css";

import { ThemeProvider } from "@/components/ui/theme-provider";
import { PageViewTracker } from "@/lib/analytics/page-view-tracker";
import { AnalyticsProviderComponent } from "@/lib/analytics/provider";
import { constructMetadata } from "@/lib/utility/construct-metadata";
import { cn } from "@/lib/utils";
import { inter, satoshi } from "@/styles/font";
import { Toaster } from "sonner";

export const metadata = constructMetadata({
  title: "Orgnise",
  description: "The internal wiki for modern teams.",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "h-screen font-sans antialiased",
          satoshi.variable,
          inter.variable,
        )}
      >
        <AnalyticsProviderComponent>
          <PageViewTracker />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AnalyticsProviderComponent>

        <Toaster />
      </body>
    </html>
  );
}
