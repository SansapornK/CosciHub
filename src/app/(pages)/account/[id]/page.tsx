// src/app/(pages)/account/[id]/page.tsx


"use client";
import { useParams } from "next/navigation";
import AccountPageCore from "../AccountPageCore";

export default function PublicProfilePage() {
  const { id } = useParams();
  return <AccountPageCore profileId={id as string} />;
}