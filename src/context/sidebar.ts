"use client";

import { createContext } from "react";

export type SidebarContextType = {
  toggleSidebar: () => void;
  showSidebar: boolean;
};

export const SidebarContext = createContext<SidebarContextType>({
  toggleSidebar: () => {},
  showSidebar: true,
});
