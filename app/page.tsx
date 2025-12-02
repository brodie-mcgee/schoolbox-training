import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Staff Training Portal
          </h1>

          <p className="text-gray-600 mb-6">
            Access your training modules, courses, and certifications through Schoolbox.
          </p>

          <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-800">
            <p className="font-medium mb-1">Access via Schoolbox</p>
            <p className="text-purple-600">
              This portal is integrated with Schoolbox. Please access it through your
              Schoolbox dashboard to authenticate.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              For staff members only. If you&apos;re having trouble accessing this portal,
              please contact IT support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
