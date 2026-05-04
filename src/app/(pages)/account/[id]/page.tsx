// src/app/(pages)/account/[id]/page.tsx

"use client";
import { useParams } from "next/navigation";
import AccountPageCore from "../AccountPageCore";
import BackButton from "@/app/components/buttons/BackButton";

export default function PublicProfilePage() {
  const { id } = useParams();

  return (
    <div className="relative min-h-screen">
      {/* STICKY HEADER — Desktop & Mobile */}
      <div
        className="sticky z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100/60"
        style={{ top: "75px" }}
      >
        <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center h-14 md:h-auto">
          <div className="flex items-center">
            <BackButton />
          </div>
        </nav>
      </div>

      {/* CONTENT SECTION */}
      <main className="relative">
        <AccountPageCore profileId={id as string} />
      </main>
    </div>
  );
}
