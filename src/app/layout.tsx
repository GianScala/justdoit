import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Shell from "@/components/layout/Shell";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = { title: "JustDoIt — Task Automation Scheduler", description: "Automate and schedule your tasks with smart folders, priorities, and deadlines." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Shell>
            <Header />
            <main>{children}</main>
            <Footer />
          </Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
