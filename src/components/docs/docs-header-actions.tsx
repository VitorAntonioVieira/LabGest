"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateDocumentDialog } from "@/components/modals/create-document-dialog";

interface DocsHeaderActionsProps {
  workspaceId?: string;
  workspaces?: { id: string; name: string }[];
  label?: string;
}

export function DocsHeaderActions({
  workspaceId,
  workspaces = [],
  label = "Nova Página",
}: DocsHeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-1.5 shadow-xs cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{label}</span>
      </Button>

      <CreateDocumentDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        workspaceId={workspaceId}
        workspaces={workspaces}
      />
    </>
  );
}
