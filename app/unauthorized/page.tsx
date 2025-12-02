import { ShieldX, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access this page. This portal is
            restricted to authorized staff members.
          </p>

          <div className="bg-red-50 rounded-lg p-4 text-sm text-red-800 mb-6">
            <p className="font-medium mb-1">Why am I seeing this?</p>
            <ul className="text-red-600 text-left list-disc list-inside space-y-1">
              <li>Your session may have expired</li>
              <li>You may not have staff access</li>
              <li>The authentication link may be invalid</li>
            </ul>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Please access this portal through Schoolbox to authenticate properly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
