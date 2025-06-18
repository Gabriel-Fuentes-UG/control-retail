// src/components/layout/SidebarToggleButton.tsx
"use client";

import { useLayout } from "@/components/providers/LayoutProvider";
import { Button } from "react-bootstrap";

const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default function SidebarToggleButton() {
    const { toggleSidebar } = useLayout();
    return (
        <Button onClick={toggleSidebar} variant="light" className="me-3 d-lg-none">
            <MenuIcon />
        </Button>
    );
}