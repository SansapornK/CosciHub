// src/app/(pages)/account/[id]/page.tsx


"use client";
import { useParams } from "next/navigation";
import AccountPageCore from "../AccountPageCore";
import BackButton from "@/app/components/buttons/BackButton";

export default function PublicProfilePage() {
  const { id } = useParams();
  
  return (
    <>
      <BackButton />
      <AccountPageCore profileId={id as string} />
    </>
  );
}