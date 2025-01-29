"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import { FiUser } from "react-icons/fi";
import { IoArrowBack } from "react-icons/io5";
import { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}
const menuGroups = [
  {
    name: "INICIO",
    menuItems: [
      {
        icon: <FiUser size={18} className="fill-current" />,
        label: "Dashboard",
        route: "/",
      }
    ]
  },
  {
    name: "ADMINISTRACIÓN",
    menuItems: [
      {
        icon: <FiUser size={18} className="fill-current" />,
        label: "Empleados",
        route: "/empleados",
      },
      {
        icon: <FiUser size={18} className="fill-current" />,
        label: "Empleados Por CUR",
        route: "/empleados_cur",
      }
    ],
  }
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const toggleDropdown = (index: number) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <Link href="/" className="flex items-center gap-2">
            <Image
              width={100}
              height={100}
              src={"/images/logo/logo.png"}
              alt="Logo"
              priority
            />
            <h1 className="text-white text-2xl font-bold">UNCPGGL</h1>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="block lg:hidden"
          >
            <IoArrowBack size={20} className="fill-current" />
          </button>
        </div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <button
                  onClick={() => toggleDropdown(groupIndex)}
                  className="flex w-full items-center justify-between mb-4 ml-4 text-sm font-semibold text-bodydark2 hover:text-white"
                >
                  {group.name}
                  <IoIosArrowDown
                    className={`transform transition-transform duration-200 ${
                      openDropdown === groupIndex ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <ul className={`mb-6 flex flex-col gap-1.5 overflow-hidden transition-all duration-300 ${
                  openDropdown === groupIndex ? "max-h-96" : "max-h-0"
                }`}>
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          {/* <!-- Sidebar Menu --> */}
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
