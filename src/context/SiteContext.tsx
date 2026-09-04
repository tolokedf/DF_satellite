"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Site {
  id: string;
  name: string;
  code: string;
  location?: string;
  companyId: string;
  company?: {
    id: string;
    name: string;
    code: string;
  };
}

interface SiteContextType {
  currentSiteId: string; // "ALL" or specific site ID
  setCurrentSiteId: (siteId: string) => void;
  availableSites: Site[];
  currentSiteName: string;
  userRole?: string;
  isCustomer: boolean;
  isEngineer: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const SiteContext = createContext<SiteContextType>({
  currentSiteId: "ALL",
  setCurrentSiteId: () => {},
  availableSites: [],
  currentSiteName: "All Sites",
  isCustomer: false,
  isEngineer: false,
  isAdmin: false,
  isLoading: true,
});

export function SiteProvider({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser?: any;
}) {
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [currentSiteId, setCurrentSiteIdState] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const isCustomer = currentUser?.role === "CUSTOMER";
  const isEngineer = currentUser?.role === "ENGINEER";
  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    if (!currentUser) {
      if (typeof window !== "undefined") {
        document.cookie = "df_satellite_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch("/api/sites")
      .then((res) => res.json())
      .then((sites: Site[]) => {
        if (Array.isArray(sites)) {
          setAvailableSites(sites);

          // Retrieve saved site or determine default
          const savedSiteId = typeof window !== "undefined" ? localStorage.getItem("df_selected_site") : null;
          
          if (isCustomer) {
            // If customer has only 1 site, default to that site
            if (sites.length === 1) {
              setCurrentSiteIdState(sites[0].id);
            } else if (savedSiteId && (savedSiteId === "ALL" || sites.some((s) => s.id === savedSiteId))) {
              setCurrentSiteIdState(savedSiteId);
            } else {
              // Customer with multiple sites defaults to "ALL" (All Sites)
              setCurrentSiteIdState("ALL");
            }
          } else {
            // Engineer / Admin defaults to saved or "ALL"
            if (savedSiteId && (savedSiteId === "ALL" || sites.some((s) => s.id === savedSiteId))) {
              setCurrentSiteIdState(savedSiteId);
            } else {
              setCurrentSiteIdState("ALL");
            }
          }
        }
      })
      .catch((err) => console.error("Failed to load sites:", err))
      .finally(() => setIsLoading(false));
  }, [currentUser?.id, currentUser?.role]);

  const setCurrentSiteId = (siteId: string) => {
    setCurrentSiteIdState(siteId);
    if (typeof window !== "undefined") {
      localStorage.setItem("df_selected_site", siteId);
      // Also store in cookie for potential SSR use
      document.cookie = `df_selected_site=${siteId}; path=/; max-age=604800`;
    }
  };

  // Determine current site display name
  let currentSiteName = "All Sites";
  if (currentSiteId !== "ALL") {
    const found = availableSites.find((s) => s.id === currentSiteId);
    if (found) {
      currentSiteName = found.name;
    }
  } else if (isCustomer && availableSites.length === 1) {
    currentSiteName = availableSites[0].name;
  }

  return (
    <SiteContext.Provider
      value={{
        currentSiteId,
        setCurrentSiteId,
        availableSites,
        currentSiteName,
        userRole: currentUser?.role,
        isCustomer,
        isEngineer,
        isAdmin,
        isLoading,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
