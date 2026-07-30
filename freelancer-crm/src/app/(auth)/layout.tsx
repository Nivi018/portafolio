import { Layers } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 text-white">
            <Layers className="h-8 w-8" />
            <span className="text-2xl font-bold">FreelancerCRM</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage your freelance business in one place
          </h1>
          <p className="text-blue-100 text-lg">
            Track clients, manage projects, send proposals and invoices, and grow your business with powerful analytics.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-white">10x</p>
              <p className="text-blue-200 text-sm">Faster invoicing</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50%</p>
              <p className="text-blue-200 text-sm">Less admin time</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-blue-200 text-sm">Organized</p>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            &copy; {new Date().getFullYear()} FreelancerCRM. Built for freelancers, by freelancers.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Layers className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FreelancerCRM</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
