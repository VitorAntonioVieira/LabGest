"use client";

import React, { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeEntryDialog } from "./time-entry-dialog";

interface TimeEntryButtonProps {
  tasks?: {
    id: string;
    title: string;
    workspaceName: string;
    workspaceId: string;
  }[];
}

export function TimeEntryButton({ tasks = [] }: TimeEntryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-xs font-medium"
      >
        <Clock className="mr-1.5 h-3.5 w-3.5" />
        + Apontar Horas
      </Button>

      <TimeEntryDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tasks={tasks}
      />
    </>
  );
}
