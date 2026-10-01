"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestWorkspaceDialog } from "@/components/modals/request-workspace-dialog";

export function WorkspacesHeaderActions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Solicitar Novo Espaço</span>
      </Button>

      <RequestWorkspaceDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
