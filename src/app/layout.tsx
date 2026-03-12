import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "JustDoIt — Task Automation Scheduler",
  description:
    "Automate and schedule your tasks with smart folders, priorities, and deadlines.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="shell">
            <Header />
            <div className="shell-inner">
              <main className="site-main">{children}</main>
            </div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}