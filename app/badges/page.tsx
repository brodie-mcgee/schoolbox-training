"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Award, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const { data, error } = await supabase
          .from("badges")
          .select("*")
          .order("name");

        if (error) throw error;
        setBadges(data || []);
      } catch (err) {
        console.error("Error fetching badges:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Badges</h1>
              <p className="text-sm text-gray-500">View available badges and achievements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {badges.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Badges Available</h3>
            <p className="text-gray-500">Complete training to earn badges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {badges.map((badge) => (
              <div key={badge.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: badge.color ? `${badge.color}20` : '#f3e8ff' }}
                >
                  <Award className="w-8 h-8" style={{ color: badge.color || '#9333ea' }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{badge.name}</h3>
                <p className="text-xs text-gray-500">{badge.description || "Complete training to earn"}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
