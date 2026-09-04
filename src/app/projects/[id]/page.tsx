"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      router.replace(`/project?id=${params.id}`);
    } else {
      router.replace("/project");
    }
  }, [params.id, router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to project workspace...
    </div>
  );
}
