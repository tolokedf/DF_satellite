"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import StandardProjectWorkspace from "@/components/project/StandardProjectWorkspace";

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = () => {
    setLoading(true);
    fetch(`/api/projects/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load project details");
        return res.json();
      })
      .then((data) => setProject(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading project workspace...</div>;
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        {error || "Project not found"}
      </div>
    );
  }

  return <StandardProjectWorkspace project={project} onRefresh={fetchProject} />;
}
