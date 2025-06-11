"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import { useParams } from "next/navigation";

import { clearIdentity } from "@/lib/analytics/identity";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { LogOutIcon, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "../atom/logo";
import { TeamSwitcher } from "../ui/team-switcher";
import { ThemeSwitcher } from "../ui/theme-switcher";

const Nav = ({}) => {
  const { team_slug } = (useParams() as { team_slug?: string }) ?? {};
  const { data: session, status } = useSession();
  const user = session?.user;
  const analytics = useAnalytics();

  const handleLogoClick = () => {
    analytics.track("button_click", {
      button_id: "logo_home",
      location: "navigation",
    });
  };

  const handleUserAvatarClick = () => {
    analytics.track("button_click", {
      button_id: "user_avatar_dropdown",
      location: "navigation",
    });
  };

  const handleSettingsClick = () => {
    analytics.track("button_click", {
      button_id: "settings_nav",
      location: "navigation",
    });
  };

  const handleLogout = () => {
    analytics.track("button_click", {
      button_id: "logout",
      location: "navigation",
    });

    // Clear analytics identity before signing out
    clearIdentity();
    signOut({
      callbackUrl: `/login`,
    });
  };

  return (
    <div className="flex h-16 w-full place-content-between items-center">
      <div className="flex items-center sm:gap-2">
        <Link
          href="/"
          className="Logo hidden items-center gap-2 sm:mr-4 sm:flex "
          onClick={handleLogoClick}
        >
          <Logo className="h-8" />
        </Link>
        {user && <TeamSwitcher />}
      </div>
      <div className="flex items-center gap-2">
        {status === "loading" && (
          <div className="h-8 w-8 animate-pulse rounded-full bg-accent" />
        )}
        {user && Object.keys(user).length !== 0 && (
          <div className="flex items-center space-x-4 ">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="group"
                onClick={handleUserAvatarClick}
              >
                <div className="bg-primary-200  flex h-10 w-10 place-content-center items-center rounded-full text-lg font-bold hover:text-teal-700">
                  <Image
                    unoptimized={true}
                    height={40}
                    width={40}
                    src={user.image ?? ""}
                    alt="user"
                    className="h-10 w-10 rounded-full border border-border group-active:scale-95"
                    onError={(e) => {
                      (e.target as any).src =
                        `https://api.dicebear.com/8.x/initials/svg?seed=${user?.name}&scale=70&size=40`;
                    }}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="max-w-[224px] border-border p-2"
                align="end"
              >
                <div className=" p-2 text-sm">
                  <p className="truncate whitespace-nowrap font-bold">
                    {user.name}
                  </p>
                  <p className="truncate text-secondary-foreground/85">
                    {user.email}
                  </p>
                </div>
                <ThemeSwitcher />
                <DropdownMenuItem className="cursor-pointer">
                  <Link
                    href="/settings"
                    className="flex items-center"
                    onClick={handleSettingsClick}
                  >
                    <Settings size={18} className="mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={handleLogout}
                >
                  <LogOutIcon size={18} className="mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};
export default Nav;
