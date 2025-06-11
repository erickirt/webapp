"use client";

import { UsageLimitView } from "@/components/molecule";
import { CreateTeam } from "@/components/team/create/create-team";
import TeamsList from "@/components/team/team-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { FREE_TEAMS_LIMIT } from "@/lib/constants/pricing";
import useTeams from "@/lib/swr/use-teams";
import { useEffect } from "react";

interface CerateWorkspaceModelProps {
  children: React.ReactNode;
}

export default function DashboardClient() {
  const { exceedingFreeTeam, freeTeams, loading } = useTeams();
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.track("dashboard_viewed", {});
  }, [analytics]);

  return (
    <div className="">
      <div className="flex h-36 items-center border-b border-border bg-background">
        <div className="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl ">My Teams</h1>
            <UsageLimitView
              exceedingLimit={exceedingFreeTeam}
              upgradeMessage={`You can only create up to ${FREE_TEAMS_LIMIT} free teams. Additional team require a paid plan.`}
              team_slug={freeTeams?.[0]?.meta?.slug ?? ""}
              placeholder={
                <Button size={"sm"} variant={"subtle"}>
                  Create Team
                </Button>
              }
            >
              <CerateWorkspaceModel>
                <Button
                  size={"sm"}
                  variant={"default"}
                  disabled={loading}
                  onClick={() => {
                    analytics.track("button_click", {
                      button_id: "create_team",
                      location: "dashboard",
                    });
                    console.log("create team clicked");
                  }}
                >
                  Create Team
                </Button>
              </CerateWorkspaceModel>
            </UsageLimitView>
          </div>
        </div>
      </div>
      <TeamsList />
    </div>
  );
}

export function CerateWorkspaceModel({ children }: CerateWorkspaceModelProps) {
  return (
    <Dialog modal={true}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className=" rounded-lg border-border bg-card p-0">
        <CreateTeam />
        <DialogClose id="CreateTeamCloseDialogButton" className="hidden">
          Close
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
