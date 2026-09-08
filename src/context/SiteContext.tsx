"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

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

export interface Company {
  id: string;
  name: string;
  code?: string;
}

interface SiteContextType {
  currentCustomerId: string; // "ALL" or specific company ID
  setCurrentCustomerId: (companyId: string) => void;
  currentSiteId: string; // "ALL" or specific site ID
  setCurrentSiteId: (siteId: string) => void;
  availableCompanies: Company[];
  availableSites: Site[];
  filteredSitesForCustomer: Site[];
  currentCustomerName: string;
  currentSiteName: string;
  userRole?: string;
  isCustomer: boolean;
  isEngineer: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const SiteContext = createContext<SiteContextType>({
  currentCustomerId: "ALL",
  setCurrentCustomerId: () => {},
  currentSiteId: "ALL",
  setCurrentSiteId: () => {},
  availableCompanies: [],
  availableSites: [],
  filteredSitesForCustomer: [],
  currentCustomerName: "All Customers",
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
  const [currentCustomerId, setCurrentCustomerIdState] = useState<string>("ALL");
  const [currentSiteId, setCurrentSiteIdState] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const isCustomer = currentUser?.role === "CUSTOMER";
  const isEngineer = currentUser?.role === "ENGINEER";
  const isAdmin = currentUser?.role === "ADMIN";

  // Derive unique companies from available sites
  const availableCompanies = useMemo(() => {
    const compMap = new Map<string, Company>();
    availableSites.forEach((site) => {
      if (site.company) {
        compMap.set(site.company.id, {
          id: site.company.id,
          name: site.company.name,
          code: site.company.code,
        });
      }
    });
    return Array.from(compMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [availableSites]);

  // Sites filtered by currently selected customer
  const filteredSitesForCustomer = useMemo(() => {
    if (currentCustomerId === "ALL") {
      return availableSites;
    }
    return availableSites.filter((site) => site.companyId === currentCustomerId);
  }, [availableSites, currentCustomerId]);

  useEffect(() => {
    if (!currentUser) {
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        fetch("/api/auth/logout", { method: "POST" }).finally(() => {
          window.location.href = "/login";
        });
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

          // Retrieve saved customer and site from localStorage
          const savedCustomerId = typeof window !== "undefined" ? localStorage.getItem("df_selected_customer") : null;
          const savedSiteId = typeof window !== "undefined" ? localStorage.getItem("df_selected_site") : null;

          let targetCustomerId = "ALL";
          let targetSiteId = "ALL";

          if (savedCustomerId && (savedCustomerId === "ALL" || sites.some((s) => s.companyId === savedCustomerId))) {
            targetCustomerId = savedCustomerId;
          }

          if (isCustomer) {
            // Customer single site auto-select
            if (sites.length === 1) {
              targetSiteId = sites[0].id;
              targetCustomerId = sites[0].companyId;
            } else if (savedSiteId && (savedSiteId === "ALL" || sites.some((s) => s.id === savedSiteId))) {
              targetSiteId = savedSiteId;
              const found = sites.find((s) => s.id === savedSiteId);
              if (found) targetCustomerId = found.companyId;
            }
          } else {
            if (savedSiteId && (savedSiteId === "ALL" || sites.some((s) => s.id === savedSiteId))) {
              targetSiteId = savedSiteId;
              if (savedSiteId !== "ALL") {
                const found = sites.find((s) => s.id === savedSiteId);
                if (found) targetCustomerId = found.companyId;
              }
            }
          }

          setCurrentCustomerIdState(targetCustomerId);
          setCurrentSiteIdState(targetSiteId);
        }
      })
      .catch((err) => console.error("Failed to load sites:", err))
      .finally(() => setIsLoading(false));
  }, [currentUser?.id, currentUser?.role]);

  // Set Customer with cascading Site reset if site doesn't belong to customer
  const setCurrentCustomerId = (companyId: string) => {
    setCurrentCustomerIdState(companyId);
    if (typeof window !== "undefined") {
      localStorage.setItem("df_selected_customer", companyId);
    }

    if (companyId !== "ALL") {
      // Check if current site belongs to this company
      const currentSite = availableSites.find((s) => s.id === currentSiteId);
      if (currentSite && currentSite.companyId !== companyId) {
        // Reset site to ALL
        setCurrentSiteIdState("ALL");
        if (typeof window !== "undefined") {
          localStorage.setItem("df_selected_site", "ALL");
          document.cookie = `df_selected_site=ALL; path=/; max-age=604800`;
        }
      }
    }
  };

  // Set Site with cascading auto-update of Customer if specific site selected
  const setCurrentSiteId = (siteId: string) => {
    setCurrentSiteIdState(siteId);
    if (typeof window !== "undefined") {
      localStorage.setItem("df_selected_site", siteId);
      document.cookie = `df_selected_site=${siteId}; path=/; max-age=604800`;
    }

    if (siteId !== "ALL") {
      const site = availableSites.find((s) => s.id === siteId);
      if (site && site.companyId && site.companyId !== currentCustomerId) {
        setCurrentCustomerIdState(site.companyId);
        if (typeof window !== "undefined") {
          localStorage.setItem("df_selected_customer", site.companyId);
        }
      }
    }
  };

  // Current display names
  let currentCustomerName = "All Customers";
  if (currentCustomerId !== "ALL") {
    const foundComp = availableCompanies.find((c) => c.id === currentCustomerId);
    if (foundComp) currentCustomerName = foundComp.name;
  }

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
        currentCustomerId,
        setCurrentCustomerId,
        currentSiteId,
        setCurrentSiteId,
        availableCompanies,
        availableSites,
        filteredSitesForCustomer,
        currentCustomerName,
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
